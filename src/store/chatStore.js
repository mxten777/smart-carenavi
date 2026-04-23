import { create } from 'zustand'
import { processChat, processChatStream } from '@/lib/rag'
import { supabase } from '@/lib/supabase'

/**
 * 채팅 상태 관리 (Zustand)
 * - messages: 화면에 표시되는 메시지 배열
 * - sessionId: Supabase chat_sessions ID
 * - recommendedProducts: AI가 추천한 제품 목록
 * - streamingContent: 스트리밍 중인 AI 응답 (누적 텍스트)
 * - sessions: 이전 상담 세션 목록
 */
export const useChatStore = create((set, get) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  recommendedProducts: [],
  sessions: [],
  sessionsLoading: false,

  /** 이전 상담 세션 목록 로드 */
  loadSessions: async () => {
    set({ sessionsLoading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let query = supabase
        .from('chat_sessions')
        .select('id, session_name, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (session?.user) {
        query = query.eq('user_id', session.user.id)
      } else {
        query = query.is('user_id', null)
      }

      const { data } = await query
      set({ sessions: data ?? [], sessionsLoading: false })
    } catch {
      set({ sessionsLoading: false })
    }
  },

  /** 특정 세션 메시지 불러오기 */
  loadSession: async (sessionId) => {
    set({ isLoading: true, messages: [], streamingContent: '' })
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, context_data, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      const messages = (data ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        recommendedProducts: [],
      }))

      set({ messages, sessionId, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  /** 채팅 전송 (스트리밍 우선, fallback 일반) */
  sendMessage: async (userMessage) => {
    if (!userMessage.trim()) return

    const userMsg = { id: Date.now(), role: 'user', content: userMessage }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      isStreaming: false,
      streamingContent: '',
      error: null,
    }))

    // 히스토리 준비 (방금 추가한 사용자 메시지 제외)
    const history = get()
      .messages.slice(0, -1)
      .map(({ role, content }) => ({ role, content }))

    // ── 스트리밍 시도 ─────────────────────────────────────
    try {
      let metaReceived = null

      await processChatStream(
        userMessage,
        history,
        get().sessionId,
        // onDelta: 텍스트 청크 수신
        (delta) => {
          set((state) => ({
            isLoading: false,
            isStreaming: true,
            streamingContent: state.streamingContent + delta,
          }))
        },
        // onMeta: 세션/제품 정보 수신
        (meta) => {
          metaReceived = meta
          if (meta.sessionId) {
            set({ sessionId: meta.sessionId })
          }
        }
      )

      // 스트리밍 완료 → 정식 메시지로 확정
      const finalContent = get().streamingContent
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: finalContent,
        recommendedProducts: metaReceived?.recommendedProducts ?? [],
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        recommendedProducts: metaReceived?.recommendedProducts ?? state.recommendedProducts,
        isStreaming: false,
        streamingContent: '',
        isLoading: false,
      }))
    } catch (streamErr) {
      // ── 스트리밍 실패 시 일반 호출로 fallback ────────────
      console.warn('[Chat] 스트리밍 실패, 일반 모드로 전환:', streamErr.message)
      set({ isStreaming: false, streamingContent: '', isLoading: true })

      try {
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
    }
  },

  /** 채팅 초기화 (새 상담 시작) */
  resetChat: () =>
    set((state) => ({
      messages: [],
      sessionId: null,
      isLoading: false,
      isStreaming: false,
      streamingContent: '',
      error: null,
      recommendedProducts: [],
      sessions: state.sessions, // 이력 목록 유지
    })),
}))
