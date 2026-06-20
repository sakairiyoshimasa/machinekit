import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { DiaryEntry } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import DeleteButton from '@/components/DeleteButton'
import PublicToggle from '@/components/PublicToggle'
import UnlockBanner from '@/components/UnlockBanner'
import DiaryDetailContent from './DiaryDetailContent'
import { isEncrypted } from '@/lib/crypto'


export default async function DiaryDetailPage({
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

  const diaryEntry = entry as DiaryEntry
  const isOwner = diaryEntry.user_id === user.id

  const formattedDate = format(
    new Date(diaryEntry.date + 'T00:00:00'),
    'yyyy年M月d日(E)',
    { locale: ja }
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={isOwner ? '/diary' : '/feed'}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <PublicToggle
                  entryId={id}
                  title={diaryEntry.title}
                  content={diaryEntry.content}
                  initialIsPublic={diaryEntry.is_public ?? false}
                />
                <Link
                  href={`/diary/${id}/edit`}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  編集
                </Link>
                <DeleteButton entryId={id} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <UnlockBanner sample={!diaryEntry.is_public && isEncrypted(diaryEntry.title) ? diaryEntry.title ?? undefined : undefined} />
        <DiaryDetailContent
          entry={diaryEntry}
          isOwner={isOwner}
          currentUserId={user.id}
          formattedDate={formattedDate}
        />
      </main>
    </div>
  )
}
