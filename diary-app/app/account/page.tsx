import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'
import { isEncrypted } from '@/lib/crypto'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const [profileResult, entriesResult] = await Promise.all([
    admin
      .from('profiles')
      .select('partner_user_id')
      .eq('id', user.id)
      .single(),
    admin
      .from('diary_entries')
      .select('title')
      .eq('user_id', user.id)
      .eq('is_public', false)
      .limit(10),
  ])

  const entries = entriesResult.data ?? []
  const encryptedSample = entries.find(e => isEncrypted(e.title))?.title ?? null

  return (
    <AccountClient
      email={user.email ?? ''}
      partnerUserId={profileResult.data?.partner_user_id ?? null}
      encryptedSample={encryptedSample}
    />
  )
}
