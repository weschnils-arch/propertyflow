'use client'

import { useEffect, useState } from 'react'
import {
  Wrench, MapPin, Clock, CheckCircle, AlertTriangle, Phone, Mail,
  Camera, Play, Pause, Navigation, User, Bell, FileText, ChevronRight
} from 'lucide-react'
import { formatCurrency, formatDate, getPriorityColor } from '@/lib/utils'

interface Ticket {
  id: string; title: string; description: string; category: string
  priority: string; status: string; costActual: number | null; createdAt: string
  property: { name: string; street: string; houseNumber: string; city: string }
  unit: { designation: string } | null
  tenant: { firstName: string; lastName: string; phone: string } | null
}

const statusLabels: Record<string, string> = { open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Erledigt' }
const priorityLabels: Record<string, string> = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch', critical: 'Kritisch' }

export default function TechnicianPortalPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [activeTab, setActiveTab] = useState('open')
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(d => {
      setTickets(d)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'open') return t.status === 'open'
    if (activeTab === 'progress') return t.status === 'in_progress'
    return t.status === 'completed'
  })

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in -mx-6 -mt-4">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Techniker-Portal</h1>
            <p className="text-white/80 text-sm">Marco Rossi - Heizungstechniker</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Bell className="w-5 h-5" /></button>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold">MR</div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 px-6">
        {[{ id: 'open', label: 'Offen', count: tickets.filter(t => t.status === 'open').length },
          { id: 'progress', label: 'In Bearbeitung', count: tickets.filter(t => t.status === 'in_progress').length },
          { id: 'done', label: 'Erledigt', count: tickets.filter(t => t.status === 'completed').length }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedTicket(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:bg-gray-200'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="px-6">
        {!selectedTicket ? (
          <div className="space-y-3">
            {filteredTickets.length === 0 && (
              <div className="glass-card p-8 text-center text-text-muted">Keine Aufträge in dieser Kategorie</div>
            )}
            {filteredTickets.map(t => (
              <div key={t.id} onClick={() => setSelectedTicket(t)} className="glass-card p-4 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${getPriorityColor(t.priority)}`}>{priorityLabels[t.priority]}</span>
                      <span className="text-xs text-text-muted">{formatDate(t.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{t.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-1">{t.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.property?.name}</span>
                      {t.unit && <span>{t.unit.designation}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setSelectedTicket(null)} className="btn-secondary text-sm">← Zurück zur Übersicht</button>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`badge ${getPriorityColor(selectedTicket.priority)}`}>{priorityLabels[selectedTicket.priority]}</span>
                <span className={`badge ${selectedTicket.status === 'open' ? 'text-blue-600 bg-blue-50' : selectedTicket.status === 'in_progress' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
                  {statusLabels[selectedTicket.status]}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2">{selectedTicket.title}</h2>
              <p className="text-text-secondary">{selectedTicket.description}</p>
            </div>

            {/* Location */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Standort</h3>
              <div className="text-sm space-y-1">
                <div>{selectedTicket.property?.name}</div>
                <div className="text-text-secondary">{selectedTicket.property?.street} {selectedTicket.property?.houseNumber}, {selectedTicket.property?.city}</div>
                {selectedTicket.unit && <div className="text-text-secondary">Einheit: {selectedTicket.unit.designation}</div>}
              </div>
              <button className="btn-secondary mt-3 text-sm"><Navigation className="w-4 h-4" /> Route planen</button>
            </div>

            {/* Contact */}
            {selectedTicket.tenant && (
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Mieter-Kontakt</h3>
                <div className="text-sm space-y-2">
                  <div className="font-medium">{selectedTicket.tenant.firstName} {selectedTicket.tenant.lastName}</div>
                  {selectedTicket.tenant.phone && (
                    <a href={`tel:${selectedTicket.tenant.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                      <Phone className="w-4 h-4" /> {selectedTicket.tenant.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Zeiterfassung</h3>
              <div className="text-4xl font-mono font-bold text-center my-4">{formatTime(timerSeconds)}</div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setTimerRunning(!timerRunning)} className={timerRunning ? 'btn-secondary' : 'btn-primary'}>
                  {timerRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
                </button>
                {timerSeconds > 0 && <button onClick={() => { setTimerRunning(false); setTimerSeconds(0) }} className="btn-secondary">Zurücksetzen</button>}
              </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3">Aktionen</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary text-sm"><Camera className="w-4 h-4" /> Foto hochladen</button>
                <button className="btn-secondary text-sm"><FileText className="w-4 h-4" /> Material erfassen</button>
                <button className="btn-primary text-sm col-span-2"><CheckCircle className="w-4 h-4" /> Auftrag abschließen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
