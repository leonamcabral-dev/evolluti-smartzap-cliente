'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, PartyPopper, HelpCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';

/**
 * Sanitiza o access token removendo caracteres não-ASCII que podem
 * causar erro "ByteString" ao fazer requests HTTP.
 * Também remove espaços, quebras de linha e outros caracteres invisíveis.
 */
function sanitizeAccessToken(value: string): string {
  // Remove caracteres não-ASCII (inclui emojis, caracteres de formatação, etc.)
  // eslint-disable-next-line no-control-regex
  return value.replace(/[^\x00-\x7F]/g, '').replace(/\s/g, '').trim();
}

/**
 * Traduz erros técnicos em mensagens amigáveis para o usuário.
 */
function getUserFriendlyError(error: any): { title: string; description: string } {
  const msg = String(error?.message || '').toLowerCase();

  // Erro de ByteString (caracteres não-ASCII no token)
  if (msg.includes('bytestring') || msg.includes('character at index')) {
    return {
      title: 'Token contém caracteres inválidos',
      description: 'O token parece ter caracteres especiais ou emojis. Tente copiar novamente direto do Meta Business Manager.',
    };
  }

  // Erro de assinatura/token corrompido
  if (msg.includes('bad signature') || msg.includes('signature') || msg.includes('malformed')) {
    return {
      title: 'Token corrompido ou incompleto',
      description: 'O token não está completo. Copie novamente do Meta Business Manager, garantindo que copiou o token inteiro.',
    };
  }

  // Token inválido/expirado
  if (msg.includes('token') && (msg.includes('invalid') || msg.includes('expired') || msg.includes('expirado'))) {
    return {
      title: 'Token inválido ou expirado',
      description: 'Gere um novo token no Meta Business Manager. Dica: use um System User Token para não expirar.',
    };
  }

  // ID inexistente ou sem permissão
  if (msg.includes('unsupported get') || msg.includes('does not exist') || msg.includes('no permission')) {
    return {
      title: 'ID incorreto ou sem permissão',
      description: 'Verifique se o Phone Number ID está correto e se o token tem acesso a este número.',
    };
  }

  // App desativado
  if (msg.includes('deactivated') || msg.includes('archived')) {
    return {
      title: 'App Meta desativado',
      description: 'O App no Meta foi arquivado. Acesse developers.facebook.com e reative seu App.',
    };
  }

  // Erro genérico - NÃO mostrar mensagem técnica
  return {
    title: 'Credenciais inválidas',
    description: 'Verifique se os dados foram copiados corretamente do Meta Business Manager.',
  };
}

interface DirectCredentialsStepProps {
  credentials: {
    phoneNumberId: string;
    businessAccountId: string;
    accessToken: string;
    metaAppId: string;
  };
  onCredentialsChange: (credentials: {
    phoneNumberId: string;
    businessAccountId: string;
    accessToken: string;
    metaAppId: string;
  }) => void;
  onComplete: () => Promise<void>;
  onBack: () => void;
}

export function DirectCredentialsStep({
  credentials,
  onCredentialsChange,
  onComplete,
  onBack,
}: DirectCredentialsStepProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationInfo, setValidationInfo] = useState<{
    displayPhoneNumber?: string;
    verifiedName?: string;
  } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ title: string; description: string } | null>(null);

  const canTest =
    credentials.phoneNumberId.trim() &&
    credentials.businessAccountId.trim() &&
    credentials.accessToken.trim();

  const handleTest = async () => {
    setIsTesting(true);
    setIsValid(false);
    setValidationInfo(null);
    setErrorInfo(null);

    try {
      const result = await settingsService.testConnection({
        phoneNumberId: credentials.phoneNumberId.trim(),
        businessAccountId: credentials.businessAccountId.trim(),
        accessToken: sanitizeAccessToken(credentials.accessToken),
      });

      setIsValid(true);
      setValidationInfo({
        displayPhoneNumber: result.displayPhoneNumber ?? undefined,
        verifiedName: result.verifiedName ?? undefined,
      });

      toast.success('Credenciais válidas!', {
        description: result.verifiedName
          ? `${result.displayPhoneNumber} • ${result.verifiedName}`
          : result.displayPhoneNumber,
      });
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setErrorInfo(friendlyError);
      toast.error(friendlyError.title, {
        description: friendlyError.description,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h2 className="text-xl font-semibold text-white">Conectar Credenciais</h2>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        {/* Phone Number ID */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumberId" className="flex items-center gap-2">
            Phone Number ID
            <span className="text-red-400">*</span>
          </Label>
          <Input
            id="phoneNumberId"
            placeholder="123456789012345"
            value={credentials.phoneNumberId}
            onChange={(e) => {
              onCredentialsChange({ ...credentials, phoneNumberId: e.target.value });
              setIsValid(false);
              setErrorInfo(null);
            }}
            className="font-mono"
          />
          <p className="text-xs text-zinc-500">
            Encontrado em: App Dashboard → WhatsApp → API Setup
          </p>
        </div>

        {/* Business Account ID */}
        <div className="space-y-2">
          <Label htmlFor="businessAccountId" className="flex items-center gap-2">
            WhatsApp Business Account ID
            <span className="text-red-400">*</span>
          </Label>
          <Input
            id="businessAccountId"
            placeholder="987654321098765"
            value={credentials.businessAccountId}
            onChange={(e) => {
              onCredentialsChange({ ...credentials, businessAccountId: e.target.value });
              setIsValid(false);
              setErrorInfo(null);
            }}
            className="font-mono"
          />
          <p className="text-xs text-zinc-500">
            Encontrado em: App Dashboard → WhatsApp → API Setup
          </p>
        </div>

        {/* Access Token */}
        <div className="space-y-2">
          <Label htmlFor="accessToken" className="flex items-center gap-2">
            Access Token
            <span className="text-red-400">*</span>
          </Label>
          <Input
            id="accessToken"
            type="password"
            placeholder="EAAG..."
            value={credentials.accessToken}
            onChange={(e) => {
              // Sanitiza automaticamente ao colar para evitar erro de ByteString
              const sanitized = sanitizeAccessToken(e.target.value);
              onCredentialsChange({ ...credentials, accessToken: sanitized });
              setIsValid(false);
              setErrorInfo(null);
            }}
            className="font-mono"
          />
          <p className="text-xs text-zinc-500">
            💡 Use um System User Token para não expirar
          </p>
        </div>

        {/* Meta App ID */}
        <div className="space-y-2">
          <Label htmlFor="metaAppId" className="flex items-center gap-2">
            ID do Aplicativo (Meta App ID)
          </Label>
          <Input
            id="metaAppId"
            placeholder="123456789012345"
            value={credentials.metaAppId}
            onChange={(e) => {
              onCredentialsChange({ ...credentials, metaAppId: e.target.value });
            }}
            className="font-mono"
          />
          <p className="text-xs text-zinc-500">
            Necessário para templates com imagem/vídeo. Encontre em developers.facebook.com › Meus apps › Seu App
          </p>
        </div>
      </div>

      {/* Erro inline */}
      {errorInfo && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-red-200 font-medium">{errorInfo.title}</p>
              <p className="text-red-200/70">{errorInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info de validação */}
      {validationInfo && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div className="text-sm">
              <p className="text-emerald-200 font-medium">Credenciais válidas</p>
              <p className="text-emerald-200/70">
                {validationInfo.displayPhoneNumber}
                {validationInfo.verifiedName && ` • ${validationInfo.verifiedName}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Link de ajuda */}
      <a
        href="https://developers.facebook.com/apps/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir Meta for Developers
      </a>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        {!isValid ? (
          <Button
            className="flex-1"
            onClick={handleTest}
            disabled={!canTest || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <PartyPopper className="w-4 h-4 mr-2" />
                Conectar e Continuar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
