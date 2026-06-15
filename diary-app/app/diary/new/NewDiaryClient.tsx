'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AIChatPanel from '@/components/AIChatPanel'
import DiaryEditor from '@/components/DiaryEditor'
import { ChatMessage, Mood } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft, MessageCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function NewDiaryClient({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'yyyy年M月d日(E)', { locale: ja })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>(aiEnabled ? 'chat' : 'editor')

  const handleGenerateDiary = (content: string, title: string) => {
    setEditorTitle(title)
    setEditorContent(content)
    setActiveTab('editor')
  }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        title: title || todayLabel,
        content,
        mood,
        date: today,
        is_public: isPublic,
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
          <Link href="/diary" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-800">新しい日記</h1>
            <p className="text-xs text-gray-400">{todayLabel}</p>
          </div>
        </div>

        {/* モバイル用タブ（AI有効時のみ） */}
        {aiEnabled && (
          <div className="flex lg:hidden mb-3 bg-white rounded-xl border border-gray-200 p-1 gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              AIと話す
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'editor' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              日記を書く
              {editorContent && activeTab !== 'editor' && (
                <span className="w-2 h-2 bg-green-400 rounded-full" />
              )}
            </button>
          </div>
        )}

        <div
          className={`grid gap-4 ${aiEnabled ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}
          style={{ height: 'calc(100vh - 130px)' }}
        >
          {aiEnabled && (
            <div className={`${activeTab === 'chat' ? 'block' : 'hidden'} lg:block h-full`}>
              <AIChatPanel
                messages={messages}
                onMessagesChange={setMessages}
                onGenerateDiary={handleGenerateDiary}
                date={todayLabel}
              />
            </div>
          )}
          <div className={`${!aiEnabled || activeTab === 'editor' ? 'block' : 'hidden'} lg:block h-full`}>
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
    </div>
  )
}
