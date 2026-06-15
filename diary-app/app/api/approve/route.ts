import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, action } = await request.json()

  if (!userId || !action) {
    return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未認証です' }, { status: 401 })
  }

  // Check requester is owner
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('group_code, is_owner')
    .eq('id', user.id)
    .single()

  if (!ownerProfile?.is_owner) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  // Check target user is in same group and pending
  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('group_code, status')
    .eq('id', userId)
    .single()

  if (!targetProfile || targetProfile.group_code !== ownerProfile.group_code) {
    return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 })
  }

  if (action === 'approve') {
    await admin
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId)
  } else if (action === 'reject') {
    await admin.from('profiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  return NextResponse.json({ success: true })
}
