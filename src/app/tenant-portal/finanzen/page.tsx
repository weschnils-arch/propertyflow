'use client'

import { Wallet, CheckCircle, Clock, TrendingUp, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PAYMENTS = [
  { month: 'März 2026', amount: 730, status: 'pending', due: '01.04.2026' },
  { month: 'Februar 2026', amount: 730, status: 'paid', due: '01.03.2026' },
  { month: 'Januar 2026', amount: 730, status: 'paid', due: '01.02.2026' },
  { month: 'Dezember 2025', amount: 730, status: 'paid', due: '01.01.2026' },
  { month: 'November 2025', amount: 730, status: 'paid', due: '01.12.2025' },
  { month: 'Oktober 2025', amount: 730, status: 'paid', due: '01.11.2025' },
]

export default function TenantFinanzenPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Finanzen</h1>
        <p className="text-muted-foreground text-sm mt-1">Miete, Zahlungen und Abrechnungen</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Monatliche Miete</span></div>
          <div className="text-2xl font-bold">{formatCurrency(730)}</div>
          <div className="text-xs text-muted-foreground mt-1">Kaltmiete: {formatCurrency(650)} · NK: {formatCurrency(80)}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Status</span></div>
          <div className="text-2xl font-bold text-success">Aktuell</div>
          <div className="text-xs text-muted-foreground mt-1">Keine Rückstände</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Kaution</span></div>
          <div className="text-2xl font-bold">{formatCurrency(1950)}</div>
          <div className="text-xs text-muted-foreground mt-1">3 Monatsmieten hinterlegt</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Zahlungshistorie</h3>
          <button className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
        <div className="space-y-2">
          {PAYMENTS.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30">
              <div>
                <div className="font-medium text-sm">{p.month}</div>
                <div className="text-xs text-muted-foreground">Fällig: {p.due}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${p.status === 'paid' ? 'text-success bg-green-50' : 'text-warning bg-amber-50'}`}>
                  {p.status === 'paid' ? <><CheckCircle className="w-3 h-3 mr-1" /> Bezahlt</> : <><Clock className="w-3 h-3 mr-1" /> Ausstehend</>}
                </span>
                <span className="font-semibold text-sm">{formatCurrency(p.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
