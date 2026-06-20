'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DiaryEditor from '@/components/DiaryEditor'
import { Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEncryption } from '@/contexts/EncryptionContext'
import { encrypt } from '@/lib/crypto'
import UnlockBanner from '@/components/UnlockBanner'

export default function NewDiaryClient() {
  const router = useRouter()
  const { privateKey } = useEncryption()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'yyyy年M月d日(E)', { locale: ja })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async ({
    title, content, mood, isPublic,
  }: {
    title: string; content: string; mood: Mood | null; isPublic: boolean
  }) => {
    setIsSaving(true)
    let encTitle = title || todayLabel
    let encContent = content
    if (!isPublic && privateKey) {
      encTitle = await encrypt(encTitle, privateKey)
      encContent = await encrypt(content, privateKey)
    }
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: encTitle, content: encContent, mood, date: today, is_public: isPublic }),
    })
    const data = await res.json()
    if (res.ok && data.id) {
      router.push(`/diary/${data.id}`)
    } else {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/diary" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-800">新しい日記</h1>
            <p className="text-xs text-gray-400">{todayLabel}</p>
          </div>
        </div>

        <UnlockBanner />

        <div style={{ height: 'calc(100vh - 130px)' }}>
          <DiaryEditor
            date={todayLabel}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  )
}
