'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Home, ArrowLeft, Edit2, Save, X, Users, Wallet, Cpu,
  Zap, Droplets, Flame, AlertTriangle, Shield
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import VorgaengeTab from '@/components/vorgaenge/VorgaengeTab'

interface UnitDetail {
  id: string; designation: string; floor: number; area: number; rooms: number
  bathrooms: number; hasBalcony: boolean; hasTerrace: boolean; rent: number
  utilityCost: number; status: string; notes: string | null; propertyId: string
  property: { id: string; name: string }
  sensors: Array<{ id: string; type: string; designation: string; serialNumber: string; status: string; batteryLevel: number | null; lastReading: number | null }>
  contracts: Array<{ id: string; startDate: string; endDate: string | null; monthlyRent: number; utilityCost: number; deposit: number; status: string; tenant: { id: string; firstName: string; lastName: string; email: string; phone: string | null } }>
  tickets: Array<{ id: string; title: string; status: string; priority: string; createdAt: string; technician: { firstName: string; lastName: string } | null }>
}

const typeIcons: Record<string, React.ElementType> = { electricity: Zap, water: Droplets, heat: Flame, smoke_detector: AlertTriangle, door_lock: Shield }
const typeColors: Record<string, string> = { electricity: 'text-yellow-500', water: 'text-blue-500', heat: 'text-orange-500', smoke_detector: 'text-red-500', door_lock: 'text-gray-500' }
const typeLabels: Record<string, string> = { electricity: 'Strom', water: 'Wasser', heat: 'Wärme', smoke_detector: 'Rauchmelder', door_lock: 'Türschloss' }
const statusLabels: Record<string, string> = { occupied: 'Vermietet', vacant: 'Leer', renovation: 'Renovierung' }

export default function UnitDetailPage() {
  const params = useParams()
  const [unit, setUnit] = useState<UnitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetch(`/api/units/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setUnit(null)
        } else {
          setUnit(d)
          setForm({
            designation: d.designation, floor: d.floor, area: d.area, rooms: d.rooms,
            bathrooms: d.bathrooms, hasBalcony: d.hasBalcony, hasTerrace: d.hasTerrace,
            rent: d.rent, utilityCost: d.utilityCost, status: d.status, notes: d.notes || ''
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    if (!unit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const updated = await res.json()
        setUnit(prev => prev ? { ...prev, ...updated } : prev)
        setEditing(false)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!unit) return <div className="text-center py-20 text-text-secondary">Einheit nicht gefunden</div>

  const activeTenant = unit.contracts.find(c => c.status === 'active')?.tenant
  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'sensors', label: `Sensoren (${unit.sensors.length})` },
    { id: 'contracts', label: `Verträge (${unit.contracts.length})` },
    { id: 'tickets', label: `Tickets (${unit.tickets.length})` },
    { id: 'vorgaenge', label: 'Vorgänge' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href={`/properties/${unit.property.id}`} className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> {unit.property.name}
          </Link>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Home className="w-6 h-6 text-primary" /> {unit.designation}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span>{unit.floor}. OG</span>
              <span>{unit.area} m²</span>
              <span>{unit.rooms} Zimmer</span>
              <span>{unit.bathrooms} Bad</span>
              {unit.hasBalcony && <span>Balkon</span>}
              {unit.hasTerrace && <span>Terrasse</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${getStatusColor(unit.status)}`}>{statusLabels[unit.status] || unit.status}</span>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm"><Edit2 className="w-4 h-4" /> Bearbeiten</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm"><X className="w-4 h-4" /> Abbrechen</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm"><Save className="w-4 h-4" /> {saving ? 'Speichere...' : 'Speichern'}</button>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
            <Wallet className="w-5 h-5 text-success mx-auto mb-1" />
            <div className="text-lg font-bold text-success">{formatCurrency(unit.rent)}</div>
            <div className="text-xs text-text-muted">Kaltmiete</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
            <Wallet className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold">{formatCurrency(unit.utilityCost)}</div>
            <div className="text-xs text-text-muted">Nebenkosten</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
            <Cpu className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold">{unit.sensors.length}</div>
            <div className="text-xs text-text-muted">Sensoren</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold truncate">{activeTenant ? `${activeTenant.firstName} ${activeTenant.lastName}` : '–'}</div>
            <div className="text-xs text-text-muted">Mieter</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/5 pb-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id ? 'text-primary bg-white border border-b-0 border-black/5' : 'text-text-secondary hover:text-text-primary'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Einheit-Details</h3>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm text-text-muted">Bezeichnung</label><input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} className="input-field" /></div>
                  <div><label className="text-sm text-text-muted">Etage</label><input type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm text-text-muted">Fläche (m²)</label><input type="number" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} className="input-field" /></div>
                  <div><label className="text-sm text-text-muted">Zimmer</label><input type="number" value={form.rooms} onChange={e => setForm(p => ({ ...p, rooms: e.target.value }))} className="input-field" /></div>
                  <div><label className="text-sm text-text-muted">Bäder</label><input type="number" value={form.bathrooms} onChange={e => setForm(p => ({ ...p, bathrooms: e.target.value }))} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm text-text-muted">Kaltmiete (€)</label><input type="number" value={form.rent} onChange={e => setForm(p => ({ ...p, rent: e.target.value }))} className="input-field" /></div>
                  <div><label className="text-sm text-text-muted">Nebenkosten (€)</label><input type="number" value={form.utilityCost} onChange={e => setForm(p => ({ ...p, utilityCost: e.target.value }))} className="input-field" /></div>
                </div>
                <div>
                  <label className="text-sm text-text-muted">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
                    <option value="occupied">Vermietet</option><option value="vacant">Leer</option><option value="renovation">Renovierung</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasBalcony} onChange={e => setForm(p => ({ ...p, hasBalcony: e.target.checked }))} /> Balkon</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasTerrace} onChange={e => setForm(p => ({ ...p, hasTerrace: e.target.checked }))} /> Terrasse</label>
                </div>
                <div><label className="text-sm text-text-muted">Notizen</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-[60px]" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-text-secondary">Bezeichnung</span><span className="font-medium">{unit.designation}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Etage</span><span>{unit.floor}. OG</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Fläche</span><span>{unit.area} m²</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Zimmer</span><span>{unit.rooms}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Bäder</span><span>{unit.bathrooms}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Kaltmiete</span><span className="text-success font-semibold">{formatCurrency(unit.rent)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Nebenkosten</span><span>{formatCurrency(unit.utilityCost)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">€/m²</span><span>{unit.area > 0 ? `${(unit.rent / unit.area).toFixed(2)} €` : '–'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Balkon</span><span>{unit.hasBalcony ? 'Ja' : 'Nein'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Terrasse</span><span>{unit.hasTerrace ? 'Ja' : 'Nein'}</span></div>
                {unit.notes && <div className="pt-2 border-t border-black/5"><p className="text-sm text-text-secondary">{unit.notes}</p></div>}
              </div>
            )}
          </div>

          {/* Current Tenant */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Aktueller Mieter</h3>
            {activeTenant ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{activeTenant.firstName[0]}{activeTenant.lastName[0]}</div>
                  <div>
                    <Link href={`/tenants/${activeTenant.id}`} className="font-semibold hover:text-primary">{activeTenant.firstName} {activeTenant.lastName}</Link>
                    <div className="text-sm text-text-secondary">{activeTenant.email}</div>
                    {activeTenant.phone && <div className="text-sm text-text-secondary">{activeTenant.phone}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-muted">Kein aktiver Mieter</p>
            )}
          </div>
        </div>
      )}

      {/* Sensors Tab */}
      {activeTab === 'sensors' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="table-header">
              <th className="text-left px-4 py-3">Sensor</th>
              <th className="text-left px-4 py-3">Typ</th>
              <th className="text-left px-4 py-3">Seriennr.</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Batterie</th>
              <th className="text-left px-4 py-3">Letzter Wert</th>
            </tr></thead>
            <tbody>
              {unit.sensors.map(s => {
                const Icon = typeIcons[s.type] || Cpu
                const color = typeColors[s.type] || 'text-gray-500'
                return (
                  <tr key={s.id} className="table-row border-t border-black/5 cursor-pointer hover:bg-surface-secondary/30" onClick={() => window.location.href = `/smart-home/${s.id}`}>
                    <td className="px-4 py-3 font-medium">{s.designation}</td>
                    <td className="px-4 py-3"><span className={`flex items-center gap-1.5 ${color}`}><Icon className="w-4 h-4" /> {typeLabels[s.type] || s.type}</span></td>
                    <td className="px-4 py-3 text-sm text-text-secondary font-mono">{s.serialNumber}</td>
                    <td className="px-4 py-3"><span className={`badge ${getStatusColor(s.status)}`}>{s.status}</span></td>
                    <td className="px-4 py-3">{s.batteryLevel != null ? `${s.batteryLevel}%` : '–'}</td>
                    <td className="px-4 py-3 text-sm">{s.lastReading != null ? s.lastReading.toFixed(1) : '–'}</td>
                  </tr>
                )
              })}
              {unit.sensors.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Keine Sensoren</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {unit.contracts.map(c => (
            <div key={c.id} className={`glass-card p-5 ${c.status === 'active' ? 'ring-2 ring-success/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.tenant.firstName[0]}{c.tenant.lastName[0]}</div>
                  <div>
                    <Link href={`/tenants/${c.tenant.id}`} className="font-semibold hover:text-primary">{c.tenant.firstName} {c.tenant.lastName}</Link>
                    <div className="text-xs text-text-muted">{c.tenant.email}</div>
                  </div>
                </div>
                <span className={`badge ${c.status === 'active' ? 'text-success bg-green-50' : 'text-text-muted bg-gray-50'}`}>{c.status === 'active' ? 'Aktiv' : 'Beendet'}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><span className="text-text-muted">Von:</span> {formatDate(c.startDate)}</div>
                <div><span className="text-text-muted">Bis:</span> {c.endDate ? formatDate(c.endDate) : 'Unbefristet'}</div>
                <div><span className="text-text-muted">Miete:</span> <span className="font-semibold">{formatCurrency(c.monthlyRent)}</span></div>
                <div><span className="text-text-muted">Kaution:</span> {formatCurrency(c.deposit)}</div>
              </div>
            </div>
          ))}
          {unit.contracts.length === 0 && <div className="glass-card p-8 text-center text-text-muted">Keine Verträge</div>}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="table-header">
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Priorität</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Techniker</th>
              <th className="text-left px-4 py-3">Erstellt</th>
            </tr></thead>
            <tbody>
              {unit.tickets.map(t => (
                <tr key={t.id} className="table-row border-t border-black/5">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.status)}`}>{t.status === 'open' ? 'Offen' : t.status === 'in_progress' ? 'In Arbeit' : 'Erledigt'}</span></td>
                  <td className="px-4 py-3 text-sm">{t.technician ? `${t.technician.firstName} ${t.technician.lastName}` : '–'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
              {unit.tickets.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Keine Tickets</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Vorgänge Tab */}
      {activeTab === 'vorgaenge' && (
        <VorgaengeTab entityType="unit" entityId={unit.id} />
      )}
    </div>
  )
}
