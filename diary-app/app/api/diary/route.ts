import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const body = await request.json()
  const { title, content, mood, date, is_public } = body

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diary_entries')
    .insert({
      user_id: user.id,
      title,
      content,
      mood,
      date,
      is_public,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
