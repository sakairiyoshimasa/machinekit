import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewDiaryClient from './NewDiaryClient'

export default async function NewDiaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <NewDiaryClient />
}
