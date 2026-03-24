'use client'

import { useEffect, useState } from 'react'
import {
  HardHat, Search, Plus, Star, Phone, Mail, CheckCircle,
  Clock, TrendingUp, X, Edit2, Building2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TechnicianRow {
  id: string; firstName: string; lastName: string; email: string
  phone: string; specialization: string; rating: number; notes: string | null
  _totalTickets: number; _openTickets: number; _inProgressTickets: number
  _completedTickets: number; _totalCost: number
  tickets: Array<{
    id: string; title: string; status: string; priority: string
    property: { name: string }; unit: { designation: string } | null
  }>
}

const specLabels: Record<string, string> = {
  heating: 'Heizung', plumbing: 'Sanitär', electrical: 'Elektrik',
  general: 'Allgemein', smoke_detector: 'Brandschutz',
}

const specColors: Record<string, string> = {
  heating: 'text-orange-600 bg-orange-50', plumbing: 'text-blue-600 bg-blue-50',
  electrical: 'text-yellow-600 bg-yellow-50', general: 'text-gray-600 bg-gray-50',
  smoke_detector: 'text-red-600 bg-red-50',
}

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', specialization: 'general', company: '', notes: '' }

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTechnicians()
  }, [])

  function fetchTechnicians() {
    fetch('/api/technicians').then(r => r.json()).then(d => { setTechnicians(d); setLoading(false) })
  }

  const filtered = technicians.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    specLabels[t.specialization]?.toLowerCase().includes(search.toLowerCase()) ||
    (t.notes || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalActive = technicians.reduce((s, t) => s + t._openTickets + t._inProgressTickets, 0)
  const totalCompleted = technicians.reduce((s, t) => s + t._completedTickets, 0)
  const avgRating = technicians.length > 0
    ? (technicians.reduce((s, t) => s + t.rating, 0) / technicians.length).toFixed(1)
    : '–'

  const selectedTechnician = technicians.find(t => t.id === selectedTech)

  function openNewForm() {
    setForm(emptyForm)
    setEditMode(false)
    setShowForm(true)
  }

  function openEditForm(tech: TechnicianRow) {
    const companyMatch = tech.notes?.match(/^Firma: (.+?)(\n|$)/)
    setForm({
      firstName: tech.firstName, lastName: tech.lastName,
      email: tech.email, phone: tech.phone,
      specialization: tech.specialization,
      company: companyMatch ? companyMatch[1] : '',
      notes: tech.notes?.replace(/^Firma: .+?\n?/, '') || '',
    })
    setEditMode(true)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.firstName || !form.lastName || !form.email) return
    setSaving(true)
    const notes = [form.company ? `Firma: ${form.company}` : '', form.notes].filter(Boolean).join('\n')
    try {
      if (editMode && selectedTech) {
        await fetch('/api/technicians', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedTech, ...form, notes })
        })
      } else {
        await fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, notes })
        })
      }
      setShowForm(false)
      setLoading(true)
      fetchTechnicians()
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Techniker-Verwaltung</h1>
          <p className="text-text-secondary text-sm mt-1">{technicians.length} Techniker registriert</p>
        </div>
        <button onClick={openNewForm} className="btn-primary"><Plus className="w-4 h-4" /> Neuer Techniker</button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><HardHat className="w-5 h-5 text-primary" /></div>
          <div><div className="text-2xl font-bold">{technicians.length}</div><div className="text-xs text-text-muted">Techniker</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div>
          <div><div className="text-2xl font-bold">{totalActive}</div><div className="text-xs text-text-muted">Aktive Aufträge</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-success" /></div>
          <div><div className="text-2xl font-bold">{totalCompleted}</div><div className="text-xs text-text-muted">Abgeschlossen</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center"><Star className="w-5 h-5 text-yellow-500" /></div>
          <div><div className="text-2xl font-bold">{avgRating}</div><div className="text-xs text-text-muted">Ø Bewertung</div></div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Techniker suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technician List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(t => {
            const companyMatch = t.notes?.match(/^Firma: (.+?)(\n|$)/)
            const company = companyMatch ? companyMatch[1] : null
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTech(t.id === selectedTech ? null : t.id)}
                className={`glass-card p-5 cursor-pointer transition-all hover:shadow-md ${selectedTech === t.id ? 'ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {t.firstName[0]}{t.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{t.firstName} {t.lastName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge text-xs ${specColors[t.specialization] || 'text-gray-600 bg-gray-50'}`}>
                          {specLabels[t.specialization] || t.specialization}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-current" /> {t.rating.toFixed(1)}
                        </span>
                      </div>
                      {company && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                          <Building2 className="w-3 h-3" /> {company}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(t) }} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="Bearbeiten">
                      <Edit2 className="w-4 h-4 text-text-muted" />
                    </button>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-warning">{t._openTickets + t._inProgressTickets}</div>
                        <div className="text-xs text-text-muted">Aktiv</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-success">{t._completedTickets}</div>
                        <div className="text-xs text-text-muted">Erledigt</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
                  <a href={`mailto:${t.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary"><Mail className="w-3.5 h-3.5" /> {t.email}</a>
                  {t.phone && <a href={`tel:${t.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3.5 h-3.5" /> {t.phone}</a>}
                </div>

                {t._totalCost > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                    <TrendingUp className="w-3 h-3" /> Gesamtkosten: {formatCurrency(t._totalCost)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedTechnician ? (
            <div className="glass-card p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Details & Tickets</h3>
                <button onClick={() => openEditForm(selectedTechnician)} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
                </button>
              </div>
              {selectedTechnician.notes && (
                <div className="p-3 rounded-lg bg-surface-secondary/50 text-sm mb-4">
                  <div className="text-text-muted text-xs mb-1">Notizen / Firma</div>
                  <div className="whitespace-pre-wrap">{selectedTechnician.notes}</div>
                </div>
              )}
              <h4 className="text-sm font-medium mb-2">Zugewiesene Tickets</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedTechnician.tickets.length > 0 ? selectedTechnician.tickets.map(tk => (
                  <div key={tk.id} className="p-3 rounded-lg bg-surface-secondary/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{tk.title}</span>
                      <span className={`badge text-xs ${tk.status === 'completed' ? 'text-success bg-green-50' : tk.status === 'in_progress' ? 'text-warning bg-orange-50' : 'text-primary bg-blue-50'}`}>
                        {tk.status === 'completed' ? 'Erledigt' : tk.status === 'in_progress' ? 'In Arbeit' : 'Offen'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">{tk.property.name}{tk.unit ? ` – ${tk.unit.designation}` : ''}</div>
                  </div>
                )) : (
                  <p className="text-text-muted text-sm">Keine Tickets zugewiesen</p>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-text-muted">
              <HardHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Wähle einen Techniker, um Details zu sehen</p>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Technician Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editMode ? 'Techniker bearbeiten' : 'Neuer Techniker'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vorname *</label>
                  <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nachname *</label>
                  <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-Mail *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fachgebiet</label>
                  <select value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} className="input-field">
                    {Object.entries(specLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Firma</label>
                <input type="text" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="input-field" placeholder="z.B. Müller Haustechnik GmbH" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notizen</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-[60px]" placeholder="Zusätzliche Informationen..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Abbrechen</button>
                <button onClick={handleSave} disabled={saving || !form.firstName || !form.lastName || !form.email} className="btn-primary">
                  {saving ? 'Speichere...' : editMode ? 'Speichern' : 'Techniker anlegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
