'use client';

import React from 'react';
import { Check, ExternalLink, Calendar } from 'lucide-react';
import type { WizardSidebarProps } from './types';

const WIZARD_STEPS = [
  { id: 0, label: 'Inicio' },
  { id: 1, label: 'Credenciais' },
  { id: 2, label: 'Conectar' },
  { id: 3, label: 'Calendario' },
];

export function WizardSidebar({
  calendarWizardStep,
  calendarCredsStatus,
  calendarAuthStatus,
  handleCalendarWizardStepClick,
}: WizardSidebarProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId === 0) return 'completed';
    if (stepId === 1) return calendarCredsStatus?.isConfigured ? 'completed' : 'pending';
    if (stepId === 2) return calendarAuthStatus?.connected ? 'completed' : 'pending';
    if (stepId === 3) return calendarAuthStatus?.calendar?.calendarId ? 'completed' : 'pending';
    return 'pending';
  };

  const isStepUnlocked = (stepId: number) => {
    if (stepId === 0 || stepId === 1) return true;
    if (stepId === 2) return !!calendarCredsStatus?.isConfigured;
    if (stepId === 3) return !!calendarAuthStatus?.connected;
    return false;
  };

  return (
    <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 bg-zinc-900/50 p-6 lg:p-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Google Calendar</div>
          <div className="text-xs text-gray-500">Configuracao</div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {WIZARD_STEPS.map((step) => {
          const isActive = calendarWizardStep === step.id;
          const status = getStepStatus(step.id);
          const isUnlocked = isStepUnlocked(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleCalendarWizardStepClick(step.id)}
              disabled={!isUnlocked}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                isActive
                  ? 'bg-emerald-500/15 border border-emerald-500/30'
                  : isUnlocked
                    ? 'hover:bg-white/5 border border-transparent'
                    : 'opacity-40 cursor-not-allowed border border-transparent'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                status === 'completed' && !isActive
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-white/10 text-gray-400'
              }`}>
                {status === 'completed' && !isActive ? (
                  <Check size={14} />
                ) : (
                  step.id + 1
                )}
              </span>
              <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Help */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs font-medium text-white mb-3">Ajuda rapida</div>
        <div className="space-y-2">
          <a
            href="https://developers.google.com/calendar/api/quickstart/js"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink size={12} />
            Guia oficial do Google
          </a>
          <a
            href="https://www.youtube.com/results?search_query=google+calendar+oauth+setup"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink size={12} />
            Videos tutoriais
          </a>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-gray-500">
        Seu progresso fica salvo automaticamente.
      </p>
    </aside>
  );
}
