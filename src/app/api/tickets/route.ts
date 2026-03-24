import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    const ticket = await prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description || '',
        category: body.category || 'general',
        priority: body.priority || 'medium',
        status: 'open',
        propertyId: body.propertyId,
        unitId: body.unitId || null,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, designation: true } },
        tenant: { select: { firstName: true, lastName: true } },
        technician: { select: { firstName: true, lastName: true } },
      }
    })
    return NextResponse.json(ticket)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
