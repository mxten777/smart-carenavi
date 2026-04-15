import { useState } from 'react'
import { Link } from 'react-router-dom'

const CATEGORY_CONFIG = {
  이동보조: { emoji: '🦽', gradientStyle: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)', badge: 'bg-blue-100 text-blue-700',   dot: '#3b82f6' },
  욕창예방: { emoji: '🛏',  gradientStyle: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)', badge: 'bg-green-100 text-green-700',  dot: '#22c55e' },
  목욕:     { emoji: '🚿', gradientStyle: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)', badge: 'bg-purple-100 text-purple-700', dot: '#8b5cf6' },
  배설:     { emoji: '🚽', gradientStyle: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)', badge: 'bg-orange-100 text-orange-700', dot: '#f97316' },
  안전:     { emoji: '🛡',  gradientStyle: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)', badge: 'bg-yellow-100 text-yellow-700', dot: '#eab308' },
}

export default function ProductCard({ product, compact = false }) {
  const [imgError, setImgError] = useState(false)
  const cfg = CATEGORY_CONFIG[product.category] ?? {
    emoji: '📦',
    gradientStyle: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    badge: 'bg-gray-100 text-gray-700',
    dot: '#94a3b8',
  }
  const grades = product.target_grade?.join(', ') ?? '전체'
  const selfPay = Math.round(product.price * 0.15).toLocaleString()

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 border border-gray-100/80"
    >
      {/* 이미지 영역 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 relative overflow-hidden"
            style={{ background: cfg.gradientStyle }}
          >
            {/* 장식 원 */}
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20"
              style={{ background: cfg.dot }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-15"
              style={{ background: cfg.dot }}
            />
            <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">
              {cfg.emoji}
            </span>
          </div>
        )}

        {/* 오버레이 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 카테고리 배지 */}
        <span className={`absolute top-3 left-3 badge ${cfg.badge} backdrop-blur-sm`}>
          {product.category}
        </span>

        {/* 등급 배지 */}
        <span className="absolute top-3 right-3 badge bg-white/90 text-gray-600 backdrop-blur-sm shadow-sm">
          {grades}등급
        </span>
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-brand-700 transition-colors">
          {product.name}
        </h3>

        {!compact && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="pt-3 border-t border-gray-50 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">보험 적용 후</p>
            <p className="text-base font-bold text-brand-600">
              약 {selfPay}
              <span className="text-sm font-normal text-gray-500">원</span>
            </p>
            <p className="text-[10px] text-gray-400 line-through">{product.price.toLocaleString()}원</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            급여적용
          </span>
        </div>
      </div>
    </Link>
  )
}
