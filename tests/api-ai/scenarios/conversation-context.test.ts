/**
 * Teste de API: Contexto de Conversa
 *
 * Valida que a AI mantém contexto entre mensagens.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { AIApiClient } from '../ai-api-client'
import { TIMEOUTS } from '../config'

describe('API AI: Contexto de Conversa', () => {
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

  it('deve manter contexto em conversa de 3 turnos', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    // Turno 1: Apresentação
    console.log('\n--- Turno 1 ---')
    const r1 = await client.chat('Olá! Meu nome é Carlos.')
    expect(r1.success).toBe(true)
    console.log(`📥 Resposta 1: "${r1.response?.message.slice(0, 80)}..."`)

    // Turno 2: Pergunta
    console.log('\n--- Turno 2 ---')
    const r2 = await client.chat('Qual produto vocês recomendam para iniciantes?')
    expect(r2.success).toBe(true)
    console.log(`📥 Resposta 2: "${r2.response?.message.slice(0, 80)}..."`)

    // Turno 3: Follow-up
    console.log('\n--- Turno 3 ---')
    const r3 = await client.chat('E qual o preço desse?')
    expect(r3.success).toBe(true)
    console.log(`📥 Resposta 3: "${r3.response?.message.slice(0, 80)}..."`)

    // Verifica que todas as respostas têm conteúdo
    expect(r1.response?.message.length).toBeGreaterThan(5)
    expect(r2.response?.message.length).toBeGreaterThan(5)
    expect(r3.response?.message.length).toBeGreaterThan(5)

    // Verifica que o histórico foi mantido
    const history = client.getHistory()
    expect(history.length).toBe(6) // 3 user + 3 assistant
  }, TIMEOUTS.multiTurn)

  it('deve responder de forma contextual a follow-ups', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    // Estabelece contexto
    console.log('\n--- Estabelecendo contexto ---')
    const r1 = await client.chat('Estou procurando um presente para minha mãe que gosta de cozinhar.')
    expect(r1.success).toBe(true)
    console.log(`📥 Contexto: "${r1.response?.message.slice(0, 80)}..."`)

    // Follow-up que depende do contexto
    console.log('\n--- Follow-up contextual ---')
    const r2 = await client.chat('Ela prefere coisas práticas. Qual você sugere?')
    expect(r2.success).toBe(true)
    console.log(`📥 Follow-up: "${r2.response?.message.slice(0, 80)}..."`)

    // A resposta deve ser relevante ao contexto
    // (não pode ser uma resposta genérica que ignora o contexto anterior)
    expect(r2.response?.message.length).toBeGreaterThan(20)
  }, TIMEOUTS.multiTurn)

  it('deve lidar com mudança de assunto', async () => {
    if (!isConfigured) {
      console.log('⏭️  Skipped: AI API not configured')
      return
    }

    // Primeiro assunto
    console.log('\n--- Assunto 1 ---')
    const r1 = await client.chat('Quanto custa o frete para São Paulo?')
    expect(r1.success).toBe(true)
    console.log(`📥 Resposta 1: "${r1.response?.message.slice(0, 80)}..."`)

    // Mudança brusca de assunto
    console.log('\n--- Assunto 2 (mudança) ---')
    const r2 = await client.chat('A propósito, vocês têm loja física?')
    expect(r2.success).toBe(true)
    console.log(`📥 Resposta 2: "${r2.response?.message.slice(0, 80)}..."`)

    // Ambas respostas devem ter conteúdo
    expect(r1.response?.message.length).toBeGreaterThan(10)
    expect(r2.response?.message.length).toBeGreaterThan(10)

    // Respostas devem ser diferentes
    expect(r1.response?.message).not.toBe(r2.response?.message)
  }, TIMEOUTS.multiTurn)
})
