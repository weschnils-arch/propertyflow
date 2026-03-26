'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List, FolderKanban } from 'lucide-react'
import VorgangCard from '@/components/vorgaenge/VorgangCard'
import VorgangStats from '@/components/vorgaenge/VorgangStats'
import VorgangFilters from '@/components/vorgaenge/VorgangFilters'

interface Vorgang {
  id: string
  referenceNumber: string
  title: string
  status: string
  priority: string
  subcategory: string | null
  createdAt: string
  trafficLight: string | null
  property: { name: string } | null
  unit: { designation: string } | null
  tenant: { firstName: string; lastName: string } | null
  owner: { firstName: string; lastName: string } | null
  category: { name: string; icon: string | null; color: string | null } | null
  assignedToUser: { firstName: string; lastName: string; avatar: string | null } | null
  _count?: { communications: number }
}

interface FiltersState {
  propertyId: string
  categoryId: string
  status: string
  trafficLight: string
  search: string
}

const STATUS_COLUMNS = [
  { key: 'open', label: 'Offen', color: 'border-blue-500/50' },
  { key: 'in_progress', label: 'In Bearbeitung', color: 'border-amber-500/50' },
  { key: 'waiting', label: 'Wartend', color: 'border-purple-500/50' },
  { key: 'closed', label: 'Geschlossen', color: 'border-emerald-500/50' },
]

export default function VorgaengePage() {
  const router = useRouter()
  const [vorgaenge, setVorgaenge] = useState<Vorgang[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vorgaenge-view') as 'kanban' | 'list') || 'kanban'
    return 'kanban'
  })
  const [filters, setFilters] = useState<FiltersState>({
    propertyId: '', categoryId: '', status: '', trafficLight: '', search: '',
  })
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', propertyId: '', categoryId: '', description: '', priority: 'medium' })
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const fetchVorgaenge = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' })
    if (filters.propertyId) params.set('propertyId', filters.propertyId)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.status) params.set('status', filters.status)
    if (filters.trafficLight) params.set('trafficLight', filters.trafficLight)
    if (filters.search) params.set('search', filters.search)

    const res = await fetch(`/api/vorgaenge?${params}`)
    const data = await res.json()
    setVorgaenge(data.data || [])
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchVorgaenge() }, [fetchVorgaenge])

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(setProperties).catch(() => {})
    fetch('/api/vorgang-categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  const toggleView = (mode: 'kanban' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('vorgaenge-view', mode)
  }

  const handleCreate = async () => {
    if (!createForm.title || !createForm.propertyId || !createForm.categoryId) return
    const res = await fetch('/api/vorgaenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    if (res.ok) {
      setShowCreate(false)
      setCreateForm({ title: '', propertyId: '', categoryId: '', description: '', priority: 'medium' })
      fetchVorgaenge()
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Vorgänge</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button onClick={() => toggleView('kanban')} className={`px-3 py-1.5 text-xs ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => toggleView('list')} className={`px-3 py-1.5 text-xs ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Neuer Vorgang
          </button>
        </div>
      </div>

      <VorgangStats />
      <VorgangFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="text-center text-white/40 py-20">Lade Vorgänge...</div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {STATUS_COLUMNS.map(col => {
            const colVorgaenge = vorgaenge.filter(v => v.status === col.key)
            return (
              <div key={col.key} className={`space-y-3 border-t-2 ${col.color} pt-3`}>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-white/70">{col.label}</span>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{colVorgaenge.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colVorgaenge.map(v => (
                    <VorgangCard key={v.id} vorgang={v} onClick={() => router.push(`/vorgaenge/${v.id}`)} />
                  ))}
                  {colVorgaenge.length === 0 && (
                    <div className="text-center text-white/20 text-xs py-10">Keine Vorgänge</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Referenz</th>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Kategorie</th>
                <th className="px-4 py-3">Immobilie</th>
                <th className="px-4 py-3">Zugewiesen</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vorgaenge.map(v => (
                <tr key={v.id} onClick={() => router.push(`/vorgaenge/${v.id}`)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-4 py-3"><span className={`inline-block w-2.5 h-2.5 rounded-full ${v.trafficLight === 'green' ? 'bg-emerald-500' : v.trafficLight === 'yellow' ? 'bg-amber-400' : v.trafficLight === 'red' ? 'bg-red-500' : 'bg-white/20'}`} /></td>
                  <td className="px-4 py-3 font-mono text-white/40 text-xs">{v.referenceNumber}</td>
                  <td className="px-4 py-3 text-white">{v.title}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (v.category?.color || '#64748b') + '20', color: v.category?.color || '#64748b' }}>{v.category?.name}</span></td>
                  <td className="px-4 py-3 text-white/60">{v.property?.name}{v.unit ? ` · ${v.unit.designation}` : ''}</td>
                  <td className="px-4 py-3 text-white/60">{v.assignedToUser ? `${v.assignedToUser.firstName} ${v.assignedToUser.lastName}` : <span className="text-red-400">—</span>}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'open' ? 'bg-blue-500/20 text-blue-300' : v.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300' : v.status === 'waiting' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{v.status === 'open' ? 'Offen' : v.status === 'in_progress' ? 'In Bearbeitung' : v.status === 'waiting' ? 'Wartend' : 'Geschlossen'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {vorgaenge.length === 0 && <div className="text-center text-white/30 py-10">Keine Vorgänge gefunden</div>}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">Neuer Vorgang</h2>
            <input type="text" placeholder="Titel *" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            <select value={createForm.propertyId} onChange={e => setCreateForm(f => ({ ...f, propertyId: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
              <option value="">Immobilie wählen *</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={createForm.categoryId} onChange={e => setCreateForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
              <option value="">Kategorie wählen *</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <textarea placeholder="Beschreibung" rows={3} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none resize-none" />
            <select value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Abbrechen</button>
              <button onClick={handleCreate} disabled={!createForm.title || !createForm.propertyId || !createForm.categoryId} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-40 transition-colors">Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
