'use client';

import React from 'react';
import { ExternalLink, Check } from 'lucide-react';
import type { WizardStepCredentialsProps } from './types';

export function WizardStepCredentials({
  calendarCredsStatus,
  calendarCredsLoading,
  calendarCredsSaving,
  calendarClientIdDraft,
  calendarClientSecretDraft,
  calendarBaseUrl,
  calendarBaseUrlDraft,
  calendarBaseUrlEditing,
  calendarRedirectUrl,
  calendarClientIdValid,
  calendarClientSecretValid,
  calendarCredsFormValid,
  calendarCredsSourceLabel,
  setCalendarClientIdDraft,
  setCalendarClientSecretDraft,
  setCalendarBaseUrlDraft,
  setCalendarBaseUrlEditing,
  handleSaveCalendarCreds,
  handleRemoveCalendarCreds,
  handleCopyCalendarValue,
}: WizardStepCredentialsProps) {
  if (calendarCredsLoading) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Credenciais OAuth</h2>
          <p className="mt-1 text-gray-400">Cole o Client ID e Client Secret do Google Cloud.</p>
        </div>
        {calendarCredsStatus?.isConfigured && (
          <span className="flex items-center gap-1 text-sm text-emerald-400">
            <Check size={16} /> Configurado
          </span>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4 text-sm">
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
          <ExternalLink size={14} /> Google Cloud Console
        </a>
        <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
          <ExternalLink size={14} /> Ativar Calendar API
        </a>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Client ID</label>
          <input
            type="text"
            value={calendarClientIdDraft}
            onChange={(e) => setCalendarClientIdDraft(e.target.value)}
            placeholder="xxxxx.apps.googleusercontent.com"
            className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm"
          />
          {!calendarClientIdValid && calendarClientIdDraft && (
            <p className="mt-1 text-xs text-amber-400">Deve terminar com .apps.googleusercontent.com</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Client Secret</label>
          <input
            type="password"
            value={calendarClientSecretDraft}
            onChange={(e) => setCalendarClientSecretDraft(e.target.value)}
            placeholder="GOCSPX-..."
            className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-gray-300">Redirect URI</label>
            <button type="button" onClick={() => handleCopyCalendarValue(calendarRedirectUrl, 'Redirect URI')} className="text-xs text-emerald-400 hover:text-emerald-300">
              Copiar
            </button>
          </div>
          <div className="h-10 px-3 rounded-lg bg-zinc-800/50 border border-white/10 flex items-center text-sm text-emerald-400 font-mono overflow-x-auto">
            {calendarRedirectUrl}
          </div>
          <p className="mt-1 text-xs text-gray-500">Cole em "URIs de redirecionamento autorizados" no Google Cloud.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {calendarCredsStatus?.source === 'db' && calendarCredsStatus?.isConfigured ? (
          <button type="button" onClick={handleRemoveCalendarCreds} className="text-sm text-red-400 hover:text-red-300">
            Remover
          </button>
        ) : <div />}
        <button
          type="button"
          onClick={handleSaveCalendarCreds}
          disabled={!calendarCredsFormValid || calendarCredsSaving}
          className="h-10 px-5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {calendarCredsSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
