'use client'

import { useState } from 'react'
import {
  Zap, Plus, Search, Play, Pause, Settings, Clock, Bell, Mail,
  Wrench, AlertTriangle, CheckCircle, ChevronRight, X, Trash2,
  ToggleLeft, ToggleRight, ArrowRight, Filter,
} from 'lucide-react'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  triggerLabel: string
  actions: string[]
  isActive: boolean
  lastRun: string | null
  runCount: number
}

const MOCK_RULES: AutomationRule[] = [
  { id: '1', name: 'Heizungs-Tickets auto-zuweisen', description: 'Alle Heizungs-Tickets automatisch an Rossi Heiztechnik zuweisen', trigger: 'ticket_created', triggerLabel: 'Ticket erstellt (Kategorie: Heizung)', actions: ['Techniker zuweisen: Marco Rossi', 'Benachrichtigung an Mieter senden'], isActive: true, lastRun: 'vor 2h', runCount: 47 },
  { id: '2', name: 'Zahlungserinnerung (7 Tage)', description: 'Automatische Erinnerung bei 7 Tagen überfälliger Miete', trigger: 'payment_overdue', triggerLabel: 'Zahlung überfällig > 7 Tage', actions: ['E-Mail: Zahlungserinnerung senden', 'Alert im Dashboard erstellen'], isActive: true, lastRun: 'vor 1 Tag', runCount: 156 },
  { id: '3', name: '1. Mahnung (21 Tage)', description: 'Automatische 1. Mahnung nach 21 Tagen Zahlungsverzug', trigger: 'payment_overdue', triggerLabel: 'Zahlung überfällig > 21 Tage', actions: ['Brief: 1. Mahnung generieren', 'Mahnstufe auf 1 setzen', 'Benachrichtigung an Verwalter'], isActive: true, lastRun: 'vor 3 Tagen', runCount: 34 },
  { id: '4', name: 'Kritische Tickets eskalieren', description: 'Tickets mit Priorität Kritisch nach 24h ohne Bearbeitung eskalieren', trigger: 'ticket_created', triggerLabel: 'Ticket offen > 24h (Priorität: Kritisch)', actions: ['Priorität erhöhen', 'Benachrichtigung an Admin', 'SMS an Notfall-Techniker'], isActive: true, lastRun: 'vor 5h', runCount: 8 },
  { id: '5', name: 'Versicherung Ablauf-Warnung', description: 'Warnung 90 Tage vor Ablauf der Gebäudeversicherung', trigger: 'schedule', triggerLabel: 'Versicherung läuft ab in < 90 Tage', actions: ['Alert: Versicherung läuft aus', 'E-Mail an Verwalter'], isActive: true, lastRun: 'vor 1 Woche', runCount: 5 },
  { id: '6', name: 'Verbrauchsanomalie erkennen', description: 'Alert bei Verbrauch > 150% des Durchschnitts', trigger: 'meter_anomaly', triggerLabel: 'Zählerstand > 150% Ø-Verbrauch', actions: ['Alert erstellen (Warnung)', 'Ticket erstellen: Verbrauch prüfen'], isActive: false, lastRun: null, runCount: 0 },
  { id: '7', name: 'Vertrag läuft aus', description: 'Benachrichtigung 3 Monate vor Vertragsende', trigger: 'schedule', triggerLabel: 'Vertragsende in < 90 Tage', actions: ['Alert erstellen', 'E-Mail an Verwalter', 'Aufgabe: Vertragsverlängerung prüfen'], isActive: true, lastRun: 'vor 2 Tagen', runCount: 12 },
]

const TRIGGER_OPTIONS = [
  { value: 'ticket_created', label: 'Ticket erstellt' },
  { value: 'payment_overdue', label: 'Zahlung überfällig' },
  { value: 'meter_anomaly', label: 'Verbrauchsanomalie' },
  { value: 'contract_expiring', label: 'Vertrag läuft aus' },
  { value: 'insurance_expiring', label: 'Versicherung läuft ab' },
  { value: 'schedule', label: 'Zeitplan (wiederkehrend)' },
]

const ACTION_OPTIONS = [
  'Techniker zuweisen',
  'Benachrichtigung senden',
  'E-Mail senden',
  'Brief/Mahnung generieren',
  'Ticket erstellen',
  'Alert erstellen',
  'Priorität ändern',
  'Status ändern',
  'Mahnstufe erhöhen',
]

export default function AutomationPage() {
  const [rules, setRules] = useState(MOCK_RULES)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const activeRules = rules.filter(r => r.isActive)
  const totalRuns = rules.reduce((s, r) => s + r.runCount, 0)

  const filtered = rules.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  )

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automatisierung</h1>
          <p className="text-muted-foreground text-sm mt-1">Regeln und Prozessketten verwalten</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Neue Regel</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Regeln gesamt</span></div>
          <div className="text-2xl font-bold">{rules.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Play className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Aktive Regeln</span></div>
          <div className="text-2xl font-bold text-success">{activeRules.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Ausführungen (gesamt)</span></div>
          <div className="text-2xl font-bold">{totalRuns}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Letzte Ausführung</span></div>
          <div className="text-2xl font-bold">vor 2h</div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Regeln suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filtered.map(rule => (
          <div key={rule.id} className={`glass-card p-5 ${!rule.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{rule.name}</h3>
                    {rule.isActive && <span className="w-2 h-2 rounded-full bg-success" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{rule.description}</p>

                  {/* Trigger → Actions Flow */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium">{rule.triggerLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    {rule.actions.map((action, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">{action}</span>
                    ))}
                  </div>

                  {rule.lastRun && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Letzte Ausführung: {rule.lastRun}</span>
                      <span>· {rule.runCount}x ausgeführt</span>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => toggleRule(rule.id)} className="p-1 flex-shrink-0" title={rule.isActive ? 'Deaktivieren' : 'Aktivieren'}>
                {rule.isActive ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Neue Automatisierungsregel</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name der Regel</label>
                <input type="text" className="input-field text-sm" placeholder="z.B. Heizungs-Tickets automatisch zuweisen" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea className="input-field text-sm min-h-[60px]" placeholder="Was macht diese Regel?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auslöser (Trigger)</label>
                <select className="input-field text-sm">
                  <option value="">Trigger wählen...</option>
                  {TRIGGER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bedingungen</label>
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field text-sm"><option>Kategorie</option><option>Heizung</option><option>Wasser</option><option>Elektrik</option></select>
                  <select className="input-field text-sm"><option>Priorität</option><option>Niedrig</option><option>Mittel</option><option>Hoch</option><option>Kritisch</option></select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aktionen</label>
                <div className="space-y-2">
                  {ACTION_OPTIONS.slice(0, 3).map(a => (
                    <div key={a} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                  <button className="text-xs text-primary hover:underline">+ Weitere Aktion hinzufügen</button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Abbrechen</button>
                <button className="btn-primary"><Zap className="w-4 h-4" /> Regel erstellen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
