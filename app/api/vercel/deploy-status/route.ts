import { NextResponse } from 'next/server'
import { getDeploymentStatus } from '@/lib/vercel-api'

/**
 * GET /api/vercel/deploy-status?deploymentId=xxx
 *
 * Consulta o status de um deployment em andamento.
 * Usado pelo frontend para polling após salvar uma BYOK API key.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const deploymentId = searchParams.get('deploymentId')

    if (!deploymentId) {
        return NextResponse.json({ error: 'deploymentId é obrigatório' }, { status: 400 })
    }

    try {
        const status = await getDeploymentStatus(deploymentId)
        return NextResponse.json({ status })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro ao consultar status' },
            { status: 500 }
        )
    }
}
