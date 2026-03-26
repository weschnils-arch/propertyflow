import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { hasAccess, getUserPropertyScope } from '@/lib/auth/permissions'
import { getTrafficLight } from '@/lib/vorgaenge/traffic-light'
import { generateReferenceNumber } from '@/lib/vorgaenge/reference-number'
import { autoAssignVorgang } from '@/lib/vorgaenge/auto-assign'

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId
  if (!await hasAccess(user.id, 'vorgaenge', 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
  const skip = (page - 1) * limit

  // Build where clause
  const where: Record<string, unknown> = { mandantId }

  const propertyId = searchParams.get('propertyId')
  const unitId = searchParams.get('unitId')
  const tenantId = searchParams.get('tenantId')
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')
  const assignedToUserId = searchParams.get('assignedToUserId')
  const search = searchParams.get('search')

  if (propertyId) where.propertyId = propertyId
  if (unitId) where.unitId = unitId
  if (tenantId) where.tenantId = tenantId
  if (categoryId) where.categoryId = categoryId
  if (status) where.status = status
  if (assignedToUserId) where.assignedToUserId = assignedToUserId

  // Apply property scope filtering
  const scope = await getUserPropertyScope(user.id)
  if (scope !== 'all') {
    where.propertyId = propertyId ? propertyId : { in: scope }
  }

  // Search
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.vorgang.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, designation: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        assignedToUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        assignedToRole: { select: { id: true, name: true, color: true } },
        _count: { select: { communications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vorgang.count({ where }),
  ])

  // Enrich with traffic light
  const enriched = data.map(v => ({
    ...v,
    trafficLight: getTrafficLight(v.createdAt, v.status),
  }))

  // Filter by traffic light if requested
  const trafficLight = searchParams.get('trafficLight')
  const filtered = trafficLight
    ? enriched.filter(v => v.trafficLight === trafficLight)
    : enriched

  return NextResponse.json({
    data: filtered,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const body = await req.json()
  const { propertyId, categoryId, title } = body

  if (!propertyId || !categoryId || !title) {
    return NextResponse.json({ error: 'propertyId, categoryId, and title are required' }, { status: 400 })
  }

  // Validate property exists and get its mandantId
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { mandantId: true } })
  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const vorgangMandantId = property.mandantId || mandantId

  // Generate reference number
  const referenceNumber = await generateReferenceNumber(vorgangMandantId)

  // Auto-assign
  const assignment = await autoAssignVorgang(
    categoryId,
    propertyId,
    body.unitId || null,
    vorgangMandantId
  )

  const vorgang = await prisma.vorgang.create({
    data: {
      referenceNumber,
      mandantId: vorgangMandantId,
      propertyId,
      unitId: body.unitId || null,
      tenantId: body.tenantId || null,
      ownerId: body.ownerId || null,
      title,
      description: body.description || null,
      categoryId,
      subcategory: body.subcategory || null,
      priority: body.priority || 'medium',
      assignedToUserId: assignment.userId,
      assignedToRoleId: assignment.roleId,
      createdByUserId: user.id,
    },
    include: {
      property: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      assignedToUser: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  // Create initial status activity
  await prisma.vorgangActivity.create({
    data: {
      vorgangId: vorgang.id,
      type: 'statuschange',
      title: 'Vorgang erstellt',
      description: `Status: Offen`,
      createdByUserId: user.id,
    },
  })

  return NextResponse.json({ ...vorgang, trafficLight: 'green' }, { status: 201 })
}
