import { useState } from 'react'

const QUICK_QUESTIONS = [
  '3등급인데 어떤 용구를 쓸 수 있나요?',
  '전동침대 보험 지원 얼마나 되나요?',
  '욕창 예방에 좋은 제품은?',
  '보행보조기 추천해 주세요',
]

export default function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || isLoading) return
    onSend(value.trim())
    setValue('')
  }

  return (
    <div className="border-t border-gray-100 bg-white/90 backdrop-blur-sm px-4 pt-3 pb-5">
      {/* 빠른 질문 */}
      <div className="flex flex-wrap gap-1.5 mb-3 overflow-x-auto pb-1">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSend(q)}
            disabled={isLoading}
            className="shrink-0 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-full hover:bg-brand-100 hover:border-brand-400 transition-all duration-150 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="복지용구나 장기요양보험에 대해 무엇이든 물어보세요..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all disabled:opacity-60 resize-none"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 w-11 h-11 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-150 flex items-center justify-center shadow-md shadow-brand-200"
          aria-label="전송"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}

