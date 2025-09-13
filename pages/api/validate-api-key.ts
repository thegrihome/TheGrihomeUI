import { NextApiRequest, NextApiResponse } from 'next'

interface ValidateApiKeyRequest {
  llmType: 'chatgpt' | 'claude' | 'perplexity'
  apiKey: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { llmType, apiKey }: ValidateApiKeyRequest = req.body

  if (!llmType || !apiKey) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    let isValid = false

    switch (llmType) {
      case 'chatgpt':
        isValid = await validateOpenAIKey(apiKey)
        break
      case 'claude':
        isValid = await validateAnthropicKey(apiKey)
        break
      case 'perplexity':
        isValid = await validatePerplexityKey(apiKey)
        break
      default:
        return res.status(400).json({ message: 'Invalid LLM type' })
    }

    if (isValid) {
      res.status(200).json({ valid: true, message: 'API key is valid' })
    } else {
      res.status(401).json({ valid: false, message: 'Invalid API key' })
    }
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Error validating API key' })
  }
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    })
    // Even if the request fails due to insufficient tokens, a 400 with proper auth means the key is valid
    return response.status !== 401 && response.status !== 403
  } catch {
    return false
  }
}

async function validatePerplexityKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-small-32k-online',
        messages: [{ role: 'user', content: 'test' }],
      }),
    })
    return response.status !== 401 && response.status !== 403
  } catch {
    return false
  }
}
