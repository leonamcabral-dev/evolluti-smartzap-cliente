'use client';

import React from 'react';
import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import type { WizardStepConnectProps } from './types';

export function WizardStepConnect({
  calendarCredsStatus,
  calendarAuthStatus,
  calendarConnectLoading,
  handleConnectCalendar,
  handleDisconnectCalendar,
  fetchCalendarAuthStatus,
}: WizardStepConnectProps) {
  const isConnected = calendarAuthStatus?.connected;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Conectar conta Google</h2>
          <p className="mt-1 text-gray-400">Autorize o acesso ao Google Calendar.</p>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-sm text-emerald-400">
            <Check size={16} /> Conectado
          </span>
        )}
      </div>

      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
        {isConnected ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="font-medium text-white">Conta conectada</p>
            <p className="text-sm text-gray-400 mt-1">{calendarAuthStatus?.calendar?.accountEmail}</p>
            
            <div className="flex justify-center gap-2 mt-4">
              <button type="button" onClick={fetchCalendarAuthStatus} className="h-9 px-3 rounded-lg border border-white/10 text-sm text-white hover:bg-white/5">
                Verificar
              </button>
              <button type="button" onClick={handleDisconnectCalendar} className="h-9 px-3 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10">
                Desconectar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 mb-4">Clique para autorizar o acesso ao Calendar.</p>
            
            {!calendarCredsStatus?.isConfigured ? (
              <p className="text-sm text-amber-400">Configure as credenciais primeiro.</p>
            ) : (
              <button
                type="button"
                onClick={handleConnectCalendar}
                disabled={calendarConnectLoading}
                className="h-10 px-6 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {calendarConnectLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Conectando...</>
                ) : (
                  <><ExternalLink className="w-4 h-4" /> Conectar com Google</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
