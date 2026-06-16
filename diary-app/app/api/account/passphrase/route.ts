import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('group_code, is_owner')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'プロファイルが見つかりません' }, { status: 404 })
  if (!profile.is_owner) return NextResponse.json({ error: 'オーナーのみ変更できます' }, { status: 403 })

  const { newPassphrase } = await request.json()
  const trimmed = (newPassphrase ?? '').trim()
  if (!trimmed) return NextResponse.json({ error: 'パスフレーズを入力してください' }, { status: 400 })
  if (trimmed === profile.group_code) return NextResponse.json({ error: '現在と同じパスフレーズです' }, { status: 400 })

  // 他グループで使用中でないか確認
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('group_code', trimmed)
    .neq('group_code', profile.group_code)
    .limit(1)
    .single()

  if (existing) return NextResponse.json({ error: 'そのパスフレーズは既に使用されています' }, { status: 409 })

  // グループ全員のgroup_codeを更新
  const { error } = await admin
    .from('profiles')
    .update({ group_code: trimmed })
    .eq('group_code', profile.group_code)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
