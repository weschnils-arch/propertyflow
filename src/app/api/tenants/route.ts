import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        contracts: {
          where: { status: 'active' },
          include: {
            unit: {
              include: { property: true },
            },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
        tickets: { where: { status: { in: ['open', 'in_progress'] } } },
      },
      orderBy: { lastName: 'asc' },
    })

    const result = tenants.map((t) => {
      const activeContract = t.contracts[0]
      const lastPayment = t.payments[0]
      const hasOverdue = t.payments.some(p => p.status === 'overdue')

      return {
        ...t,
        _activeUnit: activeContract?.unit?.designation || null,
        _propertyName: activeContract?.unit?.property?.name || null,
        _monthlyRent: activeContract?.monthlyRent || 0,
        _paymentStatus: hasOverdue ? 'overdue' : 'current',
        _openTickets: t.tickets.length,
        _lastPayment: lastPayment?.paymentDate || null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
