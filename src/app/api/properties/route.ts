import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        units: {
          include: {
            sensors: true,
            contracts: {
              where: { status: 'active' },
              include: { tenant: true },
            },
          },
        },
        tickets: true,
      },
      orderBy: { name: 'asc' },
    })

    const result = properties.map((p) => {
      const occupiedUnits = p.units.filter(u => u.status === 'occupied').length
      const totalRent = p.units.reduce((s, u) => s + u.rent, 0)
      const totalSensors = p.units.reduce((s, u) => s + u.sensors.length, 0)
      const openTickets = p.tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

      return {
        ...p,
        _stats: {
          totalUnits: p.units.length,
          occupiedUnits,
          vacantUnits: p.units.length - occupiedUnits,
          vacancyRate: p.units.length > 0 ? Math.round(((p.units.length - occupiedUnits) / p.units.length) * 100) : 0,
          totalRent,
          totalSensors,
          openTickets,
          yield: 8.5,
        },
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const property = await prisma.property.create({
      data: {
        name: body.name,
        street: body.street,
        houseNumber: body.houseNumber,
        zipCode: body.zipCode,
        city: body.city,
        country: body.country || 'Deutschland',
        buildYear: parseInt(body.buildYear) || 2000,
        totalArea: parseFloat(body.totalArea) || 0,
        energyEfficiencyClass: body.energyEfficiencyClass || 'B',
        insuranceNumber: body.insuranceNumber || null,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
        contactName: body.contactName || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        notes: body.notes || null,
      }
    })
    return NextResponse.json(property)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const property = await prisma.property.update({
      where: { id: body.id },
      data: {
        name: body.name,
        street: body.street,
        houseNumber: body.houseNumber,
        zipCode: body.zipCode,
        city: body.city,
        buildYear: body.buildYear ? parseInt(body.buildYear) : undefined,
        totalArea: body.totalArea ? parseFloat(body.totalArea) : undefined,
        energyEfficiencyClass: body.energyEfficiencyClass,
        insuranceNumber: body.insuranceNumber,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        notes: body.notes,
      }
    })
    return NextResponse.json(property)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
