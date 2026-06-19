'use client'

import { useState, useEffect } from 'react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { decrypt, isEncrypted } from '@/lib/crypto'
import { DiaryEntry, Mood, MOOD_EMOJI, MOOD_LABELS } from '@/types'
import { Lock } from 'lucide-react'
import CommentsSection from '@/components/CommentsSection'

interface Props {
  entry: DiaryEntry
  isOwner: boolean
  currentUserId: string
  formattedDate: string
}

export default function DiaryDetailContent({ entry, isOwner, currentUserId, formattedDate }: Props) {
  const { key } = useEncryption()
  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    const needsKey = isEncrypted(entry.title) || isEncrypted(entry.content)
    if (!needsKey) {
      setTitle(entry.title || '無題')
      setContent(entry.content)
      return
    }
    if (!key) {
      setTitle(null)
      setContent(null)
      return
    }
    Promise.all([
      decrypt(entry.title || '', key),
      decrypt(entry.content || '', key),
    ]).then(([t, c]) => {
      setTitle(t || '無題')
      setContent(c)
    }).catch(() => {
      setTitle('(復号化エラー)')
      setContent('パスワードが正しくないか、データが破損しています。')
    })
  }, [key, entry.title, entry.content])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
      {!isOwner && <p className="text-xs text-blue-500 font-medium mb-4">相手の日記</p>}

      <div className="flex items-center gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-400">{formattedDate}</p>
          {entry.mood && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl">{MOOD_EMOJI[entry.mood as Mood]}</span>
              <span className="text-xs text-gray-400">{MOOD_LABELS[entry.mood as Mood]}</span>
            </div>
          )}
        </div>
      </div>

      {title !== null ? (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {content}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
          <Lock className="w-8 h-8" />
          <p className="text-sm">暗号化パスワードを入力すると読めます</p>
        </div>
      )}

      {entry.is_public && title !== null && (
        <CommentsSection entryId={entry.id} currentUserId={currentUserId} />
      )}
    </div>
  )
}
