'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare, Wrench, FolderArchive, Wallet, Gauge, User,
  Home, ChevronLeft, ChevronRight, Building2, LogOut, Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const tenantNav = [
  { href: '/tenant-portal', label: 'Übersicht', icon: Home },
  { href: '/tenant-portal/nachrichten', label: 'Nachrichten', icon: MessageSquare },
  { href: '/tenant-portal/tickets', label: 'Tickets', icon: Wrench },
  { href: '/tenant-portal/dokumente', label: 'Dokumente', icon: FolderArchive },
  { href: '/tenant-portal/finanzen', label: 'Finanzen', icon: Wallet },
  { href: '/tenant-portal/profil', label: 'Profil', icon: User },
]

export default function TenantSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/communications')
        const data = await res.json()
        if (Array.isArray(data)) {
          setUnreadCount(data.reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount || 0), 0))
        }
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const switchToAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@automiq.de', password: 'test123' }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/dashboard')
      }
    } catch {}
  }

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
    } catch { /* empty */ }
  }, [])

  return (
    <aside
      className={cn(
        'glass-sidebar fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/30">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-foreground tracking-tight">PropertyFlow</span>
            <span className="block text-[10px] text-muted-foreground">Mieter-Portal</span>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && userName && (
        <div className="px-5 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{userName}</div>
              <div className="text-[10px] text-muted-foreground">Mieter</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tenantNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/tenant-portal' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', isActive && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.href === '/tenant-portal/nachrichten' && unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Portal switch + Logout + Collapse */}
      <div className="px-3 pb-3 space-y-1">
        {!collapsed && (
          <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Portale (Testing)
          </div>
        )}
        <button
          onClick={switchToAdmin}
          className="sidebar-link w-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          title={collapsed ? 'Vermieter-Portal' : undefined}
        >
          <Shield className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Vermieter-Portal</span>}
        </button>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            localStorage.removeItem('user')
            window.location.href = '/login'
          }}
          className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/5"
          title={collapsed ? 'Abmelden' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Abmelden</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  )
}
