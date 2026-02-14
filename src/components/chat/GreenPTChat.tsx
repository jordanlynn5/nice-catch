import { useState, useRef, useEffect } from 'react'
import { chatWithContext } from '@/services/api/greenPT'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  speciesContext?: string
}

export function GreenPTChat({ speciesContext }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)

    const response = await chatWithContext(text, speciesContext)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: response ?? 'Lo siento, el asistente no está disponible ahora mismo.',
      },
    ])
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-deep transition-colors z-40"
        aria-label="Abrir chat de sostenibilidad"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Asistente GreenPT</p>
          {speciesContext && (
            <p className="text-xs opacity-75 truncate">Sobre: {speciesContext}</p>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            Pregúntame sobre la sostenibilidad de esta especie
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-primary/10 text-gray-800 ml-auto'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-3 py-2">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta..."
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="bg-primary text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  )
}
