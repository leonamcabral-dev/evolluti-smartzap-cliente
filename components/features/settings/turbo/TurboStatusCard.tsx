'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface WhatsAppThrottleConfig {
  enabled: boolean;
  sendConcurrency?: number;
  batchSize?: number;
  startMps: number;
  maxMps: number;
  minMps: number;
  cooldownSec: number;
  minIncreaseGapSec: number;
  sendFloorDelayMs: number;
}

interface WhatsAppThrottleState {
  targetMps: number;
  cooldownUntil?: string | null;
  lastIncreaseAt?: string | null;
  lastDecreaseAt?: string | null;
  updatedAt?: string | null;
}

export interface TurboStatusCardProps {
  loading?: boolean;
  config?: WhatsAppThrottleConfig;
  state?: WhatsAppThrottleState | null;
  source?: 'db' | 'env';
}

export function TurboStatusCard({
  loading,
  config,
  state,
  source,
}: TurboStatusCardProps) {
  return (
    <div className="bg-[var(--ds-bg-elevated)] border border-[var(--ds-border-default)] rounded-xl p-4">
      <div className="text-xs text-[var(--ds-text-muted)]">Status</div>
      {loading ? (
        <div className="mt-2 text-sm text-[var(--ds-text-secondary)] flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="mt-2">
          <div className="text-sm text-[var(--ds-text-primary)]">
            {config?.enabled ? (
              <span className="text-emerald-300 font-medium">Ativo</span>
            ) : (
              <span className="text-[var(--ds-text-secondary)] font-medium">Inativo</span>
            )}
            <span className="text-[var(--ds-text-muted)]"> . </span>
            <span className="text-xs text-[var(--ds-text-secondary)]">fonte: {source || '-'}</span>
          </div>
          <div className="mt-2 text-xs text-[var(--ds-text-secondary)]">
            Target atual: <span className="font-mono text-[var(--ds-text-primary)]">{typeof state?.targetMps === 'number' ? state.targetMps : '-'}</span> mps
          </div>
          {state?.cooldownUntil && (
            <div className="mt-1 text-xs text-amber-300">
              Cooldown ate: <span className="font-mono">{new Date(state.cooldownUntil).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
