import { useState, useCallback } from 'react'
import { sendChatMessage, analyzePhotoForChat, type ChatMessage } from '@/services/api/chatAssistant'
import { buildSystemPrompt } from '@/services/ai/fishKnowledge'
import type { ParsedLabel } from '@/types/species'

export function useChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: buildSystemPrompt() },
    {
      role: 'assistant',
      content: 'Hi! I\'ll help you check the sustainability of your fish. What product do you have?',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [extractedData, setExtractedData] = useState<ParsedLabel | null>(null)

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ]
      setMessages(newMessages)
      setLoading(true)

      try {
        const response = await sendChatMessage(newMessages)

        // Check if AI is ready with extracted data (JSON response)
        if (response.trim().startsWith('{') || response.includes('"ready"')) {
          try {
            const parsed = JSON.parse(response.replace(/```json\n?|```/g, '').trim())
            if (parsed.ready && parsed.data) {
              setExtractedData(parsed.data)
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: 'Perfect! I have all the details. Tap "Calculate Score" to see the sustainability rating.',
                },
              ])
              return
            }
          } catch {
            // Not valid JSON, treat as normal message
          }
        }

        setMessages([...newMessages, { role: 'assistant', content: response }])
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `Sorry, I encountered an error: ${errorMsg}` },
        ])
        console.error('Chat error:', error)
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  const sendPhoto = useCallback(
    async (blob: Blob) => {
      setLoading(true)
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: '[Photo of fish label]' },
      ])

      try {
        const visionResult = await analyzePhotoForChat(blob)
        const newMessages: ChatMessage[] = [
          ...messages,
          { role: 'user', content: '[Photo of fish label]' },
          { role: 'assistant', content: visionResult },
        ]
        setMessages(newMessages)

        // Ask AI to continue the conversation based on what was extracted
        const followUp = await sendChatMessage([
          ...newMessages,
          {
            role: 'user',
            content: 'Based on what you extracted from the photo, what other details do you need from me?',
          },
        ])

        setMessages([...newMessages, { role: 'assistant', content: followUp }])
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I couldn't analyze that photo. Error: ${errorMsg}`,
          },
        ])
        console.error('Photo analysis error:', error)
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  const reset = useCallback(() => {
    setMessages([
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'assistant',
        content: 'Hi! I\'ll help you check the sustainability of your fish. What product do you have?',
      },
    ])
    setExtractedData(null)
  }, [])

  return {
    messages: messages.filter((m) => m.role !== 'system'), // Don't show system prompt to user
    loading,
    extractedData,
    sendMessage,
    sendPhoto,
    reset,
  }
}
