# SmartZap AI API Tests

Testes da API de IA que validam qualidade das respostas, contexto e detecção de handoff **sem enviar mensagens pelo WhatsApp**.

## O que testa

| Cenário | O que valida |
|---------|--------------|
| `response-quality` | Qualidade das respostas, latência, sentiment |
| `conversation-context` | Manutenção de contexto entre mensagens |
| `handoff-detection` | Detecção de pedidos de transferência para humano |

## Arquitetura

```
POST /api/ai/test
        │
        ▼
┌───────────────────┐
│  Monta conversa   │  (mock, sem salvar no banco)
│  mock             │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  processChatAgent │  (AI real - Gemini/GPT/Claude)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Retorna resposta │  (sem enviar WhatsApp!)
└───────────────────┘
```

## Configuração

### 1. Variáveis de ambiente

```env
# .env.test.local
SMARTZAP_API_KEY=sua_api_key_aqui

# Opcional
AI_TEST_BASE_URL=http://localhost:3000
AI_TEST_TIMEOUT=60000
AI_TEST_AGENT_ID=id_do_agente  # Usa agente padrão se não informado
```

### 2. Dev server rodando

```bash
npm run dev
```

## Uso

```bash
# Executar todos os testes de AI API
npm run test:ai:api

# Modo watch
npm run test:ai:api:watch

# Cenário específico
npx vitest run tests/api-ai/scenarios/response-quality.test.ts
```

## O que cada teste valida

### `response-quality.test.ts`

- ✅ Responde a saudações de forma cordial
- ✅ Responde perguntas com conteúdo relevante
- ✅ Gera respostas diferentes para perguntas diferentes
- ✅ Mantém latência aceitável (< 30s)

### `conversation-context.test.ts`

- ✅ Mantém contexto em conversa de 3 turnos
- ✅ Responde de forma contextual a follow-ups
- ✅ Lida com mudança de assunto

### `handoff-detection.test.ts`

- ✅ Detecta pedido explícito de atendente
- ✅ Detecta frustração do usuário
- ✅ Fornece resumo para handoff
- ✅ Continua normalmente quando não há pedido de handoff

## Exemplo de Request/Response

### Request

```bash
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_API_KEY" \
  -d '{
    "message": "Olá! Qual o horário de funcionamento?",
    "conversationHistory": [
      { "role": "user", "content": "Oi!" },
      { "role": "assistant", "content": "Olá! Como posso ajudar?" }
    ]
  }'
```

### Response

```json
{
  "success": true,
  "response": {
    "message": "Funcionamos de segunda a sexta, das 9h às 18h...",
    "sentiment": "neutral",
    "confidence": 0.85,
    "shouldHandoff": false,
    "sources": [
      { "title": "Fonte 1", "content": "Horário de funcionamento..." }
    ]
  },
  "latencyMs": 2340,
  "agentUsed": {
    "id": "uuid-do-agente",
    "name": "Atendente Virtual",
    "model": "gemini-3-flash-preview"
  }
}
```

## Diferença dos outros testes

| Teste | Testa AI? | Usa WhatsApp? | Testa Webhook? |
|-------|-----------|---------------|----------------|
| Stress Test | ❌ | ❌ (simulado) | ✅ |
| E2E WhatsApp | ✅ | ✅ (real) | ✅ |
| **AI API** | ✅ | ❌ | ❌ |

## Quando usar

- **Validação rápida de agentes**: Teste um agente antes de ativar em produção
- **CI/CD**: Rode automaticamente para detectar regressões na AI
- **Debugging**: Isole problemas da AI sem variáveis do WhatsApp
- **Desenvolvimento**: Itere rapidamente no prompt do agente

## Troubleshooting

### "Unauthorized"

Verifique se `SMARTZAP_API_KEY` está configurada:

```bash
echo $SMARTZAP_API_KEY  # ou verifique .env.test.local
```

### "Agent not found"

Verifique se existe um agente ativo e marcado como default:

```sql
SELECT id, name, is_active, is_default FROM ai_agents;
```

### Timeout nos testes

Aumente o timeout em `config.ts`:

```typescript
timeout: 120000, // 2 minutos
```
