'use client'

interface ModulePermission {
  level: 'none' | 'read' | 'full'
  scope?: 'all' | 'assigned'
}

interface PermissionMatrixProps {
  permissions: Record<string, ModulePermission>
  onChange: (permissions: Record<string, ModulePermission>) => void
}

const MODULES = [
  { key: 'vorgaenge', label: 'Vorgänge' },
  { key: 'finanzen', label: 'Finanzen' },
  { key: 'immobilien', label: 'Immobilien' },
  { key: 'mieter', label: 'Mieter' },
  { key: 'eigentuemer', label: 'Eigentümer' },
  { key: 'dokumente', label: 'Dokumente' },
  { key: 'techniker', label: 'Techniker' },
  { key: 'einstellungen', label: 'Einstellungen' },
  { key: 'berichte', label: 'Berichte' },
]

const LEVELS: { key: 'none' | 'read' | 'full'; label: string }[] = [
  { key: 'none', label: 'Keine' },
  { key: 'read', label: 'Lesen' },
  { key: 'full', label: 'Voll' },
]

export default function PermissionMatrix({ permissions, onChange }: PermissionMatrixProps) {
  const updateLevel = (module: string, level: 'none' | 'read' | 'full') => {
    const current = permissions[module] || { level: 'none' }
    onChange({ ...permissions, [module]: { ...current, level } })
  }

  const updateScope = (scope: 'all' | 'assigned') => {
    const current = permissions['vorgaenge'] || { level: 'none' }
    onChange({ ...permissions, vorgaenge: { ...current, scope } })
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-white/40 font-medium">
        <div>Modul</div>
        {LEVELS.map(l => <div key={l.key} className="text-center">{l.label}</div>)}
      </div>
      {MODULES.map(mod => {
        const perm = permissions[mod.key] || { level: 'none' }
        return (
          <div key={mod.key}>
            <div className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="text-sm text-white">{mod.label}</div>
              {LEVELS.map(l => (
                <div key={l.key} className="flex justify-center">
                  <button
                    onClick={() => updateLevel(mod.key, l.key)}
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${perm.level === l.key ? 'border-blue-500 bg-blue-500' : 'border-white/20 hover:border-white/40'}`}
                  />
                </div>
              ))}
            </div>
            {mod.key === 'vorgaenge' && perm.level !== 'none' && (
              <div className="ml-6 px-3 py-1 flex items-center gap-3">
                <span className="text-xs text-white/40">Sichtbarkeit:</span>
                <button
                  onClick={() => updateScope('all')}
                  className={`text-xs px-2 py-0.5 rounded ${perm.scope === 'all' || !perm.scope ? 'bg-blue-600/30 text-blue-300' : 'bg-white/5 text-white/40'}`}
                >Alle</button>
                <button
                  onClick={() => updateScope('assigned')}
                  className={`text-xs px-2 py-0.5 rounded ${perm.scope === 'assigned' ? 'bg-blue-600/30 text-blue-300' : 'bg-white/5 text-white/40'}`}
                >Nur zugewiesene</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
