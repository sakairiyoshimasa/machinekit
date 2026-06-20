'use client'

import Link from 'next/link'
import { DiaryEntry, Mood, MOOD_EMOJI } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  entry: DiaryEntry
  isOwn: boolean
}

export default function FeedEntryCard({ entry, isOwn }: Props) {
  const formattedDate = format(new Date(entry.date + 'T00:00:00'), 'M月d日(E)', { locale: ja })

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
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-amber-700 transition-colors truncate">
              {entry.title || '無題'}
            </h3>
            <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{entry.content}</p>
          </div>
          <div className="text-gray-300 group-hover:text-amber-400 transition-colors text-lg">→</div>
        </div>
      </div>
    </Link>
  )
}
