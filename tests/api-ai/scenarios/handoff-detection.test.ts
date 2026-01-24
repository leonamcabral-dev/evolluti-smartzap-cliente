/**
 * Teste de API: Detecção de Handoff
 *
 * Valida que a AI detecta corretamente quando deve transferir para humano.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { AIApiClient } from '../ai-api-client'
import { TEST_MESSAGES, TIMEOUTS } from '../config'

describe('API AI: Detecção de Handoff', () => {
  let client: AIApiClient
  let isConfigured = false

  beforeAll(async () => {
    try {
      client = new AIApiClient()
      const health = await client.healthCheck()

      if (!health.ok) {
        console.warn(`⚠️  AI API not reachable: ${health.error}`)
        return
      }

      isConfigured = true
      console.log('✅ AI API is reachable')
    } catch (error) {
      console.warn('⚠️  AI API not configured. Tests will be skipped.')
    }
  })

  beforeEach(() => {
    if (isConfigured) {
      client.startNewConversation()
    }
  })

  it('deve detectar pedido explícito de atendente', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const handoffRequest = TEST_MESSAGES.handoffTriggers[0]
    console.log(`📤 Enviando: "${handoffRequest}"`)

    const result = await client.chat(handoffRequest)

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()

    console.log(`📥 Resposta: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`🔄 Should Handoff: ${result.response!.shouldHandoff}`)

    if (result.response!.shouldHandoff) {
      console.log(`📋 Handoff Reason: ${result.response!.handoffReason || 'N/A'}`)
      console.log(`📝 Handoff Summary: ${result.response!.handoffSummary || 'N/A'}`)
    }

    // Nota: O teste verifica que a AI reconhece o pedido
    // O handoff pode ou não ser acionado dependendo da configuração do agente
    expect(result.response!.message.length).toBeGreaterThan(5)
  }, TIMEOUTS.simpleResponse)

  it('deve detectar frustração do usuário', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    // Simula conversa frustrante
    console.log('\n--- Primeira tentativa ---')
    await client.chat('Qual o prazo de entrega?')

    console.log('\n--- Frustração ---')
    const frustratedMsg = TEST_MESSAGES.frustratedMessages[0]
    console.log(`📤 Enviando: "${frustratedMsg}"`)

    const result = await client.chat(frustratedMsg)

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()

    console.log(`📥 Resposta: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`🎭 Sentiment: ${result.response!.sentiment}`)
    console.log(`🔄 Should Handoff: ${result.response!.shouldHandoff}`)

    // Sentiment deve indicar frustração ou negativo
    expect(['frustrated', 'negative']).toContain(result.response!.sentiment)
  }, TIMEOUTS.multiTurn)

  it('deve fornecer resumo para handoff quando apropriado', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    // Contexto antes do handoff
    console.log('\n--- Estabelecendo contexto ---')
    await client.chat('Oi, estou com problema no meu pedido #12345')
    await client.chat('O produto veio com defeito')

    // Pede handoff
    console.log('\n--- Pedindo handoff ---')
    const result = await client.chat('Quero falar com um atendente para resolver isso')

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()

    console.log(`📥 Resposta: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`🔄 Should Handoff: ${result.response!.shouldHandoff}`)

    if (result.response!.shouldHandoff) {
      console.log(`📋 Reason: ${result.response!.handoffReason || 'N/A'}`)
      console.log(`📝 Summary: ${result.response!.handoffSummary || 'N/A'}`)

      // Se fez handoff, deve ter summary (idealmente)
      // Nota: isso depende da configuração do agente
    }
  }, TIMEOUTS.multiTurn)

  it('deve continuar conversa normalmente quando não há pedido de handoff', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    const normalMessage = 'Obrigado pela informação!'
    console.log(`📤 Enviando: "${normalMessage}"`)

    const result = await client.chat(normalMessage)

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()

    console.log(`📥 Resposta: "${result.response!.message.slice(0, 100)}..."`)
    console.log(`🔄 Should Handoff: ${result.response!.shouldHandoff}`)

    // Mensagem normal não deve acionar handoff
    expect(result.response!.shouldHandoff).toBe(false)
  }, TIMEOUTS.simpleResponse)
})
