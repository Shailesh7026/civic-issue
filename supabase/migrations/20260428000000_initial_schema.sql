-- =============================================================
-- CIVIC ISSUE APP — FULL SCHEMA
-- Run in Supabase SQL editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. DROP EVERYTHING (safe teardown)
-- ─────────────────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_updated on public.profiles;
drop trigger if exists on_issue_updated on public.issues;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.is_descendant(uuid, uuid) cascade;
drop function if exists public.get_area_issues_feed(uuid, text, text, int, int) cascade;

drop table if exists public.issue_updates cascade;
drop table if exists public.comments cascade;
drop table if exists public.issue_votes cascade;
drop table if exists public.issues cascade;
drop table if exists public.officer_requests cascade;
drop table if exists public.area_governance cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.area_memberships cascade;
drop table if exists public.area_meta cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;
drop table if exists public.areas cascade;

drop materialized view if exists public.area_stats cascade;

drop type if exists public.user_role cascade;

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 2. AREAS (hierarchical: country → state → city → ward)
-- ─────────────────────────────────────────────────────────────
create table public.areas (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text check (type in ('country','state','city','ward','zone')) not null,
  parent_id  uuid references public.areas(id) on delete cascade,
  created_at timestamptz default now()
);

create index idx_areas_parent on public.areas(parent_id);

-- ─────────────────────────────────────────────────────────────
-- 3. ORGANIZATIONS (government / political)
-- ─────────────────────────────────────────────────────────────
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text check (type in ('government','political_party','department')) not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. PROFILES (linked to Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name  text,
  email      text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 5. SCOPED ROLES (core RBAC)
-- ─────────────────────────────────────────────────────────────
create table public.user_roles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  role            text check (role in ('citizen','officer','admin','super_admin')) not null,
  area_id         uuid references public.areas(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  created_at      timestamptz default now()
);

create index idx_user_roles_user on public.user_roles(user_id);
create index idx_user_roles_area on public.user_roles(area_id);

alter table public.user_roles enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 6. OFFICER REQUESTS (approval flow)
-- ─────────────────────────────────────────────────────────────
create table public.officer_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  requested_area_id uuid references public.areas(id),
  status            text check (status in ('pending','approved','rejected')) default 'pending',
  documents         jsonb,
  reviewed_by       uuid references public.profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz default now()
);

create index idx_officer_requests_user on public.officer_requests(user_id);

alter table public.officer_requests enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 7. AREA GOVERNANCE (election / political history)
-- ─────────────────────────────────────────────────────────────
create table public.area_governance (
  id              uuid primary key default gen_random_uuid(),
  area_id         uuid references public.areas(id) on delete cascade not null,
  organization_id uuid references public.organizations(id),
  start_date      date not null,
  end_date        date,
  created_at      timestamptz default now()
);

create index idx_area_governance_area on public.area_governance(area_id);

-- ─────────────────────────────────────────────────────────────
-- 8. ISSUES (core feature)
-- ─────────────────────────────────────────────────────────────
create table public.issues (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  status        text check (status in ('open','in_progress','resolved')) default 'open',
  priority      text check (priority in ('low','medium','high','critical')) default 'medium',
  area_id       uuid references public.areas(id),
  created_by    uuid references public.profiles(id),
  assigned_to   uuid references public.profiles(id),
  image_urls    jsonb,
  visibility    text default 'public',
  upvotes_count int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_issues_area     on public.issues(area_id);
create index idx_issues_assigned on public.issues(assigned_to);
create index idx_issues_status   on public.issues(status);

alter table public.issues enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 9. ISSUE UPDATES & COMMENTS
-- ─────────────────────────────────────────────────────────────
create table public.issue_updates (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid references public.issues(id) on delete cascade not null,
  user_id    uuid references public.profiles(id),
  message    text,
  created_at timestamptz default now()
);

create index idx_issue_updates_issue on public.issue_updates(issue_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid references public.issues(id) on delete cascade,
  user_id    uuid references public.profiles(id),
  parent_id  uuid references public.comments(id),
  content    text not null,
  created_at timestamptz default now()
);

create index idx_comments_issue on public.comments(issue_id);

create table public.issue_votes (
  user_id  uuid references public.profiles(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete cascade,
  value    int check (value in (1, -1)),
  primary key(user_id, issue_id)
);

-- ─────────────────────────────────────────────────────────────
-- 10. AREA MEMBERSHIPS & META
-- ─────────────────────────────────────────────────────────────
create table public.area_memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  area_id    uuid references public.areas(id) on delete cascade,
  role       text check (role in ('member','moderator')) default 'member',
  created_at timestamptz default now(),
  unique(user_id, area_id)
);

create index idx_area_memberships_user on public.area_memberships(user_id);
create index idx_area_memberships_area on public.area_memberships(area_id);

alter table public.area_memberships enable row level security;

create table public.area_meta (
  area_id     uuid primary key references public.areas(id) on delete cascade,
  banner_url  text,
  logo_url    text,
  description text,
  created_at  timestamptz default now()
);

-- Stats Materialized View
create materialized view public.area_stats as
select
  a.id as area_id,
  count(distinct am.user_id) as members,
  count(distinct i.id) filter (where i.status != 'resolved') as active_issues
from public.areas a
left join public.area_memberships am on am.area_id = a.id
left join public.issues i on i.area_id = a.id
group by a.id;

-- ─────────────────────────────────────────────────────────────
-- 11. AREA TREE HELPER FUNCTION
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_descendant(child uuid, parent uuid)
returns boolean as $$
  with recursive tree as (
    select id, parent_id from public.areas where id = child
    union
    select a.id, a.parent_id
    from public.areas a
    join tree t on t.parent_id = a.id
  )
  select exists(select 1 from tree where id = parent);
$$ language sql stable;

-- ─────────────────────────────────────────────────────────────
-- 12. AUTO-CREATE PROFILE ON SIGN-UP (trigger)
-- ─────────────────────────────────────────────────────────────
create function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'citizen';
begin
  if new.email = 'prajapatishailesh2289@gmail.com' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, first_name, last_name, email, avatar_url)
  values (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'first_name',
      split_part(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'last_name',
      SUBSTRING(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') FROM '[^ ]+$')
    ),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 13. AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_issue_updated
  before update on public.issues
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 14. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

-- PROFILES
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- USER_ROLES
create policy "Users can see their own roles" on public.user_roles for select using (auth.uid() = user_id);

-- ISSUES
create policy "Authenticated users can create issues" on public.issues for insert with check (auth.uid() = created_by);

create policy "Users see issues from joined areas" on public.issues for select
using (
  exists (
    select 1 from public.area_memberships am
    where am.user_id = auth.uid()
    and is_descendant(public.issues.area_id, am.area_id)
  )
  or created_by = auth.uid()
);

create policy "Officers can update issues in their area" on public.issues for update
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('officer','admin','super_admin')
      and public.is_descendant(issues.area_id, ur.area_id)
  )
);

-- OFFICER REQUESTS
create policy "Users can create officer requests" on public.officer_requests for insert with check (auth.uid() = user_id);
create policy "Users can view their own officer requests" on public.officer_requests for select using (auth.uid() = user_id);

-- AREA MEMBERSHIPS
create policy "User can join area" on public.area_memberships for insert with check (auth.uid() = user_id);
create policy "User can see memberships" on public.area_memberships for select using (true);

-- COMMENTS
alter table public.comments enable row level security;
create policy "Users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Read comments" on public.comments for select using (true);

-- ─────────────────────────────────────────────────────────────
-- 15. GET_AREA_ISSUES_FEED RPC
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_area_issues_feed(
  p_area_id uuid default null,
  p_search text default null,
  p_order_by text default 'new',
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  area_id uuid,
  created_by uuid,
  assigned_to uuid,
  image_urls jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  visibility text,
  upvotes_count int,
  comments_count bigint,
  author_first_name text,
  author_last_name text,
  author_avatar_url text,
  area_name text,
  area_type text
) as $$
begin
  return query
  select 
    i.id,
    i.title,
    i.description,
    i.status,
    i.priority,
    i.area_id,
    i.created_by,
    i.assigned_to,
    i.image_urls,
    i.created_at,
    i.updated_at,
    i.visibility,
    i.upvotes_count,
    (select count(*) from public.comments c where c.issue_id = i.id) as comments_count,
    p.first_name as author_first_name,
    p.last_name as author_last_name,
    p.avatar_url as author_avatar_url,
    a.name as area_name,
    a.type as area_type
  from public.issues i
  left join public.profiles p on p.id = i.created_by
  left join public.areas a on a.id = i.area_id
  where (p_area_id is null or public.is_descendant(i.area_id, p_area_id))
    and (p_search is null or p_search = '' or i.title ilike '%' || p_search || '%' or i.description ilike '%' || p_search || '%')
    and (i.visibility = 'public' or i.created_by = auth.uid())
  order by
    case when p_order_by = 'popular' then i.upvotes_count end desc nulls last,
    case when p_order_by = 'popular' then i.created_at end desc nulls last,
    case when p_order_by = 'new' then i.created_at end desc nulls last,
    i.id
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable security definer set search_path = public;

-- ─────────────────────────────────────────────────────────────
-- 16. STORAGE FOR OFFICER PROOFS
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('officer-proofs', 'officer-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to officer-proofs" ON storage.objects 
FOR SELECT USING (bucket_id = 'officer-proofs');

CREATE POLICY "Allow authenticated uploads to officer-proofs" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'officer-proofs');

-- ─────────────────────────────────────────────────────────────
-- 17. MAKE SPECIFIC USER ADMIN IF ALREADY EXISTS
-- ─────────────────────────────────────────────────────────────
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id IN (SELECT id FROM public.profiles WHERE email = 'prajapatishailesh2289@gmail.com');
