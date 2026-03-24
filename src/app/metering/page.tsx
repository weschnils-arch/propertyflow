'use client'

import { useState } from 'react'
import {
  Gauge, Search, Plus, Droplets, Zap, Flame, Wind, Filter,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  ChevronRight, Building2, BarChart3, X, ArrowUpDown,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

const CONSUMPTION_DATA = [
  { month: 'Okt', strom: 285, wasser: 42, heizung: 180 },
  { month: 'Nov', strom: 310, wasser: 38, heizung: 320 },
  { month: 'Dez', strom: 340, wasser: 35, heizung: 450 },
  { month: 'Jan', strom: 330, wasser: 40, heizung: 480 },
  { month: 'Feb', strom: 295, wasser: 41, heizung: 380 },
  { month: 'Mär', strom: 270, wasser: 44, heizung: 220 },
]

const METER_TYPES = [
  { id: 'all', label: 'Alle Zähler', icon: Gauge, count: 4066, color: 'text-foreground' },
  { id: 'electricity', label: 'Strom', icon: Zap, count: 1245, color: 'text-yellow-600' },
  { id: 'water_cold', label: 'Kaltwasser', icon: Droplets, count: 980, color: 'text-blue-500' },
  { id: 'water_warm', label: 'Warmwasser', icon: Droplets, count: 856, color: 'text-red-400' },
  { id: 'heating', label: 'Heizung', icon: Flame, count: 678, color: 'text-orange-500' },
  { id: 'gas', label: 'Gas', icon: Wind, count: 307, color: 'text-gray-500' },
]

const MOCK_METERS = [
  { id: '1', number: 'ELE-000001', type: 'electricity', unit: 'Whg 1', property: 'Residenz am Park', lastReading: 4523, lastDate: '01.03.2026', status: 'ok', trend: '+12%' },
  { id: '2', number: 'WAT-000001', type: 'water_cold', unit: 'Whg 1', property: 'Residenz am Park', lastReading: 87.5, lastDate: '01.03.2026', status: 'ok', trend: '-3%' },
  { id: '3', number: 'HEA-000001', type: 'heating', unit: 'Whg 1', property: 'Residenz am Park', lastReading: 2890, lastDate: '01.03.2026', status: 'anomaly', trend: '+180%' },
  { id: '4', number: 'ELE-000002', type: 'electricity', unit: 'Whg 2', property: 'Residenz am Park', lastReading: 3210, lastDate: '01.03.2026', status: 'ok', trend: '+5%' },
  { id: '5', number: 'GAS-000001', type: 'gas', unit: '2.OG Links', property: 'Haus Bergstraße', lastReading: 1567, lastDate: '01.03.2026', status: 'calibration_due', trend: '+8%' },
  { id: '6', number: 'WAT-000045', type: 'water_warm', unit: 'EG Rechts', property: 'Haus Bergstraße', lastReading: 34.2, lastDate: '01.03.2026', status: 'ok', trend: '+1%' },
]

export default function MeteringPage() {
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddReading, setShowAddReading] = useState(false)

  const filtered = MOCK_METERS.filter(m => {
    const matchType = activeType === 'all' || m.type === activeType
    const matchSearch = !search || m.number.toLowerCase().includes(search.toLowerCase()) || m.property.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messtechnik</h1>
          <p className="text-muted-foreground text-sm mt-1">4.066 Zähler · 48.792 Ablesungen</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddReading(true)} className="btn-secondary"><Plus className="w-4 h-4" /> Ablesung erfassen</button>
          <button className="btn-primary"><Plus className="w-4 h-4" /> Neuer Zähler</button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Gauge className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Aktive Zähler</span></div>
          <div className="text-2xl font-bold">4.066</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Abgelesen (März)</span></div>
          <div className="text-2xl font-bold text-success">3.891</div>
          <div className="text-xs text-muted-foreground">95.7%</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Anomalien</span></div>
          <div className="text-2xl font-bold text-warning">12</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Eichung fällig</span></div>
          <div className="text-2xl font-bold text-destructive">34</div>
        </div>
      </div>

      {/* Consumption Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Verbrauchstrend (Portfolio)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={CONSUMPTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="strom" name="Strom (kWh)" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="wasser" name="Wasser (m³)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="heizung" name="Heizung (kWh)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Verbrauch nach Typ (März)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Strom', value: 270, fill: '#eab308' },
              { name: 'Kaltwasser', value: 44, fill: '#3b82f6' },
              { name: 'Warmwasser', value: 28, fill: '#ef4444' },
              { name: 'Heizung', value: 220, fill: '#f97316' },
              { name: 'Gas', value: 85, fill: '#6b7280' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Ø Verbrauch/Einheit" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meter Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {METER_TYPES.map(mt => (
          <button key={mt.id} onClick={() => setActiveType(mt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeType === mt.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
            }`}>
            <mt.icon className="w-3.5 h-3.5" />
            {mt.label}
            <span className={`text-[10px] ${activeType === mt.id ? 'opacity-80' : 'opacity-60'}`}>{mt.count}</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Zähler suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Meters Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Zähler-Nr.</th>
              <th className="text-left px-4 py-3">Typ</th>
              <th className="text-left px-4 py-3">Einheit</th>
              <th className="text-left px-4 py-3">Immobilie</th>
              <th className="text-left px-4 py-3">Letzter Stand</th>
              <th className="text-left px-4 py-3">Letzte Ablesung</th>
              <th className="text-left px-4 py-3">Trend</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="table-row border-t border-border/30 cursor-pointer">
                <td className="px-4 py-3 font-mono text-sm font-medium">{m.number}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${m.type === 'electricity' ? 'text-yellow-600 bg-yellow-50' : m.type.includes('water') ? 'text-blue-600 bg-blue-50' : m.type === 'heating' ? 'text-orange-600 bg-orange-50' : 'text-gray-600 bg-gray-50'}`}>
                    {m.type === 'electricity' ? 'Strom' : m.type === 'water_cold' ? 'Kaltwasser' : m.type === 'water_warm' ? 'Warmwasser' : m.type === 'heating' ? 'Heizung' : 'Gas'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{m.unit}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.property}</td>
                <td className="px-4 py-3 text-sm font-medium">{m.lastReading.toLocaleString('de-DE')}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.lastDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium flex items-center gap-1 ${m.trend.startsWith('+') && parseInt(m.trend) > 50 ? 'text-destructive' : m.trend.startsWith('+') ? 'text-warning' : 'text-success'}`}>
                    {parseInt(m.trend) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {m.trend}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {m.status === 'ok' ? (
                    <span className="badge text-success bg-green-50"><CheckCircle className="w-3 h-3 mr-1" /> OK</span>
                  ) : m.status === 'anomaly' ? (
                    <span className="badge text-destructive bg-red-50"><AlertTriangle className="w-3 h-3 mr-1" /> Anomalie</span>
                  ) : (
                    <span className="badge text-warning bg-amber-50"><Clock className="w-3 h-3 mr-1" /> Eichung</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Reading Modal */}
      {showAddReading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddReading(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Ablesung erfassen</h2>
              <button onClick={() => setShowAddReading(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Immobilie</label>
                <select className="input-field text-sm"><option>Residenz am Park</option><option>Haus Bergstraße</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Einheit</label>
                <select className="input-field text-sm"><option>Wohnung 1</option><option>Wohnung 2</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zähler</label>
                <select className="input-field text-sm"><option>ELE-000001 (Strom)</option><option>WAT-000001 (Kaltwasser)</option></select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Zählerstand</label>
                  <input type="number" className="input-field text-sm" placeholder="z.B. 4523" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input type="date" className="input-field text-sm" defaultValue="2026-03-23" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grund</label>
                <select className="input-field text-sm">
                  <option value="regular">Reguläre Ablesung</option>
                  <option value="move_in">Einzug</option>
                  <option value="move_out">Auszug</option>
                  <option value="annual">Jahresablesung</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddReading(false)} className="btn-secondary">Abbrechen</button>
                <button className="btn-primary">Ablesung speichern</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
