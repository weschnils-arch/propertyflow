'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Search, Plus, Mail, Phone, Building2, AlertTriangle, CheckCircle, X, MessageSquare } from 'lucide-react'
import { formatCurrency, getStatusColor } from '@/lib/utils'

interface TenantRow {
  id: string; firstName: string; lastName: string; email: string; phone: string
  occupation: string; creditScore: number
  _activeUnit: string | null; _propertyName: string | null
  _monthlyRent: number; _paymentStatus: string; _openTickets: number
}

interface UnitOption { id: string; designation: string; propertyName: string }

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [units, setUnits] = useState<UnitOption[]>([])
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', occupation: '', unitId: '' })

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(d => { setTenants(d); setLoading(false) })
  }, [])

  function openModal() {
    setForm({ firstName: '', lastName: '', email: '', phone: '', occupation: '', unitId: '' })
    setShowModal(true)
    // Load available units
    fetch('/api/properties').then(r => r.json()).then((props: any[]) => {
      const unitList: UnitOption[] = []
      props.forEach((p: any) => {
        if (p.units) p.units.forEach((u: any) => {
          unitList.push({ id: u.id, designation: u.designation, propertyName: p.name })
        })
      })
      setUnits(unitList)
    }).catch(() => {})
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.email) return
    setSaving(true)
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setLoading(true)
      fetch('/api/tenants').then(r => r.json()).then(d => { setTenants(d); setLoading(false) })
    }
    setSaving(false)
  }

  const filtered = tenants.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t._propertyName || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mieter</h1>
          <p className="text-text-secondary text-sm mt-1">{tenants.length} Mieter verwaltet</p>
        </div>
        <button className="btn-primary" onClick={openModal}><Plus className="w-4 h-4" /> Neuer Mieter</button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Mieter suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Einheit</th>
              <th className="text-left px-4 py-3">Property</th>
              <th className="text-left px-4 py-3">Miete</th>
              <th className="text-left px-4 py-3">Beruf</th>
              <th className="text-left px-4 py-3">Zahlung</th>
              <th className="text-left px-4 py-3">Kontakt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="table-row border-t border-black/5 cursor-pointer" onClick={() => router.push(`/tenants/${t.id}`)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                      {t.firstName[0]}{t.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium">{t.firstName} {t.lastName}</div>
                      {t._openTickets > 0 && <span className="text-xs text-warning">{t._openTickets} offene Tickets</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{t._activeUnit || '–'}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{t._propertyName || '–'}</td>
                <td className="px-4 py-3 font-medium">{t._monthlyRent > 0 ? formatCurrency(t._monthlyRent) : '–'}</td>
                <td className="px-4 py-3 text-sm">{t.occupation || '–'}</td>
                <td className="px-4 py-3">
                  {t._paymentStatus === 'overdue' ? (
                    <span className="badge text-danger bg-red-50"><AlertTriangle className="w-3 h-3 mr-1" /> Überfällig</span>
                  ) : (
                    <span className="badge text-success bg-green-50"><CheckCircle className="w-3 h-3 mr-1" /> Aktuell</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/communications?tenantId=${t.id}`) }} className="text-text-muted hover:text-primary" title="Nachricht senden">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <a href={`mailto:${t.email}`} onClick={e => e.stopPropagation()} className="text-text-muted hover:text-primary"><Mail className="w-4 h-4" /></a>
                    {t.phone && <a href={`tel:${t.phone}`} onClick={e => e.stopPropagation()} className="text-text-muted hover:text-primary"><Phone className="w-4 h-4" /></a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Neuer Mieter</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Vorname *</label>
                <input className="input-field" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Max" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nachname *</label>
                <input className="input-field" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Mustermann" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">E-Mail *</label>
              <input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="max@beispiel.de" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefon</label>
                <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+49 171 ..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Beruf</label>
                <input className="input-field" value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="Ingenieur/in" />
              </div>
            </div>

            {units.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Einheit zuweisen (optional)</label>
                <select className="input-field" value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}>
                  <option value="">Keine Einheit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.propertyName} — {u.designation}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Abbrechen</button>
              <button onClick={handleCreate} disabled={!form.firstName || !form.lastName || !form.email || saving} className="btn-primary">
                {saving ? 'Wird erstellt...' : 'Mieter anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
