import { Link } from 'react-router-dom'

// HTML 특수문자 이스케이프 — dangerouslySetInnerHTML 사용 전 반드시 처리
const escapeHtml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  const formatContent = (text) => {
    return text.split('\n').map((line, i, arr) => {
      // 1. 먼저 이스케이프 → 2. 안전한 마크다운 태그만 치환
      const safe = escapeHtml(line)
      const html = safe
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-white/20 px-1.5 py-0.5 rounded text-[0.8em] font-mono">$1</code>')
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: html }} />
          {i < arr.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex flex-col max-w-[85%] animate-fade-in ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {!isUser && (
        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm0 4a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
          </div>
          <span className="text-xs text-gray-400 font-medium">AI 상담사</span>
        </div>
      )}

      <div
        className={`px-4 py-3 text-sm leading-relaxed max-w-full ${
          isUser
            ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-brand-200'
            : message.isError
              ? 'bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-bl-sm'
              : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-card border border-gray-100/80'
        }`}
      >
        {formatContent(message.content)}
      </div>

      {/* 추천 제품 (AI 메시지에만) */}
      {!isUser && message.recommendedProducts?.length > 0 && (
        <div className="mt-3 w-full ml-1 max-w-md">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <span>✦</span> 추천 복지용구
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.recommendedProducts.slice(0, 2).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:border-brand-200 hover:shadow-soft transition-all duration-200 group"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-brand-50 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                )}
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-700 transition-colors">{product.name}</p>
                  <p className="text-xs text-brand-600 font-bold mt-1">
                    약 {Math.round(product.price * 0.15).toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-gray-400">{product.target_grade?.join(',')}등급 지원</p>
                </div>
              </Link>
            ))}
          </div>
          {message.recommendedProducts.length > 2 && (
            <Link to="/products" className="mt-2 block text-xs text-center text-brand-600 hover:text-brand-800 font-medium">
              전체 제품 보기 →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
