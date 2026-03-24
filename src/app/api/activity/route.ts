import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [recentTickets, recentPayments, recentAlerts] = await Promise.all([
      prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { property: true, unit: true, tenant: true, technician: true },
      }),
      prisma.payment.findMany({
        orderBy: { paymentDate: 'desc' },
        take: 8,
        include: { tenant: true },
      }),
      prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

    type ActivityItem = {
      id: string
      type: 'ticket' | 'payment' | 'alert'
      title: string
      description: string
      timestamp: string
      severity?: string
      status?: string
    }

    const activities: ActivityItem[] = []

    for (const t of recentTickets) {
      activities.push({
        id: `ticket-${t.id}`,
        type: 'ticket',
        title: t.status === 'completed' ? 'Ticket abgeschlossen' : t.status === 'in_progress' ? 'Ticket in Bearbeitung' : 'Neues Ticket erstellt',
        description: `${t.title} – ${t.property.name}${t.technician ? ` (${t.technician.firstName} ${t.technician.lastName})` : ''}`,
        timestamp: t.createdAt.toISOString(),
        status: t.status,
      })
    }

    for (const p of recentPayments) {
      activities.push({
        id: `payment-${p.id}`,
        type: 'payment',
        title: p.status === 'overdue' ? 'Zahlung überfällig' : 'Zahlung eingegangen',
        description: `${p.tenant.firstName} ${p.tenant.lastName}: €${p.amount.toFixed(2)}`,
        timestamp: p.paymentDate.toISOString(),
        status: p.status,
      })
    }

    for (const a of recentAlerts) {
      activities.push({
        id: `alert-${a.id}`,
        type: 'alert',
        title: a.title,
        description: a.message,
        timestamp: a.createdAt.toISOString(),
        severity: a.severity,
      })
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(activities.slice(0, 15))
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
