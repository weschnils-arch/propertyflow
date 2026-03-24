'use client'

import { useEffect, useState, useRef } from 'react'
import {
  MessageSquare, Search, Plus, Users, Building2, HardHat,
  Send, Paperclip, X, User, Mail, Phone, FileText, MoreVertical,
  ArrowLeft, Inbox, Bell, Megaphone, Copy, Wrench, Clock,
  AlertTriangle, CheckCircle, Image, Download, Bot, Sparkles,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
  id: string
  entityId: string
  entityType: 'tenant' | 'owner' | 'technician'
  name: string
  initials: string
  email: string
  phone: string | null
  propertyName: string
  propertyId: string
  unitDesignation: string
  unitId: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  channel: string
  status: string
  priority: string
  ticketId: string | null
  ticketTitle: string | null
  ticketStatus: string | null
  monthlyRent: number
  contractStart: string | null
}

interface Message {
  id: string
  senderName: string | null
  senderRole: string | null
  message: string
  direction: string
  isRead: boolean
  createdAt: string
  attachments: { id: string; fileName: string; fileSize: number; filePath: string; mimeType: string }[]
}

interface Template {
  id: string
  name: string
  category: string
  subject: string | null
  body: string
}

// ============================================================================
// CHANNEL CONFIG
// ============================================================================

const CHANNELS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Alle', icon: Inbox },
  { id: 'tenant', label: 'Mieter', icon: Users },
  { id: 'owner', label: 'Eigentümer', icon: Building2 },
  { id: 'service_provider', label: 'Dienstleister', icon: HardHat },
]

const CHANNEL_COLORS: Record<string, string> = {
  tenant: 'bg-primary/10 text-primary',
  owner: 'bg-amber-100 text-amber-700',
  service_provider: 'bg-green-100 text-green-700',
  weg: 'bg-purple-100 text-purple-700',
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CommunicationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeChannel, setActiveChannel] = useState('all')
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showMassComm, setShowMassComm] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  const [agentMessages, setAgentMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hallo! Ich bin der Property Agent — Ihr digitaler Assistent für PropertyFlow. 🏠\n\nIch kann Ihnen helfen mit:\n• Navigation & Funktionen der Plattform\n• Fragen zu Mietverwaltung & Prozessen\n• Betriebskostenabrechnung & Finanzen\n• Ticket-System & Kommunikation\n\nWie kann ich Ihnen helfen?' }
  ])
  const [agentInput, setAgentInput] = useState('')
  const [agentThinking, setAgentThinking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [massSending, setMassSending] = useState(false)
  const [massResult, setMassResult] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  const agentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch conversations on mount and when filters change
  useEffect(() => {
    fetchConversations()
    fetchTemplates()
  }, [activeChannel])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchConversations(), 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  async function fetchConversations() {
    try {
      const params = new URLSearchParams()
      if (activeChannel !== 'all') params.set('channel', activeChannel)
      if (search) params.set('search', search)
      const res = await fetch(`/api/communications?${params}`)
      const data = await res.json()
      if (Array.isArray(data)) setConversations(data)
    } catch { /* empty */ }
    setLoading(false)
  }

  async function fetchMessages(entityType: string, entityId: string) {
    try {
      const param = entityType === 'tenant' ? 'tenantId' : 'tenantId' // For now, all stored under tenantId
      const res = await fetch(`/api/communications?${param}=${entityId}`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch { /* empty */ }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      if (Array.isArray(data)) setTemplates(data)
    } catch { /* empty */ }
  }

  function selectConversation(convo: Conversation) {
    setSelectedConvo(convo)
    setAgentMode(false)
    setShowTemplates(false)
    fetchMessages(convo.entityType, convo.entityId)
    setTimeout(() => messageTextareaRef.current?.focus(), 200)

    // Mark as read
    if (convo.unreadCount > 0 && convo.entityType === 'tenant') {
      fetch('/api/communications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true, tenantId: convo.entityId }),
      }).then(() => {
        setConversations(prev => prev.map(c =>
          c.id === convo.id ? { ...c, unreadCount: 0 } : c
        ))
        window.dispatchEvent(new Event('messages-read'))
      })
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedConvo) return
    setSending(true)
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedConvo.entityType === 'tenant' ? selectedConvo.entityId : null,
          ticketId: selectedConvo.ticketId,
          message: messageInput,
          channel: selectedConvo.channel,
          type: 'chat',
          direction: 'outbound',
          senderRole: 'admin',
          senderName: 'Hendrik Verwaltung',
        }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setMessages(prev => [...prev, newMsg])
        setMessageInput('')
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch { /* empty */ }
    setSending(false)
  }

  async function handleAgentSend() {
    if (!agentInput.trim() || agentThinking) return
    const userMsg = agentInput.trim()
    setAgentMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setAgentInput('')
    setAgentThinking(true)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...agentMessages, { role: 'user', content: userMsg }],
        }),
      })
      const data = await res.json()
      setAgentMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Entschuldigung, ich konnte keine Antwort generieren.' }])
    } catch {
      setAgentMessages(prev => [...prev, { role: 'assistant', content: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }])
    }
    setAgentThinking(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function handleMassSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message') as string
    const subject = formData.get('subject') as string
    const recipientGroup = formData.get('recipientGroup') as string

    if (!message || !recipientGroup) return
    setMassSending(true)
    setMassResult(null)

    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mass: true, recipientGroup, message, subject }),
      })
      const data = await res.json()
      if (data.success) {
        setMassResult(`Erfolgreich an ${data.recipients} Empfänger gesendet.`)
        fetchConversations()
      } else {
        setMassResult(`Fehler: ${data.error}`)
      }
    } catch {
      setMassResult('Fehler beim Senden.')
    }
    setMassSending(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedConvo) return
    setUploadingFile(true)

    try {
      // First send a message mentioning the attachment
      const msgRes = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedConvo.entityType === 'tenant' ? selectedConvo.entityId : null,
          message: `📎 Datei angehängt: ${file.name}`,
          channel: selectedConvo.channel,
          direction: 'outbound',
          senderRole: 'admin',
          senderName: 'Hendrik Verwaltung',
        }),
      })

      if (msgRes.ok) {
        const msg = await msgRes.json()
        // Upload the file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('communicationId', msg.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })

        if (uploadRes.ok) {
          // Refresh messages
          fetchMessages(selectedConvo.entityType, selectedConvo.entityId)
        }
      }
    } catch { /* empty */ }
    setUploadingFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleInsertTemplate(template: Template) {
    let text = template.body
    if (selectedConvo) {
      text = text
        .replace(/\{\{tenant_name\}\}/g, selectedConvo.name)
        .replace(/\{\{property_address\}\}/g, selectedConvo.propertyName)
        .replace(/\{\{unit\}\}/g, selectedConvo.unitDesignation)
        .replace(/\{\{amount\}\}/g, selectedConvo.monthlyRent ? formatCurrency(selectedConvo.monthlyRent) : '—')
        .replace(/\{\{year\}\}/g, '2025')
        .replace(/\{\{month\}\}/g, 'März 2026')
    }
    setMessageInput(text)
    setShowTemplates(false)
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)
  const channelCounts: Record<string, number> = { all: conversations.length }
  for (const c of conversations) channelCounts[c.channel] = (channelCounts[c.channel] || 0) + 1

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in -mx-8 -mt-6 overflow-hidden" style={{ height: 'calc(100vh - 105px)' }}>
      <div className="flex h-full overflow-hidden">

        {/* LEFT PANEL: Conversations */}
        <div className={`w-[380px] flex-shrink-0 border-r border-border/50 flex flex-col bg-card/30 ${selectedConvo ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-foreground">Kommunikation</h1>
                <p className="text-xs text-muted-foreground">{totalUnread > 0 ? `${totalUnread} ungelesene · ` : ''}{conversations.length} Konversationen</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setShowMassComm(true)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Massenkommunikation">
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => setShowNewMessage(true)} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-sm" />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeChannel === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}>
                  <ch.icon className="w-3.5 h-3.5" />
                  {ch.label}
                  {(channelCounts[ch.id] || 0) > 0 && activeChannel !== ch.id && (
                    <span className="ml-0.5 text-[10px] opacity-70">{channelCounts[ch.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* PINNED: Property Agent */}
            <button
              onClick={() => { setAgentMode(true); setSelectedConvo(null); setTimeout(() => agentTextareaRef.current?.focus(), 200) }}
              className={`w-full text-left p-3.5 border-b border-border/30 hover:bg-muted/40 transition-colors ${
                agentMode ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-l-2 border-l-violet-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Property Agent</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[9px] font-bold uppercase tracking-wider">AI</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Online" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Ihr digitaler Assistent für PropertyFlow</p>
                </div>
              </div>
            </button>

            {conversations.length === 0 && !agentMode && (
              <div className="p-8 text-center text-muted-foreground text-sm">Keine Konversationen.</div>
            )}
            {conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => selectConversation(convo)}
                className={`w-full text-left p-3.5 border-b border-border/30 hover:bg-muted/40 transition-colors ${
                  selectedConvo?.id === convo.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${CHANNEL_COLORS[convo.channel] || 'bg-muted text-foreground'}`}>
                    {convo.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-bold' : 'font-medium text-foreground/80'}`}>
                        {convo.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{convo.lastMessageTime}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mb-0.5">
                      {convo.propertyName}{convo.unitDesignation ? ` · ${convo.unitDesignation}` : ''}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {convo.lastMessage || 'Keine Nachrichten'}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {convo.priority === 'urgent' && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        {convo.ticketId && <Wrench className="w-3 h-3 text-amber-500" />}
                        {convo.unreadCount > 0 && (
                          <span className="w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center min-w-[18px] px-1">{convo.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Thread */}
        <div className={`flex-1 flex flex-col ${!selectedConvo && !agentMode ? 'hidden lg:flex' : 'flex'}`}>
          {agentMode ? (
            <>
              {/* Agent Header */}
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-violet-500/5 to-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAgentMode(false)} className="lg:hidden p-1 rounded-lg hover:bg-muted">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-foreground text-sm">Property Agent</h2>
                        <span className="px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[9px] font-bold uppercase tracking-wider">AI</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                      </div>
                      <p className="text-xs text-muted-foreground">PropertyFlow Assistent — FAQ, Navigation, Hilfe</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {agentMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span className="text-violet-400">Property Agent</span>
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-violet-500/10 border border-violet-500/20 text-foreground rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {agentThinking && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%]">
                      <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                        <Sparkles className="w-3 h-3 text-violet-400 animate-spin" />
                        <span className="text-violet-400">Property Agent denkt nach...</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Agent Input */}
              <div className="p-3 border-t border-border/50 bg-card/30">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={agentTextareaRef}
                    value={agentInput}
                    onChange={e => setAgentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentSend() } }}
                    placeholder="Frage an Property Agent..."
                    rows={1}
                    className="input-field text-sm resize-none min-h-[38px] max-h-[120px] flex-1"
                  />
                  <button onClick={handleAgentSend} disabled={!agentInput.trim() || agentThinking}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-40 shadow-lg shadow-violet-500/20">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : selectedConvo ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border/50 bg-card/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedConvo(null)} className="lg:hidden p-1 rounded-lg hover:bg-muted">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${CHANNEL_COLORS[selectedConvo.channel] || 'bg-muted'}`}>
                      {selectedConvo.initials}
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground text-sm">{selectedConvo.name}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{selectedConvo.propertyName}</span>
                        {selectedConvo.unitDesignation && <><span>·</span><span>{selectedConvo.unitDesignation}</span></>}
                        {selectedConvo.ticketTitle && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                            {selectedConvo.ticketTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedConvo.phone && (
                      <a href={`tel:${selectedConvo.phone}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    <a href={`mailto:${selectedConvo.email}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Context Bar */}
              {selectedConvo.entityType === 'tenant' && (
                <div className="px-4 py-2 border-b border-border/30 bg-accent/30 flex items-center gap-4 text-xs overflow-x-auto">
                  <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedConvo.propertyName}
                  </div>
                  {selectedConvo.contractStart && (
                    <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                      <FileText className="w-3.5 h-3.5" />
                      Vertrag seit {formatDate(selectedConvo.contractStart)}
                    </div>
                  )}
                  {selectedConvo.monthlyRent > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                      <WalletIcon className="w-3.5 h-3.5" />
                      Miete: {formatCurrency(selectedConvo.monthlyRent)}
                    </div>
                  )}
                  {selectedConvo.ticketTitle && (
                    <div className="flex items-center gap-1.5 text-amber-600 whitespace-nowrap">
                      <Wrench className="w-3.5 h-3.5" />
                      {selectedConvo.ticketTitle}
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">Noch keine Nachrichten.</div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : msg.senderRole === 'system' ? 'justify-center' : 'justify-start'}`}>
                    {msg.senderRole === 'system' ? (
                      <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs flex items-center gap-1.5">
                        <Bell className="w-3 h-3" /> {msg.message}
                      </div>
                    ) : (
                      <div className="max-w-[70%]">
                        {msg.direction !== 'outbound' && (
                          <div className="text-xs font-medium mb-1">
                            <span className={msg.senderRole === 'technician' ? 'text-green-600' : 'text-foreground'}>{msg.senderName}</span>
                            {msg.senderRole === 'technician' && <span className="text-muted-foreground font-normal"> · Techniker</span>}
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.direction === 'outbound'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                        }`}>
                          {msg.message}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map(att => (
                                <a key={att.id} href={att.filePath} target="_blank" rel="noopener"
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                    msg.direction === 'outbound' ? 'bg-white/15 hover:bg-white/25' : 'bg-muted/50 hover:bg-muted'
                                  }`}>
                                  {att.mimeType?.startsWith('image/') ? <Image className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                  <span className="truncate">{att.fileName}</span>
                                  <span className="text-[10px] opacity-70">{formatFileSize(att.fileSize)}</span>
                                  <Download className="w-3 h-3 ml-auto opacity-60" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] text-muted-foreground mt-1 ${msg.direction === 'outbound' ? 'text-right' : ''}`}>
                          {formatMessageTime(msg.createdAt)}
                          {msg.direction === 'outbound' && <span className="ml-1 opacity-70">✓✓</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-border/50 bg-card/30">
                {showTemplates && templates.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl bg-card border border-border/50 space-y-1 animate-slide-in max-h-[200px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">Vorlagen</span>
                      <button onClick={() => setShowTemplates(false)} className="p-0.5 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    {templates.map(t => (
                      <button key={t.id} onClick={() => handleInsertTemplate(t)} className="w-full text-left p-2 rounded-lg hover:bg-muted/60 transition-colors">
                        <div className="text-xs font-medium">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{t.body.substring(0, 80)}...</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex gap-0.5">
                    <button onClick={() => setShowTemplates(!showTemplates)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Vorlage">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Datei anhängen">
                      <Paperclip className={`w-4 h-4 ${uploadingFile ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
                  </div>
                  <textarea
                    ref={messageTextareaRef}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    placeholder="Nachricht..."
                    rows={1}
                    className="input-field text-sm resize-none min-h-[38px] max-h-[120px] flex-1"
                  />
                  <button onClick={handleSendMessage} disabled={!messageInput.trim() || sending}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Kommunikation</h3>
                <p className="text-sm text-muted-foreground">Konversation wählen oder neue Nachricht starten.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW MESSAGE MODAL */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewMessage(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Neue Nachricht</h2>
              <button onClick={() => setShowNewMessage(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Empfänger</label>
                <select className="input-field text-sm">
                  <option value="">Wählen...</option>
                  {conversations.filter(c => c.entityType === 'tenant').slice(0, 30).map(c => (
                    <option key={c.id} value={c.entityId}>{c.name} — {c.propertyName}, {c.unitDesignation}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Betreff</label>
                <input type="text" className="input-field text-sm" placeholder="Betreff..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nachricht</label>
                <textarea className="input-field text-sm min-h-[100px]" placeholder="Nachricht..." />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setShowNewMessage(false)} className="btn-secondary">Abbrechen</button>
                <button className="btn-primary"><Send className="w-4 h-4" /> Senden</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASS COMMUNICATION MODAL */}
      {showMassComm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMassComm(false)}>
          <form onSubmit={handleMassSend} className="glass-card p-6 w-full max-w-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Massenkommunikation</h2>
                <p className="text-xs text-muted-foreground">Nachricht an mehrere Empfänger</p>
              </div>
              <button type="button" onClick={() => setShowMassComm(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Empfängergruppe</label>
                <select name="recipientGroup" className="input-field text-sm" required>
                  <option value="">Wählen...</option>
                  <option value="all_tenants">Alle Mieter ({conversations.filter(c => c.entityType === 'tenant').length})</option>
                  <option value="overdue">Mieter mit überfälligen Zahlungen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Betreff</label>
                <input type="text" name="subject" className="input-field text-sm" placeholder="Betreff..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Nachricht</label>
                  {templates.length > 0 && (
                    <select className="text-xs border-none bg-transparent text-primary cursor-pointer"
                      onChange={e => {
                        const t = templates.find(t => t.id === e.target.value)
                        if (t) {
                          const textarea = e.target.closest('div')?.querySelector('textarea')
                          if (textarea) (textarea as HTMLTextAreaElement).value = t.body
                        }
                      }}>
                      <option value="">Vorlage einfügen...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
                <textarea name="message" className="input-field text-sm min-h-[120px]" placeholder="Platzhalter: {{tenant_name}}, {{property_address}}, {{unit}}, {{amount}}" required />
              </div>

              {massResult && (
                <div className={`p-3 rounded-lg text-sm ${massResult.includes('Fehler') ? 'bg-red-50 text-destructive' : 'bg-green-50 text-green-700'}`}>
                  {massResult}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowMassComm(false)} className="btn-secondary">Abbrechen</button>
                <button type="submit" disabled={massSending} className="btn-primary">
                  {massSending ? 'Sende...' : <><Megaphone className="w-4 h-4" /> Senden</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
    </svg>
  )
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `vor ${diffDays}T`
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
