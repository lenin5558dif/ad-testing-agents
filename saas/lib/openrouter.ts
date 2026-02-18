import OpenAI from 'openai'
import pino from 'pino'

const logger = pino({ name: 'openrouter' })

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

interface CallLLMOptions {
  systemPrompt: string
  userPrompt: string
  model: string
  temperature: number
  maxTokens: number
}

export async function callLLM(options: CallLLMOptions): Promise<string> {
  const { systemPrompt, userPrompt, model, temperature, maxTokens } = options
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const start = Date.now()

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      })

      const latency = Date.now() - start
      const content = response.choices[0]?.message?.content || ''
      const tokens = response.usage?.total_tokens || 0

      logger.info({ model, tokens, latency, attempt }, 'LLM call success')

      return content
    } catch (error) {
      const isLast = attempt === maxRetries
      logger.error({ model, attempt, error: String(error) }, 'LLM call failed')

      if (isLast) throw error

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}
