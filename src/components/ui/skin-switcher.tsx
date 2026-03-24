'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Paintbrush } from 'lucide-react'

export type Skin = 'default' | 'modern'

export function useSkin(): [Skin, (s: Skin) => void] {
  const [skin, setSkinState] = useState<Skin>('default')

  useEffect(() => {
    const stored = localStorage.getItem('skin') as Skin | null
    if (stored) setSkinState(stored)
  }, [])

  const setSkin = (s: Skin) => {
    setSkinState(s)
    localStorage.setItem('skin', s)
  }

  return [skin, setSkin]
}

interface SkinSwitcherProps {
  skin: Skin
  onSkinChange: (skin: Skin) => void
}

const skins: { value: Skin; label: string; color: string }[] = [
  { value: 'default', label: 'Classic', color: 'bg-violet-500' },
  { value: 'modern', label: 'Modern', color: 'bg-blue-500' },
]

export function SkinSwitcher({ skin, onSkinChange }: SkinSwitcherProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        title="Skin wechseln"
      >
        <Paintbrush className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-2 shadow-xl min-w-[160px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Skin</p>
            {skins.map(s => (
              <button
                key={s.value}
                onClick={() => { onSkinChange(s.value); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors',
                  skin === s.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                )}
              >
                <div className={cn('w-3 h-3 rounded-full', s.color)} />
                {s.label}
                {skin === s.value && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
