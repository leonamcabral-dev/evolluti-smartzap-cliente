'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export function WizardStepChecklist() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Vamos comecar!</h2>
        <p className="mt-2 text-gray-400">
          Em 3 passos voce conecta o Google Calendar e habilita agendamentos automaticos.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium text-sm flex-shrink-0">1</div>
          <div>
            <div className="font-medium text-white">Credenciais OAuth</div>
            <div className="text-sm text-gray-400">Crie um projeto no Google Cloud e obtenha Client ID e Secret.</div>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium text-sm flex-shrink-0">2</div>
          <div>
            <div className="font-medium text-white">Conectar conta</div>
            <div className="text-sm text-gray-400">Autorize o SmartZap a acessar seu Google Calendar.</div>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium text-sm flex-shrink-0">3</div>
          <div>
            <div className="font-medium text-white">Escolher calendario</div>
            <div className="text-sm text-gray-400">Selecione qual calendario usar para os agendamentos.</div>
          </div>
        </div>
      </div>

      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
      >
        <ExternalLink size={16} />
        Abrir Google Cloud Console
      </a>
    </div>
  );
}
