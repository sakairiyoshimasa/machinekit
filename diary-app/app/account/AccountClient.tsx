'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Loader2, Check, KeyRound } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { encrypt, decrypt, deriveKey, isEncrypted } from '@/lib/crypto'
import UnlockBanner from '@/components/UnlockBanner'

interface Props {
  email: string
  partnerUserId: string | null
  encryptedSample: string | null
}

export default function AccountClient({ email, partnerUserId: initialPartnerUserId, encryptedSample }: Props) {
  const { privateKey, unlockPrivate } = useEncryption()

  const [partnerEmail, setPartnerEmail] = useState('')
  const [savingPartner, setSavingPartner] = useState(false)
  const [partnerSaved, setPartnerSaved] = useState(false)
  const [partnerError, setPartnerError] = useState('')
  const [currentPartnerUserId, setCurrentPartnerUserId] = useState(initialPartnerUserId)

  const [oldPrivatePassword, setOldPrivatePassword] = useState('')
  const [newPrivatePassword, setNewPrivatePassword] = useState('')
  const [newPrivateConfirm, setNewPrivateConfirm] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changePasswordDone, setChangePasswordDone] = useState(false)
  const [reencryptProgress, setReencryptProgress] = useState('')

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPartner(true)
    setPartnerError('')
    try {
      const searchRes = await fetch(`/api/users/search?email=${encodeURIComponent(partnerEmail)}`)
      if (!searchRes.ok) {
        const d = await searchRes.json()
        throw new Error(d.error ?? 'ユーザーが見つかりません')
      }
      const { id: pid } = await searchRes.json()

      const saveRes = await fetch('/api/account/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerUserId: pid }),
      })
      if (!saveRes.ok) throw new Error('保存に失敗しました')

      setCurrentPartnerUserId(pid)
      setPartnerSaved(true)
      setPartnerEmail('')
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
      body: JSON.stringify({ partnerUserId: null }),
    })
    if (res.ok) setCurrentPartnerUserId(null)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangePasswordError('')
    if (newPrivatePassword !== newPrivateConfirm) {
      setChangePasswordError('新しいパスワードが一致しません')
      return
    }
    if (encryptedSample && newPrivatePassword === oldPrivatePassword) {
      setChangePasswordError('新旧パスワードが同じです')
      return
    }
    setChangingPassword(true)
    try {
      // 旧鍵を検証（既存エントリーがある場合のみ）
      const oldKey = encryptedSample
        ? await deriveKey(oldPrivatePassword)
        : (privateKey ?? await deriveKey(oldPrivatePassword))
      if (encryptedSample && isEncrypted(encryptedSample)) {
        try {
          await decrypt(encryptedSample, oldKey)
        } catch {
          throw new Error('現在のパスワードが違います')
        }
      }

      // 新鍵を生成
      const newKey = await deriveKey(newPrivatePassword)

      // 全非公開エントリーを再暗号化
      setReencryptProgress('日記を取得中...')
      const entriesRes = await fetch('/api/diary')
      if (!entriesRes.ok) throw new Error('日記の取得に失敗しました')
      const entries: Array<{ id: string; title: string | null; content: string | null; is_public: boolean }> = await entriesRes.json()

      const privateEntries = entries.filter(e => !e.is_public && (isEncrypted(e.title) || isEncrypted(e.content)))
      for (let i = 0; i < privateEntries.length; i++) {
        const entry = privateEntries[i]
        setReencryptProgress(`再暗号化中... ${i + 1}/${privateEntries.length}件`)
        const newTitle = isEncrypted(entry.title)
          ? await encrypt(await decrypt(entry.title!, oldKey), newKey)
          : entry.title
        const newContent = isEncrypted(entry.content)
          ? await encrypt(await decrypt(entry.content!, oldKey), newKey)
          : entry.content
        const res = await fetch(`/api/diary/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, content: newContent }),
        })
        if (!res.ok) throw new Error(`日記ID ${entry.id} の更新に失敗しました`)
      }

      await unlockPrivate(newPrivatePassword)

      setChangePasswordDone(true)
      setOldPrivatePassword('')
      setNewPrivatePassword('')
      setNewPrivateConfirm('')
      setReencryptProgress('')
      setTimeout(() => setChangePasswordDone(false), 4000)
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : '変更に失敗しました')
      setReencryptProgress('')
    }
    setChangingPassword(false)
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

        <UnlockBanner sample={encryptedSample ?? undefined} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">相手の設定</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            相手のメールアドレスを入力してください。フィードに相手の公開日記が表示されます。
            {currentPartnerUserId && ' 現在1名登録済みです。変更すると上書きされます。'}
          </p>
          <form onSubmit={handleSavePartner} className="flex gap-2">
            <input
              type="email"
              value={partnerEmail}
              onChange={e => setPartnerEmail(e.target.value)}
              placeholder="相手のメールアドレス"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              required
            />
            <button
              type="submit"
              disabled={savingPartner || !partnerEmail}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {savingPartner ? <Loader2 className="w-4 h-4 animate-spin" /> : partnerSaved ? <Check className="w-4 h-4" /> : '登録'}
            </button>
          </form>
          {partnerError && <p className="text-red-500 text-xs mt-2">{partnerError}</p>}
          {currentPartnerUserId && (
            <button onClick={handleClearPartner}
              className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors">
              登録を解除する
            </button>
          )}
        </div>

        {privateKey && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">非公開パスワードを{encryptedSample ? '変更' : '設定'}</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {encryptedSample
                ? '変更すると全ての非公開日記が新しいパスワードで再暗号化されます。処理中はページを閉じないでください。'
                : '非公開日記の暗号化に使います。忘れると日記が読めなくなります。パスワードマネージャーへの保存を推奨します。'}
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              {encryptedSample && (
                <input
                  type="password"
                  value={oldPrivatePassword}
                  onChange={e => setOldPrivatePassword(e.target.value)}
                  placeholder="現在のパスワード"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                  required
                />
              )}
              <input
                type="password"
                value={newPrivatePassword}
                onChange={e => setNewPrivatePassword(e.target.value)}
                placeholder="新しいパスワード"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                required
              />
              <input
                type="password"
                value={newPrivateConfirm}
                onChange={e => setNewPrivateConfirm(e.target.value)}
                placeholder="新しいパスワード（確認）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                required
              />
              <button
                type="submit"
                disabled={changingPassword || (!!encryptedSample && !oldPrivatePassword) || !newPrivatePassword || !newPrivateConfirm}
                className="w-full bg-gray-700 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {changingPassword
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{reencryptProgress || '処理中...'}</>
                  : changePasswordDone
                  ? <><Check className="w-4 h-4" />変更しました</>
                  : 'パスワードを変更する'}
              </button>
            </form>
            {changePasswordError && <p className="text-red-500 text-xs mt-2">{changePasswordError}</p>}
          </div>
        )}
      </main>
    </div>
  )
}
