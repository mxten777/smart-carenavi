import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/products/ProductCard'
import ProductFilter from '@/components/products/ProductFilter'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-card animate-pulse">
      <div className="bg-gray-100" style={{ aspectRatio: '4/3' }} />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
        <div className="pt-3 flex justify-between">
          <div className="h-4 bg-gray-100 rounded-full w-1/3" />
          <div className="h-5 bg-gray-100 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [category, setCategory] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) setError('제품을 불러오는 데 실패했습니다.')
      else setProducts(data ?? [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = [...products]
    if (category) result = result.filter((p) => p.category === category)
    if (grade) result = result.filter((p) => p.target_grade?.includes(Number(grade)))
    setFiltered(result)
  }, [products, category, grade])

  const hasFilter = category || grade

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-sm font-medium text-brand-600 mb-2">장기요양보험 급여 적용</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">복지용구 전체 목록</h1>
          <p className="text-gray-400">정부 지원으로 최대 85% 절약할 수 있는 복지용구를 찾아보세요</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 필터 */}
        <div className="glass-card p-5 mb-8">
          <ProductFilter
            category={category}
            grade={grade}
            onCategoryChange={setCategory}
            onGradeChange={setGrade}
          />
        </div>

        {/* 결과 바 */}
        {!loading && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              총 <span className="font-bold text-gray-800">{filtered.length}</span>개 제품
            </p>
            {hasFilter && (
              <button
                onClick={() => { setCategory(''); setGrade('') }}
                className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                필터 초기화
              </button>
            )}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-500 font-medium mb-1">{error}</p>
            <p className="text-sm text-gray-400">Supabase 연결 설정을 확인해 주세요.</p>
          </div>
        )}

        {/* 제품 그리드 */}
        {!loading && !error && (
          filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-gray-700 mb-1">해당 조건에 맞는 제품이 없습니다</p>
              <p className="text-sm text-gray-400 mb-5">다른 카테고리나 등급으로 검색해 보세요</p>
              <button
                onClick={() => { setCategory(''); setGrade('') }}
                className="btn-secondary"
              >
                전체 보기
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

