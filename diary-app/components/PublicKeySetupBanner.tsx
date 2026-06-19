import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function PublicKeySetupBanner({ hasPublicSlot }: { hasPublicSlot: boolean }) {
  if (hasPublicSlot) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-blue-600" />
        <p className="text-sm font-medium text-blue-800">公開パスワードが未設定です</p>
      </div>
      <p className="text-xs text-blue-600 mb-3">
        公開日記の暗号化や相手の日記を読むには、アカウント設定で公開パスワードを設定してください。
      </p>
      <Link
        href="/account"
        className="inline-block text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        アカウント設定へ
      </Link>
    </div>
  )
}
