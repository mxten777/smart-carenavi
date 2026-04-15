import { useEffect, useRef } from 'react'
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

export default function Chat() {
  const { messages, isLoading, sendMessage, resetChat } = useChatStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const displayMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.212c-1.443 0-2.414-1.798-1.414-2.798L4.2 15.3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">케어나비 AI 상담사</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">응답 준비됨</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/products" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
            제품 목록
          </Link>
          <button
            onClick={resetChat}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            초기화
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

        {/* 로딩 dots */}
        {isLoading && (
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
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}

