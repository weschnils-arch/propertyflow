import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sensor = await prisma.sensor.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            property: true,
            contracts: {
              where: { status: 'active' },
              include: { tenant: true },
            },
          },
        },
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 120,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!sensor) {
      return NextResponse.json({ error: 'Sensor nicht gefunden' }, { status: 404 })
    }

    const values = sensor.sensorData.map(d => d.value)
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const min = values.length > 0 ? Math.min(...values) : 0
    const stdDev = values.length > 0
      ? Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length)
      : 0
    const anomalyThreshold = avg + 2 * stdDev
    const anomalies = sensor.sensorData.filter(d => d.value > anomalyThreshold)

    return NextResponse.json({
      ...sensor,
      _stats: {
        avg: Math.round(avg * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        anomalyThreshold: Math.round(anomalyThreshold * 100) / 100,
        anomalyCount: anomalies.length,
        dataPoints: sensor.sensorData.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
