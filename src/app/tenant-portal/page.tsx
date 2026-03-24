'use client'

import { useEffect, useState } from 'react'
import {
  Home, MessageSquare, Wrench, FolderArchive, Wallet, Gauge,
  Zap, Droplets, Flame, CheckCircle, AlertTriangle, Clock,
  ArrowUpRight, Building2, FileText, User,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface TenantData {
  firstName: string
  lastName: string
  property: string
  unit: string
  rent: number
  utilityCost: number
  contractStart: string
  openTickets: number
  unreadMessages: number
}

export default function TenantPortalPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(u)
    } catch { /* empty */ }
  }, [])

  const name = user?.firstName || 'Mieter'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Willkommen, {name}!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.tenant?.property && `${user.tenant.property}`}
          {user?.tenant?.unit && ` · ${user.tenant.unit}`}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Nächste Zahlung</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(730)}</div>
          <div className="text-xs text-muted-foreground mt-1">Fällig am 01.04.2026</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Zahlungsstatus</span>
          </div>
          <div className="text-2xl font-bold text-success">Aktuell</div>
          <div className="text-xs text-muted-foreground mt-1">Keine Rückstände</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Offene Tickets</span>
          </div>
          <div className="text-2xl font-bold">1</div>
          <div className="text-xs text-muted-foreground mt-1">Heizung — In Bearbeitung</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Nachrichten</span>
          </div>
          <div className="text-2xl font-bold">2</div>
          <div className="text-xs text-muted-foreground mt-1">Ungelesene Nachrichten</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/tenant-portal/nachrichten" className="glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Nachrichten</div>
            <div className="text-xs text-muted-foreground">Mit Verwaltung chatten</div>
          </div>
        </a>
        <a href="/tenant-portal/tickets" className="glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="font-semibold text-sm">Reparatur melden</div>
            <div className="text-xs text-muted-foreground">Neues Ticket erstellen</div>
          </div>
        </a>
        <a href="/tenant-portal/dokumente" className="glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <FolderArchive className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <div className="font-semibold text-sm">Dokumente</div>
            <div className="text-xs text-muted-foreground">Vertrag, Abrechnung</div>
          </div>
        </a>
      </div>

      {/* Rent Breakdown */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Mietübersicht</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Kaltmiete</span><span className="font-medium">{formatCurrency(650)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Nebenkosten</span><span className="font-medium">{formatCurrency(80)}</span></div>
          <hr className="border-border/30" />
          <div className="flex justify-between text-base"><span className="font-semibold">Gesamtmiete</span><span className="font-bold text-primary">{formatCurrency(730)}</span></div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Letzte Aktivitäten</h3>
        <div className="space-y-3">
          {[
            { icon: MessageSquare, color: 'bg-primary/10 text-primary', text: 'Neue Nachricht von der Verwaltung', time: 'vor 2h' },
            { icon: Wrench, color: 'bg-amber-100 text-amber-700', text: 'Ticket "Heizung defekt" — Techniker beauftragt', time: 'vor 1 Tag' },
            { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: 'Mietzahlung März erfolgreich verbucht', time: 'vor 3 Tagen' },
            { icon: FileText, color: 'bg-blue-100 text-blue-700', text: 'BK-Abrechnung 2025 ist verfügbar', time: 'vor 5 Tagen' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{item.text}</div>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
