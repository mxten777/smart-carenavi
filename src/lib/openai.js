import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

if (!apiKey) {
  console.warn(
    '[OpenAI] VITE_OPENAI_API_KEY가 설정되지 않았습니다. AI 기능이 비활성화됩니다.'
  )
}

/**
 * ⚠️  보안 주의: dangerouslyAllowBrowser = true 는 MVP 전용입니다.
 *  - API 키가 브라우저 네트워크 탭에 노출됩니다.
 *  - 프로덕션 배포 전에 반드시 Supabase Edge Function 프록시로 교체하세요.
 *  - PROGRESS.md Phase 2-A 항목 참고
 */
export const openai = apiKey
  ? new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  : null

/**
 * AI 상담 응답 생성
 * @param {Array<{role: string, content: string}>} messages - 대화 히스토리
 * @param {string} systemPrompt - RAG context가 포함된 시스템 프롬프트
 * @returns {Promise<string>} AI 응답 텍스트
 */
export async function generateChatResponse(messages, systemPrompt) {
  if (!openai) {
    return getMockResponse(messages[messages.length - 1]?.content ?? '')
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // 최근 10개 메시지로 컨텍스트 제한
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  return response.choices[0].message.content
}

/** OpenAI 미설정 시 Mock 응답 */
function getMockResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase()

  if (lowerMsg.includes('등급') || lowerMsg.includes('grade')) {
    return '장기요양보험 등급은 1~5등급으로 구분됩니다. 등급에 따라 지원되는 복지용구와 한도액이 달라집니다. 1~2등급은 전동침대, 욕창예방 매트리스 등 고가 품목도 지원됩니다. 정확한 등급을 알고 계신가요?'
  }
  if (lowerMsg.includes('침대') || lowerMsg.includes('bed')) {
    return '전동침대는 1~2등급 어르신께 장기요양보험으로 지원됩니다. 연간 160만원 한도 내에서 본인부담금 15%만 내시면 됩니다. 3모터 전동침대가 가장 많이 이용되며, 등받이·다리·높이 조절이 가능합니다.'
  }
  if (lowerMsg.includes('욕창') || lowerMsg.includes('pressure')) {
    return '욕창예방 에어매트리스는 1~3등급 수급자께 지원됩니다. 교대 압력 방식으로 지속적인 압력 없이 욕창을 예방합니다. 현재 35만원 제품이 인기이며 보험 적용 후 본인부담은 약 5만원입니다.'
  }
  if (lowerMsg.includes('휠체어') || lowerMsg.includes('wheelchair')) {
    return '수동 휠체어는 1~4등급 수급자께 지원됩니다. 경량 알루미늄 프레임 제품이 이동이 편리하며, 접이식으로 차량 이동도 가능합니다. 보험 적용 후 본인부담금은 약 6~7만원 수준입니다.'
  }

  return '안녕하세요! 복지용구 AI 상담사입니다. 장기요양보험 등급이나 필요한 용구에 대해 질문해 주시면 맞춤 추천을 도와드리겠습니다. (⚠️ 현재 Mock 모드 - OpenAI API 키를 설정하면 실제 AI 상담이 가능합니다)'
}
