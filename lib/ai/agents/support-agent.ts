/**
 * Support Agent Debounce Utilities
 *
 * Manages debounce logic for consecutive messages in conversations.
 * The actual AI processing is handled by support-agent-v2.ts using AI SDK v6 patterns.
 *
 * This module is kept for backward compatibility with existing imports.
 */

// =============================================================================
// Debounce Manager
// =============================================================================

/**
 * Track pending responses to implement debounce
 * Key: conversationId, Value: timeout handle and last message timestamp
 */
const pendingResponses = new Map<
  string,
  {
    timeout: NodeJS.Timeout
    lastMessageAt: number
    messageIds: string[]
  }
>()

/**
 * Check if we should wait for more messages (debounce)
 * Returns true if we should delay processing
 */
export function shouldDebounce(
  conversationId: string,
  debounceSec: number = 5
): boolean {
  const pending = pendingResponses.get(conversationId)
  if (!pending) return false

  const elapsed = Date.now() - pending.lastMessageAt
  return elapsed < debounceSec * 1000
}

/**
 * Schedule agent processing with debounce
 * Returns a promise that resolves when processing should begin
 */
export function scheduleWithDebounce(
  conversationId: string,
  messageId: string,
  debounceSec: number = 5
): Promise<string[]> {
  return new Promise((resolve) => {
    const pending = pendingResponses.get(conversationId)

    // Clear existing timeout
    if (pending?.timeout) {
      clearTimeout(pending.timeout)
    }

    // Accumulate message IDs
    const messageIds = pending?.messageIds || []
    messageIds.push(messageId)

    // Set new timeout
    const timeout = setTimeout(() => {
      const accumulated = pendingResponses.get(conversationId)
      pendingResponses.delete(conversationId)
      resolve(accumulated?.messageIds || messageIds)
    }, debounceSec * 1000)

    pendingResponses.set(conversationId, {
      timeout,
      lastMessageAt: Date.now(),
      messageIds,
    })
  })
}

/**
 * Cancel pending debounce for a conversation
 */
export function cancelDebounce(conversationId: string): void {
  const pending = pendingResponses.get(conversationId)
  if (pending?.timeout) {
    clearTimeout(pending.timeout)
    pendingResponses.delete(conversationId)
  }
}

// =============================================================================
// Re-exports from support-agent-v2 for backward compatibility
// =============================================================================

export { processSupportAgentV2 as processSupportAgent } from './support-agent-v2'
export type { SupportAgentConfig, SupportAgentResult } from './support-agent-v2'
export type { SupportResponse } from './support-agent-v2'
