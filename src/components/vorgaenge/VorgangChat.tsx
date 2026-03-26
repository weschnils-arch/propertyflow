'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Lock } from 'lucide-react'

interface Message {
  id: string
  message: string
  type: string
  direction: string
  senderName: string | null
  senderRole: string | null
  isRead: boolean
  createdAt: string
  attachments: { id: string; fileName: string; fileSize: number }[]
}

interface VorgangChatProps {
  vorgangId: string
  messages: Message[]
  onMessageSent: () => void
  readOnly?: boolean
}

export default function VorgangChat({ vorgangId, messages, onMessageSent, readOnly }: VorgangChatProps) {
  const [text, setText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/vorgaenge/${vorgangId}/communicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim(), isInternal }),
    })
    if (res.ok) {
      setText('')
      onMessageSent()
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <div className="text-center text-white/30 py-10 text-sm">Noch keine Nachrichten</div>
        )}
        {messages.map(msg => {
          const isNote = msg.type === 'note'
          const isOutbound = msg.direction === 'outbound'
          if (isNote && readOnly) return null
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${isNote ? 'bg-amber-500/10 border border-amber-500/20' : isOutbound ? 'bg-blue-600/20 border border-blue-500/20' : 'bg-white/5 border border-white/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white/70">{msg.senderName || 'System'}</span>
                  {msg.senderRole && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">{msg.senderRole}</span>}
                  {isNote && <span title="Interne Notiz"><Lock className="w-3 h-3 text-amber-400" /></span>}
                </div>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.message}</p>
                <div className="text-[10px] text-white/30 mt-1 text-right">{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {!readOnly && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsInternal(!isInternal)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isInternal ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/40 hover:text-white/60'} transition-colors`}
            >
              <Lock className="w-3 h-3" />
              {isInternal ? 'Interne Notiz' : 'Nachricht'}
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isInternal ? 'Interne Notiz schreiben...' : 'Nachricht schreiben...'}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
