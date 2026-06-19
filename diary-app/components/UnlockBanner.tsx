'use client'

import { useState } from 'react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { Lock, Loader2 } from 'lucide-react'

export default function UnlockBanner({ sample }: { sample?: string }) {
  const { privateKey, unlockPrivate } = useEncryption()

  if (privateKey !== null) return null

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await unlockPrivate(password, sample)
    if (result === 'wrong_password') {
      setError('パスワードが違います')
    }
    setLoading(false)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-amber-600" />
        <p className="text-sm font-medium text-amber-800">
          {sample ? '日記を読むには非公開パスワードが必要です' : '非公開パスワードを設定してください'}
        </p>
      </div>
      {!sample && (
        <p className="text-xs text-amber-600 mb-3">
          このパスワードは忘れると非公開日記が読めなくなります。パスワードマネージャーへの保存を推奨します。
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="非公開パスワード"
          className="flex-1 text-sm border border-amber-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 bg-white"
          required
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '解除'}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  )
}
