import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({
      include: {
        unit: {
          include: { property: true },
        },
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
        alerts: {
          where: { isResolved: false },
        },
      },
      orderBy: { type: 'asc' },
    })

    return NextResponse.json(sensors)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
