'use client'

import { useEffect, useState } from 'react'
import { Shield, Plus, Trash2, Users, Edit2 } from 'lucide-react'
import PermissionMatrix from '@/components/roles/PermissionMatrix'

interface Role {
  id: string
  name: string
  description: string | null
  color: string | null
  isSystem: boolean
  permissions: Record<string, { level: string; scope?: string }>
  _count: { roleAssignments: number }
}

interface RoleAssignment {
  id: string
  scope: string
  isActive: boolean
  user: { id: string; firstName: string; lastName: string; email: string }
  role: { id: string; name: string; color: string | null }
  property: { id: string; name: string } | null
  unit: { id: string; designation: string } | null
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [assignments, setAssignments] = useState<RoleAssignment[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6', permissions: {} as Record<string, { level: 'none' | 'read' | 'full'; scope?: 'all' | 'assigned' }> })

  const fetchRoles = () => fetch('/api/roles').then(r => r.json()).then(setRoles).catch(() => {})
  const fetchAssignments = () => fetch('/api/role-assignments').then(r => r.json()).then(setAssignments).catch(() => {})

  useEffect(() => { fetchRoles(); fetchAssignments() }, [])

  const openCreate = () => {
    setEditRole(null)
    setForm({ name: '', description: '', color: '#3b82f6', permissions: {} })
    setShowModal(true)
  }

  const openEdit = (role: Role) => {
    setEditRole(role)
    setForm({ name: role.name, description: role.description || '', color: role.color || '#3b82f6', permissions: role.permissions as Record<string, { level: 'none' | 'read' | 'full'; scope?: 'all' | 'assigned' }> })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    const url = editRole ? `/api/roles/${editRole.id}` : '/api/roles'
    const method = editRole ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      fetchRoles()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Rolle wirklich löschen?')) return
    await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    fetchRoles()
  }

  const deleteAssignment = async (id: string) => {
    await fetch(`/api/role-assignments/${id}`, { method: 'DELETE' })
    fetchAssignments()
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Rollen & Berechtigungen</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
          <Plus className="w-4 h-4" /> Neue Rolle
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#64748b' }} />
                <h3 className="text-sm font-semibold text-white">{role.name}</h3>
                {role.isSystem && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">System</span>}
              </div>
              {!role.isSystem && (
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(role)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(role.id)} className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            {role.description && <p className="text-xs text-white/40">{role.description}</p>}
            <div className="flex items-center gap-1 text-xs text-white/30">
              <Users className="w-3 h-3" /> {role._count.roleAssignments} Zuweisungen
            </div>
          </div>
        ))}
      </div>

      {/* Assignments */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Zuweisungen</h2>
        {assignments.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-6">Keine Zuweisungen</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="px-4 py-3">Benutzer</th>
                  <th className="px-4 py-3">Rolle</th>
                  <th className="px-4 py-3">Bereich</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">{a.user.firstName} {a.user.lastName}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (a.role.color || '#64748b') + '20', color: a.role.color || '#64748b' }}>{a.role.name}</span></td>
                    <td className="px-4 py-3 text-white/60">{a.scope === 'mandant' ? 'Mandant-weit' : a.property ? a.property.name : ''}{a.unit ? ` · ${a.unit.designation}` : ''}</td>
                    <td className="px-4 py-3"><button onClick={() => deleteAssignment(a.id)} className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">{editRole ? 'Rolle bearbeiten' : 'Neue Rolle'}</h2>
            <input type="text" placeholder="Rollenname *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none" />
            <input type="text" placeholder="Beschreibung" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Farbe:</span>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer" />
            </div>
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white/70 mb-3">Berechtigungen</h3>
              <PermissionMatrix permissions={form.permissions} onChange={p => setForm(f => ({ ...f, permissions: p }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-white/60">Abbrechen</button>
              <button onClick={handleSave} disabled={!form.name} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-40">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
