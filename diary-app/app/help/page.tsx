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
            誰かを招待したいときは、アカウント設定のQRコードを見せてください。スキャンするとパスフレーズが自動入力された登録画面が開きます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            同じパスフレーズで登録するとグループとなり、公開に設定した日記だけがお互いに閲覧できます。グループは最大2名で、参加にはオーナーの承認が必要です。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記は記事ごとに公開・非公開が選べます。デフォルトは非公開です。公開にしてもグループ外や未登録のユーザーには見えません。外部への公開機能はありません。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記は暗号化パスワードで保護できます。最初の日記を書く前にパスワードを設定すると、内容が暗号化されて保存されます。グループ内で同じパスワードを使ってください。パスワードを忘れると日記が読めなくなります。
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
