import { useState, useCallback } from 'react'
import { sendChatMessage, analyzePhotoForChat, type ChatMessage } from '@/services/api/chatAssistant'
import { buildSystemPrompt } from '@/services/ai/fishKnowledge'
import { useI18n } from '@/hooks/useI18n'
import type { ParsedLabel } from '@/types/species'

export function useChatAssistant() {
  const { language } = useI18n()
  const initialGreeting = language === 'en'
    ? 'Hi! I\'ll help you check the sustainability of your fish. What product do you have?'
    : '¡Hola! Te ayudaré a verificar la sostenibilidad de tu pescado. ¿Qué producto tienes?'

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: buildSystemPrompt(language) },
    {
      role: 'assistant',
      content: initialGreeting,
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
        console.log('🤖 AI response:', response)

        // Check if AI is ready with extracted data (JSON response)
        if (response.includes('"ready"') || response.includes('```json')) {
          try {
            // Extract JSON from response (handle markdown code blocks and surrounding text)
            let jsonStr = response

            // Try to extract from markdown code block first
            const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
            if (codeBlockMatch) {
              jsonStr = codeBlockMatch[1].trim()
              console.log('📦 Extracted from code block:', jsonStr)
            } else {
              // Try to find JSON object in the text
              const jsonMatch = response.match(/\{[\s\S]*"ready"[\s\S]*\}/)
              if (jsonMatch) {
                jsonStr = jsonMatch[0]
                console.log('📦 Extracted from text:', jsonStr)
              }
            }

            const parsed = JSON.parse(jsonStr.trim())
            console.log('✅ Parsed JSON successfully:', parsed)

            if (parsed.ready && parsed.data) {
              setExtractedData(parsed.data)
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: 'Perfect! I have all the details. Tap "Calculate Score" to see the sustainability rating.',
                },
              ])
              console.log('🎯 Data extracted, showing Calculate button')
              return
            } else {
              console.warn('⚠️ JSON missing ready or data fields:', parsed)
            }
          } catch (err) {
            // Not valid JSON, treat as normal message
            console.error('❌ Failed to parse AI JSON response:', err)
            console.error('❌ Attempted to parse:', response)
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
    const greeting = language === 'en'
      ? 'Hi! I\'ll help you check the sustainability of your fish. What product do you have?'
      : '¡Hola! Te ayudaré a verificar la sostenibilidad de tu pescado. ¿Qué producto tienes?'

    setMessages([
      { role: 'system', content: buildSystemPrompt(language) },
      {
        role: 'assistant',
        content: greeting,
      },
    ])
    setExtractedData(null)
  }, [language])

  return {
    messages: messages.filter((m) => m.role !== 'system'), // Don't show system prompt to user
    loading,
    extractedData,
    sendMessage,
    sendPhoto,
    reset,
  }
}
