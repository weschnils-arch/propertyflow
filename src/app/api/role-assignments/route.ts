import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { hasAccess } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const roleId = searchParams.get('roleId')
  const propertyId = searchParams.get('propertyId')

  const where: Record<string, unknown> = { mandantId }
  if (userId) where.userId = userId
  if (roleId) where.roleId = roleId
  if (propertyId) where.propertyId = propertyId

  const assignments = await prisma.roleAssignment.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      role: { select: { id: true, name: true, color: true } },
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, designation: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })

  return NextResponse.json(assignments)
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
  const { userId: targetUserId, roleId, scope, propertyId, unitId } = body

  if (!targetUserId || !roleId || !scope) {
    return NextResponse.json({ error: 'userId, roleId, and scope are required' }, { status: 400 })
  }

  if (scope === 'property' && !propertyId) {
    return NextResponse.json({ error: 'propertyId required for property scope' }, { status: 400 })
  }
  if (scope === 'unit' && (!propertyId || !unitId)) {
    return NextResponse.json({ error: 'propertyId and unitId required for unit scope' }, { status: 400 })
  }

  // Application-level duplicate check
  const existing = await prisma.roleAssignment.findFirst({
    where: {
      userId: targetUserId,
      roleId,
      scope,
      mandantId,
      propertyId: propertyId || null,
      unitId: unitId || null,
      isActive: true,
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'This role assignment already exists' }, { status: 409 })
  }

  const assignment = await prisma.roleAssignment.create({
    data: {
      userId: targetUserId,
      roleId,
      scope,
      mandantId,
      propertyId: propertyId || null,
      unitId: unitId || null,
      assignedByUserId: user.id,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      role: { select: { id: true, name: true, color: true } },
    },
  })

  return NextResponse.json(assignment, { status: 201 })
}
