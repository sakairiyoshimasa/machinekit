import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DiaryEntry } from '@/types'
import Link from 'next/link'
import { Users, PenLine, BookOpen } from 'lucide-react'
import FeedEntryCard from '@/components/FeedEntryCard'
import UnlockBanner from '@/components/UnlockBanner'
import LogoutButton from '@/components/LogoutButton'
import { isEncrypted } from '@/lib/crypto'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('partner_user_id')
    .eq('id', user.id)
    .single()

  const partnerUserId = profile?.partner_user_id ?? null

  const query = admin
    .from('diary_entries')
    .select('*')
    .eq('is_public', true)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (partnerUserId) {
    query.in('user_id', [user.id, partnerUserId])
  } else {
    query.eq('user_id', user.id)
  }

  const { data: entries } = await query
  const diaryEntries = (entries as DiaryEntry[] | null) ?? []

  // Use a private entry as unlock sample — public entries are encrypted with myPublicKey,
  // which differs from privateKey (different derivation salt), so verification would always fail.
  const { data: privateSampleRow } = await admin
    .from('diary_entries')
    .select('title')
    .eq('user_id', user.id)
    .eq('is_public', false)
    .like('title', 'enc:%')
    .limit(1)
    .maybeSingle()

  const hasEncryptedFeedEntries = diaryEntries.some(e => isEncrypted(e.title))
  const unlockSample = privateSampleRow?.title ?? undefined

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
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {hasEncryptedFeedEntries && <UnlockBanner sample={unlockSample} />}

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
            {diaryEntries.map(entry => (
              <FeedEntryCard key={entry.id} entry={entry} isOwn={entry.user_id === user.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
