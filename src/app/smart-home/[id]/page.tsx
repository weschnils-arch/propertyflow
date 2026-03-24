'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Zap, Droplets, Flame, Shield, AlertTriangle, CheckCircle,
  Activity, Calendar, Cpu, Battery, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react'
import { formatDate, formatDateTime, getStatusColor } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine
} from 'recharts'

interface SensorDetail {
  id: string; type: string; designation: string; serialNumber: string
  installDate: string; expiryDate: string | null; status: string
  batteryLevel: number | null; lastReading: number | null; lastReadingAt: string
  unit: {
    id: string; designation: string; floor: number
    property: { id: string; name: string; street: string; houseNumber: string; city: string }
    contracts: Array<{ tenant: { firstName: string; lastName: string } }>
  }
  sensorData: Array<{ id: string; value: number; unit: string; timestamp: string }>
  alerts: Array<{ id: string; type: string; severity: string; title: string; message: string; isResolved: boolean; createdAt: string }>
  _stats: {
    avg: number; max: number; min: number; stdDev: number
    anomalyThreshold: number; anomalyCount: number; dataPoints: number
  }
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  electricity: { label: 'Stromzähler', icon: Zap, color: '#EAB308', bgColor: 'bg-yellow-50 text-yellow-600' },
  water: { label: 'Wasserzähler', icon: Droplets, color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-600' },
  heat: { label: 'Wärmezähler', icon: Flame, color: '#F97316', bgColor: 'bg-orange-50 text-orange-600' },
  smoke_detector: { label: 'Rauchmelder', icon: AlertTriangle, color: '#EF4444', bgColor: 'bg-red-50 text-red-600' },
  door_lock: { label: 'Türschloss', icon: Shield, color: '#6B7280', bgColor: 'bg-gray-50 text-gray-600' },
}

export default function SensorDetailPage() {
  const params = useParams()
  const [sensor, setSensor] = useState<SensorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sensors/${params.id}`).then(r => r.json()).then(d => { setSensor(d); setLoading(false) })
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!sensor) return <div className="text-center py-20 text-text-secondary">Sensor nicht gefunden</div>

  const config = typeConfig[sensor.type] || typeConfig.electricity
  const Icon = config.icon
  const tenant = sensor.unit.contracts?.[0]?.tenant

  const chartData = sensor.sensorData.slice(0, 60).reverse().map(d => ({
    date: formatDate(d.timestamp).slice(0, 5),
    value: d.value,
    fullDate: formatDateTime(d.timestamp),
  }))

  const hasConsumptionData = ['electricity', 'water', 'heat'].includes(sensor.type)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/smart-home" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Smart Home
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.bgColor}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{sensor.designation}</h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
              <span>{sensor.unit.property.name}</span>
              <span>•</span>
              <span>{sensor.unit.designation}</span>
              {tenant && <><span>•</span><span>Mieter: {tenant.firstName} {tenant.lastName}</span></>}
            </div>
          </div>
          <span className={`badge text-sm ${getStatusColor(sensor.status)}`}>{sensor.status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <StatCard icon={Cpu} label="Seriennummer" value={sensor.serialNumber} />
          <StatCard icon={Calendar} label="Installiert" value={formatDate(sensor.installDate)} />
          {sensor.expiryDate && <StatCard icon={Calendar} label="Ablauf" value={formatDate(sensor.expiryDate)} />}
          {sensor.batteryLevel != null && (
            <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
              <Battery className="w-5 h-5 mx-auto mb-1" style={{ color: sensor.batteryLevel > 50 ? '#22C55E' : sensor.batteryLevel > 20 ? '#F59E0B' : '#EF4444' }} />
              <div className="text-lg font-bold">{Math.round(sensor.batteryLevel)}%</div>
              <div className="text-xs text-text-muted">Batterie</div>
            </div>
          )}
          {sensor.lastReading != null && (
            <StatCard icon={Activity} label="Letzter Wert" value={`${sensor.lastReading.toFixed(1)}`} />
          )}
        </div>
      </div>

      {/* Stats + Anomalies */}
      {hasConsumptionData && sensor._stats.dataPoints > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-xs text-text-secondary">Durchschnitt</span></div>
            <div className="text-xl font-bold">{sensor._stats.avg} <span className="text-sm text-text-muted">{sensor.sensorData[0]?.unit || ''}</span></div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-danger" /><span className="text-xs text-text-secondary">Maximum</span></div>
            <div className="text-xl font-bold">{sensor._stats.max} <span className="text-sm text-text-muted">{sensor.sensorData[0]?.unit || ''}</span></div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-success" /><span className="text-xs text-text-secondary">Minimum</span></div>
            <div className="text-xl font-bold">{sensor._stats.min} <span className="text-sm text-text-muted">{sensor.sensorData[0]?.unit || ''}</span></div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-warning" /><span className="text-xs text-text-secondary">Anomalien</span></div>
            <div className="text-xl font-bold">{sensor._stats.anomalyCount}</div>
            <div className="text-xs text-text-muted">Schwelle: {sensor._stats.anomalyThreshold}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      {hasConsumptionData && chartData.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Verbrauchsverlauf</h3>
            <span className="text-sm text-text-muted">{sensor._stats.dataPoints} Datenpunkte</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${sensor.type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(2)} ${sensor.sensorData[0]?.unit || ''}`, 'Verbrauch']}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
              />
              {sensor._stats.anomalyThreshold > 0 && (
                <ReferenceLine y={sensor._stats.anomalyThreshold} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'Anomalie-Schwelle', fill: '#EF4444', fontSize: 11 }} />
              )}
              <ReferenceLine y={sensor._stats.avg} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Durchschnitt', fill: '#6B7280', fontSize: 11 }} />
              <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill={`url(#gradient-${sensor.type})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts */}
      {sensor.alerts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Alarme & Warnungen</h3>
          <div className="space-y-2">
            {sensor.alerts.map(a => (
              <div key={a.id} className={`p-3 rounded-lg text-sm ${a.severity === 'critical' ? 'bg-red-50 border-l-3 border-red-500' : a.severity === 'warning' ? 'bg-orange-50 border-l-3 border-orange-500' : 'bg-blue-50 border-l-3 border-blue-500'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.title}</span>
                  <div className="flex items-center gap-2">
                    {a.isResolved && <span className="badge text-success bg-green-50 text-xs">Behoben</span>}
                    <span className="text-xs text-text-muted">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs mt-0.5">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Table */}
      {hasConsumptionData && sensor.sensorData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-black/5">
            <h3 className="font-semibold">Rohdaten (letzte {Math.min(30, sensor.sensorData.length)} Einträge)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Zeitpunkt</th>
                <th className="text-left px-4 py-3">Wert</th>
                <th className="text-left px-4 py-3">Einheit</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sensor.sensorData.slice(0, 30).map(d => {
                const isAnomaly = d.value > sensor._stats.anomalyThreshold
                return (
                  <tr key={d.id} className={`table-row border-t border-black/5 ${isAnomaly ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-2 text-sm">{formatDateTime(d.timestamp)}</td>
                    <td className="px-4 py-2 font-medium">{d.value.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-text-secondary">{d.unit}</td>
                    <td className="px-4 py-2">
                      {isAnomaly ? (
                        <span className="badge text-danger bg-red-50 text-xs"><AlertTriangle className="w-3 h-3 mr-0.5" /> Anomalie</span>
                      ) : (
                        <span className="badge text-success bg-green-50 text-xs"><CheckCircle className="w-3 h-3 mr-0.5" /> Normal</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
      <div className="text-sm font-bold truncate">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
