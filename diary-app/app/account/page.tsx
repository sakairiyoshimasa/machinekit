import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('group_code, is_owner, status')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/diary')

  return (
    <AccountClient
      email={user.email ?? ''}
      groupCode={profile.group_code}
      isOwner={profile.is_owner}
    />
  )
}
