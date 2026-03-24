import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * ioBroker Simulation REST-API - Sensor History Data
 * GET /api/iobroker/sensors/:id/data - Historische Sensordaten
 * Query Params: ?from=ISO&to=ISO&limit=100
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const sensor = await prisma.sensor.findUnique({
      where: { id },
      select: { id: true, type: true, designation: true, serialNumber: true },
    })

    if (!sensor) {
      return NextResponse.json({ success: false, error: 'Sensor not found' }, { status: 404 })
    }

    const where: Record<string, unknown> = { sensorId: id }
    if (from || to) {
      const timestamp: Record<string, Date> = {}
      if (from) timestamp.gte = new Date(from)
      if (to) timestamp.lte = new Date(to)
      where.timestamp = timestamp
    }

    const data = await prisma.sensorData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 500),
    })

    const values = data.map(d => d.value)
    const stats = values.length > 0 ? {
      count: values.length,
      avg: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100,
      min: Math.round(Math.min(...values) * 100) / 100,
      max: Math.round(Math.max(...values) * 100) / 100,
      first_timestamp: data[data.length - 1]?.timestamp,
      last_timestamp: data[0]?.timestamp,
    } : null

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'propertyflow-iobroker-simulation',
      sensor: {
        id: sensor.id,
        type: sensor.type,
        designation: sensor.designation,
        serial_number: sensor.serialNumber,
      },
      stats,
      data: data.map(d => ({
        id: d.id,
        value: d.value,
        unit: d.unit,
        timestamp: d.timestamp,
      })),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
