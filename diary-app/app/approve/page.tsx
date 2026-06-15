import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/types'
import ApproveClient from './ApproveClient'

export default async function ApprovePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!myProfile?.is_owner) redirect('/diary')

  const { data: pending } = await supabase
    .from('profiles')
    .select('*')
    .eq('group_code', myProfile.group_code)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return <ApproveClient pending={(pending as Profile[]) ?? []} />
}
