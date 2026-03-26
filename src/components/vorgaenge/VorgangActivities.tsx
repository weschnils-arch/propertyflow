'use client'

import { useState } from 'react'
import { Plus, Calendar, Phone, FileSearch, Hammer } from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  scheduledAt: string | null
  completedAt: string | null
  createdAt: string
  createdBy: { firstName: string; lastName: string }
}

interface VorgangActivitiesProps {
  vorgangId: string
  activities: Activity[]
  onActivityAdded: () => void
}

const typeConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  termin: { label: 'Termin', icon: Calendar, color: 'text-blue-400' },
  gespraechsvermerk: { label: 'Gesprächsvermerk', icon: Phone, color: 'text-emerald-400' },
  angebotsanfrage: { label: 'Angebotsanfrage', icon: FileSearch, color: 'text-amber-400' },
  auftrag: { label: 'Auftrag', icon: Hammer, color: 'text-purple-400' },
}

export default function VorgangActivities({ vorgangId, activities, onActivityAdded }: VorgangActivitiesProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'termin', title: '', description: '', scheduledAt: '' })
  const [saving, setSaving] = useState(false)

  const userActivities = activities.filter(a => !['statuschange', 'assignment'].includes(a.type))

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)
    const res = await fetch(`/api/vorgaenge/${vorgangId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        description: form.description || null,
        scheduledAt: form.scheduledAt || null,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ type: 'termin', title: '', description: '', scheduledAt: '' })
      onActivityAdded()
    }
    setSaving(false)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Aktivitäten</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors">
          <Plus className="w-3 h-3" /> Hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-4 space-y-3">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
            {Object.entries(typeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
          <input type="text" placeholder="Titel *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none" />
          <textarea placeholder="Beschreibung" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none resize-none" />
          {form.type === 'termin' && (
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-white/50">Abbrechen</button>
            <button onClick={handleSave} disabled={!form.title || saving} className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white disabled:opacity-40">Speichern</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {userActivities.length === 0 && <div className="text-center text-white/30 text-sm py-6">Keine Aktivitäten</div>}
        {userActivities.map(a => {
          const cfg = typeConfig[a.type] || { label: a.type, icon: Calendar, color: 'text-white/40' }
          const Icon = cfg.icon
          return (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <Icon className={`w-4 h-4 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50">{cfg.label}</span>
                  <span className="text-xs text-white/30">{formatDate(a.createdAt)}</span>
                </div>
                <div className="text-sm text-white mt-1">{a.title}</div>
                {a.description && <div className="text-xs text-white/50 mt-0.5">{a.description}</div>}
                {a.scheduledAt && <div className="text-xs text-blue-300 mt-1">Termin: {formatDate(a.scheduledAt)}</div>}
                <div className="text-[10px] text-white/30 mt-1">{a.createdBy.firstName} {a.createdBy.lastName}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
