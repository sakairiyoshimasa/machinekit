'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/types'
import { Send, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CommentsSectionProps {
  entryId: string
  currentUserId: string
}

export default function CommentsSection({ entryId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true })
    if (data) setComments(data as Comment[])
  }

  useEffect(() => { load() }, [entryId])

  const post = async () => {
    if (!text.trim()) return
    setPosting(true)
    await supabase.from('comments').insert({
      entry_id: entryId,
      user_id: currentUserId,
      content: text.trim(),
    })
    setText('')
    await load()
    setPosting(false)
  }

  const remove = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">
        コメント {comments.length > 0 && `(${comments.length})`}
      </h3>

      <div className="space-y-3 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">まだコメントはありません</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${c.user_id === currentUserId ? 'text-amber-600' : 'text-blue-500'}`}>
                  {c.user_id === currentUserId ? 'あなた' : '相手'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {format(new Date(c.created_at), 'M/d HH:mm', { locale: ja })}
                  </span>
                  {c.user_id === currentUserId && (
                    <button
                      onClick={() => remove(c.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post() } }}
          placeholder="コメントを入力..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition-colors"
        />
        <button
          onClick={post}
          disabled={posting || !text.trim()}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white p-2 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
