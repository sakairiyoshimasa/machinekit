'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, KeyRound, Loader2, Check, QrCode, Copy } from 'lucide-react'

interface Props {
  email: string
  groupCode: string
  isOwner: boolean
}

export default function AccountClient({ email, groupCode: initialGroupCode, isOwner }: Props) {
  const router = useRouter()
  const [groupCode, setGroupCode] = useState(initialGroupCode)
  const [newPassphrase, setNewPassphrase] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const inviteUrl = origin ? `${origin}/auth/login?passphrase=${encodeURIComponent(groupCode)}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSaving(true)

    const res = await fetch('/api/account/passphrase', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassphrase }),
    })
    const data = await res.json()

    if (res.ok) {
      setSuccess(true)
      setGroupCode(newPassphrase.trim())
      setNewPassphrase('')
      router.refresh()
    } else {
      setError(data.error ?? '変更に失敗しました')
    }
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/diary" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-800">アカウント設定</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">アカウント情報</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">メールアドレス</p>
              <p className="text-gray-700 text-sm mt-0.5">{email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">現在のパスフレーズ</p>
              <p className="text-gray-700 text-sm mt-0.5 font-mono">{groupCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">権限</p>
              <p className="text-gray-700 text-sm mt-0.5">{isOwner ? 'オーナー' : 'メンバー'}</p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500">招待QRコード</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              スキャンするとパスフレーズが自動入力された登録画面が開きます
            </p>
            {inviteUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <QRCodeSVG
                    value={inviteUrl}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#1f2937"
                    level="M"
                  />
                </div>
                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 text-gray-500 hover:text-amber-600 transition-all whitespace-nowrap"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">パスフレーズを変更</h2>
            <p className="text-xs text-gray-400 mb-4">
              変更するとグループ全員のパスフレーズが更新されます
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={newPassphrase}
                  onChange={e => setNewPassphrase(e.target.value)}
                  placeholder="新しいパスフレーズ"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              {success && (
                <p className="text-green-600 text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  パスフレーズを変更しました
                </p>
              )}
              <button
                type="submit"
                disabled={isSaving || !newPassphrase.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                変更する
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
