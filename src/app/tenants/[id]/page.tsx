'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Phone, Briefcase, Building2, Calendar, CreditCard,
  FileText, Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp,
  ArrowLeft, MessageSquare, Droplets, Zap, Flame, Pencil, Save, X
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'
import { LazyBarChart as BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '@/components/ui/lazy-recharts'
import VorgaengeTab from '@/components/vorgaenge/VorgaengeTab'

interface TenantDetail {
  id: string; firstName: string; lastName: string; email: string
  phone: string; mobile: string | null; dateOfBirth: string | null
  occupation: string; employer: string | null; netIncome: number | null
  creditScore: number | null; notes: string | null; createdAt: string
  _activeContract: {
    id: string; startDate: string; endDate: string | null; monthlyRent: number
    utilityCost: number; deposit: number; status: string
    unit: {
      id: string; designation: string; floor: number; area: number; rooms: number
      property: { id: string; name: string; street: string; houseNumber: string; city: string }
      sensors: Array<{
        id: string; type: string; designation: string; status: string
        sensorData: Array<{ value: number; unit: string; timestamp: string }>
      }>
    }
  } | null
  _totalPaid: number; _overdueCount: number; _openTickets: number
  payments: Array<{ id: string; amount: number; paymentDate: string; dueDate: string; type: string; status: string; method: string }>
  tickets: Array<{ id: string; title: string; status: string; priority: string; category: string; createdAt: string; property: { name: string }; technician: { firstName: string; lastName: string } | null }>
  communications: Array<{ id: string; type: string; subject: string; message: string; direction: string; createdAt: string }>
  contracts: Array<{ id: string; startDate: string; endDate: string | null; monthlyRent: number; status: string; unit: { designation: string; property: { name: string } } }>
}

export default function TenantDetailPage() {
  const params = useParams()
  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', occupation: '', employer: '', netIncome: '', notes: '' })

  function startEdit() {
    if (!tenant) return
    setEditForm({
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone || '',
      occupation: tenant.occupation || '',
      employer: tenant.employer || '',
      netIncome: tenant.netIncome ? String(tenant.netIncome) : '',
      notes: tenant.notes || '',
    })
    setEditing(true)
  }

  async function handleSave() {
    if (!tenant) return
    setSaving(true)
    const res = await fetch(`/api/tenants/${tenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        netIncome: editForm.netIncome ? parseFloat(editForm.netIncome) : null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTenant(prev => prev ? { ...prev, ...updated } : prev)
      setEditing(false)
    }
    setSaving(false)
  }

  useEffect(() => {
    fetch(`/api/tenants/${params.id}`).then(r => r.json()).then(d => { setTenant(d); setLoading(false) })
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!tenant) return <div className="text-center py-20 text-text-secondary">Mieter nicht gefunden</div>

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'contract', label: 'Vertrag' },
    { id: 'payments', label: `Zahlungen (${tenant.payments.length})` },
    { id: 'consumption', label: 'Verbrauch' },
    { id: 'tickets', label: `Tickets (${tenant.tickets.length})` },
    { id: 'communication', label: 'Kommunikation' },
    { id: 'vorgaenge', label: 'Vorgänge' },
  ]

  const paymentChartData = tenant.payments.slice(0, 12).reverse().map(p => ({
    month: formatDate(p.paymentDate).slice(3, 10),
    amount: p.amount,
    status: p.status,
  }))

  const consumptionSensors = tenant._activeContract?.unit.sensors.filter(s =>
    ['electricity', 'water', 'heat'].includes(s.type)
  ) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tenants" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Mieter
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold flex-shrink-0">
            {tenant.firstName[0]}{tenant.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{tenant.firstName} {tenant.lastName}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
              {tenant.occupation && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {tenant.occupation}</span>}
              {tenant.employer && <span>bei {tenant.employer}</span>}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 text-text-secondary hover:text-primary"><Mail className="w-3.5 h-3.5" /> {tenant.email}</a>
              {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 text-text-secondary hover:text-primary"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</a>}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={startEdit} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Mieter bearbeiten">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            {tenant._overdueCount > 0 ? (
              <span className="badge text-danger bg-red-50 text-sm"><AlertTriangle className="w-3.5 h-3.5 mr-1" />{tenant._overdueCount} überfällig</span>
            ) : (
              <span className="badge text-success bg-green-50 text-sm"><CheckCircle className="w-3.5 h-3.5 mr-1" />Zahlung aktuell</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <StatBox icon={Building2} label="Wohnung" value={tenant._activeContract?.unit.designation || '–'} />
          <StatBox icon={CreditCard} label="Monatsmiete" value={tenant._activeContract ? formatCurrency(tenant._activeContract.monthlyRent + tenant._activeContract.utilityCost) : '–'} />
          <StatBox icon={TrendingUp} label="Gesamt bezahlt" value={formatCurrency(tenant._totalPaid)} />
          <StatBox icon={Wrench} label="Offene Tickets" value={tenant._openTickets} />
          <StatBox icon={Calendar} label="Vertragsbeginn" value={tenant._activeContract ? formatDate(tenant._activeContract.startDate) : '–'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/5 pb-0 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-primary bg-white border border-b-0 border-black/5' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Persönliche Daten</h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Geburtsdatum" value={tenant.dateOfBirth ? formatDate(tenant.dateOfBirth) : '–'} />
              <InfoRow label="Beruf" value={tenant.occupation || '–'} />
              <InfoRow label="Arbeitgeber" value={tenant.employer || '–'} />
              <InfoRow label="Nettoeinkommen" value={tenant.netIncome ? formatCurrency(tenant.netIncome) : '–'} />
              <InfoRow label="Kreditwürdigkeit" value={tenant.creditScore ? `${tenant.creditScore} / 850` : '–'} />
              <InfoRow label="Mieter seit" value={formatDate(tenant.createdAt)} />
              {tenant.notes && <div className="mt-3 p-3 rounded-lg bg-surface-secondary text-text-secondary">{tenant.notes}</div>}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Wohnsituation</h3>
            {tenant._activeContract ? (
              <div className="space-y-3 text-sm">
                <InfoRow label="Property" value={tenant._activeContract.unit.property.name} />
                <InfoRow label="Adresse" value={`${tenant._activeContract.unit.property.street} ${tenant._activeContract.unit.property.houseNumber}, ${tenant._activeContract.unit.property.city}`} />
                <InfoRow label="Wohnung" value={tenant._activeContract.unit.designation} />
                <InfoRow label="Fläche" value={`${tenant._activeContract.unit.area} m²`} />
                <InfoRow label="Zimmer" value={`${tenant._activeContract.unit.rooms}`} />
                <InfoRow label="Etage" value={`${tenant._activeContract.unit.floor}. OG`} />
                <InfoRow label="Kaltmiete" value={formatCurrency(tenant._activeContract.monthlyRent)} />
                <InfoRow label="Nebenkosten" value={formatCurrency(tenant._activeContract.utilityCost)} />
                <InfoRow label="Kaution" value={formatCurrency(tenant._activeContract.deposit)} />
              </div>
            ) : (
              <p className="text-text-muted">Kein aktiver Vertrag</p>
            )}
          </div>
        </div>
      )}

      {/* Contract Tab */}
      {activeTab === 'contract' && (
        <div className="space-y-4">
          {tenant.contracts.map(c => (
            <div key={c.id} className={`glass-card p-6 ${c.status === 'active' ? 'ring-2 ring-primary/20' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{c.unit.property.name} – {c.unit.designation}</h3>
                <span className={`badge ${getStatusColor(c.status)}`}>{c.status === 'active' ? 'Aktiv' : c.status === 'terminated' ? 'Gekündigt' : 'Abgelaufen'}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <InfoRow label="Vertragsbeginn" value={formatDate(c.startDate)} />
                <InfoRow label="Vertragsende" value={c.endDate ? formatDate(c.endDate) : 'Unbefristet'} />
                <InfoRow label="Monatsmiete" value={formatCurrency(c.monthlyRent)} />
                <InfoRow label="Laufzeit" value={`${Math.round((Date.now() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} Monate`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {paymentChartData.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Zahlungsverlauf</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#0066FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Datum</th>
                  <th className="text-left px-4 py-3">Fällig</th>
                  <th className="text-left px-4 py-3">Typ</th>
                  <th className="text-left px-4 py-3">Betrag</th>
                  <th className="text-left px-4 py-3">Methode</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenant.payments.map(p => (
                  <tr key={p.id} className="table-row border-t border-black/5">
                    <td className="px-4 py-3 text-sm">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-3 text-sm">{p.type === 'rent' ? 'Miete' : p.type === 'utility' ? 'Nebenkosten' : p.type}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{p.method === 'bank_transfer' ? 'Überweisung' : p.method || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusColor(p.status)}`}>
                        {p.status === 'completed' ? 'Bezahlt' : p.status === 'overdue' ? 'Überfällig' : p.status === 'pending' ? 'Ausstehend' : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumption Tab */}
      {activeTab === 'consumption' && (
        <div className="space-y-6">
          {consumptionSensors.length > 0 ? consumptionSensors.map(sensor => {
            const chartData = sensor.sensorData.slice(0, 20).reverse().map(d => ({
              date: formatDate(d.timestamp).slice(0, 5),
              value: d.value,
            }))
            const Icon = sensor.type === 'electricity' ? Zap : sensor.type === 'water' ? Droplets : Flame
            const color = sensor.type === 'electricity' ? '#EAB308' : sensor.type === 'water' ? '#3B82F6' : '#F97316'
            return (
              <div key={sensor.id} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5" style={{ color }} />
                  <h3 className="font-semibold">{sensor.designation}</h3>
                  <span className={`badge ${getStatusColor(sensor.status)}`}>{sensor.status}</span>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `${Number(v).toFixed(2)} ${sensor.sensorData[0]?.unit || ''}`} />
                      <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-text-muted text-sm">Keine Verbrauchsdaten vorhanden</p>
                )}
              </div>
            )
          }) : (
            <div className="glass-card p-10 text-center text-text-muted">Keine Sensordaten verfügbar</div>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Ticket</th>
                <th className="text-left px-4 py-3">Kategorie</th>
                <th className="text-left px-4 py-3">Priorität</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Techniker</th>
                <th className="text-left px-4 py-3">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {tenant.tickets.map(t => (
                <tr key={t.id} className="table-row border-t border-black/5">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-sm">{t.category}</td>
                  <td className="px-4 py-3"><span className={`badge ${getPriorityColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(t.status)}`}>{t.status === 'open' ? 'Offen' : t.status === 'in_progress' ? 'In Bearbeitung' : 'Erledigt'}</span></td>
                  <td className="px-4 py-3 text-sm">{t.technician ? `${t.technician.firstName} ${t.technician.lastName}` : '–'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
              {tenant.tickets.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Keine Tickets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === 'communication' && (
        <div className="space-y-3">
          {tenant.communications.length > 0 ? tenant.communications.map(c => (
            <div key={c.id} className={`glass-card p-4 border-l-3 ${c.direction === 'inbound' ? 'border-blue-500' : 'border-green-500'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-text-muted" />
                  <span className="font-medium text-sm">{c.subject || c.type}</span>
                  <span className={`badge text-xs ${c.direction === 'inbound' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}`}>
                    {c.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
                  </span>
                </div>
                <span className="text-xs text-text-muted">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-text-secondary">{c.message}</p>
            </div>
          )) : (
            <div className="glass-card p-10 text-center text-text-muted">Keine Kommunikation vorhanden</div>
          )}
        </div>
      )}

      {/* Vorgänge Tab */}
      {activeTab === 'vorgaenge' && (
        <VorgaengeTab entityType="tenant" entityId={tenant.id} />
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="glass-card w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Mieter bearbeiten</h2>
              <button onClick={() => setEditing(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Vorname</label>
                <input className="input-field" value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nachname</label>
                <input className="input-field" value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">E-Mail</label>
              <input className="input-field" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefon</label>
                <input className="input-field" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Beruf</label>
                <input className="input-field" value={editForm.occupation} onChange={e => setEditForm(f => ({ ...f, occupation: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Arbeitgeber</label>
                <input className="input-field" value={editForm.employer} onChange={e => setEditForm(f => ({ ...f, employer: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nettoeinkommen</label>
                <input className="input-field" type="number" value={editForm.netIncome} onChange={e => setEditForm(f => ({ ...f, netIncome: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notizen</label>
              <textarea className="input-field resize-none" rows={3} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditing(false)} className="btn-secondary">Abbrechen</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" /> {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg bg-surface-secondary/50 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
