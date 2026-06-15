import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { ChatMessage } from '@/types'

export const maxDuration = 60

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    // Check if AI chat is enabled
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'ai_chat_enabled')
      .single()

    if (setting?.value === 'false') {
      return NextResponse.json({ error: 'AI機能は現在停止中です' }, { status: 503 })
    }

    const { messages, mode, date }: {
      messages: ChatMessage[]
      mode: 'chat' | 'generate'
      date?: string
    } = await request.json()

    const systemPrompt = mode === 'generate'
      ? `あなたは日記ライターのアシスタントです。ユーザーとの会話の内容をもとに、${date ? `${date}の` : ''}日記の文章を日本語で作成してください。

日記の文章は以下の点を意識して書いてください：
- 一人称（私は、今日は、など）で書く
- 感情や気持ちを丁寧に表現する
- 出来事を自然な流れで描写する
- 読み返したときに当時の気持ちが蘇るような文章にする
- 800〜1200文字程度でしっかり書く
- ユーザーが話した内容だけをもとにする（AIの質問文は日記に含めない）
- 会話が途中でも、話された内容から想像を膨らませて書く

前置きや導入文は不要です。以下の形式で直接出力してください。

出力形式：
タイトル：（タイトル）

（日記本文）`
      : `あなたは日記をつけるのを手伝う優しいAIアシスタントです。ユーザーが今日の出来事や気持ちを話しやすいように、自然な会話で引き出してください。

以下のことを心がけてください：
- 日本語で話す
- 共感的で温かみのある返答をする
- 出来事だけでなく、その時の感情や気持ちも聞く
- 一度に多くの質問をしない（1個まで）
- ユーザーが話してくれたことをしっかり受け止めてから次の質問をする
- 具体的なエピソードを引き出す質問をする
- ユーザーが3回返答するたびに、次の質問の代わりに「まだ続けますか？続ける場合はそのままお話しください。よければ「日記を生成」ボタンを押してください。」と伝える
- 「要約」「まとめ」などの言葉は使わない

まずは「今日はどんな一日でしたか？」などの自然な質問から始めてください。`

    // 生成モードはユーザーの発言だけを抽出して渡す
    if (mode === 'generate') {
      const userMessages = messages
        .filter(m => m.role === 'user')
        .map((m, i) => `【${i + 1}】${m.content}`)
        .join('\n')

      const generatePrompt = `あなたは日記ライターのアシスタントです。以下はユーザーが今日話してくれた内容です。この内容だけをもとに、${date ? `${date}の` : ''}日記を日本語で作成してください。

【ユーザーが話した内容】
${userMessages}

日記を書く際のルール：
- 一人称（今日は、私は、など）で書く
- 出来事を自然な流れで描写する
- 800〜1200文字程度で書く
- 上記の【ユーザーが話した内容】に書かれていないエピソード・感情・出来事は一切追加しない
- 話された内容を誇張したり、劇的に演出したりしない
- 感情表現はユーザーが実際に述べたものだけにとどめる
- ユーザーが話した事実をそのまま、自然な日記の文体に整える
- 前置きや導入文は不要。タイトルから直接始める

出力形式：
タイトル：（タイトル）

（日記本文）`

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: generatePrompt,
        messages: [{ role: 'user', content: '日記を作成してください。' }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ text })
    }

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } catch (streamError) {
          console.error('Stream error:', streamError)
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process chat request: ${message}` },
      { status: 500 }
    )
  }
}
