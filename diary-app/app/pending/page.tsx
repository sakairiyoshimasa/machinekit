'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

export default function PendingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'approved') {
      router.push('/diary')
    } else {
      setChecking(false)
      alert('まだ承認されていません。オーナーに確認してください。')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="bg-amber-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-3">承認待ちです</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          パスフレーズのオーナーがあなたの参加を承認するまでお待ちください。
          承認されたら下のボタンで確認できます。
        </p>
        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            承認状況を確認する
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
