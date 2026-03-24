'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Search, Plus, Mail, Phone, Building2, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency, getStatusColor } from '@/lib/utils'

interface TenantRow {
  id: string; firstName: string; lastName: string; email: string; phone: string
  occupation: string; creditScore: number
  _activeUnit: string | null; _propertyName: string | null
  _monthlyRent: number; _paymentStatus: string; _openTickets: number
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(d => { setTenants(d); setLoading(false) })
  }, [])

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
        <button className="btn-primary"><Plus className="w-4 h-4" /> Neuer Mieter</button>
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
                    <a href={`mailto:${t.email}`} className="text-text-muted hover:text-primary"><Mail className="w-4 h-4" /></a>
                    {t.phone && <a href={`tel:${t.phone}`} className="text-text-muted hover:text-primary"><Phone className="w-4 h-4" /></a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
