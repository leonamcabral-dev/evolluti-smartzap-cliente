'use client'

/**
 * T034: ConversationItem - Preview card with avatar, name, last message, time, badges
 * Memoized for performance in virtual lists
 */

import React, { memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { InboxConversation } from '@/types'

export interface ConversationItemProps {
  conversation: InboxConversation
  isSelected: boolean
  onClick: () => void
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const {
    phone,
    contact,
    mode,
    status,
    unread_count,
    last_message_preview,
    last_message_at,
    labels,
    ai_agent,
  } = conversation

  // Agent display name for bot mode
  const agentName = ai_agent?.name

  // Display name: contact name or phone
  const displayName = contact?.name || phone
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Format time
  const timeAgo = last_message_at
    ? formatDistanceToNow(new Date(last_message_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : ''

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 text-left',
        'hover:bg-[var(--ds-bg-hover)] transition-colors',
        'border-b border-[var(--ds-border-default)]',
        isSelected && 'bg-[var(--ds-bg-elevated)] border-l-2 border-l-primary-500',
        unread_count > 0 && !isSelected && 'bg-[var(--ds-bg-surface)]'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-[var(--ds-bg-surface)] text-[var(--ds-text-primary)] text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row: name + time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm',
              unread_count > 0 ? 'font-semibold text-[var(--ds-text-primary)]' : 'text-[var(--ds-text-primary)]'
            )}
          >
            {displayName}
          </span>
          <span className="text-xs text-[var(--ds-text-muted)] shrink-0">{timeAgo}</span>
        </div>

        {/* Message preview */}
        <p
          className={cn(
            'text-xs truncate mt-0.5',
            unread_count > 0 ? 'text-[var(--ds-text-primary)]' : 'text-[var(--ds-text-muted)]'
          )}
        >
          {last_message_preview || 'Sem mensagens'}
        </p>

        {/* Footer: badges */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {/* Mode badge - shows agent name when in bot mode */}
          {mode === 'bot' ? (
            <Badge variant="outline" className="h-5 text-[10px] px-1.5 gap-1 border-blue-500/50 text-blue-400 max-w-[120px]">
              <Bot className="h-3 w-3 shrink-0" />
              <span className="truncate">{agentName || 'Bot'}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 text-[10px] px-1.5 gap-1 border-amber-500/50 text-amber-400">
              <User className="h-3 w-3" />
              Humano
            </Badge>
          )}

          {/* Status badge if closed */}
          {status === 'closed' && (
            <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
              Fechada
            </Badge>
          )}

          {/* Unread badge */}
          {unread_count > 0 && (
            <Badge className="h-5 text-[10px] px-1.5 bg-primary-500">
              {unread_count > 99 ? '99+' : unread_count}
            </Badge>
          )}

          {/* Labels (show first 2) */}
          {labels?.slice(0, 2).map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="h-5 text-[10px] px-1.5"
              style={{
                borderColor: label.color,
                color: label.color,
              }}
            >
              {label.name}
            </Badge>
          ))}
          {labels && labels.length > 2 && (
            <span className="text-[10px] text-[var(--ds-text-muted)]">+{labels.length - 2}</span>
          )}
        </div>
      </div>
    </button>
  )
})
