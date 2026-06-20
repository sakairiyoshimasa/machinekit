'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DiaryEntry, Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DiaryEditor from '@/components/DiaryEditor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'
import UnlockBanner from '@/components/UnlockBanner'

export default function EditDiaryClient({ entry }: { entry: DiaryEntry }) {
  const router = useRouter()
  const { privateKey, myPublicKey } = useEncryption()
  const [isSaving, setIsSaving] = useState(false)
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)

  const formattedDate = format(
    new Date(entry.date + 'T00:00:00'),
    'yyyy年M月d日(E)',
    { locale: ja }
  )

  const key = entry.is_public ? myPublicKey : privateKey

  useEffect(() => {
    const needsKey = isEncrypted(entry.title) || isEncrypted(entry.content)
    if (!needsKey) {
      setDecryptedTitle(entry.title || '')
      setDecryptedContent(entry.content || '')
      return
    }
    if (!key) {
      setDecryptedTitle(null)
      setDecryptedContent(null)
      return
    }
    Promise.all([
      decrypt(entry.title || '', key),
      decrypt(entry.content || '', key),
    ]).then(([t, c]) => {
      setDecryptedTitle(t)
      setDecryptedContent(c)
    }).catch(() => {
      setDecryptedTitle('')
      setDecryptedContent('')
    })
  }, [key, entry.title, entry.content])

  const handleSave = async ({
    title,
    content,
    mood,
    isPublic,
  }: {
    title: string
    content: string
    mood: Mood | null
    isPublic: boolean
  }) => {
    setIsSaving(true)
    let encTitle = title || formattedDate
    let encContent = content
    const saveKey = isPublic ? myPublicKey : privateKey
    if (saveKey) {
      encTitle = await encrypt(encTitle, saveKey)
      encContent = await encrypt(content, saveKey)
    }
    const res = await fetch(`/api/diary/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: encTitle,
        content: encContent,
        mood,
        is_public: isPublic,
      }),
    })
    if (res.ok) {
      router.push(`/diary/${entry.id}`)
    } else {
      setIsSaving(false)
    }
  }

  const needsKey = isEncrypted(entry.title) || isEncrypted(entry.content)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/diary/${entry.id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-800">日記を編集</h1>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
        </div>

        {needsKey && <UnlockBanner sample={!entry.is_public && isEncrypted(entry.title) ? entry.title ?? undefined : undefined} />}

        {decryptedTitle !== null && decryptedContent !== null && (
          <div style={{ height: 'calc(100vh - 130px)' }}>
            <DiaryEditor
              initialTitle={decryptedTitle}
              initialContent={decryptedContent}
              initialMood={entry.mood as Mood | null}
              initialIsPublic={entry.is_public ?? false}
              date={formattedDate}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        )}
      </div>
    </div>
  )
}
