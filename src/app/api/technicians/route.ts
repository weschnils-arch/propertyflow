import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const technicians = await prisma.technician.findMany({
      include: {
        tickets: {
          include: { property: true, unit: true },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    const result = technicians.map(t => ({
      ...t,
      _totalTickets: t.tickets.length,
      _openTickets: t.tickets.filter(tk => tk.status === 'open').length,
      _inProgressTickets: t.tickets.filter(tk => tk.status === 'in_progress').length,
      _completedTickets: t.tickets.filter(tk => tk.status === 'completed').length,
      _totalCost: t.tickets.filter(tk => tk.costActual).reduce((s, tk) => s + (tk.costActual || 0), 0),
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tech = await prisma.technician.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || '',
        specialization: body.specialization || 'general',
        rating: body.rating || 5.0,
        notes: body.notes || null,
      }
    })
    return NextResponse.json(tech)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const tech = await prisma.technician.update({
      where: { id: body.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        specialization: body.specialization,
        rating: body.rating,
        notes: body.notes,
      }
    })
    return NextResponse.json(tech)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
