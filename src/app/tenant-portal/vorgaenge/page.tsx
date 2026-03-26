'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderKanban, Plus } from 'lucide-react'
import TrafficLight from '@/components/vorgaenge/TrafficLight'

interface Vorgang {
  id: string
  referenceNumber: string
  title: string
  status: string
  priority: string
  createdAt: string
  trafficLight: string | null
  category: { name: string; color: string | null } | null
  _count?: { communications: number }
}

const STATUS_LABELS: Record<string, string> = { open: 'Offen', in_progress: 'In Bearbeitung', waiting: 'Wartend', closed: 'Geschlossen' }

export default function TenantVorgaengePage() {
  const router = useRouter()
  const [vorgaenge, setVorgaenge] = useState<Vorgang[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const tenantId = user.tenant?.id
    if (!tenantId) return

    fetch(`/api/vorgaenge?tenantId=${tenantId}&limit=100`)
      .then(r => r.json())
      .then(data => {
        setVorgaenge(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? vorgaenge : filter === 'open' ? vorgaenge.filter(v => v.status !== 'closed') : vorgaenge.filter(v => v.status === 'closed')

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Meine Vorgänge</h1>
        </div>
        <button onClick={() => router.push('/tenant-portal/meldung')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
          <Plus className="w-4 h-4" /> Neue Meldung
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
            {f === 'all' ? 'Alle' : f === 'open' ? 'Offen' : 'Geschlossen'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-20">Lade...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/30 py-20">Keine Vorgänge</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id} onClick={() => router.push(`/tenant-portal/vorgaenge/${v.id}`)} className="glass-card p-4 cursor-pointer hover:ring-1 hover:ring-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrafficLight createdAt={v.createdAt} status={v.status} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{v.title}</span>
                      {v.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (v.category.color || '#64748b') + '20', color: v.category.color || '#64748b' }}>
                          {v.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-white/30">{v.referenceNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${v.status === 'closed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {STATUS_LABELS[v.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/30">{new Date(v.createdAt).toLocaleDateString('de-DE')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
