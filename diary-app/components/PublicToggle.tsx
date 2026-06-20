'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Lock, Loader2 } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'

interface PublicToggleProps {
  entryId: string
  title: string | null
  content: string | null
  initialIsPublic: boolean
}

export default function PublicToggle({ entryId, title, content, initialIsPublic }: PublicToggleProps) {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [loading, setLoading] = useState(false)
  const { privateKey, myPublicKey } = useEncryption()

  const toggle = async () => {
    setLoading(true)
    const newIsPublic = !isPublic

    // current key (for decrypt) → new key (for re-encrypt)
    const fromKey = isPublic ? myPublicKey : privateKey
    const toKey = isPublic ? privateKey : myPublicKey

    let newTitle = title
    let newContent = content

    const needsReencrypt = isEncrypted(title) || isEncrypted(content)

    if (needsReencrypt) {
      if (!fromKey || !toKey) {
        // Keys not available — cannot safely toggle; bail out silently
        setLoading(false)
        return
      }
      try {
        if (isEncrypted(title) && title) {
          newTitle = await encrypt(await decrypt(title, fromKey), toKey)
        }
        if (isEncrypted(content) && content) {
          newContent = await encrypt(await decrypt(content, fromKey), toKey)
        }
      } catch {
        setLoading(false)
        return
      }
    }

    const res = await fetch(`/api/diary/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: newIsPublic, title: newTitle, content: newContent }),
    })

    if (res.ok) {
      setIsPublic(newIsPublic)
      router.refresh()
    }
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
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {isPublic ? '公開中' : '非公開'}
    </button>
  )
}
