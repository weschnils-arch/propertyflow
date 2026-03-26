'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import VorgangCard from './VorgangCard'

interface Vorgang {
  id: string
  referenceNumber: string
  title: string
  status: string
  priority: string
  subcategory: string | null
  createdAt: string
  trafficLight: string | null
  property: { name: string } | null
  unit: { designation: string } | null
  tenant: { firstName: string; lastName: string } | null
  owner: { firstName: string; lastName: string } | null
  category: { name: string; icon: string | null; color: string | null } | null
  assignedToUser: { firstName: string; lastName: string; avatar: string | null } | null
  _count?: { communications: number }
}

interface VorgaengeTabProps {
  entityType: 'property' | 'unit' | 'tenant'
  entityId: string
}

export default function VorgaengeTab({ entityType, entityId }: VorgaengeTabProps) {
  const router = useRouter()
  const [vorgaenge, setVorgaenge] = useState<Vorgang[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paramKey = entityType === 'property' ? 'propertyId' : entityType === 'unit' ? 'unitId' : 'tenantId'
    fetch(`/api/vorgaenge?${paramKey}=${entityId}&limit=50`)
      .then(r => r.json())
      .then(data => {
        setVorgaenge(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [entityType, entityId])

  if (loading) return <div className="text-center text-white/40 py-10">Lade Vorgänge...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{vorgaenge.length} Vorgang/Vorgänge</span>
        <button onClick={() => router.push('/vorgaenge')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
          <Plus className="w-3 h-3" /> Neuer Vorgang
        </button>
      </div>
      {vorgaenge.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-10">Keine Vorgänge</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {vorgaenge.map(v => (
            <VorgangCard key={v.id} vorgang={v} onClick={() => router.push(`/vorgaenge/${v.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
