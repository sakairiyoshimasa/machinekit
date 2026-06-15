'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'
import { ArrowLeft, Check, X, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ApproveClient({ pending }: { pending: Profile[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [members, setMembers] = useState(pending)

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setLoading(userId)
    const res = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })
    if (res.ok) {
      setMembers(m => m.filter(p => p.id !== userId))
      if (action === 'approve') router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/diary" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-gray-800">メンバー承認</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {members.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-500">承認待ちのメンバーはいません</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              以下のユーザーがあなたのグループへの参加を申請しています。
            </p>
            {members.map(member => (
              <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{member.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(member.created_at), 'yyyy年M月d日 HH:mm', { locale: ja })} 申請
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(member.id, 'reject')}
                      disabled={loading === member.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      拒否
                    </button>
                    <button
                      onClick={() => handleAction(member.id, 'approve')}
                      disabled={loading === member.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      承認
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
