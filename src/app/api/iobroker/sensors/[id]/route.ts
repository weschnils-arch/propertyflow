import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * ioBroker Simulation REST-API - Sensor Detail
 * GET /api/iobroker/sensors/:id - Einzelner Sensor mit aktuellen Daten
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sensor = await prisma.sensor.findUnique({
      where: { id },
      include: {
        unit: { include: { property: true } },
        sensorData: { orderBy: { timestamp: 'desc' }, take: 1 },
        alerts: { where: { isResolved: false } },
      },
    })

    if (!sensor) {
      return NextResponse.json({ success: false, error: 'Sensor not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'propertyflow-iobroker-simulation',
      data: {
        id: sensor.id,
        iobroker_id: `propertyflow.0.${sensor.unit.property.name.replace(/\s+/g, '_')}.${sensor.unit.designation.replace(/\s+/g, '_')}.${sensor.type}`,
        type: sensor.type,
        designation: sensor.designation,
        serial_number: sensor.serialNumber,
        status: sensor.status,
        battery_level: sensor.batteryLevel,
        current_value: sensor.sensorData[0]?.value ?? sensor.lastReading,
        current_value_unit: sensor.sensorData[0]?.unit ?? null,
        last_reading_at: sensor.lastReadingAt,
        install_date: sensor.installDate,
        expiry_date: sensor.expiryDate,
        location: {
          property_id: sensor.unit.property.id,
          property_name: sensor.unit.property.name,
          property_address: `${sensor.unit.property.street} ${sensor.unit.property.houseNumber}, ${sensor.unit.property.zipCode} ${sensor.unit.property.city}`,
          unit_id: sensor.unit.id,
          unit_designation: sensor.unit.designation,
        },
        active_alerts: sensor.alerts.map(a => ({
          id: a.id, severity: a.severity, title: a.title, message: a.message, created_at: a.createdAt,
        })),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
