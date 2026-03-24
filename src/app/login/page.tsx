"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Building2, Shield, User, AlertCircle, Loader2 } from "lucide-react"

const DottedSurface = dynamic(() => import("@/components/ui/dotted-surface").then(m => ({ default: m.DottedSurface })), { ssr: false })
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Login fehlgeschlagen"); setLoading(false); return }
      localStorage.setItem("user", JSON.stringify(data.user))
      router.push(data.user.role === "tenant" ? "/tenant-portal" : "/dashboard")
    } catch {
      setError("Verbindungsfehler."); setLoading(false)
    }
  }

  async function quickLogin(testEmail: string) {
    setEmail(testEmail); setPassword("test123"); setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "test123" }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Bitte erst Demo-Daten laden."); setLoading(false); return }
      localStorage.setItem("user", JSON.stringify(data.user))
      router.push(data.user.role === "tenant" ? "/tenant-portal" : "/dashboard")
    } catch {
      setError("Verbindungsfehler"); setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Dotted Surface Background */}
      <DottedSurface />

      {/* Theme Switcher */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeSwitcher />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-card/70 backdrop-blur-2xl border border-border/30 p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">PropertyFlow</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Immobilienverwaltung</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="name@beispiel.de" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" required />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </motion.div>
            )}

            <Button type="submit" size="lg" className="w-full mt-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Anmelden"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">DSGVO-konform · Verschlüsselt · EU-gehostet</p>
          </div>
        </div>

        {/* Test Accounts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 bg-card/50 backdrop-blur-2xl border border-border/20 p-5 rounded-2xl">
          <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">Test-Zugänge</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => quickLogin("admin@automiq.de")} disabled={loading}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-4 h-4 text-primary" /></div>
              <div><div className="text-sm font-semibold text-foreground">Admin</div><div className="text-[10px] text-muted-foreground">admin@automiq.de</div></div>
            </button>
            <button onClick={() => quickLogin("mieter@automiq.de")} disabled={loading}
              className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border/20 hover:bg-accent transition-colors text-left disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center"><User className="w-4 h-4 text-accent-foreground" /></div>
              <div><div className="text-sm font-semibold text-foreground">Mieter</div><div className="text-[10px] text-muted-foreground">mieter@automiq.de</div></div>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3">Passwort: <span className="font-mono">test123</span></p>
        </motion.div>
      </motion.div>
    </div>
  )
}
