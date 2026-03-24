'use client'

import { useState } from 'react'
import {
  Wrench, Plus, Clock, CheckCircle, AlertTriangle, X,
  ChevronRight, Flame, Droplets, Zap, Home,
} from 'lucide-react'

const MOCK_TICKETS = [
  { id: '1', title: 'Heizung defekt', description: 'Heizung im Wohnzimmer wird nicht warm', category: 'heating', priority: 'high', status: 'in_progress', technician: 'Marco Rossi', created: '18.03.2026', updated: 'Techniker beauftragt' },
  { id: '2', title: 'Fenster undicht', description: 'Schlafzimmerfenster schließt nicht richtig', category: 'general', priority: 'low', status: 'open', technician: null, created: '20.03.2026', updated: 'Wird geprüft' },
  { id: '3', title: 'Wasserhahn tropft', description: 'Küchenwasserhahn tropft seit 3 Tagen', category: 'water', priority: 'medium', status: 'completed', technician: 'Klaus Bergmann', created: '10.03.2026', updated: 'Erledigt am 12.03.' },
]

const CATEGORIES = [
  { value: 'heating', label: 'Heizung', icon: Flame },
  { value: 'water', label: 'Wasser / Sanitär', icon: Droplets },
  { value: 'electrical', label: 'Elektrik', icon: Zap },
  { value: 'general', label: 'Allgemein', icon: Home },
]

export default function TenantTicketsPage() {
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets & Reparaturen</h1>
          <p className="text-muted-foreground text-sm mt-1">Probleme melden und Reparaturen verfolgen</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> Problem melden</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-700" /></div>
          <div><div className="text-xl font-bold">1</div><div className="text-xs text-muted-foreground">Offen</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-blue-700" /></div>
          <div><div className="text-xl font-bold">1</div><div className="text-xs text-muted-foreground">In Bearbeitung</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-700" /></div>
          <div><div className="text-xl font-bold">1</div><div className="text-xs text-muted-foreground">Erledigt</div></div>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_TICKETS.map(t => (
          <div key={t.id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{t.title}</h3>
                  <span className={`badge text-xs ${t.status === 'completed' ? 'text-success bg-green-50' : t.status === 'in_progress' ? 'text-primary bg-blue-50' : 'text-warning bg-amber-50'}`}>
                    {t.status === 'completed' ? 'Erledigt' : t.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                  </span>
                  <span className={`badge text-xs ${t.priority === 'high' ? 'text-destructive bg-red-50' : t.priority === 'medium' ? 'text-warning bg-amber-50' : 'text-muted-foreground bg-muted'}`}>
                    {t.priority === 'high' ? 'Hoch' : t.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Erstellt: {t.created}</span>
                  {t.technician && <span>Techniker: {t.technician}</span>}
                  <span>{t.updated}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Problem melden</h2>
              <button onClick={() => setShowNew(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors text-left">
                      <c.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input type="text" className="input-field text-sm" placeholder="z.B. Heizung defekt" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea className="input-field text-sm min-h-[80px]" placeholder="Was genau ist das Problem?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Foto (optional)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <p className="text-sm text-muted-foreground">Klicken oder Foto hierher ziehen</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNew(false)} className="btn-secondary">Abbrechen</button>
                <button className="btn-primary">Ticket erstellen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
