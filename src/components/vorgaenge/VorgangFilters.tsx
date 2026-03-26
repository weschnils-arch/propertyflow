'use client'

import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'

interface Property { id: string; name: string }
interface Category { id: string; name: string; color: string | null }

interface FiltersState {
  propertyId: string
  categoryId: string
  status: string
  trafficLight: string
  search: string
}

interface VorgangFiltersProps {
  filters: FiltersState
  onChange: (filters: FiltersState) => void
}

export default function VorgangFilters({ filters, onChange }: VorgangFiltersProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(setProperties).catch(() => {})
    fetch('/api/vorgang-categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  const update = (key: keyof FiltersState, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Suchen..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <select
        value={filters.propertyId}
        onChange={e => update('propertyId', e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
      >
        <option value="">Alle Immobilien</option>
        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <select
        value={filters.categoryId}
        onChange={e => update('categoryId', e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
      >
        <option value="">Alle Kategorien</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select
        value={filters.status}
        onChange={e => update('status', e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
      >
        <option value="">Alle Status</option>
        <option value="open">Offen</option>
        <option value="in_progress">In Bearbeitung</option>
        <option value="waiting">Wartend</option>
        <option value="closed">Geschlossen</option>
      </select>

      <select
        value={filters.trafficLight}
        onChange={e => update('trafficLight', e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
      >
        <option value="">Alle Ampel</option>
        <option value="green">Grün (&lt;24h)</option>
        <option value="yellow">Gelb (&gt;24h)</option>
        <option value="red">Rot (&gt;48h)</option>
      </select>

      {(filters.propertyId || filters.categoryId || filters.status || filters.trafficLight || filters.search) && (
        <button
          onClick={() => onChange({ propertyId: '', categoryId: '', status: '', trafficLight: '', search: '' })}
          className="px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
