'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, AlertTriangle, UserX, CheckCircle2 } from 'lucide-react'

interface Stats {
  totalOpen: number
  overdue: number
  unassigned: number
  closedToday: number
}

export default function VorgangStats() {
  const [stats, setStats] = useState<Stats>({ totalOpen: 0, overdue: 0, unassigned: 0, closedToday: 0 })

  useEffect(() => {
    fetch('/api/vorgaenge/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const items = [
    { label: 'Offen', value: stats.totalOpen, icon: FolderOpen, color: 'text-blue-400' },
    { label: 'Überfällig', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Nicht zugewiesen', value: stats.unassigned, icon: UserX, color: 'text-amber-400' },
    { label: 'Heute geschlossen', value: stats.closedToday, icon: CheckCircle2, color: 'text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="glass-card p-4 flex items-center gap-3">
          <item.icon className={`w-5 h-5 ${item.color}`} />
          <div>
            <div className="text-2xl font-semibold text-white">{item.value}</div>
            <div className="text-xs text-white/50">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
