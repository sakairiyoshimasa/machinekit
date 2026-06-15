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
            登録時に自分でパスフレーズを決めます。新しいパスフレーズで登録するとグループのオーナーになります。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            同じパスフレーズで登録したい人がいる場合、オーナーが承認することで参加できます。1グループ最大2名です。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記は記事ごとに公開・非公開が選べます。デフォルトは非公開です。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            公開にすると、同じグループのメンバーだけに見えます。グループ外には公開されません。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            AIと会話しながら日記を生成することができます。チャットしなくても日記は書けます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            通知機能はありません。お互いのペースで書いて、読んでください。
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
