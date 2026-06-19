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
    .select('my_public_slot, partner_slot, partner_user_id')
    .eq('id', user.id)
    .single()

  return (
    <AccountClient
      email={user.email ?? ''}
      myPublicSlot={profile?.my_public_slot ?? null}
      partnerSlot={profile?.partner_slot ?? null}
      partnerUserId={profile?.partner_user_id ?? null}
    />
  )
}
