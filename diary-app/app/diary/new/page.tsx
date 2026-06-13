'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AIChatPanel from '@/components/AIChatPanel'
import DiaryEditor from '@/components/DiaryEditor'
import { ChatMessage, Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewDiaryPage() {
  const router = useRouter()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'yyyy年M月d日(E)', { locale: ja })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerateDiary = (content: string, title: string) => {
    setEditorTitle(title)
    setEditorContent(content)
  }

  const handleSave = async ({
    title,
    content,
    mood,
  }: {
    title: string
    content: string
    mood: Mood | null
  }) => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        title: title || '無題',
        content,
        mood,
        date: today,
      })
      .select()
      .single()

    if (!error && data) {
      router.push(`/diary/${data.id}`)
    } else {
      console.error('Save error:', error)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/diary"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-800">新しい日記</h1>
            <p className="text-xs text-gray-400">{todayLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 100px)' }}>
          <AIChatPanel
            messages={messages}
            onMessagesChange={setMessages}
            onGenerateDiary={handleGenerateDiary}
            date={todayLabel}
          />
          <DiaryEditor
            initialTitle={editorTitle}
            initialContent={editorContent}
            date={todayLabel}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  )
}
