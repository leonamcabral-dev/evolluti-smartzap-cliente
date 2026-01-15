'use client';

import React from 'react';
import { Check, RefreshCw } from 'lucide-react';
import type { WizardStepCalendarSelectionProps } from './types';

export function WizardStepCalendarSelection({
  calendarAuthStatus,
  calendarList,
  calendarListLoading,
  calendarListError,
  calendarSelectionId,
  calendarSelectionSaving,
  calendarListQuery,
  filteredCalendarList,
  selectedCalendarTimeZone,
  setCalendarSelectionId,
  setCalendarListQuery,
  fetchCalendarList,
  handleSaveCalendarSelection,
}: WizardStepCalendarSelectionProps) {
  const hasCalendar = !!calendarAuthStatus?.calendar?.calendarId;

  if (!calendarAuthStatus?.connected) {
    return (
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
        Conecte o Google Calendar primeiro.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Escolher calendario</h2>
          <p className="mt-1 text-gray-400">Selecione qual calendario usar.</p>
        </div>
        {hasCalendar && (
          <span className="flex items-center gap-1 text-sm text-emerald-400">
            <Check size={16} /> {calendarAuthStatus?.calendar?.calendarSummary}
          </span>
        )}
      </div>

      {calendarListLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : calendarListError ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {calendarListError}
        </div>
      ) : calendarList.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-400 mb-3">Nenhum calendario encontrado.</p>
          <button type="button" onClick={fetchCalendarList} className="text-sm text-emerald-400 hover:text-emerald-300">
            Atualizar lista
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Buscar</label>
            <input
              type="text"
              value={calendarListQuery}
              onChange={(e) => setCalendarListQuery(e.target.value)}
              placeholder="Filtrar calendarios..."
              className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Calendario</label>
            <select
              value={calendarSelectionId}
              onChange={(e) => setCalendarSelectionId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm"
            >
              <option value="">Selecione...</option>
              {filteredCalendarList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.summary || item.id}{item.primary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCalendarTimeZone && (
            <p className="text-sm text-gray-500">
              Fuso: <code className="text-emerald-400">{selectedCalendarTimeZone}</code>
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={fetchCalendarList} className="text-sm text-gray-400 hover:text-white">
              Atualizar lista
            </button>
            <button
              type="button"
              onClick={handleSaveCalendarSelection}
              disabled={!calendarSelectionId || calendarSelectionSaving}
              className="h-10 px-5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {calendarSelectionSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
