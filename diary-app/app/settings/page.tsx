import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (user.email !== '3333449@pm.me') redirect('/diary')

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')

  const aiEnabled = settings?.find(s => s.key === 'ai_chat_enabled')?.value === 'true'

  return <SettingsClient aiEnabled={aiEnabled} />
}
