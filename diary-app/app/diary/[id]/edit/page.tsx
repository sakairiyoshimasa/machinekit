'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DiaryEntry, Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DiaryEditor from '@/components/DiaryEditor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditDiaryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setEntry(data as DiaryEntry)
      })
  }, [id])

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
    const { error } = await supabase
      .from('diary_entries')
      .update({ title: title || '無題', content, mood, is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      router.push(`/diary/${id}`)
    } else {
      setIsSaving(false)
    }
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  const formattedDate = format(
    new Date(entry.date + 'T00:00:00'),
    'yyyy年M月d日(E)',
    { locale: ja }
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/diary/${id}`} className="text-gray-400 hover:text-gray-600">
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
