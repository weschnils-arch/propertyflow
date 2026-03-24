'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, FileText, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LazyBarChart as BarChart, LazyLineChart as LineChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend } from '@/components/ui/lazy-recharts'

interface FinanceData {
  portfolio: { totalRentMonthly: number; totalIncomeMonthly: number }
  finance: { income: number; expenses: number; profit: number; paymentRate: number; overduePayments: number; monthlyData: { month: string; income: number; expenses: number; profit: number }[] }
  recentPayments: Array<{ id: string; amount: number; status: string; paymentDate: string; tenant: { firstName: string; lastName: string } }>
}

export default function FinancesPage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading || !data) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finanzen</h1>
          <p className="text-text-secondary text-sm mt-1">Finanzübersicht und Abrechnungen</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
          <button className="btn-primary"><FileText className="w-4 h-4" /> Abrechnung erstellen</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-success" /><span className="text-sm text-text-secondary">Einnahmen</span></div>
          <div className="text-2xl font-bold text-success">{formatCurrency(data.finance.income)}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-danger" /><span className="text-sm text-text-secondary">Ausgaben</span></div>
          <div className="text-2xl font-bold text-danger">{formatCurrency(data.finance.expenses)}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-primary" /><span className="text-sm text-text-secondary">Gewinn</span></div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(data.finance.profit)}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-success" /><span className="text-sm text-text-secondary">Zahlungsquote</span></div>
          <div className="text-2xl font-bold">{data.finance.paymentRate}%</div>
          {data.finance.overduePayments > 0 && <div className="text-xs text-danger mt-1">{data.finance.overduePayments} überfällig</div>}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Einnahmen vs. Ausgaben (12 Monate)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.finance.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="income" name="Einnahmen" fill="#0066FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Ausgaben" fill="#FF3333" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Gewinn-Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.finance.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="profit" stroke="#00CC66" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Letzte Zahlungen</h3>
        <div className="space-y-2">
          {data.recentPayments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                  {p.tenant.firstName[0]}{p.tenant.lastName[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{p.tenant.firstName} {p.tenant.lastName}</div>
                  <div className="text-xs text-text-muted">{formatDate(p.paymentDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${p.status === 'completed' ? 'text-success bg-green-50' : p.status === 'overdue' ? 'text-danger bg-red-50' : 'text-warning bg-orange-50'}`}>
                  {p.status === 'completed' ? 'Bezahlt' : p.status === 'overdue' ? 'Überfällig' : 'Ausstehend'}
                </span>
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
