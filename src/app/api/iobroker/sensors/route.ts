import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * ioBroker Simulation REST-API
 * Simuliert die ioBroker Smart Home Integration
 * GET /api/iobroker/sensors - Alle Sensoren mit aktuellem Status
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status
    if (propertyId) where.unit = { propertyId }

    const sensors = await prisma.sensor.findMany({
      where,
      include: {
        unit: { include: { property: { select: { id: true, name: true } } } },
        sensorData: { orderBy: { timestamp: 'desc' }, take: 1 },
        alerts: { where: { isResolved: false }, take: 3 },
      },
      orderBy: { type: 'asc' },
    })

    const response = sensors.map(s => ({
      id: s.id,
      iobroker_id: `propertyflow.0.${s.unit.property.name.replace(/\s+/g, '_')}.${s.unit.designation.replace(/\s+/g, '_')}.${s.type}`,
      type: s.type,
      designation: s.designation,
      serial_number: s.serialNumber,
      status: s.status,
      battery_level: s.batteryLevel,
      last_value: s.sensorData[0]?.value ?? s.lastReading,
      last_value_unit: s.sensorData[0]?.unit ?? null,
      last_reading_at: s.lastReadingAt,
      install_date: s.installDate,
      expiry_date: s.expiryDate,
      location: {
        property_id: s.unit.property.id,
        property_name: s.unit.property.name,
        unit_id: s.unit.id,
        unit_designation: s.unit.designation,
      },
      active_alerts: s.alerts.map(a => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        message: a.message,
      })),
      _timestamp: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      count: response.length,
      timestamp: new Date().toISOString(),
      source: 'propertyflow-iobroker-simulation',
      data: response,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
