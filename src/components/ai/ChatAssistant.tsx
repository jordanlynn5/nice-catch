import { useState, useRef, useEffect } from 'react'
import { useChatAssistant } from '@/hooks/useChatAssistant'
import { useCamera } from '@/hooks/useCamera'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useI18n } from '@/hooks/useI18n'
import type { ParsedLabel } from '@/types/species'

interface Props {
  onComplete: (label: ParsedLabel) => void
  onBack: () => void
}

export function ChatAssistant({ onComplete, onBack }: Props) {
  const { messages, loading, extractedData, sendMessage, sendPhoto } = useChatAssistant()
  const [input, setInput] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (showCamera) {
    return <CameraView onCapture={(blob) => { sendPhoto(blob); setShowCamera(false) }} onBack={() => setShowCamera(false)} />
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <button onClick={onBack} className="text-primary text-sm font-medium">
          {t('common.back')}
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">🤖 AI Assistant</h2>
          <p className="text-xs text-gray-500">Fish sustainability helper</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Calculate button when ready */}
      {extractedData && (
        <div className="p-3 bg-teal-50 border-t border-teal-100">
          <button
            onClick={() => onComplete(extractedData)}
            className="w-full bg-gradient-to-r from-primary to-deep text-white py-3.5 rounded-xl font-semibold"
          >
            Calculate Score 🌊
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setShowCamera(true)}
            className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg active:scale-95 transition-transform"
            disabled={loading}
          >
            📷
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

function CameraView({ onCapture, onBack }: { onCapture: (blob: Blob) => void; onBack: () => void }) {
  const { startPreview, capture, stop } = useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (videoRef.current && !started) {
      setStarted(true)
      startPreview(videoRef.current)
    }
    return () => { stop() }
  }, [startPreview, stop, started])

  const handleCapture = async () => {
    const blob = await capture()
    if (blob) onCapture(blob)
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4">
        <button onClick={onBack} className="text-white text-sm">
          ← {t('common.back')}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <video
          ref={videoRef}
          className="w-full max-w-sm rounded-xl"
          autoPlay
          playsInline
          muted
        />
        <button
          onClick={handleCapture}
          className="w-16 h-16 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-primary rounded-full" />
        </button>
      </div>
    </div>
  )
}
