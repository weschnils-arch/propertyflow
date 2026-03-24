'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Building2, Users, Home, Wrench, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, Cpu, Bell, Zap,
  Droplets, Flame, Plus, FileText, Download, Activity,
  CircleDot, Wallet, CreditCard, Shield, MessageSquare
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'

interface DashboardData {
  portfolio: {
    properties: number; units: number; tenants: number; technicians: number
    vacantUnits: number; vacancyRate: number; totalRentMonthly: number
    totalIncomeMonthly: number; avgYield: number
  }
  finance: {
    income: number; expenses: number; profit: number; paymentRate: number
    overduePayments: number; monthlyData: { month: string; income: number; expenses: number; profit: number }[]
  }
  tickets: {
    open: number; inProgress: number; completed: number; avgResolutionHours: number
    recent: Array<{ id: string; title: string; priority: string; status: string; property: { name: string }; createdAt: string }>
  }
  sensors: { total: number; active: number; warning: number; offline: number; lastSync: string }
  alerts: Array<{ id: string; type: string; severity: string; title: string; message: string; isRead: boolean; createdAt: string }>
  recentPayments: Array<{ id: string; amount: number; status: string; paymentDate: string; tenant: { firstName: string; lastName: string } }>
}

interface ActivityItem {
  id: string; type: 'ticket' | 'payment' | 'alert'
  title: string; description: string; timestamp: string
  severity?: string; status?: string
}

const COLORS = ['#0066FF', '#00CC66', '#FF9900', '#FF3333']

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [dashRes, actRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/activity'),
      ])
      const json = await dashRes.json()
      if (json && json.portfolio) {
        setData(json)
      } else {
        setData(null)
      }
      try {
        const acts = await actRes.json()
        if (Array.isArray(acts)) setActivities(acts)
      } catch { /* ok */ }
    } catch { /* empty db, show seed button */ }
    setLoading(false)
  }

  async function seedData() {
    setSeeding(true)
    await fetch('/api/seed', { method: 'POST' })
    await fetchData()
    setSeeding(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-secondary text-sm">Lade Dashboard...</p>
      </div>
    </div>
  )

  if (!data || data.portfolio.properties === 0) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="glass-card p-10 text-center max-w-md">
        <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Willkommen bei PropertyFlow</h2>
        <p className="text-text-secondary mb-6">
          Das System ist noch leer. Klicke auf den Button, um realistische Demo-Daten zu laden.
        </p>
        <button onClick={seedData} disabled={seeding} className="btn-primary text-base px-8 py-3">
          {seeding ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Daten werden geladen...</>
          ) : (
            <><Plus className="w-5 h-5" /> Demo-Daten laden</>
          )}
        </button>
      </div>
    </div>
  )

  const pieData = [
    { name: 'Vermietet', value: data.portfolio.units - data.portfolio.vacantUnits },
    { name: 'Leerstand', value: data.portfolio.vacantUnits },
  ]

  const ticketPieData = [
    { name: 'Offen', value: data.tickets.open },
    { name: 'In Bearbeitung', value: data.tickets.inProgress },
    { name: 'Erledigt', value: data.tickets.completed },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Willkommen zurück, Hendrik. Hier ist dein Portfolio-Überblick.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finances" className="btn-secondary"><Download className="w-4 h-4" /> Bericht</Link>
          <Link href="/maintenance" className="btn-primary"><Plus className="w-4 h-4" /> Neues Ticket</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard icon={Building2} label="Immobilien" value={data.portfolio.properties} color="text-primary" />
        <KPICard icon={Home} label="Einheiten" value={data.portfolio.units} color="text-primary" />
        <KPICard icon={Users} label="Mieter" value={data.portfolio.tenants} color="text-primary" />
        <KPICard icon={Wallet} label="Monatsmiete" value={formatCurrency(data.portfolio.totalRentMonthly)} color="text-success" />
        <KPICard icon={TrendingUp} label="Rendite" value={`${data.portfolio.avgYield}%`} color="text-success" />
        <KPICard icon={Home} label="Leerstand" value={`${data.portfolio.vacancyRate}%`} color={data.portfolio.vacancyRate > 5 ? 'text-warning' : 'text-success'} />
      </div>

      {/* Finance + Tickets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Finance Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Finanzen (12 Monate)</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-primary" /> Einnahmen</span>
              <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-success" /> Gewinn</span>
              <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-danger" /> Ausgaben</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.finance.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="income" stroke="#0066FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#00CC66" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#FF3333" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Finance Summary */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-text-primary">Monatsübersicht</h3>
          <div className="space-y-3">
            <FinanceRow label="Einnahmen" value={data.finance.income} icon={TrendingUp} positive />
            <FinanceRow label="Ausgaben" value={data.finance.expenses} icon={TrendingDown} />
            <hr className="border-black/5" />
            <FinanceRow label="Gewinn" value={data.finance.profit} icon={Zap} positive highlight />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-surface-secondary">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Zahlungsquote</span>
              <span className="font-semibold">{data.finance.paymentRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${data.finance.paymentRate}%` }} />
            </div>
          </div>
          {data.finance.overduePayments > 0 && (
            <div className="p-3 rounded-lg bg-red-50 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" /> {data.finance.overduePayments} überfällige Zahlungen
            </div>
          )}
        </div>
      </div>

      {/* Tickets + Sensors + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-text-primary mb-4">Tickets</h3>
          <div className="flex items-center gap-4 mb-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={ticketPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                  {ticketPieData.map((_, i) => <Cell key={i} fill={['#FF3333', '#FF9900', '#00CC66'][i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> Offen: {data.tickets.open}</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> In Bearbeitung: {data.tickets.inProgress}</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Erledigt: {data.tickets.completed}</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.tickets.recent.slice(0, 3).map((t) => (
              <Link href="/maintenance" key={t.id} className="block p-2 rounded-lg bg-surface-secondary/50 text-sm hover:bg-surface-secondary transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{t.title}</span>
                  <span className={`badge ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                </div>
                <span className="text-text-muted text-xs">{t.property?.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sensor Status */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-text-primary mb-4">Sensoren</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SensorStatusBox icon={CheckCircle} label="Aktiv" value={data.sensors.active} color="text-success bg-green-50" />
            <SensorStatusBox icon={AlertTriangle} label="Warnung" value={data.sensors.warning} color="text-warning bg-orange-50" />
            <SensorStatusBox icon={Activity} label="Gesamt" value={data.sensors.total} color="text-primary bg-blue-50" />
            <SensorStatusBox icon={Cpu} label="Offline" value={data.sensors.offline} color="text-danger bg-red-50" />
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            Letzte Sync: {formatDateTime(data.sensors.lastSync)}
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Alerts</h3>
            <span className="badge text-danger bg-red-50">{data.alerts.filter(a => !a.isRead).length} neu</span>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {data.alerts.map((a) => (
              <Link href={a.type === 'payment' ? '/finances' : a.type === 'sensor_failure' ? '/smart-home' : a.type === 'anomaly' ? '/smart-home' : '/maintenance'} key={a.id} className={`block p-3 rounded-lg text-sm cursor-pointer hover:opacity-80 transition-opacity ${a.severity === 'critical' ? 'bg-red-50' : a.severity === 'warning' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <div className="font-medium text-text-primary">{a.title}</div>
                <div className="text-text-secondary text-xs mt-0.5">{a.message}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {activities.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-text-primary mb-4">Letzte Aktivitäten</h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {activities.slice(0, 10).map((a) => {
              const iconMap = { ticket: Wrench, payment: CreditCard, alert: Bell }
              const colorMap = {
                ticket: a.status === 'completed' ? 'bg-green-50 text-success' : a.status === 'open' ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-warning',
                payment: a.status === 'overdue' ? 'bg-red-50 text-danger' : 'bg-green-50 text-success',
                alert: a.severity === 'critical' ? 'bg-red-50 text-danger' : a.severity === 'warning' ? 'bg-orange-50 text-warning' : 'bg-blue-50 text-primary',
              }
              const Icon = iconMap[a.type]
              const color = colorMap[a.type]
              const timeAgo = getTimeAgo(a.timestamp)
              return (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-secondary/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{a.title}</span>
                      <span className="text-xs text-text-muted flex-shrink-0 ml-2">{timeAgo}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{a.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-text-primary mb-4">Schnellaktionen</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={Plus} label="Neues Ticket" color="bg-primary" href="/maintenance" />
          <QuickAction icon={Building2} label="Property hinzufügen" color="bg-success" href="/properties" />
          <QuickAction icon={FileText} label="Abrechnung erstellen" color="bg-warning" href="/finances" />
          <QuickAction icon={Download} label="Bericht exportieren" color="bg-gray-500" href="/finances" />
        </div>
      </div>
    </div>
  )
}

function KPICard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="text-xl font-bold text-text-primary">{value}</div>
    </div>
  )
}

function FinanceRow({ label, value, icon: Icon, positive, highlight }: { label: string; value: number; icon: React.ElementType; positive?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'text-lg font-bold' : ''}`}>
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon className={`w-4 h-4 ${positive ? 'text-success' : 'text-danger'}`} /> {label}
      </span>
      <span className={positive ? 'text-success font-semibold' : 'text-danger font-semibold'}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function SensorStatusBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-lg ${color} flex items-center gap-2`}>
      <Icon className="w-5 h-5" />
      <div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs opacity-75">{label}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, href }: { icon: React.ElementType; label: string; color: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary hover:bg-gray-100 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `vor ${days}T`
  return `vor ${Math.floor(days / 7)}W`
}
