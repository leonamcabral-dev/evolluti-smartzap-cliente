'use client'

/**
 * T037: MessageInput - Textarea + send button + quick replies trigger
 * Ctrl+Enter to send, expandable textarea
 * AI Co-pilot: Suggest button for AI-assisted responses
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QuickRepliesPopover } from './QuickRepliesPopover'
import type { InboxQuickReply } from '@/types'

export interface MessageInputProps {
  onSend: (content: string) => void
  isSending: boolean
  disabled?: boolean
  placeholder?: string
  quickReplies: InboxQuickReply[]
  quickRepliesLoading?: boolean
  /** Conversation ID for AI suggestions */
  conversationId?: string | null
  /** Whether to show AI suggest button */
  showAISuggest?: boolean
}

export function MessageInput({
  onSend,
  isSending,
  disabled,
  placeholder = 'Digite sua mensagem...',
  quickReplies,
  quickRepliesLoading,
  conversationId,
  showAISuggest = false,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [suggestionNotes, setSuggestionNotes] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [value])

  // Handle send
  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isSending || disabled) return

    onSend(trimmed)
    setValue('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isSending, disabled, onSend])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Insert quick reply content
  const handleQuickReplySelect = useCallback((content: string) => {
    setValue((prev) => {
      // If there's existing text, add a space before
      if (prev.trim()) {
        return `${prev.trimEnd()} ${content}`
      }
      return content
    })

    // Focus textarea after inserting
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }, [])

  // AI Suggest handler
  const handleAISuggest = useCallback(async () => {
    if (!conversationId || isLoadingSuggestion || disabled) return

    setIsLoadingSuggestion(true)
    setSuggestionNotes(null)

    try {
      const response = await fetch('/api/inbox/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar sugestão')
      }

      const data = await response.json()

      // Set the suggestion in the textarea
      setValue(data.suggestion)

      // Show notes if available
      if (data.notes) {
        setSuggestionNotes(data.notes)
      }

      // Focus textarea for editing
      setTimeout(() => {
        textareaRef.current?.focus()
        // Move cursor to end
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.value.length
          textareaRef.current.selectionEnd = textareaRef.current.value.length
        }
      }, 0)
    } catch (error) {
      console.error('[AI Suggest] Error:', error)
      // Could show a toast here
    } finally {
      setIsLoadingSuggestion(false)
    }
  }, [conversationId, isLoadingSuggestion, disabled])

  // Clear suggestion notes when value changes manually
  useEffect(() => {
    if (suggestionNotes && value.trim() === '') {
      setSuggestionNotes(null)
    }
  }, [value, suggestionNotes])

  const canSend = value.trim().length > 0 && !isSending && !disabled
  const canSuggest = showAISuggest && conversationId && !isLoadingSuggestion && !disabled

  return (
    <div className="flex flex-col border-t border-[var(--ds-border-default)] bg-[var(--ds-bg-elevated)]">
      {/* AI Suggestion notes */}
      {suggestionNotes && (
        <div className="px-3 pt-2">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <Sparkles className="h-4 w-4 text-primary-400 mt-0.5 shrink-0" />
            <p className="text-xs text-primary-300">{suggestionNotes}</p>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Quick replies */}
        <QuickRepliesPopover
          quickReplies={quickReplies}
          onSelect={handleQuickReplySelect}
          isLoading={quickRepliesLoading}
        />

        {/* AI Suggest button */}
        {showAISuggest && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAISuggest}
                disabled={!canSuggest}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 shrink-0',
                  isLoadingSuggestion && 'animate-pulse',
                  canSuggest
                    ? 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10'
                    : 'text-[var(--ds-text-muted)]'
                )}
              >
                {isLoadingSuggestion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sugestão AI</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Input area */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending || isLoadingSuggestion}
            rows={1}
            className={cn(
              'min-h-[40px] max-h-[150px] resize-none py-2.5 pr-10',
              'bg-[var(--ds-bg-surface)] border-[var(--ds-border-default)]',
              'focus:border-primary-500 focus:ring-primary-500/20'
            )}
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-[var(--ds-text-muted)]">
            Ctrl+Enter
          </span>
        </div>

        {/* Send button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              className={cn(
                'h-10 w-10 shrink-0',
                canSend
                  ? 'bg-primary-500 hover:bg-primary-600'
                  : 'bg-[var(--ds-bg-surface)] text-[var(--ds-text-muted)]'
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{canSend ? 'Enviar mensagem' : 'Digite uma mensagem'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
