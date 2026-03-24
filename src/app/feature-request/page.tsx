'use client'

import { useState } from 'react'
import { Lightbulb, Send, ChevronDown } from 'lucide-react'

const CATEGORIES = ['UI/UX', 'Kommunikation', 'Finanzen', 'Wartung', 'Automatisierung', 'Reporting', 'Sonstiges']
const PRIORITIES = [
  { value: 'nice-to-have', label: 'Nice to have', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'should-have', label: 'Should have', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'must-have', label: 'Must have', color: 'bg-red-500/10 text-red-400' },
]

export default function FeatureRequestPage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('nice-to-have')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: POST to /api/feature-requests
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setTitle('')
      setCategory('')
      setPriority('nice-to-have')
      setDescription('')
    }, 3000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature anfragen</h1>
          <p className="text-sm text-muted-foreground">Neue Funktionen oder Verbesserungen vorschlagen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Titel</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Kurze Beschreibung der gewünschten Funktion"
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
            <label className="block text-sm font-medium text-foreground mb-1.5">Priorität</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    priority === p.value
                      ? p.color + ' ring-1 ring-current'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
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
            placeholder="Was soll die Funktion können? Warum ist sie wichtig? Wie stellen Sie sich die Umsetzung vor?"
            rows={6}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            required
          />
        </div>

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
              Feature anfragen
            </>
          )}
        </button>
      </form>
    </div>
  )
}
