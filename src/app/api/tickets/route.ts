import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'
import { generateReferenceNumber } from '@/lib/vorgaenge/reference-number'
import { autoAssignVorgang } from '@/lib/vorgaenge/auto-assign'

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        property: true,
        unit: true,
        tenant: true,
        technician: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // If tenantId is provided but no propertyId, look up from active contract
    let propertyId = body.propertyId
    let unitId = body.unitId || null

    if (body.tenantId && !propertyId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: body.tenantId },
        include: {
          contracts: {
            where: { status: 'active' },
            include: { unit: { include: { property: true } } },
            take: 1,
          },
        },
      })
      const activeContract = tenant?.contracts[0]
      if (activeContract) {
        propertyId = activeContract.unit.property.id
        unitId = unitId || activeContract.unitId
      }
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId ist erforderlich' }, { status: 400 })
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description || '',
        category: body.category || 'general',
        priority: body.priority || 'medium',
        status: 'open',
        propertyId,
        unitId,
        tenantId: body.tenantId || null,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, designation: true } },
        tenant: { select: { firstName: true, lastName: true } },
        technician: { select: { firstName: true, lastName: true } },
      }
    })
    // Auto-create Vorgang for this maintenance ticket
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { mandantId: true } })
    const ticketMandantId = property?.mandantId
    if (ticketMandantId) {
      const reparaturCategory = await prisma.vorgangCategory.findFirst({
        where: { mandantId: ticketMandantId, slug: 'reparatur' },
      })
      if (reparaturCategory) {
        const user = await getUser()
        const referenceNumber = await generateReferenceNumber(ticketMandantId)
        const assignment = await autoAssignVorgang(reparaturCategory.id, propertyId, unitId, ticketMandantId)
        await prisma.vorgang.create({
          data: {
            referenceNumber,
            mandantId: ticketMandantId,
            propertyId,
            unitId,
            tenantId: body.tenantId || null,
            ticketId: ticket.id,
            title: ticket.title,
            description: ticket.description,
            categoryId: reparaturCategory.id,
            subcategory: ticket.category,
            priority: ticket.priority,
            assignedToUserId: assignment.userId,
            assignedToRoleId: assignment.roleId,
            createdByUserId: user?.id || ticket.tenantId || ticketMandantId,
          },
        })
      }
    }

    return NextResponse.json(ticket)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
