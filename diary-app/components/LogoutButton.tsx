'use client'

import { LogOut } from 'lucide-react'
import { useEncryption } from '@/contexts/EncryptionContext'

export default function LogoutButton() {
  const { lockAll } = useEncryption()

  return (
    <form action="/api/auth/signout" method="POST" onSubmit={() => lockAll()}>
      <button
        type="submit"
        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
        title="ログアウト"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </form>
  )
}
