'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cpu, Zap, Droplets, Flame, Shield, AlertTriangle, CheckCircle, Search, Filter, Activity } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'

interface SensorRow {
  id: string; type: string; designation: string; serialNumber: string
  status: string; batteryLevel: number | null; lastReading: number | null
  lastReadingAt: string
  unit: { designation: string; property: { name: string } }
  sensorData: Array<{ value: number; unit: string; timestamp: string }>
  alerts: Array<{ id: string; title: string; severity: string }>
}

const typeLabels: Record<string, string> = {
  electricity: 'Strom', water: 'Wasser', heat: 'Wärme',
  smoke_detector: 'Rauchmelder', door_lock: 'Türschloss',
}

const typeIcons: Record<string, React.ElementType> = {
  electricity: Zap, water: Droplets, heat: Flame,
  smoke_detector: AlertTriangle, door_lock: Shield,
}

const typeColors: Record<string, string> = {
  electricity: 'text-yellow-500', water: 'text-blue-500', heat: 'text-orange-500',
  smoke_detector: 'text-red-500', door_lock: 'text-gray-500',
}

export default function SmartHomePage() {
  const router = useRouter()
  const [sensors, setSensors] = useState<SensorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')

  useEffect(() => {
    fetch('/api/sensors').then(r => r.json()).then(d => { setSensors(d); setLoading(false) })
  }, [])

  const uniqueProperties = Array.from(new Map(sensors.map(s => [s.unit.property.name, s.unit.property.name])).values())
  const uniqueUnits = sensors
    .filter(s => propertyFilter === 'all' || s.unit.property.name === propertyFilter)
    .map(s => s.unit.designation)
    .filter((v, i, a) => a.indexOf(v) === i)

  const filtered = sensors.filter(s => {
    const matchSearch = s.designation.toLowerCase().includes(search.toLowerCase()) || s.unit.property.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || s.type === typeFilter
    const matchProperty = propertyFilter === 'all' || s.unit.property.name === propertyFilter
    const matchUnit = unitFilter === 'all' || s.unit.designation === unitFilter
    return matchSearch && matchType && matchProperty && matchUnit
  })

  const activeCount = sensors.filter(s => s.status === 'active').length
  const warningCount = sensors.filter(s => s.status === 'warning').length
  const offlineCount = sensors.filter(s => s.status === 'offline' || s.status === 'defective').length

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Home</h1>
          <p className="text-text-secondary text-sm mt-1">{sensors.length} Sensoren überwacht</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="w-5 h-5 text-primary" /></div>
          <div><div className="text-2xl font-bold">{sensors.length}</div><div className="text-xs text-text-muted">Gesamt</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-success" /></div>
          <div><div className="text-2xl font-bold">{activeCount}</div><div className="text-xs text-text-muted">Aktiv</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-warning" /></div>
          <div><div className="text-2xl font-bold">{warningCount}</div><div className="text-xs text-text-muted">Warnung</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><Cpu className="w-5 h-5 text-danger" /></div>
          <div><div className="text-2xl font-bold">{offlineCount}</div><div className="text-xs text-text-muted">Offline</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Sensoren suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="flex gap-1">
          {['all', 'electricity', 'water', 'heat', 'smoke_detector', 'door_lock'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:bg-gray-200'}`}>
              {t === 'all' ? 'Alle' : typeLabels[t]}
            </button>
          ))}
        </div>
        <select value={propertyFilter} onChange={e => { setPropertyFilter(e.target.value); setUnitFilter('all') }} className="input-field min-w-[180px]">
          <option value="all">Alle Properties</option>
          {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="input-field min-w-[150px]" disabled={propertyFilter === 'all'}>
          <option value="all">Alle Einheiten</option>
          {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Sensor Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Sensor</th>
              <th className="text-left px-4 py-3">Typ</th>
              <th className="text-left px-4 py-3">Property</th>
              <th className="text-left px-4 py-3">Einheit</th>
              <th className="text-left px-4 py-3">Letzter Wert</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Batterie</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const Icon = typeIcons[s.type] || Cpu
              const color = typeColors[s.type] || 'text-gray-500'
              const lastData = s.sensorData?.[0]
              return (
                <tr key={s.id} className="table-row border-t border-black/5 cursor-pointer" onClick={() => router.push(`/smart-home/${s.id}`)}>
                  <td className="px-4 py-3 font-medium text-sm">{s.designation}</td>
                  <td className="px-4 py-3"><span className={`flex items-center gap-1.5 ${color}`}><Icon className="w-4 h-4" /> {typeLabels[s.type]}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.unit.property.name}</td>
                  <td className="px-4 py-3 text-sm">{s.unit.designation}</td>
                  <td className="px-4 py-3 text-sm font-medium">{lastData ? `${lastData.value.toFixed(1)} ${lastData.unit}` : s.lastReading ? `${s.lastReading.toFixed(0)}` : '–'}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    {s.batteryLevel != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.batteryLevel > 50 ? 'bg-success' : s.batteryLevel > 20 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${s.batteryLevel}%` }} />
                        </div>
                        <span className="text-xs">{Math.round(s.batteryLevel)}%</span>
                      </div>
                    ) : '–'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
