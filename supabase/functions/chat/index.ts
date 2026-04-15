// Supabase Edge Function: /functions/v1/chat
// 프로덕션에서 OpenAI API 키를 서버에서 관리하기 위한 구조
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
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history = [], sessionId }: ChatRequest = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: '메시지를 입력해 주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Supabase 클라이언트 (서비스 롤 - RLS 우회 가능)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. 제품 검색 (키워드 기반)
    const keywords = extractKeywords(message)
    const productsContext = await searchProducts(supabase, keywords)
    const chunksContext = await searchChunks(supabase, keywords)

    // 2. 시스템 프롬프트 빌드
    const systemPrompt = buildSystemPrompt(productsContext, chunksContext)

    // 3. OpenAI 호출
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10),
          { role: 'user', content: message },
        ],
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

    // 4. 세션/메시지 저장
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
        { session_id: activeSessionId, role: 'user', content: message, context_data: {} },
        {
          session_id: activeSessionId,
          role: 'assistant',
          content: aiContent,
          context_data: { product_ids: productsContext.map((p: any) => p.id) },
        },
      ])
    }

    return new Response(
      JSON.stringify({
        content: aiContent,
        sessionId: activeSessionId,
        recommendedProducts: productsContext.slice(0, 3),
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
// 헬퍼 함수
// ============================================================

function extractKeywords(text: string): string[] {
  const keywords: string[] = []
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
  const lower = text.toLowerCase()
  Object.entries(keywordMap).forEach(([key, variants]) => {
    if (variants.some((v) => lower.includes(v))) keywords.push(key)
  })
  return keywords.length > 0 ? keywords : ['복지용구']
}

async function searchProducts(supabase: any, keywords: string[]) {
  const orConditions = keywords
    .map((kw) => `name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`)
    .join(',')
  const { data } = await supabase
    .from('products')
    .select('*')
    .or(orConditions)
    .eq('is_active', true)
    .limit(4)
  return data ?? []
}

async function searchChunks(supabase: any, keywords: string[]) {
  const orConditions = keywords.map((kw) => `content.ilike.%${kw}%`).join(',')
  const { data } = await supabase
    .from('document_chunks')
    .select('content, metadata')
    .or(orConditions)
    .limit(3)
  return data ?? []
}

function buildSystemPrompt(products: any[], chunks: any[]): string {
  const productsText = products
    .map((p) => `- ${p.name} (${p.category}) | ${p.price.toLocaleString()}원 | ${p.target_grade?.join(',')}등급`)
    .join('\n')

  const chunksText = chunks.map((c: any) => `- ${c.content}`).join('\n')

  return `당신은 '스마트케어나비'의 복지용구 전문 AI 상담사입니다.
아래 제품 및 정책 정보를 참고하여 친절하게 안내해 주세요.

[제품 정보]
${productsText || '정보 없음'}

[정책 정보]
${chunksText || '정보 없음'}

답변 원칙: 등급별 지원 혜택, 본인부담금(15%), 추천 제품을 구체적으로 안내하세요.`
}
