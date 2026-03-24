'use client'

import {
  FolderArchive, Search, Plus, Upload, Filter, FileText, Image, File,
  Download, Eye, MoreVertical, Building2, Users, Calendar, Tag, X,
  FolderOpen, Lock, Clock, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'Alle', count: 847 },
  { id: 'contract', label: 'Verträge', count: 234 },
  { id: 'invoice', label: 'Rechnungen', count: 189 },
  { id: 'protocol', label: 'Protokolle', count: 67 },
  { id: 'insurance', label: 'Versicherung', count: 45 },
  { id: 'bk_abrechnung', label: 'BK-Abrechnungen', count: 156 },
  { id: 'correspondence', label: 'Korrespondenz', count: 98 },
  { id: 'photo', label: 'Fotos', count: 58 },
]

const MOCK_DOCS = [
  { id: '1', name: 'Mietvertrag_Mueller_Anna.pdf', category: 'contract', size: '245 KB', date: '15.03.2026', property: 'Residenz am Park', unit: 'Whg 3', tenant: 'Anna Müller', isArchived: false },
  { id: '2', name: 'BK_Abrechnung_2025_Residenz.pdf', category: 'bk_abrechnung', size: '1.2 MB', date: '01.03.2026', property: 'Residenz am Park', unit: '', tenant: '', isArchived: true },
  { id: '3', name: 'Rechnung_Rossi_Heizung_042.pdf', category: 'invoice', size: '89 KB', date: '12.03.2026', property: 'Haus Bergstraße', unit: '2.OG Links', tenant: '', isArchived: false },
  { id: '4', name: 'Protokoll_ETV_2026_Stadthaus.pdf', category: 'protocol', size: '567 KB', date: '15.03.2026', property: 'Stadthaus Süd', unit: '', tenant: '', isArchived: true },
  { id: '5', name: 'Gebaeudeversicherung_2026.pdf', category: 'insurance', size: '340 KB', date: '01.01.2026', property: 'Residenz am Park', unit: '', tenant: '', isArchived: true },
  { id: '6', name: 'Foto_Schimmel_Bad_Whg7.webp', category: 'photo', size: '2.1 MB', date: '18.03.2026', property: 'Residenz am Park', unit: 'Whg 7', tenant: 'Sophie Fischer', isArchived: false },
]

export default function DocumentsPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = MOCK_DOCS.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.property.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const catIcon = (cat: string) => {
    switch (cat) {
      case 'contract': return <FileText className="w-4 h-4 text-primary" />
      case 'invoice': return <File className="w-4 h-4 text-amber-600" />
      case 'protocol': return <FileText className="w-4 h-4 text-purple-600" />
      case 'insurance': return <Lock className="w-4 h-4 text-green-600" />
      case 'bk_abrechnung': return <FileText className="w-4 h-4 text-blue-600" />
      case 'photo': return <Image className="w-4 h-4 text-pink-600" />
      default: return <File className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dokumente</h1>
          <p className="text-muted-foreground text-sm mt-1">847 Dokumente im Archiv</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary"><Upload className="w-4 h-4" /> Hochladen</button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
            }`}>
            {cat.label}
            <span className={`text-[10px] ${activeCategory === cat.id ? 'opacity-80' : 'opacity-60'}`}>{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Dokumente suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Documents Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Dokument</th>
              <th className="text-left px-4 py-3">Immobilie</th>
              <th className="text-left px-4 py-3">Einheit / Mieter</th>
              <th className="text-left px-4 py-3">Datum</th>
              <th className="text-left px-4 py-3">Größe</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} className="table-row border-t border-border/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {catIcon(doc.category)}
                    <span className="text-sm font-medium truncate max-w-[250px]">{doc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.property}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.unit || doc.tenant || '—'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.date}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.size}</td>
                <td className="px-4 py-3">
                  {doc.isArchived ? (
                    <span className="badge text-green-600 bg-green-50"><Lock className="w-3 h-3 mr-1" /> Archiviert</span>
                  ) : (
                    <span className="badge text-muted-foreground bg-muted">Aktiv</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Dokument hochladen</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium">Dateien hierher ziehen oder klicken</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Bilder, Word — max. 10 MB</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select className="input-field text-sm">
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kontext</label>
                  <select className="input-field text-sm">
                    <option>Mietverwaltung</option>
                    <option>WEG</option>
                    <option>Allgemein</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verknüpfung</label>
                <select className="input-field text-sm">
                  <option value="">Immobilie / Einheit / Mieter wählen...</option>
                  <option>Residenz am Park</option>
                  <option>Residenz am Park — Whg 3 — Anna Müller</option>
                  <option>Haus Bergstraße</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowUpload(false)} className="btn-secondary">Abbrechen</button>
                <button className="btn-primary"><Upload className="w-4 h-4" /> Hochladen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
