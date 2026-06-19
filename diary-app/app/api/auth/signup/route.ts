import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
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

  const admin = createAdminClient()
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      status: 'approved',
      is_owner: true,
    })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'プロフィール作成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
