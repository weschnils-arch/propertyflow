'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Immobilien',
  tenants: 'Mieter',
  maintenance: 'Wartung',
  finances: 'Finanzen',
  'smart-home': 'Smart Home',
  technicians: 'Techniker-Verwaltung',
  units: 'Einheiten',
  settings: 'Einstellungen',
  'tenant-portal': 'Mieter-Portal',
  'technician-portal': 'Techniker-Portal',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm text-text-secondary px-6 py-3">
      <Link href="/dashboard" className="hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = labelMap[segment] || decodeURIComponent(segment)

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
            {isLast ? (
              <span className="text-text-primary font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
