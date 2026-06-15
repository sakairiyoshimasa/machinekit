'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SettingsClient({ aiEnabled: initial }: { aiEnabled: boolean }) {
  const router = useRouter()
  const [aiEnabled, setAiEnabled] = useState(initial)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const newValue = !aiEnabled
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ai_chat_enabled', value: String(newValue) }),
    })
    if (res.ok) {
      setAiEnabled(newValue)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/diary" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-gray-800">設定</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">AI日記生成</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {aiEnabled ? '現在オンです。AIとの会話から日記を生成できます。' : '現在オフです。AIチャット機能が無効になっています。'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                aiEnabled ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  aiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
