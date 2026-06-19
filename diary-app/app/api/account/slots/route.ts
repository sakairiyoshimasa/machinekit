import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('my_public_slot, partner_slot, partner_user_id')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    myPublicSlot: profile?.my_public_slot ?? null,
    partnerSlot: profile?.partner_slot ?? null,
    partnerUserId: profile?.partner_user_id ?? null,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, string | null> = {}

  if ('myPublicSlot' in body) updates.my_public_slot = body.myPublicSlot
  if ('partnerSlot' in body) updates.partner_slot = body.partnerSlot
  if ('partnerUserId' in body) updates.partner_user_id = body.partnerUserId

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
