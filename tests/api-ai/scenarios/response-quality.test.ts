/**
 * Teste de API: Qualidade das Respostas
 *
 * Valida que a AI gera respostas de qualidade adequada.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { AIApiClient, type AITestResponse } from '../ai-api-client'
import { TEST_MESSAGES, EXPECTED_PATTERNS, TIMEOUTS } from '../config'

describe('API AI: Qualidade das Respostas', () => {
  let client: AIApiClient
  let isConfigured = false

  beforeAll(async () => {
    try {
      client = new AIApiClient()
      const health = await client.healthCheck()

      if (!health.ok) {
        console.warn(`⚠️  AI API not reachable: ${health.error}`)
        console.warn('   Make sure the dev server is running (npm run dev)')
        return
      }

      isConfigured = true
      console.log('✅ AI API is reachable')
    } catch (error) {
      console.warn('⚠️  AI API not configured. Tests will be skipped.')
      console.warn('   Set SMARTZAP_API_KEY in .env.test.local')
    }
  })

  beforeEach(() => {
    if (isConfigured) {
      client.startNewConversation()
    }
  })

  it('deve responder a saudações de forma cordial', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const greeting = TEST_MESSAGES.greetings[0]
    console.log(`📤 Enviando: "${greeting}"`)

    const result = await client.chat(greeting)

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()
    expect(result.response!.message).toBeTruthy()

    console.log(`📥 Recebido: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`⏱️  Latência: ${result.latencyMs}ms`)
    console.log(`🎭 Sentiment: ${result.response!.sentiment}`)

    // Resposta deve ter conteúdo mínimo
    expect(result.response!.message.length).toBeGreaterThan(5)

    // Sentiment deve ser válido
    expect(EXPECTED_PATTERNS.validSentiments).toContain(result.response!.sentiment)

    // Confidence deve estar no range
    expect(result.response!.confidence).toBeGreaterThanOrEqual(0)
    expect(result.response!.confidence).toBeLessThanOrEqual(1)
  }, TIMEOUTS.simpleResponse)

  it('deve responder perguntas com conteúdo relevante', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const question = TEST_MESSAGES.ragQueries[0]
    console.log(`📤 Enviando: "${question}"`)

    const result = await client.chat(question)

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()

    console.log(`📥 Recebido: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`⏱️  Latência: ${result.latencyMs}ms`)

    // Resposta deve ter conteúdo substancial
    expect(result.response!.message.length).toBeGreaterThan(20)

    // Se usou RAG, deve ter sources
    if (result.response!.sources && result.response!.sources.length > 0) {
      console.log(`📚 Sources usadas: ${result.response!.sources.length}`)
    }
  }, TIMEOUTS.ragResponse)

  it('deve gerar respostas diferentes para perguntas diferentes', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const responses: AITestResponse[] = []

    // Primeira pergunta
    const q1 = 'Olá, bom dia!'
    console.log(`📤 Enviando: "${q1}"`)
    const r1 = await client.chat(q1)
    responses.push(r1)
    console.log(`📥 Recebido: "${r1.response?.message.slice(0, 50)}..."`)

    // Nova conversa para segunda pergunta
    client.startNewConversation()

    // Segunda pergunta (diferente)
    const q2 = 'Quais são as formas de pagamento?'
    console.log(`📤 Enviando: "${q2}"`)
    const r2 = await client.chat(q2)
    responses.push(r2)
    console.log(`📥 Recebido: "${r2.response?.message.slice(0, 50)}..."`)

    // Ambas devem ter sucesso
    expect(responses[0].success).toBe(true)
    expect(responses[1].success).toBe(true)

    // Respostas não devem ser idênticas
    if (responses[0].response && responses[1].response) {
      expect(responses[0].response.message).not.toBe(responses[1].response.message)
    }
  }, TIMEOUTS.simpleResponse * 2)

  it('deve manter latência aceitável', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const message = 'Qual o prazo de entrega?'
    console.log(`📤 Enviando: "${message}"`)

    const result = await client.chat(message)

    console.log(`⏱️  Latência: ${result.latencyMs}ms`)

    expect(result.success).toBe(true)

    // Latência deve ser menor que 30 segundos para perguntas simples
    expect(result.latencyMs).toBeLessThan(30000)

    // Idealmente menor que 10 segundos
    if (result.latencyMs > 10000) {
      console.log(`⚠️  Latência alta: ${result.latencyMs}ms (esperado < 10000ms)`)
    }
  }, TIMEOUTS.simpleResponse)
})
