'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import TrafficLight from '@/components/vorgaenge/TrafficLight'
import VorgangChat from '@/components/vorgaenge/VorgangChat'

interface VorgangDetail {
  id: string
  referenceNumber: string
  title: string
  status: string
  createdAt: string
  category: { name: string; color: string | null } | null
  communications: { id: string; message: string; type: string; direction: string; senderName: string | null; senderRole: string | null; isRead: boolean; createdAt: string; attachments: { id: string; fileName: string; fileSize: number }[] }[]
}

const STATUS_LABELS: Record<string, string> = { open: 'Offen', in_progress: 'In Bearbeitung', waiting: 'Wartend', closed: 'Geschlossen' }

export default function TenantVorgangDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vorgang, setVorgang] = useState<VorgangDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchVorgang = async () => {
    const res = await fetch(`/api/vorgaenge/${params.id}`)
    if (res.ok) setVorgang(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchVorgang() }, [params.id])

  if (loading) return <div className="text-center text-white/40 py-20">Lade...</div>
  if (!vorgang) return <div className="text-center text-white/40 py-20">Nicht gefunden</div>

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={() => router.push('/tenant-portal/vorgaenge')} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-center gap-3">
        <TrafficLight createdAt={vorgang.createdAt} status={vorgang.status} />
        <div>
          <h1 className="text-xl font-bold text-white">{vorgang.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-white/40">{vorgang.referenceNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${vorgang.status === 'closed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {STATUS_LABELS[vorgang.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-white/50">Nachrichten</div>
        <VorgangChat vorgangId={vorgang.id} messages={vorgang.communications} onMessageSent={fetchVorgang} readOnly={vorgang.status === 'closed'} />
      </div>
    </div>
  )
}
