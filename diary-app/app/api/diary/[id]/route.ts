import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const body = await request.json()

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('diary_entries')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.content !== undefined) updates.content = body.content
  if (body.mood !== undefined) updates.mood = body.mood
  if (body.is_public !== undefined) updates.is_public = body.is_public

  const { data, error } = await admin
    .from('diary_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('diary_entries')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { error } = await admin
    .from('diary_entries')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
