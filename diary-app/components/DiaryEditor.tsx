'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Globe, Lock } from 'lucide-react'
import { Mood, MOOD_EMOJI, MOOD_LABELS } from '@/types'

interface DiaryEditorProps {
  initialTitle?: string
  initialContent?: string
  initialMood?: Mood | null
  initialIsPublic?: boolean
  date: string
  onSave: (data: { title: string; content: string; mood: Mood | null; isPublic: boolean }) => Promise<void>
  isSaving?: boolean
}

const MOODS: Mood[] = ['great', 'good', 'neutral', 'bad', 'terrible']

export default function DiaryEditor({
  initialTitle = '',
  initialContent = '',
  initialMood = null,
  initialIsPublic = false,
  date,
  onSave,
  isSaving = false,
}: DiaryEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [mood, setMood] = useState<Mood | null>(initialMood)
  const [isPublic, setIsPublic] = useState(initialIsPublic)

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    if (initialContent) setContent(initialContent)
  }, [initialContent])

  const handleSave = () => {
    onSave({ title, content, mood, isPublic })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{date}</p>
          <h2 className="font-semibold text-gray-700 text-sm mt-0.5">日記を書く</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPublic(v => !v)}
            title={isPublic ? '公開中（クリックで非公開）' : '非公開（クリックで公開）'}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-all ${
              isPublic
                ? 'text-amber-600 border-amber-300 bg-amber-50'
                : 'text-gray-400 border-gray-200'
            }`}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? '公開' : '非公開'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            保存
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">今日の気分:</span>
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? null : m)}
              title={MOOD_LABELS[m]}
              className={`text-xl transition-transform hover:scale-110 ${
                mood === m ? 'scale-110' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {MOOD_EMOJI[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="タイトルを入力..."
          className="w-full text-lg font-semibold text-gray-800 placeholder-gray-300 border-none outline-none"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="ここに日記を書いてください。\n\nAIとの会話から「日記を生成」ボタンを押すと、自動で文章が入力されます。"
          className="w-full flex-1 text-gray-700 placeholder-gray-300 text-sm leading-relaxed border-none outline-none resize-none"
          style={{ minHeight: '300px' }}
        />
      </div>

      <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {content.length > 0 ? `${content.length}文字` : ''}
        </span>
        <span className="text-xs text-gray-400">
          Shift+Enterで改行
        </span>
      </div>
    </div>
  )
}
