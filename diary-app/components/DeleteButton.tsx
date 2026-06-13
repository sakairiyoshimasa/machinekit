'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteButton({ entryId }: { entryId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', entryId)

    if (!error) {
      router.push('/diary')
      router.refresh()
    } else {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">削除しますか？</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded transition-colors"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'はい'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded transition-colors"
        >
          いいえ
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
      title="削除"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
