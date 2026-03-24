import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const [properties, tenants, tickets, sensors] = await Promise.all([
    prisma.property.findMany({ where: { OR: [{ name: { contains: q } }, { city: { contains: q } }, { street: { contains: q } }] }, take: 5, select: { id: true, name: true, city: true } }),
    prisma.tenant.findMany({ where: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] }, take: 5, select: { id: true, firstName: true, lastName: true } }),
    prisma.ticket.findMany({ where: { title: { contains: q } }, take: 5, select: { id: true, title: true, status: true, property: { select: { name: true } } } }),
    prisma.sensor.findMany({ where: { OR: [{ designation: { contains: q } }, { serialNumber: { contains: q } }] }, take: 5, select: { id: true, designation: true, type: true, unit: { select: { property: { select: { name: true } } } } } }),
  ])

  const results = [
    ...properties.map(p => ({ type: 'property' as const, id: p.id, title: p.name, subtitle: p.city, href: `/properties/${p.id}` })),
    ...tenants.map(t => ({ type: 'tenant' as const, id: t.id, title: `${t.firstName} ${t.lastName}`, subtitle: 'Mieter', href: `/tenants/${t.id}` })),
    ...tickets.map(t => ({ type: 'ticket' as const, id: t.id, title: t.title, subtitle: t.property?.name || '', href: '/maintenance' })),
    ...sensors.map(s => ({ type: 'sensor' as const, id: s.id, title: s.designation, subtitle: s.unit?.property?.name || s.type, href: `/smart-home/${s.id}` })),
  ]

  return NextResponse.json(results)
}
