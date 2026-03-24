'use client'

import { useState } from 'react'
import {
  Shield, Users, Lock, Eye, FileText, Search, Clock, CheckCircle,
  AlertTriangle, ChevronRight, Settings, User, Building2, Download,
  Key, History, Trash2,
} from 'lucide-react'

const TABS = [
  { id: 'roles', label: 'Rollen & Rechte', icon: Key },
  { id: 'audit', label: 'Audit-Log', icon: History },
  { id: 'dsgvo', label: 'DSGVO', icon: Lock },
]

const ROLES = [
  { name: 'Super-Admin', users: 1, permissions: 'Vollzugriff auf alle Module', color: 'bg-red-100 text-red-700' },
  { name: 'Property Manager', users: 3, permissions: 'Verwaltung, Kommunikation, Finanzen, Tickets', color: 'bg-primary/10 text-primary' },
  { name: 'Buchhalter', users: 1, permissions: 'Finanzen, Reporting, BK-Abrechnung', color: 'bg-green-100 text-green-700' },
  { name: 'Eigentümer', users: 30, permissions: 'Eigentümer-Portal, Dokumente (eigene)', color: 'bg-amber-100 text-amber-700' },
  { name: 'Mieter', users: 1349, permissions: 'Mieter-Portal, eigene Tickets, Dokumente', color: 'bg-blue-100 text-blue-700' },
  { name: 'Techniker', users: 10, permissions: 'Techniker-Portal, zugewiesene Tickets', color: 'bg-purple-100 text-purple-700' },
]

const AUDIT_ENTRIES = [
  { time: '13:45', user: 'Hendrik Verwaltung', action: 'Ticket T-042 aktualisiert', entity: 'Ticket', detail: 'Status: open → in_progress' },
  { time: '13:32', user: 'Thomas Schmidt', action: 'Nachricht gesendet', entity: 'Kommunikation', detail: 'Kanal: Mieter' },
  { time: '12:15', user: 'System', action: 'Zahlungserinnerung versendet', entity: 'Automatisierung', detail: '12 Empfänger' },
  { time: '11:48', user: 'Hendrik Verwaltung', action: 'Dokument hochgeladen', entity: 'Dokument', detail: 'BK_Abrechnung_2025.pdf' },
  { time: '10:30', user: 'Marco Rossi', action: 'Ticket abgeschlossen', entity: 'Ticket', detail: 'T-038 — Kosten: 180€' },
  { time: '09:15', user: 'System', action: 'Meter-Ablesung importiert', entity: 'Messtechnik', detail: '4.066 Zähler synchronisiert' },
  { time: '08:00', user: 'System', action: 'Täglicher Backup erstellt', entity: 'System', detail: 'dev.db → backup_20260323.db' },
]

const DSGVO_REQUESTS = [
  { name: 'Anna Müller', type: 'Datenauskunft', status: 'in_progress', date: '18.03.2026' },
  { name: 'Peter Klein', type: 'Datenlöschung', status: 'pending', date: '20.03.2026' },
]

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState('roles')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governance</h1>
          <p className="text-muted-foreground text-sm mt-1">Rollen, Audit und DSGVO-Compliance</p>
        </div>
        <button className="btn-secondary"><Download className="w-4 h-4" /> Audit-Export</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Benutzer</span></div>
          <div className="text-2xl font-bold">1.394</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Key className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">Rollen</span></div>
          <div className="text-2xl font-bold">6</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><History className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Audit-Einträge (heute)</span></div>
          <div className="text-2xl font-bold">47</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1"><Lock className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">DSGVO-Anfragen</span></div>
          <div className="text-2xl font-bold">2</div>
          <div className="text-xs text-warning">1 offen</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && (
        <div className="space-y-3">
          {ROLES.map(role => (
            <div key={role.name} className="glass-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.color}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{role.name}</h3>
                  <p className="text-xs text-muted-foreground">{role.permissions}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{role.users} Benutzer</span>
                <button className="p-2 rounded-lg hover:bg-muted"><Settings className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Audit-Log durchsuchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Zeit</th>
                  <th className="text-left px-4 py-3">Benutzer</th>
                  <th className="text-left px-4 py-3">Aktion</th>
                  <th className="text-left px-4 py-3">Modul</th>
                  <th className="text-left px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_ENTRIES.map((entry, i) => (
                  <tr key={i} className="table-row border-t border-border/30">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{entry.time}</td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.user}</td>
                    <td className="px-4 py-3 text-sm">{entry.action}</td>
                    <td className="px-4 py-3"><span className="badge text-primary bg-primary/10 text-xs">{entry.entity}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dsgvo' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Offene DSGVO-Anfragen</h3>
            <div className="space-y-3">
              {DSGVO_REQUESTS.map((req, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                      {req.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{req.name}</div>
                      <div className="text-xs text-muted-foreground">{req.type} · Eingereicht am {req.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${req.status === 'pending' ? 'text-warning bg-amber-50' : 'text-primary bg-blue-50'}`}>
                      {req.status === 'pending' ? 'Ausstehend' : 'In Bearbeitung'}
                    </span>
                    <button className="btn-secondary text-xs">Bearbeiten</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-2">Einwilligungen</h3>
            <p className="text-xs text-muted-foreground mb-4">Übersicht der Datenverarbeitungs-Einwilligungen aller Mieter</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-green-50">
                <div className="text-2xl font-bold text-green-700">1.312</div>
                <div className="text-xs text-green-600">Datenverarbeitung ✓</div>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <div className="text-2xl font-bold text-green-700">987</div>
                <div className="text-xs text-green-600">E-Mail-Kommunikation ✓</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <div className="text-2xl font-bold text-amber-700">37</div>
                <div className="text-xs text-amber-600">Noch ausstehend</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <div className="text-2xl font-bold text-red-700">5</div>
                <div className="text-xs text-red-600">Widerrufen</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
