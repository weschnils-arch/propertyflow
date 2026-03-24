'use client'

import { useState } from 'react'
import { LifeBuoy, Send, ChevronDown, Paperclip } from 'lucide-react'

const CATEGORIES = ['Bug', 'Frage', 'Zugang', 'Abrechnung', 'Performance', 'Sonstiges']
const URGENCIES = [
  { value: 'niedrig', label: 'Niedrig', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'mittel', label: 'Mittel', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'hoch', label: 'Hoch', color: 'bg-orange-500/10 text-orange-400' },
  { value: 'kritisch', label: 'Kritisch', color: 'bg-red-500/10 text-red-400' },
]

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('mittel')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: POST to /api/support-tickets
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSubject('')
      setCategory('')
      setUrgency('mittel')
      setDescription('')
    }, 3000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <LifeBuoy className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support-Ticket</h1>
          <p className="text-sm text-muted-foreground">Problem melden oder Hilfe anfordern</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Betreff</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Kurze Zusammenfassung des Problems"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kategorie</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required
              >
                <option value="">Auswählen...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Dringlichkeit</label>
            <div className="flex gap-2">
              {URGENCIES.map(u => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    urgency === u.value
                      ? u.color + ' ring-1 ring-current'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Beschreibung</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Beschreiben Sie das Problem so genau wie möglich. Was haben Sie erwartet? Was ist stattdessen passiert?"
            rows={6}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitted}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitted ? (
              <>Gesendet ✓</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ticket erstellen
              </>
            )}
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Screenshot anhängen
          </button>
        </div>
      </form>
    </div>
  )
}
