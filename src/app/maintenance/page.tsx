'use client'

import { useEffect, useState } from 'react'
import { Wrench, Search, Plus, AlertTriangle, Clock, CheckCircle, User, X, Building2 } from 'lucide-react'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'

interface Ticket {
  id: string; title: string; description: string; category: string
  priority: string; status: string; costActual: number | null; createdAt: string
  propertyId: string
  property: { id: string; name: string }; unit: { id: string; designation: string } | null
  tenant: { firstName: string; lastName: string } | null
  technician: { firstName: string; lastName: string } | null
}

interface PropertyOption { id: string; name: string; units: { id: string; designation: string }[] }

const statusLabels: Record<string, string> = { open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Erledigt', cancelled: 'Storniert' }
const priorityLabels: Record<string, string> = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch', critical: 'Kritisch' }
const categoryLabels: Record<string, string> = { plumbing: 'Sanitär', electrical: 'Elektrik', heating: 'Heizung', general: 'Allgemein', structural: 'Baulich', pest_control: 'Schädlingsbekämpfung' }

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', category: 'general', priority: 'medium',
    propertyId: '', unitId: ''
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/tickets').then(r => r.json()),
      fetch('/api/properties').then(r => r.json()),
    ]).then(([t, p]) => {
      setTickets(t)
      setProperties(p.map((prop: any) => ({ id: prop.id, name: prop.name, units: prop.units?.map((u: any) => ({ id: u.id, designation: u.designation })) || [] })))
      setLoading(false)
    })
  }, [])

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.property.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchProperty = propertyFilter === 'all' || t.property?.id === propertyFilter || t.propertyId === propertyFilter
    return matchSearch && matchStatus && matchProperty
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const completedCount = tickets.filter(t => t.status === 'completed').length

  async function handleCreateTicket() {
    if (!newTicket.title || !newTicket.propertyId) return
    setSaving(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      })
      if (res.ok) {
        const created = await res.json()
        setTickets(prev => [created, ...prev])
        setShowNewTicket(false)
        setNewTicket({ title: '', description: '', category: 'general', priority: 'medium', propertyId: '', unitId: '' })
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const selectedPropertyUnits = properties.find(p => p.id === newTicket.propertyId)?.units || []

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wartung & Tickets</h1>
          <p className="text-text-secondary text-sm mt-1">{tickets.length} Tickets gesamt</p>
        </div>
        <button onClick={() => setShowNewTicket(true)} className="btn-primary"><Plus className="w-4 h-4" /> Neues Ticket</button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')} className={`glass-card p-4 flex items-center gap-3 cursor-pointer ${statusFilter === 'open' ? 'ring-2 ring-danger' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-danger" /></div>
          <div><div className="text-2xl font-bold">{openCount}</div><div className="text-xs text-text-muted">Offen</div></div>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')} className={`glass-card p-4 flex items-center gap-3 cursor-pointer ${statusFilter === 'in_progress' ? 'ring-2 ring-warning' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div>
          <div><div className="text-2xl font-bold">{inProgressCount}</div><div className="text-xs text-text-muted">In Bearbeitung</div></div>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')} className={`glass-card p-4 flex items-center gap-3 cursor-pointer ${statusFilter === 'completed' ? 'ring-2 ring-success' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-success" /></div>
          <div><div className="text-2xl font-bold">{completedCount}</div><div className="text-xs text-text-muted">Erledigt</div></div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Tickets suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="input-field min-w-[200px]">
          <option value="all">Alle Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Property</th>
              <th className="text-left px-4 py-3">Einheit</th>
              <th className="text-left px-4 py-3">Priorität</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Techniker</th>
              <th className="text-left px-4 py-3">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="table-row border-t border-black/5">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-text-muted truncate max-w-[200px]">{t.description}</div>
                </td>
                <td className="px-4 py-3 text-sm">{t.property.name}</td>
                <td className="px-4 py-3 text-sm">{t.unit?.designation || '–'}</td>
                <td className="px-4 py-3"><span className={`badge ${getPriorityColor(t.priority)}`}>{priorityLabels[t.priority]}</span></td>
                <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.status)}`}>{statusLabels[t.status]}</span></td>
                <td className="px-4 py-3 text-sm">{t.technician ? `${t.technician.firstName} ${t.technician.lastName}` : <span className="text-text-muted">Nicht zugewiesen</span>}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewTicket(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Neues Ticket erstellen</h2>
              <button onClick={() => setShowNewTicket(false)} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input type="text" value={newTicket.title} onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="z.B. Heizung defekt" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))} className="input-field min-h-[80px]" placeholder="Beschreibung des Problems..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property *</label>
                  <select value={newTicket.propertyId} onChange={e => setNewTicket(p => ({ ...p, propertyId: e.target.value, unitId: '' }))} className="input-field">
                    <option value="">Property wählen...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Einheit</label>
                  <select value={newTicket.unitId} onChange={e => setNewTicket(p => ({ ...p, unitId: e.target.value }))} className="input-field" disabled={!newTicket.propertyId}>
                    <option value="">Einheit wählen...</option>
                    {selectedPropertyUnits.map(u => <option key={u.id} value={u.id}>{u.designation}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorität</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))} className="input-field">
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowNewTicket(false)} className="btn-secondary">Abbrechen</button>
                <button onClick={handleCreateTicket} disabled={saving || !newTicket.title || !newTicket.propertyId} className="btn-primary">
                  {saving ? 'Erstelle...' : 'Ticket erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
