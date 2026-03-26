'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Home, User, MessageSquare, ClipboardList, FileText, History, ChevronDown } from 'lucide-react'
import TrafficLight from '@/components/vorgaenge/TrafficLight'
import VorgangChat from '@/components/vorgaenge/VorgangChat'
import VorgangActivities from '@/components/vorgaenge/VorgangActivities'
import VorgangHistory from '@/components/vorgaenge/VorgangHistory'

interface VorgangDetail {
  id: string
  referenceNumber: string
  title: string
  description: string | null
  status: string
  priority: string
  subcategory: string | null
  createdAt: string
  updatedAt: string
  dueDate: string | null
  closedAt: string | null
  trafficLight: string | null
  property: { id: string; name: string; street: string; houseNumber: string; zipCode: string; city: string } | null
  unit: { id: string; designation: string; floor: number } | null
  tenant: { id: string; firstName: string; lastName: string; email: string; phone: string | null } | null
  owner: { id: string; firstName: string; lastName: string; email: string } | null
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null
  assignedToUser: { id: string; firstName: string; lastName: string; avatar: string | null; email: string } | null
  assignedToRole: { id: string; name: string; color: string | null } | null
  createdBy: { firstName: string; lastName: string } | null
  closedBy: { firstName: string; lastName: string } | null
  communications: { id: string; message: string; type: string; direction: string; senderName: string | null; senderRole: string | null; isRead: boolean; createdAt: string; attachments: { id: string; fileName: string; fileSize: number }[] }[]
  activities: { id: string; type: string; title: string; description: string | null; scheduledAt: string | null; completedAt: string | null; createdAt: string; createdBy: { id: string; firstName: string; lastName: string } }[]
  attachments: { id: string; fileName: string; fileSize: number; mimeType: string }[]
}

const STATUS_LABELS: Record<string, string> = { open: 'Offen', in_progress: 'In Bearbeitung', waiting: 'Wartend', closed: 'Geschlossen' }
const STATUS_OPTIONS = ['open', 'in_progress', 'waiting', 'closed']
const PRIORITY_LABELS: Record<string, string> = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch', critical: 'Kritisch' }

type Tab = 'chat' | 'activities' | 'documents' | 'history'

export default function VorgangDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vorgang, setVorgang] = useState<VorgangDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const fetchVorgang = async () => {
    const res = await fetch(`/api/vorgaenge/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setVorgang(data)
    }
    setLoading(false)
  }

  useEffect(() => { fetchVorgang() }, [params.id])

  const updateStatus = async (status: string) => {
    await fetch(`/api/vorgaenge/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setShowStatusMenu(false)
    fetchVorgang()
  }

  if (loading) return <div className="text-center text-white/40 py-20">Lade...</div>
  if (!vorgang) return <div className="text-center text-white/40 py-20">Vorgang nicht gefunden</div>

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare; count?: number }[] = [
    { key: 'chat', label: 'Kommunikation', icon: MessageSquare, count: vorgang.communications.length },
    { key: 'activities', label: 'Aktivitäten', icon: ClipboardList, count: vorgang.activities.filter(a => !['statuschange', 'assignment'].includes(a.type)).length },
    { key: 'documents', label: 'Dokumente', icon: FileText, count: vorgang.attachments.length },
    { key: 'history', label: 'Verlauf', icon: History },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.push('/vorgaenge')} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrafficLight createdAt={vorgang.createdAt} status={vorgang.status} />
          <div>
            <h1 className="text-xl font-bold text-white">{vorgang.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-white/40">{vorgang.referenceNumber}</span>
              {vorgang.category && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (vorgang.category.color || '#64748b') + '20', color: vorgang.category.color || '#64748b' }}>
                  {vorgang.category.name}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${vorgang.priority === 'critical' ? 'bg-red-500/20 text-red-300' : vorgang.priority === 'high' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/50'}`}>
                {PRIORITY_LABELS[vorgang.priority]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${vorgang.status === 'closed' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-blue-600/20 text-blue-300'}`}>
              {STATUS_LABELS[vorgang.status]} <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 glass-card p-1 rounded-lg z-10 min-w-[150px]">
                {STATUS_OPTIONS.filter(s => s !== vorgang.status).map(s => (
                  <button key={s} onClick={() => updateStatus(s)} className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded">
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Cards + Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Context */}
        <div className="col-span-3 space-y-3">
          {vorgang.property && (
            <div className="glass-card p-4 space-y-2 cursor-pointer hover:ring-1 hover:ring-white/10" onClick={() => router.push(`/properties/${vorgang.property!.id}`)}>
              <div className="flex items-center gap-2 text-xs text-white/50"><Building2 className="w-3.5 h-3.5" /> Immobilie</div>
              <div className="text-sm text-white font-medium">{vorgang.property.name}</div>
              <div className="text-xs text-white/40">{vorgang.property.street} {vorgang.property.houseNumber}, {vorgang.property.zipCode} {vorgang.property.city}</div>
            </div>
          )}
          {vorgang.unit && (
            <div className="glass-card p-4 space-y-1 cursor-pointer hover:ring-1 hover:ring-white/10" onClick={() => router.push(`/units/${vorgang.unit!.id}`)}>
              <div className="flex items-center gap-2 text-xs text-white/50"><Home className="w-3.5 h-3.5" /> Einheit</div>
              <div className="text-sm text-white font-medium">{vorgang.unit.designation}</div>
              <div className="text-xs text-white/40">{vorgang.unit.floor}. OG</div>
            </div>
          )}
          {(vorgang.tenant || vorgang.owner) && (
            <div className="glass-card p-4 space-y-1 cursor-pointer hover:ring-1 hover:ring-white/10" onClick={() => vorgang.tenant ? router.push(`/tenants/${vorgang.tenant.id}`) : null}>
              <div className="flex items-center gap-2 text-xs text-white/50"><User className="w-3.5 h-3.5" /> {vorgang.tenant ? 'Mieter' : 'Eigentümer'}</div>
              <div className="text-sm text-white font-medium">
                {vorgang.tenant ? `${vorgang.tenant.firstName} ${vorgang.tenant.lastName}` : `${vorgang.owner!.firstName} ${vorgang.owner!.lastName}`}
              </div>
              <div className="text-xs text-white/40">{vorgang.tenant?.email || vorgang.owner?.email}</div>
            </div>
          )}
          {vorgang.assignedToUser && (
            <div className="glass-card p-4 space-y-1">
              <div className="text-xs text-white/50">Zugewiesen an</div>
              <div className="text-sm text-white font-medium">{vorgang.assignedToUser.firstName} {vorgang.assignedToUser.lastName}</div>
              {vorgang.assignedToRole && <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50">{vorgang.assignedToRole.name}</span>}
            </div>
          )}
          {vorgang.description && (
            <div className="glass-card p-4">
              <div className="text-xs text-white/50 mb-1">Beschreibung</div>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{vorgang.description}</p>
            </div>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="col-span-9">
          <div className="glass-card overflow-hidden">
            <div className="flex border-b border-white/10">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${activeTab === tab.key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/50 hover:text-white/70'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && (
              <VorgangChat vorgangId={vorgang.id} messages={vorgang.communications} onMessageSent={fetchVorgang} />
            )}
            {activeTab === 'activities' && (
              <VorgangActivities vorgangId={vorgang.id} activities={vorgang.activities} onActivityAdded={fetchVorgang} />
            )}
            {activeTab === 'documents' && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-white/70 mb-3">Dokumente</h3>
                {vorgang.attachments.length === 0 ? (
                  <div className="text-center text-white/30 text-sm py-6">Keine Dokumente</div>
                ) : (
                  <div className="space-y-2">
                    {vorgang.attachments.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <FileText className="w-4 h-4 text-white/40" />
                        <div className="flex-1">
                          <div className="text-sm text-white">{a.fileName}</div>
                          <div className="text-xs text-white/40">{(a.fileSize / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && <VorgangHistory activities={vorgang.activities} />}
          </div>
        </div>
      </div>
    </div>
  )
}
