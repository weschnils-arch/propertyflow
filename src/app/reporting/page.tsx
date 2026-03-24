'use client'

import { useState } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Building2, Users, Wallet,
  Download, Calendar, Filter, AlertTriangle, CheckCircle, Home,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  LazyBarChart as BarChart, LazyLineChart as LineChart, LazyPieChart as PieChart,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Legend, Pie, Cell,
} from '@/components/ui/lazy-recharts'

const COLORS = ['var(--primary)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const PORTFOLIO_DATA = [
  { name: 'Residenz am Park', units: 8, yield: 9.2, vacancy: 0, rent: 6800, expenses: 1200 },
  { name: 'Haus Bergstraße', units: 12, yield: 7.8, vacancy: 8.3, rent: 9600, expenses: 2100 },
  { name: 'Wohnanlage Mitte', units: 10, yield: 8.5, vacancy: 0, rent: 8200, expenses: 1800 },
  { name: 'Stadthaus Süd', units: 6, yield: 6.2, vacancy: 16.7, rent: 4200, expenses: 1500 },
  { name: 'Parkhaus Nord', units: 9, yield: 8.1, vacancy: 0, rent: 7500, expenses: 1650 },
]

const MONTHLY_TREND = [
  { month: 'Okt', income: 285000, expenses: 48000, arrears: 12000 },
  { month: 'Nov', income: 290000, expenses: 52000, arrears: 15000 },
  { month: 'Dez', income: 287000, expenses: 61000, arrears: 11000 },
  { month: 'Jan', income: 292000, expenses: 55000, arrears: 18000 },
  { month: 'Feb', income: 295000, expenses: 49000, arrears: 14000 },
  { month: 'Mär', income: 298000, expenses: 47000, arrears: 16000 },
]

const EXPENSE_BREAKDOWN = [
  { name: 'Instandhaltung', value: 42 },
  { name: 'Versicherung', value: 18 },
  { name: 'Verwaltung', value: 22 },
  { name: 'Sonstiges', value: 18 },
]

export default function ReportingPage() {
  const [dateRange, setDateRange] = useState('year')
  const [activeTab, setActiveTab] = useState<'portfolio' | 'arrears' | 'maintenance'>('portfolio')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reporting</h1>
          <p className="text-muted-foreground text-sm mt-1">Portfolio-Analyse und Berichte</p>
        </div>
        <div className="flex gap-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="input-field text-sm w-auto">
            <option value="month">Diesen Monat</option>
            <option value="quarter">Dieses Quartal</option>
            <option value="year">Dieses Jahr</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
          <button className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Immobilien</span></div>
          <div className="text-2xl font-bold">200</div>
          <div className="text-xs text-success flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+3 seit Jan</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Monatseinnahmen</span></div>
          <div className="text-2xl font-bold">{formatCurrency(298000)}</div>
          <div className="text-xs text-success flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+4.6%</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Ø Rendite</span></div>
          <div className="text-2xl font-bold">8.1%</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Home className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Leerstand</span></div>
          <div className="text-2xl font-bold">5.8%</div>
          <div className="text-xs text-destructive flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />+0.3%</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Rückstände</span></div>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(16000)}</div>
          <div className="text-xs text-muted-foreground">12 Mieter</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border/50">
        {[
          { id: 'portfolio' as const, label: 'Portfolio-Analyse' },
          { id: 'arrears' as const, label: 'Rückstände' },
          { id: 'maintenance' as const, label: 'Instandhaltungskosten' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="font-semibold mb-4">Einnahmen & Ausgaben Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={MONTHLY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="income" name="Einnahmen" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Kostenverteilung</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={EXPENSE_BREAKDOWN} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {EXPENSE_BREAKDOWN.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {EXPENSE_BREAKDOWN.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Property Comparison Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <h3 className="font-semibold">Property-Vergleich (Top 5)</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Immobilie</th>
                  <th className="text-left px-4 py-3">Einheiten</th>
                  <th className="text-left px-4 py-3">Rendite</th>
                  <th className="text-left px-4 py-3">Leerstand</th>
                  <th className="text-left px-4 py-3">Monatsmiete</th>
                  <th className="text-left px-4 py-3">Kosten</th>
                  <th className="text-left px-4 py-3">Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_DATA.map(p => (
                  <tr key={p.name} className="table-row border-t border-border/30">
                    <td className="px-4 py-3 font-medium text-sm">{p.name}</td>
                    <td className="px-4 py-3 text-sm">{p.units}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${p.yield >= 8 ? 'text-success' : p.yield >= 6 ? 'text-warning' : 'text-destructive'}`}>{p.yield}%</span></td>
                    <td className="px-4 py-3"><span className={`badge ${p.vacancy === 0 ? 'text-success bg-green-50' : p.vacancy > 10 ? 'text-destructive bg-red-50' : 'text-warning bg-amber-50'}`}>{p.vacancy}%</span></td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(p.rent)}</td>
                    <td className="px-4 py-3 text-sm text-destructive">{formatCurrency(p.expenses)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-success">{formatCurrency(p.rent - p.expenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'arrears' && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Rückstände nach Mieter</h3>
          <div className="space-y-3">
            {[
              { name: 'Thomas Schmidt', property: 'Haus Bergstraße', amount: 2400, days: 45, level: 2 },
              { name: 'Elif Yilmaz', property: 'Wohnanlage Mitte', amount: 1850, days: 38, level: 2 },
              { name: 'Peter Klein', property: 'Stadthaus Süd', amount: 1200, days: 21, level: 1 },
              { name: 'Fatima Hassan', property: 'Residenz am Park', amount: 950, days: 14, level: 1 },
              { name: 'Wolfgang Braun', property: 'Parkhaus Nord', amount: 850, days: 10, level: 1 },
            ].map(t => (
              <div key={t.name} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-sm font-semibold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.property} · {t.days} Tage überfällig</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${t.level >= 2 ? 'text-destructive bg-red-50' : 'text-warning bg-amber-50'}`}>
                    Mahnstufe {t.level}
                  </span>
                  <span className="font-bold text-destructive">{formatCurrency(t.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Instandhaltungskosten je Immobilie (letztes Jahr)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={PORTFOLIO_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => `${formatCurrency(v)}`} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="expenses" name="Kosten" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
