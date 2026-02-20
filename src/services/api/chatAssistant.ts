import ky from 'ky'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const response = await ky
    .post('/api/greenpt', {
      json: { action: 'chat', messages },
      timeout: 20000,
    })
    .json<{ message: string }>()

  return response.message
}

export async function analyzePhotoForChat(imageBlob: Blob): Promise<string> {
  // Convert blob to base64
  const base64 = await blobToBase64(imageBlob)

  const response = await ky
    .post('/api/greenpt', {
      json: {
        action: 'vision',
        image: base64,
        prompt: 'Extract from this fish label: species name, production method (wild/farmed), FAO area, fishing method, and certifications. Return as JSON.',
      },
      timeout: 15000,
    })
    .json<Record<string, unknown>>()

  // Format the vision result as a user-friendly message
  const parts: string[] = []
  if (response.species || response.speciesRaw) {
    parts.push(`Species: ${response.species || response.speciesRaw}`)
  }
  if (response.productionMethod) {
    parts.push(`Production: ${response.productionMethod}`)
  }
  if (response.faoArea) {
    parts.push(`FAO Area: ${response.faoArea}`)
  }
  if (response.fishingMethod) {
    parts.push(`Fishing method: ${response.fishingMethod}`)
  }
  if (response.certifications) {
    parts.push(`Certifications: ${JSON.stringify(response.certifications)}`)
  }

  return parts.length > 0
    ? `From the label photo, I can see:\n${parts.join('\n')}`
    : 'I analyzed the photo but couldn\'t extract clear fish label data. Can you tell me what you see?'
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
