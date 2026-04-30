'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Provider } from '@supabase/supabase-js'

export async function loginWithEmail(formData: FormData) {
  const staySignedIn = formData.get('staySignedIn') === 'true'
  const supabase = await createClient(staySignedIn)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/home')
}

export async function signupWithEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // We pass firstName and lastName to the metadata so the DB trigger populates the profile stub
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data?.user && !data.session) {
    return { success: true, message: 'Email Sent To Provided Mail. Please Verify The Mail.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/home')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const region = formData.get('region') as string

  // Update profile using RLS policy (User can update own profile)
  const { error } = await supabase
    .from('profiles')
    .update({
      region
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/home')
}

export async function signInWithOAuth(provider: Provider) {
  const supabase = await createClient()

  // Ensure REDIRECT_URL points to the callback route
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    throw error
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
