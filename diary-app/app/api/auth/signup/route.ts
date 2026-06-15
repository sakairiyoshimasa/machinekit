import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password, groupCode } = await request.json()

  if (!email || !password || !groupCode) {
    return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('group_code', groupCode)

  const isNewGroup = !existing || existing.length === 0

  if (existing && existing.length >= 2) {
    return NextResponse.json({ error: 'このパスフレーズのグループは満員です（最大2名）' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
    },
  })

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'アカウント作成に失敗しました' }, { status: 400 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      group_code: groupCode,
      is_owner: isNewGroup,
      status: isNewGroup ? 'approved' : 'pending',
    })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'プロフィール作成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true, newGroup: isNewGroup })
}
