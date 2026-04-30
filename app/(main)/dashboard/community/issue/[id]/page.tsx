import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import IssueDetailClient from "@/components/community/issue-detail-client"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();
  
  const { id } = await params;
  
  const { data: issue } = await supabase
    .from("issues")
    .select("title, description")
    .eq("id", id)
    .single();

  if (!issue) return { title: "Issue Not Found" }

  return {
    title: issue.title + " | CivicIssue",
    description: issue.description?.slice(0, 160) || "View this civic issue on CivicIssue.",
    openGraph: {
      title: issue.title,
      description: issue.description?.slice(0, 160) || "",
      type: "article",
    },
  }
}

export default async function IssueDetailPage({ params }: Props) {
  const supabase = await createClient()
  
  const { id } = await params;

  const { data: issue, error } = await supabase
    .from("issues")
    .select(
      `
      *,
      author:profiles!created_by(id, first_name, last_name, avatar_url),
      area:areas!area_id(id, name, type)
    `
    )
    .eq("id", id)
    .single()

  if (error || !issue) {
    notFound()
  }

  // Fetch top-level comments
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user:profiles!user_id(
        id, 
        first_name, 
        last_name, 
        avatar_url,
        user_roles(role)
      )
    `
    )
    .eq("issue_id", id)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .limit(10)

  // Fetch issue updates
  const { data: updates } = await supabase
    .from("issue_updates")
    .select(`
      id,
      message,
      created_at,
      user:profiles!user_id(id, first_name, last_name, avatar_url, user_roles(role))
    `)
    .eq("issue_id", id)
    .order("created_at", { ascending: true })

  return <IssueDetailClient issue={issue} initialComments={comments || []} updates={updates || []} />
}
