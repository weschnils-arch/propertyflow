'use client'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Breadcrumbs from './Breadcrumbs'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[250px] transition-all duration-300">
        <TopBar />
        <Breadcrumbs />
        <main className="px-8 pt-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
