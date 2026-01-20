/**
 * Executor de migrations para o installer.
 * Conecta ao banco Supabase e aplica o schema.
 */

import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { Client } from 'pg';

/**
 * Resolve hostname para IPv4 para evitar problemas em ambientes que não suportam IPv6.
 * Retorna o IP ou o hostname original se falhar.
 */
async function resolveToIPv4(hostname: string): Promise<string> {
  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err || !address) {
        console.log(`[migrations] Não foi possível resolver ${hostname} para IPv4, usando hostname original`);
        resolve(hostname);
      } else {
        console.log(`[migrations] Resolvido ${hostname} → ${address} (IPv4)`);
        resolve(address);
      }
    });
  });
}

/**
 * Substitui o hostname na URL por um IP (se fornecido).
 */
function replaceHostInUrl(urlString: string, newHost: string): string {
  try {
    const url = new URL(urlString);
    url.hostname = newHost;
    return url.toString();
  } catch {
    return urlString;
  }
}

// Lista ordenada de migrations a aplicar
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

function needsSsl(connectionString: string) {
  return !/sslmode=disable/i.test(connectionString);
}

function stripSslModeParam(connectionString: string) {
  // Alguns drivers tratam `sslmode=require` de forma inconsistente.
  // Controlamos SSL via `Client({ ssl })`.
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return connectionString;
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function isRetryableConnectError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('timeout') ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('socket hang up') ||
    // Erros temporários de SSL/TLS
    msg.includes('ssl routines') ||
    msg.includes('certificate') && msg.includes('expired')
  );
}

/**
 * Conecta com retry/backoff, recriando o Client a cada tentativa.
 * Evita o erro: "Client has already been connected. You cannot reuse a client."
 */
async function connectClientWithRetry(
  createClient: () => Client,
  opts?: { maxAttempts?: number; initialDelayMs?: number }
): Promise<Client> {
  const maxAttempts = opts?.maxAttempts ?? 5;
  const initialDelayMs = opts?.initialDelayMs ?? 3000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = createClient();
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastError = err;
      // Log IMEDIATO do erro para debug (usando console.log pq Vercel pode filtrar error)
      const errMsg = err instanceof Error ? err.message : String(err);
      const errCode = (err as any)?.code || 'N/A';
      const errName = (err as any)?.name || 'Error';
      console.log(`[migrations] ❌ Erro de conexão (tentativa ${attempt}): name=${errName}, code=${errCode}, msg=${errMsg}`);

      try {
        await client.end().catch(() => undefined);
      } catch {
        // ignore
      }

      const isRetryable = isRetryableConnectError(err);
      console.log(`[migrations] isRetryable=${isRetryable}, attempt=${attempt}/${maxAttempts}`);

      if (!isRetryable || attempt === maxAttempts) {
        // Log detalhado para debug
        console.log(
          `[migrations] 💥 Falha definitiva na conexão após ${attempt} tentativas:`,
          { error: errMsg, code: errCode, name: errName }
        );
        throw err;
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        `[migrations] Conexão falhou (${msg}), tentativa ${attempt}/${maxAttempts}. Aguardando ${Math.round(
          delayMs / 1000
        )}s...`
      );
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'Falha ao conectar ao banco de dados'));
}

/**
 * Aguarda storage do Supabase ficar pronto (storage.buckets).
 */
async function waitForStorageReady(
  client: Client,
  onProgress?: () => void,
  opts?: { timeoutMs?: number; pollMs?: number }
) {
  const timeoutMs = typeof opts?.timeoutMs === 'number' ? opts.timeoutMs : 210_000;
  const pollMs = typeof opts?.pollMs === 'number' ? opts.pollMs : 4_000;
  const t0 = Date.now();

  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await client.query<{ ready: boolean }>(
        `SELECT (to_regclass('storage.buckets') IS NOT NULL) as ready`
      );
      const ready = Boolean(r?.rows?.[0]?.ready);
      if (ready) return;
    } catch {
      // continua polling em erros transientes
    }
    onProgress?.();
    await sleep(pollMs);
  }

  throw new Error(
    'Supabase Storage ainda não está pronto. Aguarde o projeto terminar de provisionar e tente novamente.'
  );
}

/**
 * Lista arquivos de migration em ordem.
 */
function listMigrationFiles(): string[] {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    return files
      .filter((f) => f.endsWith('.sql') && !f.startsWith('.'))
      .sort(); // Ordem alfabética = ordem cronológica (0000, 0001, etc)
  } catch {
    return [];
  }
}

export interface MigrationProgress {
  stage: 'connecting' | 'waiting_storage' | 'applying' | 'done';
  message: string;
  current?: number;
  total?: number;
}

export interface MigrationOptions {
  skipWaitStorage?: boolean;
  onProgress?: (progress: MigrationProgress) => void;
}

/**
 * Executa todas as migrations em ordem.
 */
export async function runSchemaMigration(
  dbUrl: string,
  options?: MigrationOptions
) {
  const { skipWaitStorage = false, onProgress } = options || {};
  const migrationFiles = listMigrationFiles();

  if (migrationFiles.length === 0) {
    throw new Error('Nenhum arquivo de migration encontrado em supabase/migrations/');
  }

  const normalizedDbUrl = stripSslModeParam(dbUrl);

  onProgress?.({ stage: 'connecting', message: 'Conectando ao banco de dados...' });

  // Resolve hostname para IPv4 para evitar problemas com IPv6 em alguns ambientes (Vercel, etc.)
  let finalDbUrl = normalizedDbUrl;
  try {
    const urlObj = new URL(normalizedDbUrl);
    const originalHost = urlObj.hostname;
    console.log(`[migrations] Resolvendo DNS para: ${originalHost}:${urlObj.port || '5432'}`);

    const ipv4Address = await resolveToIPv4(originalHost);
    if (ipv4Address !== originalHost) {
      finalDbUrl = replaceHostInUrl(normalizedDbUrl, ipv4Address);
      console.log(`[migrations] Usando IPv4: ${ipv4Address}`);
    }
  } catch (dnsErr) {
    console.log('[migrations] Erro ao resolver DNS, usando URL original:', dnsErr);
  }

  const createClient = () =>
    new Client({
      connectionString: finalDbUrl,
      // Supabase DB usa TLS; em algumas redes um proxy/MITM pode inserir cert
      // que Node não confia. Preferimos "no-verify" para evitar falha.
      ssl: needsSsl(dbUrl) ? { rejectUnauthorized: false } : undefined,
      // Timeout de conexão: 15s é suficiente para estabelecer TCP + SSL handshake
      connectionTimeoutMillis: 15_000,
    });

  // Retry mais agressivo: menos tentativas, delays menores (total max ~20s de espera)
  const client = await connectClientWithRetry(createClient, { maxAttempts: 3, initialDelayMs: 2000 });

  try {
    // Aguarda storage se não for pulado
    if (!skipWaitStorage) {
      onProgress?.({ stage: 'waiting_storage', message: 'Aguardando Supabase Storage...' });
      await waitForStorageReady(client, () => {
        onProgress?.({ stage: 'waiting_storage', message: 'Aguardando Supabase Storage...' });
      });
    }

    // Cria tabela de tracking de migrations se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS _smartzap_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Verifica quais migrations já foram aplicadas
    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM _smartzap_migrations ORDER BY id'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // Aplica migrations pendentes
    const pendingMigrations = migrationFiles.filter(f => !appliedSet.has(f));
    let applied = 0;

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        console.log(`[migrations] Pulando ${file} (já aplicada)`);
        continue;
      }

      applied++;
      onProgress?.({
        stage: 'applying',
        message: `Aplicando ${file}...`,
        current: applied,
        total: pendingMigrations.length,
      });

      console.log(`[migrations] Aplicando ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _smartzap_migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`[migrations] ✓ ${file} aplicada com sucesso`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Se erro indica que objeto já existe, considera como aplicada
        if (msg.includes('already exists')) {
          console.log(`[migrations] ⚠ ${file} provavelmente já foi aplicada (objeto já existe)`);
          await client.query(
            'INSERT INTO _smartzap_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [file]
          );
          continue;
        }
        throw err;
      }
    }

    onProgress?.({ stage: 'done', message: 'Migrations concluídas!' });
    console.log('[migrations] Todas as migrations aplicadas com sucesso!');
  } finally {
    await client.end();
  }
}

/**
 * Verifica se o schema já foi aplicado (para health check).
 */
export async function checkSchemaApplied(dbUrl: string): Promise<boolean> {
  const normalizedDbUrl = stripSslModeParam(dbUrl);

  const client = new Client({
    connectionString: normalizedDbUrl,
    ssl: needsSsl(dbUrl) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();

    // Verifica se tabela principal existe (settings é uma boa candidata)
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'settings'
      ) as exists`
    );

    return rows[0]?.exists || false;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}
