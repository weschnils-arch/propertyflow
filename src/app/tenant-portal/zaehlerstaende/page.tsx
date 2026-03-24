'use client'

import { Gauge, Zap, Droplets, Flame, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STROM = [
  { month: 'Okt', kWh: 185 }, { month: 'Nov', kWh: 210 }, { month: 'Dez', kWh: 240 },
  { month: 'Jan', kWh: 225 }, { month: 'Feb', kWh: 195 }, { month: 'Mär', kWh: 180 },
]
const WASSER = [
  { month: 'Okt', m3: 3.2 }, { month: 'Nov', m3: 2.9 }, { month: 'Dez', m3: 2.7 },
  { month: 'Jan', m3: 3.1 }, { month: 'Feb', m3: 3.0 }, { month: 'Mär', m3: 3.3 },
]
const HEIZUNG = [
  { month: 'Okt', kWh: 120 }, { month: 'Nov', kWh: 280 }, { month: 'Dez', kWh: 380 },
  { month: 'Jan', kWh: 410 }, { month: 'Feb', kWh: 320 }, { month: 'Mär', kWh: 180 },
]

export default function TenantZaehlerstaendePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Zählerstände</h1>
        <p className="text-muted-foreground text-sm mt-1">Ihre Verbrauchsdaten im Überblick</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-yellow-500" /><span className="text-xs text-muted-foreground">Strom (Mär)</span></div>
          <div className="text-xl font-bold">180 kWh</div>
          <div className="text-xs text-success flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> -8% vs. Vormonat</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Droplets className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Wasser (Mär)</span></div>
          <div className="text-xl font-bold">3.3 m³</div>
          <div className="text-xs text-warning flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +10% vs. Vormonat</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Flame className="w-4 h-4 text-orange-500" /><span className="text-xs text-muted-foreground">Heizung (Mär)</span></div>
          <div className="text-xl font-bold">180 kWh</div>
          <div className="text-xs text-success flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> -44% vs. Vormonat</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Stromverbrauch</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={STROM}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="kWh" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-500" /> Wasserverbrauch</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={WASSER}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="m3" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Heizverbrauch</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={HEIZUNG}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="kWh" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
