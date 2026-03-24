'use client'

import { Settings, User, Bell, Shield, Cpu, Palette, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-text-secondary text-sm mt-1">Systemkonfiguration und Präferenzen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingsCard icon={User} title="Profil" description="Name, E-Mail, Passwort und Profilbild verwalten" />
        <SettingsCard icon={Bell} title="Benachrichtigungen" description="E-Mail-Benachrichtigungen und Push-Notifications konfigurieren" />
        <SettingsCard icon={Shield} title="Sicherheit" description="Zwei-Faktor-Authentifizierung und Sitzungsverwaltung" />
        <SettingsCard icon={Cpu} title="ioBroker-Integration" description="Sensordaten-Quellen und Synchronisierungsintervalle" />
        <SettingsCard icon={Palette} title="Design" description="Farbschema, Schriftgröße und Layout-Optionen" />
        <SettingsCard icon={Globe} title="Sprache & Region" description="Sprache, Zeitzone und Währungsformat" />
      </div>
    </div>
  )
}

function SettingsCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="glass-card p-6 cursor-pointer group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}
