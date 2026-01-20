'use client'

/**
 * T058: AIAgentForm - Create/Edit form for AI agents
 * Form with all agent configuration options
 */

import React, { useState, useEffect } from 'react'
import { Bot, Save, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import type { AIAgent } from '@/types'
import type { CreateAIAgentParams, UpdateAIAgentParams } from '@/services/aiAgentService'
import { AI_AGENT_MODELS, DEFAULT_MODEL_ID } from '@/lib/ai/model'

// Default system prompt template
const DEFAULT_SYSTEM_PROMPT = `Você é um assistente virtual da empresa [NOME_EMPRESA].

Sua função é:
- Responder dúvidas dos clientes de forma educada e profissional
- Ajudar com informações sobre produtos e serviços
- Agendar atendimentos quando necessário
- Transferir para um atendente humano quando o assunto exigir

Regras:
- Sempre responda em português do Brasil
- Seja cordial e empático
- Se não souber a resposta, admita e ofereça alternativas
- Nunca invente informações sobre preços ou disponibilidade`

export interface AIAgentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: AIAgent | null
  onSubmit: (params: CreateAIAgentParams | UpdateAIAgentParams) => Promise<void>
  isSubmitting?: boolean
}

export function AIAgentForm({
  open,
  onOpenChange,
  agent,
  onSubmit,
  isSubmitting,
}: AIAgentFormProps) {
  const isEditing = !!agent

  // Form state
  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL_ID)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [debounceMs, setDebounceMs] = useState(5000)
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setSystemPrompt(agent.system_prompt)
      setModel(agent.model)
      setTemperature(agent.temperature)
      setMaxTokens(agent.max_tokens)
      setDebounceMs(agent.debounce_ms)
      setIsActive(agent.is_active)
      setIsDefault(agent.is_default)
    } else {
      // Reset to defaults for new agent
      setName('')
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
      setModel(DEFAULT_MODEL_ID)
      setTemperature(0.7)
      setMaxTokens(1024)
      setDebounceMs(5000)
      setIsActive(true)
      setIsDefault(false)
    }
  }, [agent, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const params: CreateAIAgentParams = {
      name,
      system_prompt: systemPrompt,
      model,
      temperature,
      max_tokens: maxTokens,
      debounce_ms: debounceMs,
      is_active: isActive,
      is_default: isDefault,
    }

    await onSubmit(params)
  }

  // Get selected model info
  const selectedModel = AI_AGENT_MODELS.find((m) => m.id === model)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
        {/* Header fixo */}
        <SheetHeader className="border-b border-zinc-800 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary-400" />
            {isEditing ? 'Editar Agente' : 'Novo Agente IA'}
          </SheetTitle>
          <SheetDescription>
            Configure o comportamento do agente de atendimento automático
          </SheetDescription>
        </SheetHeader>

        {/* Conteúdo com scroll */}
        <form
          id="agent-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto"
        >
          <div className="space-y-6 px-6 py-6">
            {/* ═══════════════════════════════════════════════════════════════
                SEÇÃO: Identificação
            ═══════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Agente</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Atendente Virtual"
                  required
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Modelo IA</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_AGENT_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.id === DEFAULT_MODEL_ID && (
                            <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
                              Recomendado
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-xs text-zinc-500">{selectedModel.description}</p>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SEÇÃO: System Prompt
            ═══════════════════════════════════════════════════════════════ */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-400" />
                <Label htmlFor="systemPrompt">System Prompt</Label>
              </div>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Descreva como o agente deve se comportar..."
                className="min-h-[180px] resize-none font-mono text-sm"
                required
              />
              <p className="text-xs text-zinc-500">
                Instruções que definem a personalidade e comportamento do agente
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SEÇÃO: Parâmetros Avançados
            ═══════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">
                  Parâmetros Avançados
                </span>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Temperature</Label>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {temperature.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Focado</span>
                  <span>Criativo</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max Tokens</Label>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {maxTokens}
                  </span>
                </div>
                <Slider
                  value={[maxTokens]}
                  onValueChange={([v]) => setMaxTokens(v)}
                  min={256}
                  max={4096}
                  step={128}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Curto (256)</span>
                  <span>Longo (4096)</span>
                </div>
              </div>

              {/* Debounce */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Debounce</Label>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {debounceMs / 1000}s
                  </span>
                </div>
                <Slider
                  value={[debounceMs]}
                  onValueChange={([v]) => setDebounceMs(v)}
                  min={1000}
                  max={15000}
                  step={1000}
                  className="w-full"
                />
                <p className="text-[10px] text-zinc-600">
                  Aguarda mensagens consecutivas antes de responder
                </p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SEÇÃO: Status
            ═══════════════════════════════════════════════════════════════ */}
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive" className="text-sm">
                    Agente ativo
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Desativar impede uso em conversas
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <div>
                  <Label htmlFor="isDefault" className="text-sm">
                    Definir como padrão
                  </Label>
                  <p className="text-xs text-zinc-500">
                    {isDefault
                      ? 'Este agente é usado em novas conversas'
                      : 'Usado automaticamente em novas conversas'}
                  </p>
                </div>
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer fixo */}
        <SheetFooter className="border-t border-zinc-800 px-6 py-4">
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="agent-form"
              disabled={isSubmitting || !name || !systemPrompt}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Salvar' : 'Criar Agente'}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
