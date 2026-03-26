'use client'

import { useState } from 'react'
import { Flame, Droplets, Zap, DoorOpen, Square, Bug, ArrowUpDown, HelpCircle, ArrowLeft, ArrowRight, Check, Camera, X } from 'lucide-react'

interface MeldungWizardProps {
  onSubmit: (data: MeldungData) => Promise<void>
}

export interface MeldungData {
  subcategory: string
  location: string
  description: string
  photos: File[]
  priority: string
}

const CATEGORIES = [
  { key: 'heizung', label: 'Heizung', icon: Flame, color: 'text-red-400' },
  { key: 'wasser', label: 'Wasser', icon: Droplets, color: 'text-blue-400' },
  { key: 'elektrik', label: 'Elektrik', icon: Zap, color: 'text-amber-400' },
  { key: 'tuer_schloss', label: 'Tür / Schloss', icon: DoorOpen, color: 'text-purple-400' },
  { key: 'fenster', label: 'Fenster', icon: Square, color: 'text-cyan-400' },
  { key: 'schaedlinge', label: 'Schädlinge', icon: Bug, color: 'text-green-400' },
  { key: 'aufzug', label: 'Aufzug', icon: ArrowUpDown, color: 'text-indigo-400' },
  { key: 'sonstiges', label: 'Sonstiges', icon: HelpCircle, color: 'text-gray-400' },
]

const LOCATIONS = [
  'Meine Wohnung', 'Treppenhaus', 'Keller', 'Dachboden', 'Außenbereich', 'Garage / Stellplatz',
]

const PRIORITIES = [
  { key: 'low', label: 'Kann warten', desc: 'Kosmetisch, nicht dringend', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
  { key: 'medium', label: 'Sollte bald erledigt werden', desc: 'Funktionseinschränkung', color: 'border-amber-500 bg-amber-500/10 text-amber-300' },
  { key: 'high', label: 'Dringend', desc: 'Kein Warmwasser, Heizungsausfall, Wasserschaden', color: 'border-red-500 bg-red-500/10 text-red-300' },
]

export default function MeldungWizard({ onSubmit }: MeldungWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<MeldungData>({
    subcategory: '', location: 'Meine Wohnung', description: '', photos: [], priority: 'medium',
  })
  const [submitting, setSubmitting] = useState(false)

  const steps = ['Kategorie', 'Ort', 'Beschreibung', 'Fotos', 'Dringlichkeit', 'Zusammenfassung']

  const canNext = () => {
    if (step === 0) return !!data.subcategory
    if (step === 1) return !!data.location
    if (step === 2) return data.description.length >= 20
    if (step === 3) return true
    if (step === 4) return !!data.priority
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(data)
    setSubmitting(false)
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024).slice(0, 5 - data.photos.length)
    setData(d => ({ ...d, photos: [...d.photos, ...valid] }))
  }

  const removePhoto = (idx: number) => {
    setData(d => ({ ...d, photos: d.photos.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
          </div>
        ))}
      </div>
      <div className="text-sm text-white/50 text-center">Schritt {step + 1} von {steps.length}: {steps[step]}</div>

      {/* Step 0: Category */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setData(d => ({ ...d, subcategory: cat.key }))}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${data.subcategory === cat.key ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <cat.icon className={`w-6 h-6 ${cat.color}`} />
              <span className="text-sm text-white font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-2">
          {LOCATIONS.map(loc => (
            <button
              key={loc}
              onClick={() => setData(d => ({ ...d, location: loc }))}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${data.location === loc ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <span className="text-sm text-white">{loc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div className="space-y-2">
          <textarea
            value={data.description}
            onChange={e => setData(d => ({ ...d, description: e.target.value }))}
            placeholder="z.B. Die Heizung im Wohnzimmer wird nicht warm, obwohl der Thermostat auf 5 steht."
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
          />
          <div className={`text-xs ${data.description.length >= 20 ? 'text-white/30' : 'text-amber-400'}`}>
            {data.description.length}/20 Zeichen (Minimum)
          </div>
        </div>
      )}

      {/* Step 3: Photos */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {data.photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {data.photos.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                <Camera className="w-6 h-6 text-white/30 mb-1" />
                <span className="text-xs text-white/30">Foto</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-white/30 text-center">Optional — max. 5 Fotos, je 10 MB</p>
        </div>
      )}

      {/* Step 4: Urgency */}
      {step === 4 && (
        <div className="space-y-3">
          {PRIORITIES.map(p => (
            <button
              key={p.key}
              onClick={() => setData(d => ({ ...d, priority: p.key }))}
              className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${data.priority === p.key ? p.color : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <div className="text-sm text-white font-medium">{p.label}</div>
              <div className="text-xs text-white/50 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 5: Summary */}
      {step === 5 && (
        <div className="space-y-3">
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between"><span className="text-xs text-white/50">Kategorie</span><span className="text-sm text-white">{CATEGORIES.find(c => c.key === data.subcategory)?.label}</span></div>
            <div className="flex justify-between"><span className="text-xs text-white/50">Ort</span><span className="text-sm text-white">{data.location}</span></div>
            <div><span className="text-xs text-white/50">Beschreibung</span><p className="text-sm text-white mt-1">{data.description}</p></div>
            <div className="flex justify-between"><span className="text-xs text-white/50">Fotos</span><span className="text-sm text-white">{data.photos.length} Foto(s)</span></div>
            <div className="flex justify-between"><span className="text-xs text-white/50">Dringlichkeit</span><span className="text-sm text-white">{PRIORITIES.find(p => p.key === data.priority)?.label}</span></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-40 transition-colors"
          >
            Weiter <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-40 transition-colors"
          >
            <Check className="w-4 h-4" /> {submitting ? 'Wird gesendet...' : 'Meldung absenden'}
          </button>
        )}
      </div>
    </div>
  )
}
