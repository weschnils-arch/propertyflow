'use client'

import { Bell, Search, User, LogOut, Settings, HelpCircle, Building2, Users, Wrench, Cpu, X } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/apple-liquid-glass-switcher'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  type: 'property' | 'tenant' | 'ticket' | 'sensor'
  id: string; title: string; subtitle: string; href: string
}

const typeIcons: Record<string, React.ElementType> = { property: Building2, tenant: Users, ticket: Wrench, sensor: Cpu }
const typeLabels: Record<string, string> = { property: 'Property', tenant: 'Mieter', ticket: 'Ticket', sensor: 'Sensor' }
const typeColors: Record<string, string> = { property: 'text-primary bg-blue-50', tenant: 'text-green-600 bg-green-50', ticket: 'text-orange-600 bg-orange-50', sensor: 'text-purple-600 bg-purple-50' }

export default function TopBar() {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.trim().length < 2) { setResults([]); setShowResults(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setResults(data)
        setShowResults(true)
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleResultClick(href: string) {
    setShowResults(false)
    setSearchQuery('')
    router.push(href)
  }

  return (
    <header className="glass-topbar sticky top-0 z-30 h-16 flex items-center justify-between px-6">
      <div ref={searchRef} className="flex items-center gap-4 flex-1 max-w-xl relative">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Suche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true) }}
            className="input-field pl-10 pr-8 w-full"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setResults([]); setShowResults(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-[400px] overflow-y-auto animate-slide-in shadow-lg">
            {searching && <div className="p-4 text-center text-text-muted text-sm">Suche...</div>}
            {!searching && results.length === 0 && searchQuery.length >= 2 && (
              <div className="p-4 text-center text-text-muted text-sm">Keine Ergebnisse für &quot;{searchQuery}&quot;</div>
            )}
            {!searching && results.length > 0 && results.map(r => {
              const Icon = typeIcons[r.type]
              return (
                <button key={`${r.type}-${r.id}`} onClick={() => handleResultClick(r.href)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors text-left">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[r.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-text-muted truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-xs text-text-muted bg-surface-secondary px-2 py-0.5 rounded flex-shrink-0">{typeLabels[r.type]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <button className="relative p-2 rounded-lg hover:bg-black/5 transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:block">Admin</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 z-50 animate-slide-in">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-black/5 transition-colors">
                  <User className="w-4 h-4" /> Profil
                </button>
                <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-black/5 transition-colors">
                  <Settings className="w-4 h-4" /> Einstellungen
                </Link>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-black/5 transition-colors">
                  <HelpCircle className="w-4 h-4" /> Hilfe
                </button>
                <hr className="my-1 border-black/5" />
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    localStorage.removeItem('user')
                    window.location.href = '/login'
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Abmelden
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
