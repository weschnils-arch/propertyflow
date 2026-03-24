'use client'

import TenantSidebar from './TenantSidebar'
import TenantTopBar from './TenantTopBar'
import FloatingChat from './FloatingChat'

export default function TenantShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <TenantSidebar />
      <div className="flex-1 ml-[250px] transition-all duration-300">
        <TenantTopBar />
        <main className="px-8 pt-6 pb-8">
          {children}
        </main>
      </div>
      <FloatingChat />
    </div>
  )
}
