/**
 * DEBUG: Test File Search directly without DevTools middleware
 * This helps isolate if the issue is with DevTools or File Search itself
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { getFileSearchStore } from '@/lib/ai/file-search-store'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const startTime = Date.now()
  const logs: string[] = []

  const log = (msg: string) => {
    const elapsed = Date.now() - startTime
    logs.push(`[${elapsed}ms] ${msg}`)
    console.log(`[debug-file-search] ${msg}`)
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    log(`Starting debug for agent: ${id}`)

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('id, name, file_search_store_id, model, system_prompt')
      .eq('id', id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    log(`Agent: ${agent.name}`)
    log(`Model: ${agent.model || 'default'}`)
    log(`File Search Store ID: ${agent.file_search_store_id || 'none'}`)

    if (!agent.file_search_store_id) {
      return NextResponse.json({
        error: 'Agent has no File Search store configured',
        logs
      }, { status: 400 })
    }

    // Get API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured', logs }, { status: 500 })
    }

    log('API key found')

    // Verify store exists
    log('Verifying File Search store exists...')
    try {
      const store = await getFileSearchStore(apiKey, agent.file_search_store_id)
      if (!store) {
        return NextResponse.json({
          error: `File Search store not found: ${agent.file_search_store_id}`,
          logs
        }, { status: 404 })
      }
      log(`Store verified: ${store.name}`)
      log(`Active documents: ${store.activeDocumentsCount || '0'}`)
      log(`Pending documents: ${store.pendingDocumentsCount || '0'}`)
      log(`Failed documents: ${store.failedDocumentsCount || '0'}`)

      // Check if store has active documents
      const activeCount = parseInt(store.activeDocumentsCount || '0', 10)
      if (activeCount === 0) {
        return NextResponse.json({
          error: 'File Search store has no active documents. Upload documents first.',
          store,
          logs
        }, { status: 400 })
      }
    } catch (storeError) {
      log(`Store verification failed: ${storeError}`)
      return NextResponse.json({
        error: `Failed to verify store: ${storeError}`,
        logs
      }, { status: 500 })
    }

    // Create Google provider WITHOUT DevTools
    log('Creating Google provider (NO DevTools)...')
    const google = createGoogleGenerativeAI({ apiKey })
    const modelId = agent.model || 'gemini-2.5-pro' // Use 2.5-pro as fallback for File Search
    const model = google(modelId)

    log(`Using model: ${modelId}`)

    // Test 1: Simple generateText WITHOUT File Search
    log('Test 1: Simple generateText without File Search...')
    try {
      const simpleResult = await generateText({
        model,
        prompt: 'Say "Hello" in Portuguese.',
        maxOutputTokens: 50,
      })
      log(`Simple test passed: "${simpleResult.text.slice(0, 50)}..."`)
    } catch (simpleError) {
      log(`Simple test failed: ${simpleError}`)
      return NextResponse.json({
        error: 'Basic generateText failed - API issue',
        details: String(simpleError),
        logs
      }, { status: 500 })
    }

    // Test 2: generateText WITH File Search
    log('Test 2: generateText WITH File Search...')
    log(`Store name for File Search: ${agent.file_search_store_id}`)

    try {
      const fileSearchResult = await generateText({
        model,
        system: agent.system_prompt || 'You are a helpful assistant.',
        prompt: message,
        tools: {
          file_search: google.tools.fileSearch({
            fileSearchStoreNames: [agent.file_search_store_id],
            topK: 5,
          }),
        },
        maxOutputTokens: 1024,
        // Don't force tool choice - let the model decide
      })

      log('File Search test completed!')
      log(`Response length: ${fileSearchResult.text.length} chars`)
      log(`Tool calls: ${fileSearchResult.toolCalls?.length || 0}`)
      log(`Tool results: ${fileSearchResult.toolResults?.length || 0}`)

      // Get grounding metadata if available
      const providerMetadata = fileSearchResult.providerMetadata as Record<string, unknown> | undefined
      const groundingMetadata = providerMetadata?.google as Record<string, unknown> | undefined

      return NextResponse.json({
        success: true,
        response: fileSearchResult.text,
        toolCalls: fileSearchResult.toolCalls,
        toolResults: fileSearchResult.toolResults,
        groundingMetadata,
        latencyMs: Date.now() - startTime,
        logs
      })

    } catch (fileSearchError) {
      log(`File Search test FAILED: ${fileSearchError}`)

      // Try to get more details
      const errorDetails = fileSearchError instanceof Error
        ? { message: fileSearchError.message, stack: fileSearchError.stack }
        : String(fileSearchError)

      return NextResponse.json({
        error: 'File Search generateText failed',
        details: errorDetails,
        latencyMs: Date.now() - startTime,
        logs
      }, { status: 500 })
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logs.push(`[ERROR] ${errorMsg}`)

    return NextResponse.json({
      error: errorMsg,
      logs
    }, { status: 500 })
  }
}
