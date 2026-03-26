import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'
import { hasAccess } from '@/lib/auth/permissions'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await hasAccess(user.id, 'einstellungen', 'full')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const assignment = await prisma.roleAssignment.update({
    where: { id },
    data: {
      isActive: body.isActive,
      scope: body.scope,
      propertyId: body.propertyId,
      unitId: body.unitId,
    },
  })

  return NextResponse.json(assignment)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await hasAccess(user.id, 'einstellungen', 'full')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.roleAssignment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
