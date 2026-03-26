import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { hasAccess } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const categories = await prisma.vorgangCategory.findMany({
    where: { mandantId, isActive: true },
    include: { defaultRole: { select: { id: true, name: true, color: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(categories)
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
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

  const category = await prisma.vorgangCategory.create({
    data: {
      mandantId,
      name: body.name,
      slug,
      description: body.description,
      defaultRoleId: body.defaultRoleId,
      icon: body.icon,
      color: body.color,
      isSystem: false,
      isActive: true,
      sortOrder: body.sortOrder || 99,
    },
  })

  return NextResponse.json(category, { status: 201 })
}
