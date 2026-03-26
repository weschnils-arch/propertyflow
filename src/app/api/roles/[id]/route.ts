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

  const existing = await prisma.role.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isSystem) return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 403 })

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      color: body.color,
      permissions: body.permissions,
    },
  })

  return NextResponse.json(role)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await hasAccess(user.id, 'einstellungen', 'full')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.role.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isSystem) return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })

  await prisma.role.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
