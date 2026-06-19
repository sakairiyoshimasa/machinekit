import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DiaryCard from '@/components/DiaryCard'
import { DiaryEntry } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { PenLine, BookOpen, LogOut, Users, UserCircle, ShieldCheck } from 'lucide-react'
import UnlockBanner from '@/components/UnlockBanner'
import PublicKeySetupBanner from '@/components/PublicKeySetupBanner'
import { isEncrypted } from '@/lib/crypto'

const ADMIN_EMAIL = '3333449@pm.me'

export default async function DiaryListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const [entriesResult, profileResult] = await Promise.all([
    admin
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    admin
      .from('profiles')
      .select('my_public_slot')
      .eq('id', user.id)
      .single(),
  ])

  const allEntries = (entriesResult.data as DiaryEntry[] | null) ?? []
  const encryptedSample = allEntries.find(e => !e.is_public && isEncrypted(e.title))?.title
  const hasPublicSlot = !!profileResult.data?.my_public_slot

  const groupedEntries = allEntries.reduce(
    (groups, entry) => {
      const monthKey = format(new Date(entry.date + 'T00:00:00'), 'yyyy年M月', { locale: ja })
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(entry)
      return groups
    },
    {} as Record<string, DiaryEntry[]>
  ) ?? {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-gray-800">дневник на двоих</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              フィード
            </Link>
            <Link
              href="/diary/new"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              新しい日記
            </Link>
            {user.email === ADMIN_EMAIL && (
              <Link
                href="/admin"
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
                title="管理パネル"
              >
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/account"
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
              title="アカウント設定"
            >
              <UserCircle className="w-4 h-4" />
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
        <UnlockBanner sample={encryptedSample} />
        <PublicKeySetupBanner hasPublicSlot={hasPublicSlot} />
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-gray-600 font-medium mb-2">まだ日記がありません</h2>
            <p className="text-gray-400 text-sm mb-6">
              今日の日記を書いてみましょう
            </p>
            <Link
              href="/diary/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <PenLine className="w-4 h-4" />
              最初の日記を書く
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([month, monthEntries]) => (
              <div key={month}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  {month}
                </h2>
                <div className="space-y-2">
                  {monthEntries.map(entry => (
                    <DiaryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
