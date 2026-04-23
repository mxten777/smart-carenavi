// Supabase Edge Function: /functions/v1/embed
// 제품 및 문서 청크의 임베딩을 일괄 생성/갱신합니다.
//
// 배포: supabase functions deploy embed
// 호출 예시 (관리자 UI에서):
//   supabase.functions.invoke('embed', { body: { target: 'all' } })
//   supabase.functions.invoke('embed', { body: { target: 'chunks', ids: ['uuid1', 'uuid2'] } })
//
// target: 'all' | 'products' | 'chunks'
// ids: (선택) 특정 row UUID 배열 — 생략 시 embedding이 없는 모든 row 처리

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMBED_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 20 // OpenAI 임베딩 배치 크기

interface EmbedRequest {
  target: 'all' | 'products' | 'chunks'
  ids?: string[]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { target = 'all', ids }: EmbedRequest = await req.json().catch(() => ({ target: 'all' }))

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY 환경변수가 없습니다')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = { products: 0, chunks: 0, errors: 0 }

    // ── 제품 임베딩 ──────────────────────────────────────────
    if (target === 'all' || target === 'products') {
      let query = supabase
        .from('products')
        .select('id, name, description, category, target_grade')
        .is('embedding', null)
        .eq('is_active', true)

      if (ids?.length) query = query.in('id', ids)

      const { data: products } = await query
      if (products?.length) {
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE)
          const texts = batch.map(
            (p: any) =>
              `${p.name}. 카테고리: ${p.category}. 지원등급: ${p.target_grade?.join(',')}등급. ${p.description ?? ''}`
          )
          const embeddings = await getEmbeddings(texts, openaiKey)
          for (let j = 0; j < batch.length; j++) {
            const { error } = await supabase
              .from('products')
              .update({ embedding: `[${embeddings[j].join(',')}]` })
              .eq('id', batch[j].id)
            if (error) results.errors++
            else results.products++
          }
        }
      }
    }

    // ── 청크 임베딩 ──────────────────────────────────────────
    if (target === 'all' || target === 'chunks') {
      let query = supabase
        .from('document_chunks')
        .select('id, content')
        .is('embedding', null)

      if (ids?.length) query = query.in('id', ids)

      const { data: chunks } = await query
      if (chunks?.length) {
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE)
          const texts = batch.map((c: any) => c.content)
          const embeddings = await getEmbeddings(texts, openaiKey)
          for (let j = 0; j < batch.length; j++) {
            const { error } = await supabase
              .from('document_chunks')
              .update({ embedding: `[${embeddings[j].join(',')}]` })
              .eq('id', batch[j].id)
            if (error) results.errors++
            else results.chunks++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `임베딩 완료 — 제품 ${results.products}건, 청크 ${results.chunks}건, 오류 ${results.errors}건`,
        results,
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
// OpenAI Embeddings API 호출 (배치)
// ============================================================
async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      encoding_format: 'float',
    }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(`OpenAI Embeddings 오류: ${err.error?.message}`)
  }
  const data = await response.json()
  // data.data는 index 순서 보장됨
  return data.data.map((d: any) => d.embedding)
}
