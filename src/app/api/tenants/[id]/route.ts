import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            unit: {
              include: {
                property: true,
                sensors: {
                  include: {
                    sensorData: { orderBy: { timestamp: 'desc' }, take: 30 },
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        payments: { orderBy: { paymentDate: 'desc' }, take: 24 },
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: { property: true, unit: true, technician: true },
        },
        communications: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
    }

    const activeContract = tenant.contracts.find(c => c.status === 'active')
    const totalPaid = tenant.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const overdueCount = tenant.payments.filter(p => p.status === 'overdue').length

    return NextResponse.json({
      ...tenant,
      _activeContract: activeContract || null,
      _totalPaid: totalPaid,
      _overdueCount: overdueCount,
      _openTickets: tenant.tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
