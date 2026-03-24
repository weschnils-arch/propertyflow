'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Phone, Lock, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react'

export default function TenantProfilPage() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(d => {
        if (d.email) setProfile({ firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone || '' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profil erfolgreich aktualisiert.' })
        // Update localStorage
        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }))
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Fehler beim Speichern.' })
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Verbindungsfehler.' })
    }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwörter stimmen nicht überein.' })
      return
    }

    setChangingPw(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Passwort erfolgreich geändert.' })
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Fehler.' })
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Verbindungsfehler.' })
    }
    setChangingPw(false)
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground text-sm mt-1">Persönliche Daten und Sicherheit</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="glass-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Persönliche Daten</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vorname</label>
            <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nachname</label>
            <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className="input-field text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-Mail</label>
          <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</label>
          <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="input-field text-sm" placeholder="+49 ..." />
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-destructive'}`}>
            {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {profileMsg.text}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Speichern</>}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handleChangePassword} className="glass-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Passwort ändern</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Aktuelles Passwort</label>
          <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} className="input-field text-sm" placeholder="••••••••" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Neues Passwort</label>
          <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} className="input-field text-sm" placeholder="Mind. 6 Zeichen" required minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Neues Passwort bestätigen</label>
          <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} className="input-field text-sm" placeholder="••••••••" required />
        </div>

        {pwMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-destructive'}`}>
            {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {pwMsg.text}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={changingPw} className="btn-primary">
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Passwort ändern</>}
          </button>
        </div>
      </form>
    </div>
  )
}
