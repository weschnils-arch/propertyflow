import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'
import { getTrafficLight } from '@/lib/vorgaenge/traffic-light'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const vorgang = await prisma.vorgang.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, street: true, houseNumber: true, zipCode: true, city: true } },
      unit: { select: { id: true, designation: true, floor: true } },
      tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      assignedToUser: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      assignedToRole: { select: { id: true, name: true, color: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      closedBy: { select: { id: true, firstName: true, lastName: true } },
      communications: {
        include: {
          attachments: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      activities: {
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      attachments: true,
    },
  })

  if (!vorgang) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...vorgang,
    trafficLight: getTrafficLight(vorgang.createdAt, vorgang.status),
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.vorgang.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  // Status change
  if (body.status && body.status !== existing.status) {
    data.status = body.status
    if (body.status === 'closed') {
      data.closedAt = new Date()
      data.closedByUserId = user.id
    }

    await prisma.vorgangActivity.create({
      data: {
        vorgangId: id,
        type: 'statuschange',
        title: `Status: ${existing.status} → ${body.status}`,
        description: body.statusNote || null,
        createdByUserId: user.id,
      },
    })
  }

  // Assignment change
  if (body.assignedToUserId !== undefined && body.assignedToUserId !== existing.assignedToUserId) {
    data.assignedToUserId = body.assignedToUserId
    if (body.assignedToRoleId) data.assignedToRoleId = body.assignedToRoleId

    const newUser = body.assignedToUserId
      ? await prisma.user.findUnique({ where: { id: body.assignedToUserId }, select: { firstName: true, lastName: true } })
      : null

    await prisma.vorgangActivity.create({
      data: {
        vorgangId: id,
        type: 'assignment',
        title: newUser ? `Zugewiesen an ${newUser.firstName} ${newUser.lastName}` : 'Zuweisung entfernt',
        createdByUserId: user.id,
      },
    })
  }

  if (body.priority) data.priority = body.priority
  if (body.dueDate !== undefined) data.dueDate = body.dueDate
  if (body.title) data.title = body.title
  if (body.description !== undefined) data.description = body.description

  const vorgang = await prisma.vorgang.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      assignedToUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  })

  return NextResponse.json({
    ...vorgang,
    trafficLight: getTrafficLight(vorgang.createdAt, vorgang.status),
  })
}
