'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { ChatMessage } from '@/types'

interface AIChatPanelProps {
  messages: ChatMessage[]
  onMessagesChange: (messages: ChatMessage[]) => void
  onGenerateDiary: (content: string, title: string) => void
  date: string
}

export default function AIChatPanel({
  messages,
  onMessagesChange,
  onGenerateDiary,
  date,
}: AIChatPanelProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      startConversation()
    }
  }, [])

  const startConversation = async () => {
    setIsLoading(true)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [], mode: 'chat', date }),
    })

    if (!response.ok) return setIsLoading(false)

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMessage += decoder.decode(value, { stream: true })
      }
    }

    onMessagesChange([{ role: 'assistant', content: assistantMessage }])
    setIsLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    onMessagesChange(newMessages)
    setInput('')
    setIsLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, mode: 'chat', date }),
    })

    if (!response.ok) {
      setIsLoading(false)
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ''
    const streamMessages = [...newMessages, { role: 'assistant' as const, content: '' }]
    onMessagesChange(streamMessages)

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMessage += decoder.decode(value, { stream: true })
        onMessagesChange([
          ...newMessages,
          { role: 'assistant', content: assistantMessage },
        ])
      }
    }

    setIsLoading(false)
  }

  const handleGenerateDiary = async () => {
    if (messages.length < 2) return
    setIsGenerating(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode: 'generate', date }),
    })

    if (!response.ok) {
      setIsGenerating(false)
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let generated = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        generated += decoder.decode(value, { stream: true })
      }
    }

    const titleMatch = generated.match(/タイトル[：:]\s*(.+)/)
    const title = titleMatch ? titleMatch[1].trim() : '今日の日記'
    const content = generated.replace(/タイトル[：:].+\n?/, '').trim()

    onGenerateDiary(content, title)
    setIsGenerating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
        <h2 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AIと話す
        </h2>
        <p className="text-xs text-amber-600 mt-0.5">
          今日の出来事を話してみよう
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length >= 2 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={handleGenerateDiary}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                日記を生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                会話から日記を生成
              </>
            )}
          </button>
        </div>
      )}

      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Enter で送信)"
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
