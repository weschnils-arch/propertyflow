'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Users, Home, Wrench, Search, Plus, Cpu, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Property {
  id: string; name: string; street: string; houseNumber: string; zipCode: string
  city: string; buildYear: number; totalArea: number; energyEfficiencyClass: string
  _stats: { totalUnits: number; occupiedUnits: number; vacantUnits: number; vacancyRate: number; totalRent: number; totalSensors: number; openTickets: number; yield: number }
}

const emptyForm = {
  name: '', street: '', houseNumber: '', zipCode: '', city: '', buildYear: '',
  totalArea: '', energyEfficiencyClass: 'B', contactName: '', contactEmail: '',
  contactPhone: '', insuranceNumber: '', notes: ''
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProperties() }, [])

  function fetchProperties() {
    fetch('/api/properties').then(r => r.json()).then(d => { setProperties(d); setLoading(false) }).catch(() => setLoading(false))
  }

  async function handleCreate() {
    if (!form.name || !form.street || !form.city) return
    setSaving(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowForm(false)
        setForm(emptyForm)
        setLoading(true)
        fetchProperties()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Immobilien</h1>
          <p className="text-text-secondary text-sm mt-1">{properties.length} Properties im Portfolio</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Neue Property</button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Properties durchsuchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <div className="glass-card p-6 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.street} {p.houseNumber}, {p.zipCode} {p.city}
                  </div>
                </div>
                <span className="badge text-primary bg-blue-50">Klasse {p.energyEfficiencyClass}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatMini icon={Home} label="Einheiten" value={p._stats.totalUnits} />
                <StatMini icon={Users} label="Vermietet" value={p._stats.occupiedUnits} />
                <StatMini icon={Cpu} label="Sensoren" value={p._stats.totalSensors} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-black/5">
                <div className="text-sm">
                  <span className="text-text-secondary">Miete/Monat:</span>{' '}
                  <span className="font-semibold text-success">{formatCurrency(p._stats.totalRent)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p._stats.openTickets > 0 && (
                    <span className="badge text-warning bg-orange-50">
                      <Wrench className="w-3 h-3 mr-1" /> {p._stats.openTickets}
                    </span>
                  )}
                  {p._stats.vacancyRate > 0 && (
                    <span className="badge text-red-600 bg-red-50">{p._stats.vacancyRate}% Leerstand</span>
                  )}
                  {p._stats.vacancyRate === 0 && (
                    <span className="badge text-success bg-green-50">Voll vermietet</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* New Property Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Neue Property anlegen</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="z.B. Residenz am Park" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Straße *</label>
                  <input type="text" value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hausnummer</label>
                  <input type="text" value={form.houseNumber} onChange={e => setForm(p => ({ ...p, houseNumber: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PLZ</label>
                  <input type="text" value={form.zipCode} onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stadt *</label>
                  <input type="text" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Baujahr</label>
                  <input type="number" value={form.buildYear} onChange={e => setForm(p => ({ ...p, buildYear: e.target.value }))} className="input-field" placeholder="2020" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gesamtfläche (m²)</label>
                  <input type="number" value={form.totalArea} onChange={e => setForm(p => ({ ...p, totalArea: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Energieklasse</label>
                  <select value={form.energyEfficiencyClass} onChange={e => setForm(p => ({ ...p, energyEfficiencyClass: e.target.value }))} className="input-field">
                    {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <hr className="border-black/5" />
              <h3 className="font-medium">Kontakt & Verwaltung</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kontaktperson</label>
                  <input type="text" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input type="text" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-Mail</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Versicherungsnummer</label>
                  <input type="text" value={form.insuranceNumber} onChange={e => setForm(p => ({ ...p, insuranceNumber: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notizen</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-[60px]" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Abbrechen</button>
                <button onClick={handleCreate} disabled={saving || !form.name || !form.street || !form.city} className="btn-primary">
                  {saving ? 'Erstelle...' : 'Property anlegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatMini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="text-center p-2 rounded-lg bg-surface-secondary/50">
      <Icon className="w-4 h-4 text-text-muted mx-auto mb-1" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
