/**
 * Cliente para API de Teste da AI
 *
 * Wrapper tipado para chamar o endpoint /api/ai/test.
 */

import { loadConfig, type AITestConfig } from './config'

export interface AITestRequest {
  message: string
  agentId?: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  phone?: string
  contactName?: string
}

export interface AITestResponse {
  success: boolean
  response?: {
    message: string
    sentiment: string
    confidence: number
    shouldHandoff: boolean
    handoffReason?: string
    handoffSummary?: string
    sources?: Array<{ title: string; content: string }>
  }
  error?: string
  latencyMs: number
  agentUsed: {
    id: string
    name: string
    model: string
  }
}

export class AIApiClient {
  private config: AITestConfig
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

  constructor(config?: AITestConfig) {
    this.config = config || loadConfig()
  }

  /**
   * URL do endpoint de teste
   */
  private get testUrl(): string {
    return `${this.config.baseUrl}/api/ai/test`
  }

  /**
   * Envia mensagem para a AI
   */
  async sendMessage(message: string, options: Partial<AITestRequest> = {}): Promise<AITestResponse> {
    const request: AITestRequest = {
      message,
      agentId: options.agentId || this.config.agentId,
      conversationHistory: options.conversationHistory || this.conversationHistory,
      phone: options.phone,
      contactName: options.contactName,
    }

    const response = await fetch(this.testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API error: ${response.status} - ${error}`)
    }

    const result = await response.json() as AITestResponse

    // Atualiza histórico se resposta bem-sucedida
    if (result.success && result.response) {
      this.conversationHistory.push({ role: 'user', content: message })
      this.conversationHistory.push({ role: 'assistant', content: result.response.message })
    }

    return result
  }

  /**
   * Envia mensagem e aguarda resposta (alias mais legível)
   */
  async chat(message: string): Promise<AITestResponse> {
    return this.sendMessage(message)
  }

  /**
   * Inicia nova conversa (limpa histórico)
   */
  startNewConversation(): void {
    this.conversationHistory = []
  }

  /**
   * Retorna histórico da conversa atual
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory]
  }

  /**
   * Verifica se o servidor está acessível
   */
  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      // Envia uma mensagem simples para verificar
      const result = await this.sendMessage('ping')
      return { ok: result.success || !!result.error }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Getter para config
   */
  getConfig(): AITestConfig {
    return { ...this.config }
  }
}
