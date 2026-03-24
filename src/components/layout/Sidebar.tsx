'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Wallet,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  HardHat,
  Hammer,
  MessageSquare,
  FolderArchive,
  BarChart3,
  Gauge,
  Zap,
  Shield,
  Lightbulb,
  LifeBuoy,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

// Pages that are fully implemented — everything else is greyed out
const ENABLED_PAGES = new Set([
  '/dashboard', '/communications', '/properties', '/tenants', '/technicians',
  '/maintenance', '/documents', '/reporting', '/automation', '/governance',
  '/settings', '/tenant-portal', '/technician-portal',
  '/feature-request', '/support',
])

const navSections = [
  {
    label: 'Übersicht',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { href: '/properties', label: 'Immobilien', icon: Building2 },
      { href: '/tenants', label: 'Mieter', icon: Users },
      { href: '/technicians', label: 'Techniker', icon: HardHat },
    ],
  },
  {
    label: 'Betrieb',
    items: [
      { href: '/communications', label: 'Kommunikation', icon: MessageSquare },
      { href: '/maintenance', label: 'Wartung', icon: Wrench },
      { href: '/finances', label: 'Finanzen', icon: Wallet },
      { href: '/documents', label: 'Dokumente', icon: FolderArchive },
      { href: '/metering', label: 'Messtechnik', icon: Gauge },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { href: '/reporting', label: 'Reporting', icon: BarChart3 },
      { href: '/automation', label: 'Automatisierung', icon: Zap },
      { href: '/smart-home', label: 'Smart Home', icon: Cpu },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/governance', label: 'Governance', icon: Shield },
      { href: '/settings', label: 'Einstellungen', icon: Settings },
    ],
  },
  {
    label: 'Portale (Testing)',
    items: [
      { href: '/tenant-portal', label: 'Mieter-Portal', icon: UserCircle },
      { href: '/technician-portal', label: 'Techniker-Portal', icon: Hammer },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
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
    const interval = setInterval(fetchUnread, 15000)
    // Listen for mark-as-read events from communications page
    const handleRead = () => fetchUnread()
    window.addEventListener('messages-read', handleRead)
    return () => { clearInterval(interval); window.removeEventListener('messages-read', handleRead) }
  }, [])

  const handlePortalLogin = async (email: string, redirectTo: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'test123' }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push(redirectTo)
      }
    } catch {}
  }

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'glass-sidebar fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[250px]'
      )}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-black/5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-text-primary tracking-tight">
            PropertyFlow
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isEnabled = ENABLED_PAGES.has(item.href)

                if (!isEnabled) {
                  return (
                    <div
                      key={item.href}
                      className="sidebar-link opacity-30 cursor-not-allowed select-none"
                      title={collapsed ? `${item.label} (bald verfügbar)` : 'Bald verfügbar'}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  )
                }

                // Portal links: auto-login as test user
                if (item.href === '/tenant-portal') {
                  return (
                    <button
                      key={item.href}
                      onClick={() => handlePortalLogin('mieter@automiq.de', '/tenant-portal')}
                      className={cn('sidebar-link w-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/10', isActive && 'active')}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('sidebar-link', isActive && 'active')}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {item.href === '/communications' && unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-2 border-t border-black/5 pt-3 mt-auto space-y-0.5">
        {[
          { href: '/feature-request', label: 'Feature anfragen', icon: Lightbulb },
          { href: '/support', label: 'Support-Ticket', icon: LifeBuoy },
        ].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', isActive && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>

      <div className="px-3 pb-3 space-y-1">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
          title={collapsed ? 'Abmelden' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Abmelden</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 rounded-lg hover:bg-black/5 text-text-secondary transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  )
}
