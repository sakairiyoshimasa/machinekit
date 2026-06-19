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
            メールアドレスとパスワードだけで登録できます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記は非公開と公開の2種類があります。デフォルトは非公開です。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            日記はブラウザ上で暗号化してから保存されます。非公開日記には「非公開パスワード」、公開日記には「公開パスワード」を使います。どちらもアカウント設定で設定してください。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            相手の公開日記を読むには、アカウント設定で相手のメールアドレスと公開パスワードを登録します。相手に直接教えてもらってください。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            登録できる相手は1名だけです。フィードには自分と相手の公開日記が表示されます。
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            パスワードを忘れると暗号化した日記が読めなくなります。パスワードマネージャーへの保存を推奨します。
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
