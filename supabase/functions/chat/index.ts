// Supabase Edge Function: /functions/v1/chat
//
// 검색 전략:
//   1. 벡터 유사도 검색 (pgvector) — embedding이 있는 경우
//   2. Fallback: 키워드 LIKE 검색 — embedding 없거나 결과 부족 시
//
// 스트리밍: ?stream=true 쿼리파라미터로 SSE 스트리밍 활성화
//
// 배포: supabase functions deploy chat
// 환경변수: supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string
  history: Array<{ role: string; content: string }>
  sessionId?: string
  stream?: boolean
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history = [], sessionId, stream = false }: ChatRequest = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: '메시지를 입력해 주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ─── 1. 질문 임베딩 생성 ────────────────────────────────
    let queryEmbedding: number[] | null = null
    try {
      queryEmbedding = await getEmbedding(message, openaiKey)
    } catch {
      // 임베딩 실패 시 키워드 검색으로 fallback
    }

    // ─── 2. 제품 검색 (벡터 → 키워드 fallback) ─────────────
    let productsContext: any[] = []
    if (queryEmbedding) {
      const { data } = await supabase.rpc('match_products', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,
        match_count: 4,
      })
      productsContext = data ?? []
    }
    if (productsContext.length < 2) {
      const keywords = extractKeywords(message)
      const orConditions = keywords
        .map((kw: string) => `name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`)
        .join(',')
      const { data: kwProducts } = await supabase
        .from('products')
        .select('*')
        .or(orConditions)
        .eq('is_active', true)
        .limit(4 - productsContext.length)
      const existingIds = new Set(productsContext.map((p: any) => p.id))
      const extra = (kwProducts ?? []).filter((p: any) => !existingIds.has(p.id))
      productsContext = [...productsContext, ...extra]
    }

    // ─── 3. 청크 검색 (벡터 → 키워드 fallback) ─────────────
    let chunksContext: any[] = []
    if (queryEmbedding) {
      const { data } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
      })
      chunksContext = data ?? []
    }
    if (chunksContext.length < 2) {
      const keywords = extractKeywords(message)
      const orConditions = keywords.map((kw: string) => `content.ilike.%${kw}%`).join(',')
      const { data: kwChunks } = await supabase
        .from('document_chunks')
        .select('content, metadata')
        .or(orConditions)
        .limit(5 - chunksContext.length)
      const existingIds = new Set(chunksContext.map((c: any) => c.id))
      const extra = (kwChunks ?? []).filter((c: any) => !existingIds.has(c.id))
      chunksContext = [...chunksContext, ...extra]
    }

    // ─── 4. 시스템 프롬프트 빌드 ────────────────────────────
    const systemPrompt = buildSystemPrompt(productsContext, chunksContext)

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    // ─── 5a. 스트리밍 응답 ──────────────────────────────────
    if (stream) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 800,
          stream: true,
        }),
      })

      if (!openaiResponse.ok) {
        const err = await openaiResponse.json()
        throw new Error(`OpenAI 오류: ${err.error?.message}`)
      }

      // 세션 미리 생성
      let activeSessionId = sessionId
      if (!activeSessionId) {
        const { data: session } = await supabase
          .from('chat_sessions')
          .insert({ session_name: message.slice(0, 30) })
          .select('id')
          .single()
        activeSessionId = session?.id
      }

      // 사용자 메시지 저장
      if (activeSessionId) {
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          role: 'user',
          content: message,
          context_data: { used_vector_search: queryEmbedding !== null },
        })
      }

      // SSE 스트림 변환
      const encoder = new TextEncoder()
      let fullContent = ''

      const readable = new ReadableStream({
        async start(controller) {
          // 메타데이터 먼저 전송 (제품 추천 등)
          const meta = JSON.stringify({
            type: 'meta',
            sessionId: activeSessionId,
            recommendedProducts: productsContext.slice(0, 3),
          })
          controller.enqueue(encoder.encode(`data: ${meta}\n\n`))

          const reader = openaiResponse.body!.getReader()
          const decoder = new TextDecoder()

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  if (delta) {
                    fullContent += delta
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
                    )
                  }
                } catch {
                  // JSON 파싱 실패 무시
                }
              }
            }
          } finally {
            reader.releaseLock()
          }

          // 완료 신호
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()

          // AI 응답 저장 (스트림 완료 후)
          if (activeSessionId && fullContent) {
            await supabase.from('chat_messages').insert({
              session_id: activeSessionId,
              role: 'assistant',
              content: fullContent,
              context_data: {
                product_ids: productsContext.map((p: any) => p.id),
                chunk_count: chunksContext.length,
                used_vector_search: queryEmbedding !== null,
              },
            })
          }
        },
      })

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ─── 5b. 일반 응답 (stream=false) ───────────────────────
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!openaiResponse.ok) {
      const err = await openaiResponse.json()
      throw new Error(`OpenAI 오류: ${err.error?.message}`)
    }

    const openaiData = await openaiResponse.json()
    const aiContent: string = openaiData.choices[0].message.content

    // ─── 6. 세션/메시지 저장 ────────────────────────────────
    let activeSessionId = sessionId
    if (!activeSessionId) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .insert({ session_name: message.slice(0, 30) })
        .select('id')
        .single()
      activeSessionId = session?.id
    }

    if (activeSessionId) {
      await supabase.from('chat_messages').insert([
        {
          session_id: activeSessionId,
          role: 'user',
          content: message,
          context_data: { used_vector_search: queryEmbedding !== null },
        },
        {
          session_id: activeSessionId,
          role: 'assistant',
          content: aiContent,
          context_data: {
            product_ids: productsContext.map((p: any) => p.id),
            chunk_count: chunksContext.length,
            used_vector_search: queryEmbedding !== null,
          },
        },
      ])
    }

    return new Response(
      JSON.stringify({
        content: aiContent,
        sessionId: activeSessionId,
        recommendedProducts: productsContext.slice(0, 3),
        usedVectorSearch: queryEmbedding !== null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ============================================================
// OpenAI 단일 텍스트 임베딩
// ============================================================
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
      encoding_format: 'float',
    }),
  })
  if (!response.ok) throw new Error('Embedding 생성 실패')
  const data = await response.json()
  return data.data[0].embedding
}

// ============================================================
// 키워드 추출 (Fallback용)
// ============================================================
function extractKeywords(text: string): string[] {
  const keywordMap: Record<string, string[]> = {
    침대: ['침대', '전동침대'],
    욕창: ['욕창', '매트리스'],
    휠체어: ['휠체어'],
    보행: ['보행', '워커'],
    목욕: ['목욕', '샤워'],
    변기: ['변기', '이동변기'],
    손잡이: ['손잡이'],
    미끄럼: ['미끄럼', '안전매트'],
  }
  const found: string[] = []
  const lower = text.toLowerCase()
  Object.entries(keywordMap).forEach(([key, variants]) => {
    if (variants.some((v) => lower.includes(v))) found.push(key)
  })
  return found.length > 0 ? found : ['복지용구']
}

// ============================================================
// 시스템 프롬프트 빌더
// ============================================================
function buildSystemPrompt(products: any[], chunks: any[]): string {
  const productsText = products
    .map(
      (p) =>
        `- [${p.id}] ${p.name} (${p.category}) | ${p.price.toLocaleString()}원 | ${p.target_grade?.join(',')}등급${
          p.similarity != null ? ` | 유사도 ${(p.similarity * 100).toFixed(0)}%` : ''
        }\n  ${p.description ?? ''}`
    )
    .join('\n')

  const chunksText = chunks
    .map(
      (c) =>
        `- ${c.content}${c.similarity != null ? ` (유사도 ${(c.similarity * 100).toFixed(0)}%)` : ''}`
    )
    .join('\n')

  return `당신은 '스마트케어나비'의 복지용구 전문 AI 상담사입니다.
장기요양보험과 복지용구에 대한 깊은 전문 지식을 갖고 있으며, 보호자와 어르신이 이해하기 쉽게 안내합니다.

아래 [제품 정보]와 [정책 정보]를 반드시 참고하여 답변하세요.

답변 원칙:
1. 사용자의 상황에 맞는 제품을 구체적으로 추천하세요
2. 장기요양보험 등급별 지원 내용과 본인부담금을 설명하세요
3. 가격, 혜택, 절차를 명확하게 안내하세요
4. 친절하고 따뜻한 말투로 이해하기 쉽게 설명하세요
5. 추천 제품은 JSON 형식으로 별도 표시하세요: [[제품추천: product_id_1, product_id_2]]

[제품 정보]
${productsText || '관련 제품 정보가 없습니다.'}

[정책 정보]
${chunksText || '관련 정책 정보가 없습니다.'}`
}

