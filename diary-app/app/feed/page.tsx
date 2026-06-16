import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DiaryEntry, Mood, MOOD_EMOJI } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Users, PenLine, LogOut, BookOpen } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: entries } = await admin
    .from('diary_entries')
    .select('*')
    .eq('is_public', true)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const diaryEntries = (entries as DiaryEntry[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-gray-800">フィード</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/diary"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              マイ日記
            </Link>
            <Link
              href="/diary/new"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              新しい日記
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {diaryEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-gray-600 font-medium mb-2">公開されている日記はありません</h2>
            <p className="text-gray-400 text-sm">
              日記を書いて「公開」に設定すると、ここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {diaryEntries.map(entry => {
              const isOwn = entry.user_id === user.id
              const formattedDate = format(
                new Date(entry.date + 'T00:00:00'),
                'M月d日(E)',
                { locale: ja }
              )
              return (
                <Link key={entry.id} href={`/diary/${entry.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isOwn ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                            {isOwn ? 'あなた' : '相手'}
                          </span>
                          <span className="text-xs text-gray-400">{formattedDate}</span>
                          {entry.mood && (
                            <span className="text-base">{MOOD_EMOJI[entry.mood as Mood]}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm group-hover:text-amber-700 transition-colors truncate">
                          {entry.title || '無題'}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                          {entry.content}
                        </p>
                      </div>
                      <div className="text-gray-300 group-hover:text-amber-400 transition-colors text-lg">
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
