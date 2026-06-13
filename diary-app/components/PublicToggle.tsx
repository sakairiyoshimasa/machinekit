'use client'

import { useState } from 'react'
import { Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PublicToggleProps {
  entryId: string
  initialIsPublic: boolean
}

export default function PublicToggle({ entryId, initialIsPublic }: PublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggle = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('diary_entries')
      .update({ is_public: !isPublic })
      .eq('id', entryId)
    if (!error) setIsPublic(v => !v)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${
        isPublic
          ? 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100'
          : 'text-gray-500 border-gray-200 hover:border-gray-300'
      }`}
    >
      {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {isPublic ? '公開中' : '非公開'}
    </button>
  )
}
