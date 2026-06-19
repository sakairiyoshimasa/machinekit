'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Users, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { encrypt, decrypt, deriveKey, storeKey, isEncrypted } from '@/lib/crypto'
import UnlockBanner from '@/components/UnlockBanner'

interface Props {
  email: string
  myPublicSlot: string | null
  partnerSlot: string | null
  partnerUserId: string | null
}

export default function AccountClient({ email, myPublicSlot, partnerSlot, partnerUserId: initialPartnerUserId }: Props) {
  const { privateKey, applyPublicKeys } = useEncryption()

  const [myPublicPassword, setMyPublicPassword] = useState('')
  const [savingMyPublic, setSavingMyPublic] = useState(false)
  const [myPublicSaved, setMyPublicSaved] = useState(false)
  const [myPublicError, setMyPublicError] = useState('')
  const [showMyPublic, setShowMyPublic] = useState(false)

  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerPassword, setPartnerPassword] = useState('')
  const [savingPartner, setSavingPartner] = useState(false)
  const [partnerSaved, setPartnerSaved] = useState(false)
  const [partnerError, setPartnerError] = useState('')
  const [showPartnerPassword, setShowPartnerPassword] = useState(false)
  const [currentPartnerUserId, setCurrentPartnerUserId] = useState(initialPartnerUserId)

  const hasMyPublicSlot = !!myPublicSlot
  const hasPartnerSlot = !!partnerSlot && !!currentPartnerUserId

  const handleSaveMyPublic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!privateKey) return
    setSavingMyPublic(true)
    setMyPublicError('')
    try {
      const encryptedSlot = await encrypt(myPublicPassword, privateKey)
      const res = await fetch('/api/account/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myPublicSlot: encryptedSlot }),
      })
      if (!res.ok) throw new Error('保存に失敗しました')
      const pubKey = await deriveKey(myPublicPassword, 'public')
      await storeKey('public', pubKey)
      applyPublicKeys(pubKey, null, null)
      setMyPublicSaved(true)
      setMyPublicPassword('')
      setTimeout(() => setMyPublicSaved(false), 3000)
    } catch {
      setMyPublicError('保存に失敗しました')
    }
    setSavingMyPublic(false)
  }

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!privateKey) return
    setSavingPartner(true)
    setPartnerError('')
    try {
      const searchRes = await fetch(`/api/users/search?email=${encodeURIComponent(partnerEmail)}`)
      if (!searchRes.ok) {
        const d = await searchRes.json()
        throw new Error(d.error ?? 'ユーザーが見つかりません')
      }
      const { id: pid } = await searchRes.json()

      const encryptedSlot = await encrypt(partnerPassword, privateKey)
      const saveRes = await fetch('/api/account/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerSlot: encryptedSlot, partnerUserId: pid }),
      })
      if (!saveRes.ok) throw new Error('保存に失敗しました')

      const partnerKey = await deriveKey(partnerPassword, 'public')
      await storeKey('partner', partnerKey)
      applyPublicKeys(null, partnerKey, pid)
      setCurrentPartnerUserId(pid)
      setPartnerSaved(true)
      setPartnerEmail('')
      setPartnerPassword('')
      setTimeout(() => setPartnerSaved(false), 3000)
    } catch (err) {
      setPartnerError(err instanceof Error ? err.message : '保存に失敗しました')
    }
    setSavingPartner(false)
  }

  const handleClearPartner = async () => {
    const res = await fetch('/api/account/slots', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerSlot: null, partnerUserId: null }),
    })
    if (res.ok) {
      setCurrentPartnerUserId(null)
      applyPublicKeys(null, null, null)
      sessionStorage.removeItem('diary_partner_user_id')
    }
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
          <p className="text-xs text-gray-400 mb-1">メールアドレス</p>
          <p className="text-gray-700 text-sm">{email}</p>
        </div>

        <UnlockBanner />

        {privateKey && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">自分の公開パスワード</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                公開日記の暗号化に使います。相手に教えると、相手があなたの公開日記を読めるようになります。
                {hasMyPublicSlot && ' 現在設定済みです。変更するには新しいパスワードを入力してください。'}
              </p>
              <form onSubmit={handleSaveMyPublic} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showMyPublic ? 'text' : 'password'}
                    value={myPublicPassword}
                    onChange={e => setMyPublicPassword(e.target.value)}
                    placeholder={hasMyPublicSlot ? '新しいパスワード' : '公開パスワードを設定'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowMyPublic(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showMyPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={savingMyPublic || !myPublicPassword}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {savingMyPublic ? <Loader2 className="w-4 h-4 animate-spin" /> : myPublicSaved ? <Check className="w-4 h-4" /> : '保存'}
                </button>
              </form>
              {myPublicError && <p className="text-red-500 text-xs mt-2">{myPublicError}</p>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700">相手の公開パスワード</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                相手に教えてもらったメールアドレスと公開パスワードを入力してください。フィードに相手の公開日記が表示されます。
                {hasPartnerSlot && ' 現在1名登録済みです。変更すると上書きされます。'}
              </p>
              <form onSubmit={handleSavePartner} className="space-y-3">
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  placeholder="相手のメールアドレス"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  required
                />
                <div className="relative">
                  <input
                    type={showPartnerPassword ? 'text' : 'password'}
                    value={partnerPassword}
                    onChange={e => setPartnerPassword(e.target.value)}
                    placeholder="相手の公開パスワード"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPartnerPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPartnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={savingPartner || !partnerEmail || !partnerPassword}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingPartner ? <Loader2 className="w-4 h-4 animate-spin" /> : partnerSaved ? <Check className="w-4 h-4" /> : '登録する'}
                </button>
              </form>
              {partnerError && <p className="text-red-500 text-xs mt-2">{partnerError}</p>}
              {hasPartnerSlot && (
                <button onClick={handleClearPartner}
                  className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  登録を解除する
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
