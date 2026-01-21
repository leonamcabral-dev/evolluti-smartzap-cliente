/**
 * AI Model Configuration
 * Model definitions and schemas for AI agents
 */

import { z } from 'zod'

// =============================================================================
// Model Configuration Schema
// =============================================================================

/**
 * Schema for AI agent call options
 * Used to configure individual agent invocations
 */
export const callOptionsSchema = z.object({
  /** Maximum tokens in the response */
  maxTokens: z.number().int().positive().max(8192).default(2048),
  /** Temperature for response randomness (0-2) */
  temperature: z.number().min(0).max(2).default(0.7),
  /** Top-p sampling parameter */
  topP: z.number().min(0).max(1).optional(),
  /** Stop sequences to end generation */
  stopSequences: z.array(z.string()).optional(),
})

export type CallOptions = z.infer<typeof callOptionsSchema>

// =============================================================================
// Default Model
// =============================================================================

/**
 * Default model for AI agents
 */
export const DEFAULT_MODEL_ID = 'gemini-2.5-flash'

/**
 * Model provider type
 */
export type ModelProvider = 'google' | 'openai' | 'anthropic'

/**
 * Model definition
 */
export interface AIModel {
  id: string
  name: string
  description: string
  provider: ModelProvider
  recommended?: boolean
}

/**
 * Provider info for grouping in UI
 */
export const MODEL_PROVIDERS: Record<ModelProvider, { name: string; icon: string }> = {
  google: { name: 'Google (Gemini)', icon: '🔷' },
  openai: { name: 'OpenAI', icon: '🟢' },
  anthropic: { name: 'Anthropic', icon: '🟠' },
}

/**
 * Available models for AI agents
 * Organized by provider, supports Google, OpenAI, and Anthropic
 *
 * Todos os modelos funcionam com RAG próprio (pgvector)
 */
export const AI_AGENT_MODELS: AIModel[] = [
  // ==========================================================================
  // Google (Gemini)
  // ==========================================================================
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Rápido e eficiente',
    provider: 'google',
    recommended: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Alta qualidade, raciocínio avançado',
    provider: 'google',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Ultra-rápido, baixo custo',
    provider: 'google',
  },

  // ==========================================================================
  // OpenAI
  // ==========================================================================
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Mais inteligente da OpenAI',
    provider: 'openai',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Rápido e econômico',
    provider: 'openai',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Alta capacidade, contexto longo',
    provider: 'openai',
  },

  // ==========================================================================
  // Anthropic
  // ==========================================================================
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Mais recente, excelente raciocínio',
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Rápido e econômico',
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Equilíbrio entre velocidade e qualidade',
    provider: 'anthropic',
  },
]

/**
 * Get models grouped by provider
 */
export function getModelsByProvider(): Record<ModelProvider, AIModel[]> {
  return AI_AGENT_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<ModelProvider, AIModel[]>)
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): AIModel | undefined {
  return AI_AGENT_MODELS.find(m => m.id === modelId)
}

/**
 * @deprecated Use AI_AGENT_MODELS instead
 */
export const SUPPORT_AGENT_MODELS = AI_AGENT_MODELS

// =============================================================================
// Response Schema
// =============================================================================

/**
 * Schema for structured AI responses
 * Ensures consistent response format from the agent
 */
export const supportResponseSchema = z.object({
  /** The response message to send to the user */
  message: z.string().describe('A resposta para enviar ao usuário'),
  /** Sentiment detected in user message */
  sentiment: z
    .enum(['positive', 'neutral', 'negative', 'frustrated'])
    .describe('Sentimento detectado na mensagem do usuário'),
  /** Confidence level in the response (0-1) */
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Nível de confiança na resposta (0 = incerto, 1 = certo)'),
  /** Whether the agent should hand off to a human */
  shouldHandoff: z
    .boolean()
    .describe('Se deve transferir para um atendente humano'),
  /** Reason for handoff if shouldHandoff is true */
  handoffReason: z
    .string()
    .optional()
    .describe('Motivo da transferência para humano'),
  /** Summary of the conversation for handoff */
  handoffSummary: z
    .string()
    .optional()
    .describe('Resumo da conversa para o atendente'),
  /** Sources used to generate the response */
  sources: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .optional()
    .describe('Fontes utilizadas para gerar a resposta'),
})

export type SupportResponse = z.infer<typeof supportResponseSchema>

// =============================================================================
// Default Call Options
// =============================================================================

export const DEFAULT_CALL_OPTIONS: CallOptions = {
  maxTokens: 2048,
  temperature: 0.7,
}
