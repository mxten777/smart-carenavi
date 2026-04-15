import { supabase } from './supabase'
import { generateChatResponse } from './openai'

// ============================================================
// RAG 시스템 프롬프트 빌더
// ============================================================

const BASE_SYSTEM_PROMPT = `당신은 '스마트케어나비'의 복지용구 전문 AI 상담사입니다.
장기요양보험과 복지용구에 대한 깊은 전문 지식을 갖고 있으며, 보호자와 어르신이 이해하기 쉽게 안내합니다.

아래 [제품 정보]와 [정책 정보]를 반드시 참고하여 답변하세요.

답변 원칙:
1. 사용자의 상황에 맞는 제품을 구체적으로 추천하세요
2. 장기요양보험 등급별 지원 내용과 본인부담금을 설명하세요
3. 가격, 혜택, 절차를 명확하게 안내하세요
4. 친절하고 따뜻한 말투로 이해하기 쉽게 설명하세요
5. 추천 제품은 JSON 형식으로 별도 표시하세요: [[제품추천: product_id_1, product_id_2]]`

/**
 * RAG 컨텍스트 빌드 (내부 사용)
 * @param {string} query
 * @returns {Promise<{systemPrompt: string, contextData: object, recommendedProducts: Array}>}
 */
async function buildRagContext(query) {
  const [productResults, chunkResults] = await Promise.all([
    searchProducts(query),
    searchPolicyChunks(query),
  ])

  const productsContext = formatProductsContext(productResults)
  const policyContext = formatChunksContext(chunkResults)

  const systemPrompt = [
    BASE_SYSTEM_PROMPT,
    '',
    '[제품 정보]',
    productsContext || '관련 제품 정보가 없습니다.',
    '',
    '[정책 정보]',
    policyContext || '관련 정책 정보가 없습니다.',
  ].join('\n')

  return {
    systemPrompt,
    contextData: {
      products: productResults.map((p) => p.id),
      chunks: chunkResults.map((c) => c.id),
    },
    recommendedProducts: productResults,
  }
}

/**
 * 제품 키워드 검색 (LIKE)
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchProducts(query) {
  const keywords = extractKeywords(query)

  if (keywords.length === 0) {
    // 키워드 없으면 전체 제품 반환
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(4)
    return data ?? []
  }

  // 여러 키워드 OR 검색
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

/**
 * 정책 문서 청크 검색 (Full-text Search)
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchPolicyChunks(query) {
  // 1차: 전문 검색 시도
  const { data: ftsData } = await supabase
    .from('document_chunks')
    .select('*')
    .textSearch('content', query.split(' ').join(' | '), { type: 'websearch' })
    .limit(3)

  if (ftsData && ftsData.length > 0) return ftsData

  // 2차 fallback: LIKE 검색
  const keywords = extractKeywords(query)
  if (keywords.length === 0) return []

  const orConditions = keywords.map((kw) => `content.ilike.%${kw}%`).join(',')
  const { data } = await supabase
    .from('document_chunks')
    .select('*')
    .or(orConditions)
    .limit(3)

  return data ?? []
}

/**
 * 한국어 키워드 추출 (간단한 규칙 기반)
 * @param {string} text
 * @returns {string[]}
 */
function extractKeywords(text) {
  const keywordMap = {
    침대: ['침대', '전동침대', 'bed'],
    욕창: ['욕창', '매트리스', '에어매트'],
    휠체어: ['휠체어', 'wheelchair'],
    보행: ['보행', '워커', '보행기', '보행보조'],
    목욕: ['목욕', '샤워', '욕조', '목욕의자'],
    변기: ['변기', '이동변기', '좌변기'],
    손잡이: ['손잡이', '안전바', '안전손잡이'],
    미끄럼: ['미끄럼', '매트', '안전매트'],
    등급: ['등급', '1등급', '2등급', '3등급', '4등급', '5등급'],
    비용: ['비용', '가격', '얼마', '지원', '보험'],
  }

  const found = new Set()
  const lower = text.toLowerCase()

  Object.entries(keywordMap).forEach(([key, variants]) => {
    if (variants.some((v) => lower.includes(v))) {
      found.add(key)
      variants.forEach((v) => found.add(v))
    }
  })

  // 직접 단어 추출 (2글자 이상 한글/영문)
  const tokens = text.match(/[가-힣a-zA-Z]{2,}/g) ?? []
  tokens.forEach((t) => found.add(t))

  return [...found].slice(0, 8) // 최대 8개 키워드
}

// ============================================================
// 포매터
// ============================================================

function formatProductsContext(products) {
  if (!products.length) return ''
  return products
    .map(
      (p) =>
        `- [${p.id}] ${p.name} (${p.category}) | 가격: ${p.price.toLocaleString()}원 | 지원등급: ${p.target_grade?.join(',')}등급\n  ${p.description ?? ''}`
    )
    .join('\n')
}

function formatChunksContext(chunks) {
  if (!chunks.length) return ''
  return chunks.map((c) => `- ${c.content}`).join('\n')
}

// ============================================================
// 메인: RAG 채팅 처리
// ============================================================

/**
 * 사용자 메시지 처리 → AI 응답 반환
 * @param {string} userMessage
 * @param {Array<{role:string,content:string}>} history - 이전 대화
 * @param {string|null} sessionId
 * @returns {Promise<{content: string, contextData: object, recommendedProducts: Array, sessionId: string}>}
 */
export async function processChat(userMessage, history = [], sessionId = null) {
  // 1. RAG 컨텍스트 빌드
  const { systemPrompt, contextData, recommendedProducts } = await buildRagContext(userMessage)

  // 2. 대화 히스토리 구성
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  // 3. AI 응답 생성
  const aiContent = await generateChatResponse(messages, systemPrompt)

  // 4. 추천 제품 파싱 (AI가 [[제품추천: ...]] 형식으로 반환한 경우)
  const mentionedProductIds = parseMentionedProducts(aiContent)
  const finalRecommended = mentionedProductIds.length > 0
    ? recommendedProducts.filter((p) => mentionedProductIds.includes(p.id))
    : recommendedProducts.slice(0, 3)

  // 5. DB 저장 (세션 생성 또는 기존 세션 사용)
  const activeSessionId = await saveToDatabase({
    sessionId,
    userMessage,
    aiContent,
    contextData,
    recommendedProducts: finalRecommended,
  })

  return {
    content: aiContent.replace(/\[\[제품추천:.*?\]\]/g, '').trim(),
    contextData,
    recommendedProducts: finalRecommended,
    sessionId: activeSessionId,
  }
}

/**
 * AI 응답에서 [[제품추천: id1, id2]] 파싱
 */
function parseMentionedProducts(content) {
  const match = content.match(/\[\[제품추천:\s*([\w,\s-]+)\]\]/)
  if (!match) return []
  return match[1].split(',').map((id) => id.trim()).filter(Boolean)
}

/**
 * 채팅 메시지를 Supabase에 저장
 */
async function saveToDatabase({ sessionId, userMessage, aiContent, contextData, recommendedProducts }) {
  let activeSessionId = sessionId

  // 세션 없으면 새로 생성
  if (!activeSessionId) {
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({ session_name: userMessage.slice(0, 30) })
      .select('id')
      .single()
    activeSessionId = session?.id
  }

  if (!activeSessionId) return null

  // 사용자 메시지 + AI 응답 동시 저장
  await supabase.from('chat_messages').insert([
    {
      session_id: activeSessionId,
      role: 'user',
      content: userMessage,
      context_data: {},
    },
    {
      session_id: activeSessionId,
      role: 'assistant',
      content: aiContent,
      context_data: {
        ...contextData,
        recommended_product_ids: recommendedProducts.map((p) => p.id),
      },
    },
  ])

  return activeSessionId
}
