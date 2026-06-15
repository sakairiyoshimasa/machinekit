import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { DiaryEntry } from '@/types'
import EditDiaryClient from './EditDiaryClient'

export default async function EditDiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: entry } = await admin
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (!entry) notFound()
  if (entry.user_id !== user.id) redirect(`/diary/${id}`)

  return <EditDiaryClient entry={entry as DiaryEntry} />
}
