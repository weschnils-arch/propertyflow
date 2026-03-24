'use client'

import { usePathname } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TenantShell from '@/components/layout/TenantShell'
import FloatingChat from '@/components/layout/FloatingChat'

const PUBLIC_ROUTES = ['/login', '/register', '/reply']

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isTenantPortal = pathname.startsWith('/tenant-portal')

  if (isPublic) {
    return <>{children}</>
  }

  if (isTenantPortal) {
    return <TenantShell>{children}</TenantShell>
  }

  return (
    <AppShell>
      {children}
      <FloatingChat />
    </AppShell>
  )
}
