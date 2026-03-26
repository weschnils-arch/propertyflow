'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import MeldungWizard, { MeldungData } from '@/components/tenant/MeldungWizard'

export default function MeldungPage() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ referenceNumber: string } | null>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setTenantId(user.tenant?.id || null)
  }, [])

  const handleSubmit = async (data: MeldungData) => {
    if (!tenantId) return

    // Get tenant's property/unit from contract
    const tenantRes = await fetch(`/api/tenants/${tenantId}`)
    const tenant = await tenantRes.json()
    const contract = tenant.contracts?.find((c: { status: string }) => c.status === 'active')
    if (!contract) return

    // Find meldung category
    const catsRes = await fetch('/api/vorgang-categories')
    const cats = await catsRes.json()
    const meldungCat = cats.find((c: { slug: string }) => c.slug === 'meldung') || cats.find((c: { slug: string }) => c.slug === 'reparatur')
    if (!meldungCat) return

    const res = await fetch('/api/vorgaenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: contract.unit.property?.id || contract.unit.propertyId,
        unitId: contract.unitId,
        tenantId,
        categoryId: meldungCat.id,
        subcategory: data.subcategory,
        title: `${data.subcategory.charAt(0).toUpperCase() + data.subcategory.slice(1).replace('_', '/')} — ${data.location}`,
        description: data.description,
        priority: data.priority,
      }),
    })

    if (res.ok) {
      const vorgang = await res.json()
      setSuccess({ referenceNumber: vorgang.referenceNumber })
    }
  }

  if (!tenantId) return <div className="text-center text-white/40 py-20">Lade...</div>

  if (success) {
    return (
      <div className="animate-fade-in max-w-md mx-auto text-center py-20 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Meldung eingereicht!</h2>
        <p className="text-white/60">Ihre Meldung wurde erfolgreich erstellt.</p>
        <p className="font-mono text-blue-400 text-lg">{success.referenceNumber}</p>
        <div className="flex justify-center gap-3 pt-4">
          <button onClick={() => router.push('/tenant-portal/vorgaenge')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Meine Vorgänge</button>
          <button onClick={() => { setSuccess(null) }} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm">Neue Meldung</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in py-6">
      <div className="flex items-center gap-3 mb-8">
        <AlertCircle className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Neue Meldung</h1>
      </div>
      <MeldungWizard onSubmit={handleSubmit} />
    </div>
  )
}
