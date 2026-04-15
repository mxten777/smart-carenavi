import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useOrderStore } from '@/store/orderStore'

const CATEGORY_CONFIG = {
  이동보조: { emoji: '🦽', gradientStyle: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)', badge: 'bg-blue-100 text-blue-700',   dot: '#3b82f6' },
  욕창예방: { emoji: '🛏',  gradientStyle: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)', badge: 'bg-green-100 text-green-700',  dot: '#22c55e' },
  목욕:     { emoji: '🚿', gradientStyle: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)', badge: 'bg-purple-100 text-purple-700', dot: '#8b5cf6' },
  배설:     { emoji: '🚽', gradientStyle: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)', badge: 'bg-orange-100 text-orange-700', dot: '#f97316' },
  안전:     { emoji: '🛡',  gradientStyle: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)', badge: 'bg-yellow-100 text-yellow-700', dot: '#eab308' },
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const setPendingProduct = useOrderStore((s) => s.setPendingProduct)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) setError('제품을 찾을 수 없습니다.')
      else setProduct(data)
      setLoading(false)
    }
    fetchProduct()
  }, [id])

  const handleBuy = () => {
    setPendingProduct(product)
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">제품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-red-500 font-medium mb-4">{error ?? '제품을 찾을 수 없습니다.'}</p>
          <Link to="/products" className="btn-secondary">← 목록으로</Link>
        </div>
      </div>
    )
  }

  const cfg = CATEGORY_CONFIG[product.category] ?? {
    emoji: '📦',
    gradientStyle: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    badge: 'bg-gray-100 text-gray-700',
    dot: '#94a3b8',
  }
  const features = product.features ?? {}
  const grades = product.target_grade?.join(', ') ?? '전체'
  const selfPay = Math.round(product.price * 0.15).toLocaleString()
  const saved = Math.round(product.price * 0.85).toLocaleString()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 py-3 text-sm text-gray-400 flex items-center gap-1.5">
          <Link to="/" className="hover:text-brand-600 transition-colors">홈</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/products" className="hover:text-brand-600 transition-colors">복지용구</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* 이미지 */}
          <div className="relative">
            <div
              className="rounded-3xl overflow-hidden border border-gray-100/80 relative"
              style={{ minHeight: '340px', background: cfg.gradientStyle }}
            >
              {product.image_url && !imgError ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '340px', maxHeight: '420px' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-24 relative">
                  {/* 장식 원 */}
                  <div className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-20" style={{ background: cfg.dot }} />
                  <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full opacity-15" style={{ background: cfg.dot }} />
                  <span className="text-9xl relative z-10">{cfg.emoji}</span>
                </div>
              )}
            </div>
            {/* 카테고리 오버레이 뱃지 */}
            <span className={`absolute top-4 left-4 badge ${cfg.badge} text-sm`}>{product.category}</span>
          </div>

          {/* 상세 정보 */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">{product.name}</h1>
              <p className="text-gray-500 leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* 가격 카드 */}
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">보험 적용 가격</p>
              <div className="flex items-end gap-2 mb-3">
                <p className="text-3xl font-extrabold text-brand-600">약 {selfPay}원</p>
                <p className="text-sm text-gray-400 line-through mb-1">{product.price.toLocaleString()}원</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4 w-fit">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                최대 {saved}원 절약 (본인부담 15%)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400">지원 등급</span>
                  <span className="font-bold text-gray-800">{grades}등급</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400">카테고리</span>
                  <span className="font-bold text-gray-800">{product.category}</span>
                </div>
              </div>
            </div>

            {/* 스펙 */}
            {Object.keys(features).filter(k => k !== 'brand').length > 0 && (
              <div className="glass-card p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">제품 스펙</p>
                <dl className="grid grid-cols-2 gap-2">
                  {Object.entries(features)
                    .filter(([k]) => k !== 'brand')
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-0.5 bg-gray-50/80 rounded-xl px-3 py-2">
                        <dt className="text-[10px] text-gray-400 uppercase">{key}</dt>
                        <dd className="text-xs font-semibold text-gray-800">{String(value)}</dd>
                      </div>
                    ))}
                </dl>
                {features.brand && (
                  <p className="mt-3 text-xs text-gray-400">브랜드: <span className="font-medium text-gray-600">{features.brand}</span></p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleBuy}
                className="btn-primary w-full py-4 text-base rounded-2xl"
              >
                구매하기 (상담 신청)
              </button>
              <Link
                to="/chat"
                className="btn-secondary w-full py-3 text-sm rounded-2xl text-center"
              >
                AI 상담사에게 먼저 물어보기
              </Link>
              <p className="text-xs text-center text-gray-400">
                주문 후 상담원이 직접 연락드립니다
              </p>
            </div>
          </div>
        </div>

        {/* AI 상담 유도 배너 */}
        <div className="mt-10 hero-gradient rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-lg font-bold mb-1">이 제품이 나에게 맞는지 모르겠다면?</h3>
              <p className="text-sm text-white/70">AI 상담사가 등급과 상황에 맞게 딱 맞는 제품을 안내해 드립니다</p>
            </div>
            <Link
              to="/chat"
              className="shrink-0 bg-white text-brand-700 font-semibold text-sm px-5 py-3 rounded-2xl hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-lg whitespace-nowrap"
            >
              AI 상담하기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

