'use client'

import { ArrowRight, UserCheck } from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
  createdBy: { firstName: string; lastName: string }
}

interface VorgangHistoryProps {
  activities: Activity[]
}

export default function VorgangHistory({ activities }: VorgangHistoryProps) {
  const historyItems = activities.filter(a => ['statuschange', 'assignment'].includes(a.type))

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-white/70 mb-4">Verlauf</h3>
      <div className="space-y-1">
        {historyItems.length === 0 && <div className="text-center text-white/30 text-sm py-6">Kein Verlauf</div>}
        {historyItems.map(a => (
          <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            {a.type === 'statuschange' ? (
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white">{a.title}</span>
              {a.description && <span className="text-xs text-white/40 ml-2">— {a.description}</span>}
            </div>
            <div className="text-xs text-white/30 shrink-0">{a.createdBy.firstName} {a.createdBy.lastName}</div>
            <div className="text-xs text-white/20 shrink-0">{formatDate(a.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
