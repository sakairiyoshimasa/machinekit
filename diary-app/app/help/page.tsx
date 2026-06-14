import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-6">この日記の使いかた</h1>

        <ul className="space-y-4 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記の内容は記事ごとに公開・非公開が選べます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            デフォルトは非公開です。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            公開にすると、利用者全員に公開されます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Claudeとのチャットを日記に要約することができます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            チャットしなくても日記は書けます。
          </li>
        </ul>

        <Link
          href="/auth/login"
          className="mt-8 flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </Link>
      </div>
    </div>
  )
}
