'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MessageSquare, Send, X, Paperclip, PanelLeftOpen, PanelLeftClose,
  FileText, Image, Download, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  entityId: string
  entityType: string
  name: string
  initials: string
  propertyName: string
  unitDesignation: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  channel: string
  ticketId: string | null
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

const CHANNEL_COLORS: Record<string, string> = {
  tenant: 'bg-primary/10 text-primary',
  owner: 'bg-amber-100 text-amber-700',
  service_provider: 'bg-green-100 text-green-700',
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'jetzt'
  if (diffMin < 60) return `vor ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `vor ${diffH}h`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function FloatingChat() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hide on communications page and public routes (NOT tenant portal)
  const hidden = pathname === '/communications' ||
    pathname === '/tenant-portal/nachrichten' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reply')

  // Fetch conversations when widget opens
  useEffect(() => {
    if (!isOpen || hidden) return
    fetchConversations()
  }, [isOpen, hidden])

  // Also fetch unread count periodically for the badge
  useEffect(() => {
    if (hidden) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [hidden])

  // Restore last selected conversation
  useEffect(() => {
    if (!isOpen || conversations.length === 0) return
    const savedId = localStorage.getItem('floating-chat-convo')
    if (savedId) {
      const found = conversations.find(c => c.entityId === savedId)
      if (found) {
        selectConvo(found)
        return
      }
    }
    // Default to first conversation
    if (!selectedConvo && conversations.length > 0) {
      selectConvo(conversations[0])
    }
  }, [isOpen, conversations])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/communications')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTotalUnread(data.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0))
      }
    } catch {}
  }

  async function fetchConversations() {
    try {
      const res = await fetch('/api/communications')
      const data = await res.json()
      if (Array.isArray(data)) {
        setConversations(data.slice(0, 15))
        setTotalUnread(data.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0))
      }
    } catch {}
  }

  async function fetchMessages(entityId: string) {
    try {
      const res = await fetch(`/api/communications?tenantId=${entityId}`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {}
  }

  function selectConvo(convo: Conversation) {
    setSelectedConvo(convo)
    localStorage.setItem('floating-chat-convo', convo.entityId)
    fetchMessages(convo.entityId)
    setSidebarOpen(false)

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
        setTotalUnread(prev => Math.max(0, prev - convo.unreadCount))
      })
    }
  }

  async function handleSend() {
    if (!messageInput.trim() || !selectedConvo || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedConvo.entityType === 'tenant' ? selectedConvo.entityId : null,
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
      }
    } catch {}
    setSending(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedConvo) return
    setUploading(true)
    try {
      const msgRes = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedConvo.entityType === 'tenant' ? selectedConvo.entityId : null,
          message: `📎 ${file.name}`,
          channel: selectedConvo.channel,
          direction: 'outbound',
          senderRole: 'admin',
          senderName: 'Hendrik Verwaltung',
        }),
      })
      if (msgRes.ok) {
        const msg = await msgRes.json()
        const formData = new FormData()
        formData.append('file', file)
        formData.append('communicationId', msg.id)
        await fetch('/api/upload', { method: 'POST', body: formData })
        setMessages(prev => [...prev, msg])
      }
    } catch {}
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex"
            style={{ width: sidebarOpen ? 580 : 380, height: 500 }}
          >
            {/* Sidebar */}
            <motion.div
              animate={{ width: sidebarOpen ? 200 : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-r border-border/50 bg-muted/30 flex-shrink-0"
            >
              <div className="w-[200px] h-full flex flex-col">
                <div className="p-3 border-b border-border/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Konversationen</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectConvo(c)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 border-b border-border/20 hover:bg-muted/50 transition-colors',
                        selectedConvo?.id === c.id && 'bg-primary/10'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0',
                          CHANNEL_COLORS[c.channel] || 'bg-muted text-foreground'
                        )}>
                          {c.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-xs truncate', c.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
                              {c.name}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-1" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{c.lastMessage || 'Keine Nachrichten'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="p-3 border-b border-border/50 bg-card flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-muted-foreground" /> : <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {selectedConvo ? (
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                        CHANNEL_COLORS[selectedConvo.channel] || 'bg-muted'
                      )}>
                        {selectedConvo.initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground leading-tight">{selectedConvo.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{selectedConvo.propertyName}{selectedConvo.unitDesignation ? ` · ${selectedConvo.unitDesignation}` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Konversation wählen</span>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {!selectedConvo && (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">Konversation wählen</p>
                  </div>
                )}
                {selectedConvo && messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-xs">Noch keine Nachrichten.</div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                    <div className="max-w-[80%]">
                      {msg.direction !== 'outbound' && (
                        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.senderName}</p>
                      )}
                      <div className={cn(
                        'px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                        msg.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted/60 border border-border/50 text-foreground rounded-bl-md'
                      )}>
                        {msg.message}
                        {msg.attachments?.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {msg.attachments.map(att => (
                              <a key={att.id} href={att.filePath} target="_blank" rel="noopener"
                                className={cn(
                                  'flex items-center gap-1.5 p-1.5 rounded-lg text-[10px]',
                                  msg.direction === 'outbound' ? 'bg-white/15 hover:bg-white/25' : 'bg-muted/50 hover:bg-muted'
                                )}>
                                {att.mimeType?.startsWith('image/') ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                <span className="truncate">{att.fileName}</span>
                                <span className="opacity-60">{formatFileSize(att.fileSize)}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={cn('text-[9px] text-muted-foreground mt-0.5', msg.direction === 'outbound' && 'text-right')}>
                        {formatTime(msg.createdAt)}
                        {msg.direction === 'outbound' && <span className="ml-1 opacity-60">✓✓</span>}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConvo && (
                <div className="p-2.5 border-t border-border/50 bg-card flex-shrink-0">
                  <div className="flex items-end gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Paperclip className={cn('w-4 h-4', uploading ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
                    <textarea
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Nachricht..."
                      rows={1}
                      className="flex-1 text-sm resize-none min-h-[36px] max-h-[80px] bg-muted/30 border border-border/50 rounded-xl px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sending}
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300',
          isOpen
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground hover:shadow-primary/25'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </>
        )}
      </motion.button>
    </div>
  )
}
