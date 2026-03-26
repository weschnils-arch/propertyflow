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

  const existing = await prisma.vorgangCategory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const category = await prisma.vorgangCategory.update({
    where: { id },
    data: {
      name: existing.isSystem ? existing.name : (body.name || existing.name),
      description: body.description,
      defaultRoleId: body.defaultRoleId,
      icon: body.icon,
      color: body.color,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  })

  return NextResponse.json(category)
}
