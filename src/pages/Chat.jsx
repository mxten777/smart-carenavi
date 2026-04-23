import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import { useChatStore } from '@/store/chatStore'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `안녕하세요! 복지용구 AI 상담사입니다. 😊

장기요양보험 등급, 복지용구 추천, 보험 혜택 등 어떤 질문이든 편하게 물어보세요.

예를 들어:
- "3등급인데 어떤 용구를 쓸 수 있나요?"
- "욕창 예방에 좋은 제품을 추천해 주세요"
- "전동침대 보험 지원 얼마나 되나요?"`,
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function Chat() {
  const {
    messages, isLoading, isStreaming, streamingContent,
    sessionId, sessions, sessionsLoading,
    sendMessage, resetChat, loadSessions, loadSession,
  } = useChatStore()
  const bottomRef = useRef(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  // 새 메시지 완료 시 세션 목록 갱신
  useEffect(() => {
    if (!isLoading && !isStreaming && messages.length > 0) {
      loadSessions()
    }
  }, [isLoading, isStreaming])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  const displayMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      {/* ── 이력 사이드패널 (md 이상 항상 표시, 모바일은 토글) ── */}
      {historyOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setHistoryOpen(false)}
        />
      )}
      <aside
        className={`
          fixed md:relative z-30 md:z-auto
          top-0 md:top-auto left-0 md:left-auto
          h-full md:h-auto
          w-72 md:w-64
          bg-white border-r border-gray-100
          flex flex-col
          transition-transform duration-200
          ${historyOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:flex-shrink-0
        `}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">상담 이력</span>
          <button
            onClick={() => { resetChat(); setHistoryOpen(false) }}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 상담
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">아직 상담 이력이 없습니다</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { loadSession(s.id); setHistoryOpen(false) }}
                className={`w-full text-left px-4 py-2.5 hover:bg-brand-50 transition-colors group ${
                  sessionId === s.id ? 'bg-brand-50 border-r-2 border-brand-500' : ''
                }`}
              >
                <p className={`text-xs font-medium truncate ${
                  sessionId === s.id ? 'text-brand-700' : 'text-gray-700 group-hover:text-brand-700'
                }`}>
                  {s.session_name || '새 상담'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(s.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── 메인 채팅 영역 ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 채팅 헤더 */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* 모바일 이력 토글 버튼 */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              onClick={() => setHistoryOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.212c-1.443 0-2.414-1.798-1.414-2.798L4.2 15.3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">케어나비 AI 상담사</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">
                  {isStreaming ? '응답 중...' : '응답 준비됨'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-xs text-gray-400 hover:text-brand-600 transition-colors hidden sm:block">
              제품 목록
            </Link>
            <button
              onClick={resetChat}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새 상담
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.04) 0%, transparent 60%), #f8fafc',
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        >
          {displayMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* 스트리밍 메시지 (실시간 타이핑) */}
          {isStreaming && streamingContent && (
            <ChatMessage
              message={{ id: 'streaming', role: 'assistant', content: streamingContent }}
              isStreaming
            />
          )}

          {/* 로딩 dots (스트리밍 시작 전) */}
          {isLoading && !isStreaming && (
            <div className="mr-auto items-start flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm0 4a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400 font-medium">AI 상담사</span>
              </div>
              <div className="bg-white border border-gray-100 shadow-card rounded-2xl rounded-bl-sm px-5 py-3.5">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 120, 240].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <ChatInput onSend={sendMessage} isLoading={isLoading || isStreaming} />
      </div>
    </div>
  )
}
