import { create } from 'zustand'
import { processChat } from '@/lib/rag'

/**
 * 채팅 상태 관리 (Zustand)
 * - messages: 화면에 표시되는 메시지 배열
 * - sessionId: Supabase chat_sessions ID
 * - recommendedProducts: AI가 추천한 제품 목록
 */
export const useChatStore = create((set, get) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  error: null,
  recommendedProducts: [],

  /** 채팅 전송 */
  sendMessage: async (userMessage) => {
    if (!userMessage.trim()) return

    const userMsg = { id: Date.now(), role: 'user', content: userMessage }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }))

    try {
      const { messages } = get()
      // DB 저장용 히스토리 (id 제거)
      const history = messages
        .slice(0, -1) // 방금 추가한 사용자 메시지 제외 (processChat에서 추가됨)
        .map(({ role, content }) => ({ role, content }))

      const result = await processChat(userMessage, history, get().sessionId)

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.content,
        recommendedProducts: result.recommendedProducts,
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        sessionId: result.sessionId ?? state.sessionId,
        recommendedProducts: result.recommendedProducts,
        isLoading: false,
      }))
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '죄송합니다. 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        isError: true,
      }
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isLoading: false,
        error: err.message,
      }))
    }
  },

  /** 채팅 초기화 */
  resetChat: () =>
    set({ messages: [], sessionId: null, isLoading: false, error: null, recommendedProducts: [] }),
}))
