import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { hasAccess } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const roles = await prisma.role.findMany({
    where: { mandantId },
    include: {
      _count: { select: { roleAssignments: true } },
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json(roles)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId
  if (!await hasAccess(user.id, 'einstellungen', 'full')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, color, permissions } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const role = await prisma.role.create({
    data: {
      mandantId,
      name,
      description,
      color,
      permissions: permissions || {},
      isSystem: false,
    },
  })

  return NextResponse.json(role, { status: 201 })
}
