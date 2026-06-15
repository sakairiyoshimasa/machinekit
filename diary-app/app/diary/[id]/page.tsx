import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { DiaryEntry, Mood, MOOD_EMOJI, MOOD_LABELS } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import DeleteButton from '@/components/DeleteButton'
import PublicToggle from '@/components/PublicToggle'
import CommentsSection from '@/components/CommentsSection'

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
                <PublicToggle entryId={id} initialIsPublic={diaryEntry.is_public ?? false} />
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          {!isOwner && (
            <p className="text-xs text-blue-500 font-medium mb-4">相手の日記</p>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div>
              <p className="text-sm text-gray-400">{formattedDate}</p>
              {diaryEntry.mood && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl">{MOOD_EMOJI[diaryEntry.mood as Mood]}</span>
                  <span className="text-xs text-gray-400">{MOOD_LABELS[diaryEntry.mood as Mood]}</span>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {diaryEntry.title || '無題'}
          </h1>

          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {diaryEntry.content}
          </div>

          {diaryEntry.is_public && (
            <CommentsSection entryId={id} currentUserId={user.id} />
          )}
        </div>
      </main>
    </div>
  )
}
