'use client'

import { MessageSquare, User } from 'lucide-react'
import TrafficLight from './TrafficLight'

interface VorgangCardProps {
  vorgang: {
    id: string
    referenceNumber: string
    title: string
    status: string
    priority: string
    subcategory?: string | null
    createdAt: string
    property: { name: string } | null
    unit: { designation: string } | null
    tenant: { firstName: string; lastName: string } | null
    owner: { firstName: string; lastName: string } | null
    category: { name: string; icon: string | null; color: string | null } | null
    assignedToUser: { firstName: string; lastName: string; avatar: string | null } | null
    _count?: { communications: number }
  }
  onClick?: () => void
}

const priorityBorder = {
  low: 'border-l-slate-300',
  medium: 'border-l-blue-400',
  high: 'border-l-amber-400',
  critical: 'border-l-red-500',
}

export default function VorgangCard({ vorgang, onClick }: VorgangCardProps) {
  const person = vorgang.tenant
    ? `${vorgang.tenant.firstName} ${vorgang.tenant.lastName}`
    : vorgang.owner
    ? `${vorgang.owner.firstName} ${vorgang.owner.lastName}`
    : null

  return (
    <div
      onClick={onClick}
      className={`glass-card p-4 cursor-pointer hover:ring-1 hover:ring-white/20 transition-all border-l-3 ${priorityBorder[vorgang.priority as keyof typeof priorityBorder] || 'border-l-slate-300'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TrafficLight createdAt={vorgang.createdAt} status={vorgang.status} size="sm" />
          <span className="text-xs text-white/40 font-mono">{vorgang.referenceNumber}</span>
        </div>
        {vorgang.category && (
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: (vorgang.category.color || '#64748b') + '20', color: vorgang.category.color || '#64748b' }}
          >
            {vorgang.category.name}
          </span>
        )}
      </div>

      <h4 className="text-sm font-medium text-white truncate mb-1">{vorgang.title}</h4>

      <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
        {vorgang.property && <span>{vorgang.property.name}</span>}
        {vorgang.unit && <span>· {vorgang.unit.designation}</span>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          {person && (
            <>
              <User className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{person}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(vorgang._count?.communications || 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <MessageSquare className="w-3 h-3" />
              {vorgang._count?.communications}
            </span>
          )}
          {vorgang.assignedToUser ? (
            <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] text-blue-300" title={`${vorgang.assignedToUser.firstName} ${vorgang.assignedToUser.lastName}`}>
              {vorgang.assignedToUser.firstName[0]}{vorgang.assignedToUser.lastName[0]}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center text-[10px] text-red-400" title="Nicht zugewiesen">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
