import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [
      propertyCount,
      unitCount,
      tenantCount,
      technicianCount,
      vacantUnits,
      properties,
      tickets,
      sensors,
      alerts,
      recentPayments,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.tenant.count(),
      prisma.technician.count(),
      prisma.unit.count({ where: { status: { not: 'occupied' } } }),
      prisma.property.findMany({
        include: {
          units: { include: { contracts: { where: { status: 'active' }, include: { tenant: true } } } },
        },
      }),
      prisma.ticket.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { property: true, unit: true, technician: true } }),
      prisma.sensor.findMany({ include: { unit: { include: { property: true } } } }),
      prisma.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.payment.findMany({ orderBy: { paymentDate: 'desc' }, take: 10, include: { tenant: true } }),
    ])

    const totalRent = properties.reduce((sum, p) =>
      sum + p.units.reduce((uSum, u) => uSum + u.rent, 0), 0)

    const totalUtility = properties.reduce((sum, p) =>
      sum + p.units.reduce((uSum, u) => uSum + u.utilityCost, 0), 0)

    const openTickets = tickets.filter(t => t.status === 'open').length
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
    const completedTickets = tickets.filter(t => t.status === 'completed').length

    const activeSensors = sensors.filter(s => s.status === 'active').length
    const warningSensors = sensors.filter(s => s.status === 'warning').length
    const offlineSensors = sensors.filter(s => s.status === 'offline' || s.status === 'defective').length

    const overduePayments = await prisma.payment.count({ where: { status: 'overdue' } })
    const completedPayments = await prisma.payment.count({ where: { status: 'completed' } })
    const totalPayments = await prisma.payment.count()
    const paymentRate = totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 100

    // Monthly financial data for chart (last 12 months)
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      const expenses = Math.round(1800 + Math.random() * 800)
      monthlyData.push({
        month: monthNames[d.getMonth()],
        income: totalRent + totalUtility,
        expenses,
        profit: totalRent + totalUtility - expenses,
      })
    }

    return NextResponse.json({
      portfolio: {
        properties: propertyCount,
        units: unitCount,
        tenants: tenantCount,
        technicians: technicianCount,
        vacantUnits,
        vacancyRate: unitCount > 0 ? Math.round((vacantUnits / unitCount) * 1000) / 10 : 0,
        totalRentMonthly: totalRent,
        totalIncomeMonthly: totalRent + totalUtility,
        avgYield: 8.5,
      },
      finance: {
        income: totalRent + totalUtility,
        expenses: 2150,
        profit: totalRent + totalUtility - 2150,
        paymentRate,
        overduePayments,
        monthlyData,
      },
      tickets: {
        open: openTickets,
        inProgress: inProgressTickets,
        completed: completedTickets,
        avgResolutionHours: 24,
        recent: tickets.slice(0, 5),
      },
      sensors: {
        total: sensors.length,
        active: activeSensors,
        warning: warningSensors,
        offline: offlineSensors,
        lastSync: new Date(),
      },
      alerts: alerts,
      recentPayments: recentPayments.slice(0, 5),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
