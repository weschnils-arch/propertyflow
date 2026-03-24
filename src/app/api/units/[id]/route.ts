import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true } },
        sensors: true,
        contracts: {
          include: { tenant: true },
          orderBy: { startDate: 'desc' },
        },
        tickets: {
          include: { technician: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(unit)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await _req.json()
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        designation: body.designation,
        floor: body.floor !== undefined ? parseInt(body.floor) : undefined,
        area: body.area !== undefined ? parseFloat(body.area) : undefined,
        rooms: body.rooms !== undefined ? parseInt(body.rooms) : undefined,
        bathrooms: body.bathrooms !== undefined ? parseInt(body.bathrooms) : undefined,
        hasBalcony: body.hasBalcony,
        hasTerrace: body.hasTerrace,
        rent: body.rent !== undefined ? parseFloat(body.rent) : undefined,
        utilityCost: body.utilityCost !== undefined ? parseFloat(body.utilityCost) : undefined,
        status: body.status,
        notes: body.notes,
      },
    })
    return NextResponse.json(unit)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
