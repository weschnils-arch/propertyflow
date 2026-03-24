'use client'

import { Bell, User, LogOut, Settings } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/apple-liquid-glass-switcher'
import { useState, useEffect } from 'react'

export default function TenantTopBar() {
  const [showMenu, setShowMenu] = useState(false)
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; tenant?: { property?: string; unit?: string } } | null>(null)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(u)
    } catch { /* empty */ }
  }, [])

  return (
    <header className="glass-topbar sticky top-0 z-30 h-14 flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        {user?.tenant?.property && (
          <span>{user.tenant.property}{user.tenant.unit ? ` · ${user.tenant.unit}` : ''}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            {user?.firstName && (
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user.firstName} {user.lastName}
              </span>
            )}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 z-50 animate-slide-in">
                <a href="/tenant-portal/profil" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4" /> Profil bearbeiten
                </a>
                <hr className="my-1 border-border/30" />
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    localStorage.removeItem('user')
                    window.location.href = '/login'
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
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
