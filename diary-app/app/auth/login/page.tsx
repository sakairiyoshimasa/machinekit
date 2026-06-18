'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const passphrase = params.get('passphrase')
    if (passphrase) {
      setGroupCode(passphrase)
      setIsSignUp(true)
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, groupCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else if (data.newGroup) {
        setMessage('アカウントを作成しました。ログインしてください。')
        setIsSignUp(false)
      } else {
        setMessage('登録しました。パスフレーズのオーナーの承認をお待ちください。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        router.push('/diary')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-100 p-3 rounded-full mb-3">
            <BookOpen className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">дневник на двоих</h1>
          <Link href="/help" className="text-amber-600 hover:text-amber-700 text-xs mt-2">
            この日記の使いかた
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="6文字以上"
            />
          </div>
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスフレーズ</label>
              <input
                type="text"
                value={groupCode}
                onChange={e => setGroupCode(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="パスフレーズを入力"
              />
              <p className="text-xs text-gray-400 mt-1">
                新しいパスフレーズで登録するとグループオーナーになります。既存のパスフレーズを入力するとオーナーの承認が必要です。
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
          {message && <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            className="text-amber-600 hover:text-amber-700 text-sm"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>
      </div>
    </div>
  )
}
