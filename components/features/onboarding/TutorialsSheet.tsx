'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  HelpCircle,
  Check,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingStep } from './hooks/useOnboardingProgress'

interface TutorialItem {
  id: OnboardingStep
  number: number
  title: string
  description: string
  duration: string
  group: 'create' | 'connect' | 'start'
}

const TUTORIALS: TutorialItem[] = [
  // Grupo: Criar App
  {
    id: 'requirements',
    number: 1,
    title: 'Requisitos',
    description: 'Conta Meta Business verificada',
    duration: '2min',
    group: 'create',
  },
  {
    id: 'create-app',
    number: 2,
    title: 'Criar App Meta',
    description: 'Crie um app no Meta for Developers',
    duration: '5min',
    group: 'create',
  },
  {
    id: 'add-whatsapp',
    number: 3,
    title: 'Adicionar WhatsApp',
    description: 'Ative o produto WhatsApp Business API',
    duration: '3min',
    group: 'create',
  },
  // Grupo: Conectar
  {
    id: 'credentials',
    number: 4,
    title: 'Copiar Credenciais',
    description: 'Phone ID, Business ID e Token',
    duration: '2min',
    group: 'connect',
  },
  {
    id: 'test-connection',
    number: 5,
    title: 'Testar Conexão',
    description: 'Valide se as credenciais funcionam',
    duration: '1min',
    group: 'connect',
  },
  {
    id: 'configure-webhook',
    number: 6,
    title: 'Configurar Webhook',
    description: 'Receba notificações de entrega',
    duration: '3min',
    group: 'connect',
  },
  // Grupo: Primeiros Passos
  {
    id: 'sync-templates',
    number: 7,
    title: 'Sincronizar Templates',
    description: 'Importe seus templates aprovados',
    duration: '1min',
    group: 'start',
  },
  {
    id: 'send-first-message',
    number: 8,
    title: 'Enviar Mensagem Teste',
    description: 'Teste o envio de mensagens',
    duration: '2min',
    group: 'start',
  },
  {
    id: 'create-permanent-token',
    number: 9,
    title: 'Token Permanente',
    description: 'Evite interrupções por expiração',
    duration: '5min',
    group: 'start',
  },
]

const GROUP_LABELS = {
  create: 'Criar App',
  connect: 'Conectar',
  start: 'Primeiros Passos',
}

interface TutorialsSheetProps {
  completedSteps?: OnboardingStep[]
  currentStep?: OnboardingStep | null
  onOpenStep?: (step: OnboardingStep) => void
}

export function TutorialsSheet({
  completedSteps = [],
  currentStep = null,
  onOpenStep,
}: TutorialsSheetProps) {
  const [open, setOpen] = useState(false)

  // Encontra o primeiro step não completado como "current" se não foi passado
  const effectiveCurrentStep = currentStep || TUTORIALS.find(t => !completedSteps.includes(t.id))?.id || null

  const getStepStatus = (stepId: OnboardingStep) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (effectiveCurrentStep === stepId) return 'current'
    return 'pending'
  }

  const handleStepClick = (step: OnboardingStep) => {
    setOpen(false)
    onOpenStep?.(step)
  }

  const completedCount = completedSteps.length
  const totalCount = TUTORIALS.length

  const groupedTutorials = {
    create: TUTORIALS.filter(t => t.group === 'create'),
    connect: TUTORIALS.filter(t => t.group === 'connect'),
    start: TUTORIALS.filter(t => t.group === 'start'),
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="p-1.5 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-subtle)] rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
          aria-label="Tutoriais de Configuração"
        >
          <HelpCircle size={20} />
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">Configuração</SheetTitle>

          {/* Progress - mais proeminente */}
          <div className="mt-4 space-y-3">
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  completedCount === totalCount
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
                )}
                style={{ width: `${Math.max((completedCount / totalCount) * 100, 2)}%` }}
              />
            </div>
            <p className="text-sm text-zinc-400">
              {completedCount === 0 ? (
                "Vamos começar?"
              ) : completedCount === totalCount ? (
                <span className="text-emerald-400 font-medium">Tudo pronto!</span>
              ) : (
                <><span className="text-white font-medium">{completedCount}</span> de {totalCount} completos</>
              )}
            </p>
          </div>
        </SheetHeader>

        <div className="space-y-8 px-4">
          {(Object.keys(groupedTutorials) as Array<keyof typeof groupedTutorials>).map((groupKey) => (
            <div key={groupKey}>
              {/* Group header */}
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600 mb-3 px-1">
                {GROUP_LABELS[groupKey]}
              </p>

              {/* Group items */}
              <div className="space-y-2.5">
                {groupedTutorials[groupKey].map((tutorial) => {
                  const status = getStepStatus(tutorial.id)
                  const isCurrent = status === 'current'
                  const isCompleted = status === 'completed'

                  return (
                    <button
                      key={tutorial.id}
                      onClick={() => handleStepClick(tutorial.id)}
                      className={cn(
                        'w-full text-left transition-all duration-200 rounded-xl',
                        // Current: destaque máximo
                        isCurrent && 'bg-emerald-500/15 border-2 border-emerald-500/40 p-4',
                        // Completed: discreto
                        isCompleted && 'bg-transparent hover:bg-zinc-800/50 p-3',
                        // Pending: neutro
                        !isCurrent && !isCompleted && 'bg-zinc-800/40 hover:bg-zinc-800/60 p-3'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        <div className={cn(
                          'flex items-center justify-center flex-shrink-0 transition-all',
                          isCurrent && 'w-8 h-8 rounded-full bg-emerald-500 text-white',
                          isCompleted && 'w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500',
                          !isCurrent && !isCompleted && 'w-6 h-6 rounded-full bg-zinc-700 text-zinc-500'
                        )}>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : isCurrent ? (
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                          ) : (
                            <span className="text-xs font-medium">{tutorial.number}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium transition-colors',
                            isCurrent && 'text-white text-base',
                            isCompleted && 'text-zinc-500 text-sm',
                            !isCurrent && !isCompleted && 'text-zinc-300 text-sm'
                          )}>
                            {tutorial.title}
                          </p>

                          {/* Descrição só no current */}
                          {isCurrent && (
                            <p className="text-sm text-emerald-200/70 mt-0.5">
                              {tutorial.description}
                            </p>
                          )}
                        </div>

                        {/* Tempo só no current */}
                        {isCurrent && (
                          <div className="flex items-center gap-1.5 text-emerald-300/80 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm font-medium">{tutorial.duration}</span>
                          </div>
                        )}

                        {/* Chevron para completed/pending */}
                        {!isCurrent && (
                          <ChevronRight className={cn(
                            'w-4 h-4 flex-shrink-0 transition-colors',
                            isCompleted ? 'text-zinc-600' : 'text-zinc-500'
                          )} />
                        )}
                      </div>

                      {/* CTA no current */}
                      {isCurrent && (
                        <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-400 transition-colors">
                          Começar
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Documentation link - mais clean */}
          <div className="pt-4 border-t border-zinc-800/50">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-3 px-1 text-zinc-400 hover:text-zinc-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Documentação Meta</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
