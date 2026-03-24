'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Paperclip, Building2, Clock } from 'lucide-react'

interface Message {
  id: string
  senderName: string | null
  senderRole: string | null
  message: string
  direction: string
  isRead: boolean
  createdAt: string
}

export default function TenantNachrichtenPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.tenant?.id) {
      setTenantId(user.tenant.id)
      fetch(`/api/communications?tenantId=${user.tenant.id}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setMessages(d) })
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !tenantId) return
    setSending(true)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        message: input,
        channel: 'tenant',
        direction: 'inbound',
        senderRole: 'tenant',
        senderName: `${user.firstName} ${user.lastName}`,
      }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setInput('')
    }
    setSending(false)
  }

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Nachrichten</h1>
        <p className="text-muted-foreground text-sm mt-1">Kommunikation mit Ihrer Hausverwaltung</p>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Hendrik Verwaltung</div>
            <div className="text-xs text-muted-foreground">Ihre Hausverwaltung</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Noch keine Nachrichten. Schreiben Sie Ihrer Hausverwaltung.
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%]">
                {msg.direction !== 'inbound' && (
                  <div className="text-xs font-medium text-muted-foreground mb-1">{msg.senderName}</div>
                )}
                <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.direction === 'inbound'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                }`}>
                  {msg.message}
                </div>
                <div className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${msg.direction === 'inbound' ? 'justify-end' : ''}`}>
                  <Clock className="w-3 h-3" />
                  {new Date(msg.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-border/30">
          <div className="flex items-end gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Nachricht schreiben..."
              rows={1}
              className="input-field text-sm resize-none min-h-[38px] max-h-[100px] flex-1"
            />
            <button onClick={handleSend} disabled={!input.trim() || sending}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
