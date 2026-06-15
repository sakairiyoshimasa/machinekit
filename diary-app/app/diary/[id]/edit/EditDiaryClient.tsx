'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DiaryEntry, Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DiaryEditor from '@/components/DiaryEditor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditDiaryClient({ entry }: { entry: DiaryEntry }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const formattedDate = format(
    new Date(entry.date + 'T00:00:00'),
    'yyyy年M月d日(E)',
    { locale: ja }
  )

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
    const res = await fetch(`/api/diary/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || formattedDate,
        content,
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

        <div style={{ height: 'calc(100vh - 100px)' }}>
          <DiaryEditor
            initialTitle={entry.title}
            initialContent={entry.content}
            initialMood={entry.mood as Mood | null}
            initialIsPublic={entry.is_public ?? false}
            date={formattedDate}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  )
}
