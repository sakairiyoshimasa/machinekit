import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { ChatMessage } from '@/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
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
- 一度に多くの質問をしない（1〜2個まで）
- ユーザーが話してくれたことをしっかり受け止めてから次の質問をする
- 具体的なエピソードを引き出す質問をする

まずは「今日はどんな一日でしたか？」などの自然な質問から始めてください。`

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
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
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
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
