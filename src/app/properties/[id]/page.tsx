'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, Home, Users, Cpu, Calendar, Shield, Mail, Phone, Wrench,
  Zap, Droplets, Flame, ChevronRight, AlertTriangle, CheckCircle, Wallet, TrendingUp,
  Edit2, Save, X, Upload, ClipboardList, Clock, FileText
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'
import { LazyBarChart as BarChart, LazyPieChart as PieChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell, Legend } from '@/components/ui/lazy-recharts'
import VorgaengeTab from '@/components/vorgaenge/VorgaengeTab'

interface PropertyDetail {
  id: string; name: string; street: string; houseNumber: string; zipCode: string
  city: string; buildYear: number; totalArea: number; energyEfficiencyClass: string
  insuranceNumber: string; insuranceExpiry: string; contactName: string
  contactEmail: string; contactPhone: string; notes: string
  units: Array<{
    id: string; designation: string; floor: number; area: number; rooms: number
    rent: number; utilityCost: number; status: string; hasBalcony: boolean; hasTerrace: boolean
    sensors: Array<{ id: string; type: string; designation: string; status: string; batteryLevel: number | null }>
    contracts: Array<{ tenant: { firstName: string; lastName: string } }>
  }>
  tickets: Array<{ id: string; title: string; status: string; priority: string; createdAt: string }>
  _stats: { totalUnits: number; occupiedUnits: number; totalRent: number; totalSensors: number; openTickets: number }
}

const typeLabels: Record<string, string> = { electricity: 'Strom', water: 'Wasser', heat: 'Wärme', smoke_detector: 'Rauchmelder', door_lock: 'Türschloss' }
const typeIcons: Record<string, React.ElementType> = { electricity: Zap, water: Droplets, heat: Flame, smoke_detector: AlertTriangle, door_lock: Shield }
const typeColors: Record<string, string> = { electricity: 'text-yellow-500', water: 'text-blue-500', heat: 'text-orange-500', smoke_detector: 'text-red-500', door_lock: 'text-gray-500' }

const managementItems = [
  { id: 'insurance', label: 'Versicherung erneuern', icon: Shield, color: 'text-blue-600 bg-blue-50', interval: 'Jährlich' },
  { id: 'boiler', label: 'Heizkessel / Boiler warten', icon: Flame, color: 'text-orange-600 bg-orange-50', interval: 'Alle 2 Jahre' },
  { id: 'chimney', label: 'Rauchfangkehrer', icon: AlertTriangle, color: 'text-red-600 bg-red-50', interval: 'Jährlich' },
  { id: 'roof', label: 'Dach-Inspektion', icon: Home, color: 'text-gray-600 bg-gray-50', interval: 'Alle 5 Jahre' },
  { id: 'elevator', label: 'Aufzug-Wartung', icon: Building2, color: 'text-primary bg-blue-50', interval: 'Halbjährlich' },
  { id: 'fire_safety', label: 'Brandschutz-Prüfung', icon: AlertTriangle, color: 'text-red-600 bg-red-50', interval: 'Jährlich' },
  { id: 'electrical', label: 'Elektro-Überprüfung', icon: Zap, color: 'text-yellow-600 bg-yellow-50', interval: 'Alle 5 Jahre' },
  { id: 'plumbing', label: 'Sanitär-Inspektion', icon: Droplets, color: 'text-blue-600 bg-blue-50', interval: 'Bei Bedarf' },
  { id: 'garden', label: 'Garten-/Außenpflege', icon: Home, color: 'text-green-600 bg-green-50', interval: 'Monatlich (Saison)' },
  { id: 'pest', label: 'Schädlingsbekämpfung', icon: Shield, color: 'text-gray-600 bg-gray-50', interval: 'Bei Bedarf' },
]

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [sensorTypeFilter, setSensorTypeFilter] = useState('all')
  const [sensorStatusFilter, setSensorStatusFilter] = useState('all')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: PropertyDetail[]) => {
        const found = data.find(p => p.id === params.id)
        setProperty(found || null)
        if (found) {
          setEditForm({
            name: found.name, street: found.street, houseNumber: found.houseNumber,
            zipCode: found.zipCode, city: found.city, buildYear: found.buildYear,
            totalArea: found.totalArea, energyEfficiencyClass: found.energyEfficiencyClass,
            insuranceNumber: found.insuranceNumber || '', insuranceExpiry: found.insuranceExpiry || '',
            contactName: found.contactName || '', contactEmail: found.contactEmail || '',
            contactPhone: found.contactPhone || '', notes: found.notes || '',
          })
        }
        setLoading(false)
      })
  }, [params.id])

  async function handleSave() {
    if (!property) return
    setSaving(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: property.id, ...editForm })
      })
      if (res.ok) {
        setProperty(prev => prev ? { ...prev, ...editForm } : prev)
        setEditing(false)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  function handleUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      setUploadFiles(prev => [...prev, ...files])
    }
    input.click()
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!property) return <div className="text-center py-20 text-text-secondary">Property nicht gefunden</div>

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'units', label: `Einheiten (${property.units.length})` },
    { id: 'finances', label: 'Finanzen' },
    { id: 'management', label: 'Property-Management' },
    { id: 'sensors', label: 'Sensoren' },
    { id: 'tickets', label: `Tickets (${property.tickets?.length || 0})` },
    { id: 'vorgaenge', label: 'Vorgänge' },
  ]

  const allSensors = property.units.flatMap(u => u.sensors.map(s => ({ ...s, unitDesignation: u.designation, unitId: u.id })))
  const filteredSensors = allSensors.filter(s => {
    const matchType = sensorTypeFilter === 'all' || s.type === sensorTypeFilter
    const matchStatus = sensorStatusFilter === 'all' || s.status === sensorStatusFilter
    return matchType && matchStatus
  })
  const sensorTypes = [...new Set(allSensors.map(s => s.type))]
  const sensorStatuses = [...new Set(allSensors.map(s => s.status))]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            {editing ? (
              <div className="space-y-3">
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input-field text-2xl font-bold" />
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" value={editForm.street} onChange={e => setEditForm(p => ({ ...p, street: e.target.value }))} className="input-field col-span-2" placeholder="Straße" />
                  <input type="text" value={editForm.houseNumber} onChange={e => setEditForm(p => ({ ...p, houseNumber: e.target.value }))} className="input-field" placeholder="Nr." />
                  <input type="text" value={editForm.zipCode} onChange={e => setEditForm(p => ({ ...p, zipCode: e.target.value }))} className="input-field" placeholder="PLZ" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} className="input-field" placeholder="Stadt" />
                  <input type="number" value={editForm.buildYear} onChange={e => setEditForm(p => ({ ...p, buildYear: e.target.value }))} className="input-field" placeholder="Baujahr" />
                  <select value={editForm.energyEfficiencyClass} onChange={e => setEditForm(p => ({ ...p, energyEfficiencyClass: e.target.value }))} className="input-field">
                    {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{property.name}</h1>
                <div className="flex items-center gap-1 text-text-secondary mt-1">
                  <MapPin className="w-4 h-4" />
                  {property.street} {property.houseNumber}, {property.zipCode} {property.city}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editing && <span className="badge text-primary bg-blue-50 text-sm">Klasse {property.energyEfficiencyClass}</span>}
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <InfoBox icon={Home} label="Einheiten" value={property._stats?.totalUnits || property.units.length} />
          <InfoBox icon={Users} label="Vermietet" value={property._stats?.occupiedUnits || property.units.filter(u => u.status === 'occupied').length} />
          <InfoBox icon={Cpu} label="Sensoren" value={allSensors.length} />
          <InfoBox icon={Calendar} label="Baujahr" value={property.buildYear} />
          <InfoBox icon={Building2} label="Fläche" value={`${property.totalArea} m²`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/5 pb-0 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-primary bg-white border border-b-0 border-black/5' : 'text-text-secondary hover:text-text-primary'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Finanzen</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-text-secondary">Gesamtmiete/Monat</span><span className="font-semibold text-success">{formatCurrency(property.units.reduce((s, u) => s + u.rent, 0))}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Nebenkosten/Monat</span><span className="font-semibold">{formatCurrency(property.units.reduce((s, u) => s + u.utilityCost, 0))}</span></div>
              <hr className="border-black/5" />
              <div className="flex justify-between text-lg"><span className="text-text-secondary font-medium">Gesamt</span><span className="font-bold text-success">{formatCurrency(property.units.reduce((s, u) => s + u.rent + u.utilityCost, 0))}</span></div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Kontakt</h3>
              {editing && <span className="text-xs text-text-muted">(wird oben gespeichert)</span>}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted">Kontaktperson</label><input type="text" value={editForm.contactName} onChange={e => setEditForm(p => ({ ...p, contactName: e.target.value }))} className="input-field" /></div>
                <div><label className="text-xs text-text-muted">E-Mail</label><input type="email" value={editForm.contactEmail} onChange={e => setEditForm(p => ({ ...p, contactEmail: e.target.value }))} className="input-field" /></div>
                <div><label className="text-xs text-text-muted">Telefon</label><input type="text" value={editForm.contactPhone} onChange={e => setEditForm(p => ({ ...p, contactPhone: e.target.value }))} className="input-field" /></div>
                <div><label className="text-xs text-text-muted">Versicherung</label><input type="text" value={editForm.insuranceNumber} onChange={e => setEditForm(p => ({ ...p, insuranceNumber: e.target.value }))} className="input-field" /></div>
                <div><label className="text-xs text-text-muted">Notizen</label><textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-[60px]" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                {property.contactName && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-text-muted" /> {property.contactName}</div>}
                {property.contactEmail && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-text-muted" /> {property.contactEmail}</div>}
                {property.contactPhone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-text-muted" /> {property.contactPhone}</div>}
                {property.insuranceNumber && <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-text-muted" /> Versicherung: {property.insuranceNumber}</div>}
                {property.notes && <p className="text-sm text-text-secondary mt-2">{property.notes}</p>}
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Dokumente</h3>
              <button onClick={handleUpload} className="btn-secondary text-sm"><Upload className="w-4 h-4" /> Hochladen</button>
            </div>
            {uploadFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-sm">{f.name}</span></div>
                    <button onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-black/10 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Dokumente hier hochladen (PDF, Bilder, Word)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Units Tab */}
      {activeTab === 'units' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Einheit</th>
                <th className="text-left px-4 py-3">Etage</th>
                <th className="text-left px-4 py-3">Fläche</th>
                <th className="text-left px-4 py-3">Zimmer</th>
                <th className="text-left px-4 py-3">Mieter</th>
                <th className="text-left px-4 py-3">Miete</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {property.units.map((u) => (
                <tr key={u.id} className="table-row border-t border-black/5 cursor-pointer hover:bg-surface-secondary/30" onClick={() => router.push(`/units/${u.id}`)}>
                  <td className="px-4 py-3 font-medium">{u.designation}</td>
                  <td className="px-4 py-3">{u.floor}. OG</td>
                  <td className="px-4 py-3">{u.area} m²</td>
                  <td className="px-4 py-3">{u.rooms}</td>
                  <td className="px-4 py-3">{u.contracts?.[0]?.tenant ? `${u.contracts[0].tenant.firstName} ${u.contracts[0].tenant.lastName}` : <span className="text-text-muted">–</span>}</td>
                  <td className="px-4 py-3 font-medium">{u.rent > 0 ? formatCurrency(u.rent) : '–'}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(u.status)}`}>{u.status === 'occupied' ? 'Vermietet' : u.status === 'vacant' ? 'Leer' : 'Renovierung'}</span></td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Finances Tab */}
      {activeTab === 'finances' && (() => {
        const totalRent = property.units.reduce((s, u) => s + u.rent, 0)
        const totalUtility = property.units.reduce((s, u) => s + u.utilityCost, 0)
        const totalIncome = totalRent + totalUtility
        const occupiedUnits = property.units.filter(u => u.status === 'occupied').length
        const occupancyRate = property.units.length > 0 ? Math.round((occupiedUnits / property.units.length) * 100) : 0
        const unitFinanceData = property.units.filter(u => u.rent > 0).map(u => ({ name: u.designation, miete: u.rent, nebenkosten: u.utilityCost }))
        const pieData = [{ name: 'Kaltmiete', value: totalRent }, { name: 'Nebenkosten', value: totalUtility }]
        const COLORS = ['#0066FF', '#FF9900']

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-success" /><span className="text-sm text-text-secondary">Monatseinnahmen</span></div><div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div></div>
              <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-primary" /><span className="text-sm text-text-secondary">Kaltmiete</span></div><div className="text-2xl font-bold">{formatCurrency(totalRent)}</div></div>
              <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-blue-500" /><span className="text-sm text-text-secondary">Nebenkosten</span></div><div className="text-2xl font-bold">{formatCurrency(totalUtility)}</div></div>
              <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><Home className="w-4 h-4 text-primary" /><span className="text-sm text-text-secondary">Auslastung</span></div><div className="text-2xl font-bold">{occupancyRate}%</div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6"><h3 className="font-semibold mb-4">Mieteinnahmen pro Einheit</h3><ResponsiveContainer width="100%" height={280}><BarChart data={unitFinanceData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Legend /><Bar dataKey="miete" name="Kaltmiete" fill="#0066FF" radius={[0, 4, 4, 0]} /><Bar dataKey="nebenkosten" name="Nebenkosten" fill="#FF9900" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
              <div className="glass-card p-6"><h3 className="font-semibold mb-4">Einnahmen-Verteilung</h3><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v) => formatCurrency(Number(v))} /></PieChart></ResponsiveContainer></div>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-black/5"><h3 className="font-semibold">Einheiten-Übersicht</h3></div>
              <table className="w-full"><thead><tr className="table-header"><th className="text-left px-4 py-3">Einheit</th><th className="text-left px-4 py-3">Mieter</th><th className="text-left px-4 py-3">Kaltmiete</th><th className="text-left px-4 py-3">Nebenkosten</th><th className="text-left px-4 py-3">Gesamt</th><th className="text-left px-4 py-3">€/m²</th></tr></thead>
              <tbody>
                {property.units.map(u => (<tr key={u.id} className="table-row border-t border-black/5"><td className="px-4 py-3 font-medium">{u.designation}</td><td className="px-4 py-3 text-sm">{u.contracts?.[0]?.tenant ? `${u.contracts[0].tenant.firstName} ${u.contracts[0].tenant.lastName}` : <span className="text-text-muted">–</span>}</td><td className="px-4 py-3">{u.rent > 0 ? formatCurrency(u.rent) : '–'}</td><td className="px-4 py-3 text-text-secondary">{u.utilityCost > 0 ? formatCurrency(u.utilityCost) : '–'}</td><td className="px-4 py-3 font-semibold">{u.rent > 0 ? formatCurrency(u.rent + u.utilityCost) : '–'}</td><td className="px-4 py-3 text-sm">{u.rent > 0 && u.area > 0 ? `${(u.rent / u.area).toFixed(2)} €` : '–'}</td></tr>))}
                <tr className="table-row border-t-2 border-black/10 bg-surface-secondary/30 font-semibold"><td className="px-4 py-3" colSpan={2}>Gesamt</td><td className="px-4 py-3">{formatCurrency(totalRent)}</td><td className="px-4 py-3">{formatCurrency(totalUtility)}</td><td className="px-4 py-3 text-success">{formatCurrency(totalIncome)}</td><td className="px-4 py-3">{property.totalArea > 0 ? `${(totalRent / property.totalArea).toFixed(2)} €` : '–'}</td></tr>
              </tbody></table>
            </div>
          </div>
        )
      })()}

      {/* Property Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Property-Management & Instandhaltung</h3>
              <span className="text-sm text-text-muted">Wartungsplan für {property.name}</span>
            </div>
            <p className="text-sm text-text-secondary mb-6">Übersicht aller regelmäßigen Wartungen, Inspektionen und Instandhaltungsmaßnahmen für diese Immobilie.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managementItems.map(item => {
                const Icon = item.icon
                return (
                  <div key={item.id} className="p-4 rounded-lg border border-black/5 hover:bg-surface-secondary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.label}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {item.interval}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="badge text-xs text-text-muted bg-gray-50">Nächster Termin: Ausstehend</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insurance Info */}
          {property.insuranceNumber && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Versicherungsinformationen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-text-muted">Versicherungsnummer</span><div className="font-medium">{property.insuranceNumber}</div></div>
                <div><span className="text-sm text-text-muted">Ablaufdatum</span><div className="font-medium">{property.insuranceExpiry ? formatDate(property.insuranceExpiry) : 'Nicht angegeben'}</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sensors Tab */}
      {activeTab === 'sensors' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select value={sensorTypeFilter} onChange={e => setSensorTypeFilter(e.target.value)} className="input-field min-w-[150px]">
              <option value="all">Alle Typen</option>
              {sensorTypes.map(t => <option key={t} value={t}>{typeLabels[t] || t}</option>)}
            </select>
            <select value={sensorStatusFilter} onChange={e => setSensorStatusFilter(e.target.value)} className="input-field min-w-[150px]">
              <option value="all">Alle Status</option>
              {sensorStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-sm text-text-muted self-center">{filteredSensors.length} von {allSensors.length} Sensoren</span>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead><tr className="table-header">
                <th className="text-left px-4 py-3">Sensor</th>
                <th className="text-left px-4 py-3">Typ</th>
                <th className="text-left px-4 py-3">Einheit</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Batterie</th>
                <th className="text-left px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {filteredSensors.map((s) => {
                  const Icon = typeIcons[s.type] || Cpu
                  const color = typeColors[s.type] || 'text-gray-500'
                  return (
                    <tr key={s.id} className="table-row border-t border-black/5 cursor-pointer hover:bg-surface-secondary/30" onClick={() => router.push(`/smart-home/${s.id}`)}>
                      <td className="px-4 py-3 font-medium">{s.designation}</td>
                      <td className="px-4 py-3"><span className={`flex items-center gap-1.5 ${color}`}><Icon className="w-4 h-4" /> {typeLabels[s.type] || s.type}</span></td>
                      <td className="px-4 py-3">{s.unitDesignation}</td>
                      <td className="px-4 py-3"><span className={`badge ${getStatusColor(s.status)}`}>{s.status}</span></td>
                      <td className="px-4 py-3">{s.batteryLevel != null ? `${Math.round(s.batteryLevel)}%` : '–'}</td>
                      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-text-muted" /></td>
                    </tr>
                  )
                })}
                {filteredSensors.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Keine Sensoren</td></tr>}
              </tbody>
            </table>
          </div>
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
              <th className="text-left px-4 py-3">Erstellt</th>
            </tr></thead>
            <tbody>
              {property.tickets?.map((t) => (
                <tr key={t.id} className="table-row border-t border-black/5">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.status)}`}>{t.status === 'open' ? 'Offen' : t.status === 'in_progress' ? 'In Bearbeitung' : 'Erledigt'}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
              {(!property.tickets || property.tickets.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Keine Tickets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vorgänge Tab */}
      {activeTab === 'vorgaenge' && (
        <VorgaengeTab entityType="property" entityId={property.id} />
      )}
    </div>
  )
}

function InfoBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
