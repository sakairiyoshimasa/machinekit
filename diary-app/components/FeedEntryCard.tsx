'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DiaryEntry, Mood, MOOD_EMOJI } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Lock } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { decrypt, isEncrypted } from '@/lib/crypto'

interface Props {
  entry: DiaryEntry
  isOwn: boolean
}

export default function FeedEntryCard({ entry, isOwn }: Props) {
  const { myPublicKey, partnerPublicKey } = useEncryption()
  const [title, setTitle] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const formattedDate = format(new Date(entry.date + 'T00:00:00'), 'M月d日(E)', { locale: ja })
  const needsKey = isEncrypted(entry.title) || isEncrypted(entry.content)
  const key = isOwn ? myPublicKey : partnerPublicKey

  useEffect(() => {
    if (!needsKey) {
      setTitle(entry.title || '無題')
      setPreview(entry.content)
      return
    }
    if (!key) {
      setTitle(null)
      setPreview(null)
      return
    }
    Promise.all([
      decrypt(entry.title || '', key),
      decrypt(entry.content || '', key),
    ]).then(([t, c]) => {
      setTitle(t || '無題')
      setPreview(c)
    }).catch(() => {
      setTitle('(復号化エラー)')
      setPreview('')
    })
  }, [key, entry.title, entry.content, needsKey])

  return (
    <Link href={`/diary/${entry.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isOwn ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                {isOwn ? 'あなた' : '相手'}
              </span>
              <span className="text-xs text-gray-400">{formattedDate}</span>
              {entry.mood && <span className="text-base">{MOOD_EMOJI[entry.mood as Mood]}</span>}
            </div>
            {title !== null ? (
              <>
                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-amber-700 transition-colors truncate">
                  {title}
                </h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{preview}</p>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs">暗号化されています</span>
              </div>
            )}
          </div>
          <div className="text-gray-300 group-hover:text-amber-400 transition-colors text-lg">→</div>
        </div>
      </div>
    </Link>
  )
}
