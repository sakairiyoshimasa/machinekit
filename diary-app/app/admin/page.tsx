import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const ADMIN_EMAIL = '3333449@pm.me'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (user.email !== ADMIN_EMAIL) redirect('/diary')

  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, group_code, is_owner, status, created_at')
    .order('created_at', { ascending: true })

  const { data: entries } = await admin
    .from('diary_entries')
    .select('id, user_id, date, updated_at')

  // group_codeでグループ化
  const groups = (profiles ?? []).reduce((acc, p) => {
    if (!acc[p.group_code]) acc[p.group_code] = []
    acc[p.group_code].push(p)
    return acc
  }, {} as Record<string, typeof profiles>)

  const entryMap = (entries ?? []).reduce((acc, e) => {
    if (!acc[e.user_id]) acc[e.user_id] = { count: 0, lastDate: null as string | null }
    acc[e.user_id].count++
    if (!acc[e.user_id].lastDate || e.date > acc[e.user_id].lastDate!) {
      acc[e.user_id].lastDate = e.date
    }
    return acc
  }, {} as Record<string, { count: number; lastDate: string | null }>)

  const totalUsers = profiles?.length ?? 0
  const totalEntries = entries?.length ?? 0
  const totalGroups = Object.keys(groups).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/diary" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-gray-800">管理パネル</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'グループ数', value: totalGroups },
            { label: 'ユーザー数', value: totalUsers },
            { label: '総記事数', value: totalEntries },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* グループ一覧 */}
        <div className="space-y-4">
          {Object.entries(groups).map(([groupCode, members]) => (
            <div key={groupCode} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-gray-700">{groupCode}</span>
                <span className="text-xs text-gray-400">{members!.length}名</span>
              </div>
              <div className="divide-y divide-gray-50">
                {members!.map(member => {
                  const stats = entryMap[member.id] ?? { count: 0, lastDate: null }
                  return (
                    <div key={member.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm text-gray-800 truncate">{member.email}</p>
                          {member.is_owner && (
                            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">オーナー</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                            member.status === 'approved'
                              ? 'bg-green-50 text-green-600 border-green-200'
                              : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                          }`}>
                            {member.status === 'approved' ? '承認済' : '承認待ち'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          登録: {format(new Date(member.created_at), 'yyyy/M/d', { locale: ja })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{stats.count}件</p>
                        <p className="text-xs text-gray-400">
                          {stats.lastDate
                            ? `最終: ${format(new Date(stats.lastDate + 'T00:00:00'), 'M/d', { locale: ja })}`
                            : '未投稿'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {totalUsers === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">ユーザーがいません</p>
        )}
      </main>
    </div>
  )
}
