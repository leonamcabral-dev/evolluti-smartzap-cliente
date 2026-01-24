/**
 * Configuração dos Testes de API da AI
 *
 * Define URLs, timeouts e mensagens de teste.
 */

export interface AITestConfig {
  /** URL do endpoint de teste */
  baseUrl: string

  /** API key para autenticação */
  apiKey: string

  /** Timeout para cada teste (ms) */
  timeout: number

  /** ID do agente a testar (opcional - usa default) */
  agentId?: string
}

/**
 * Carrega configuração do ambiente
 */
export function loadConfig(): AITestConfig {
  const baseUrl = process.env.AI_TEST_BASE_URL || 'http://localhost:3000'
  const apiKey = process.env.SMARTZAP_API_KEY

  if (!apiKey) {
    throw new Error(`
Missing required environment variable for AI API tests:
  - SMARTZAP_API_KEY: Required for authentication

Please set this in your .env.test.local file:
  SMARTZAP_API_KEY=your_api_key
`)
  }

  return {
    baseUrl,
    apiKey,
    timeout: parseInt(process.env.AI_TEST_TIMEOUT || '60000', 10),
    agentId: process.env.AI_TEST_AGENT_ID,
  }
}

/**
 * Timeouts para diferentes cenários
 */
export const TIMEOUTS = {
  /** Resposta simples (saudação) */
  simpleResponse: 30000,

  /** Resposta com RAG (busca na knowledge base) */
  ragResponse: 60000,

  /** Conversa multi-turno */
  multiTurn: 90000,
}

/**
 * Mensagens de teste padronizadas
 */
export const TEST_MESSAGES = {
  /** Saudações */
  greetings: [
    'Olá!',
    'Oi, tudo bem?',
    'Bom dia!',
  ],

  /** Perguntas que devem acionar RAG */
  ragQueries: [
    'Qual o horário de funcionamento?',
    'Quais são os produtos disponíveis?',
    'Como faço para comprar?',
  ],

  /** Perguntas que devem acionar handoff */
  handoffTriggers: [
    'Quero falar com um atendente humano',
    'Preciso de ajuda urgente, não estou conseguindo resolver',
    'Isso é muito complicado, quero falar com uma pessoa',
  ],

  /** Mensagens de frustração */
  frustratedMessages: [
    'Não estou entendendo nada!',
    'Isso não me ajudou em nada',
    'Você não está me ajudando!',
  ],
}

/**
 * Padrões de resposta esperados
 */
export const EXPECTED_PATTERNS = {
  /** Resposta deve ser cordial */
  greeting: /ol[áa]|oi|bem.vindo|como posso|ajudar/i,

  /** Resposta deve ser relevante à pergunta */
  relevant: /.{20,}/, // Pelo menos 20 caracteres

  /** Sentimentos válidos */
  validSentiments: ['positive', 'neutral', 'negative', 'frustrated'],
}
