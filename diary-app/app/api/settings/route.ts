import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  if (user.email !== '3333449@pm.me') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { key, value } = await request.json()
  const admin = createAdminClient()
  await admin.from('system_settings').upsert({ key, value })

  return NextResponse.json({ success: true })
}
