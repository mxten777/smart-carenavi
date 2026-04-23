import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

async function fetchStats() {
  const [orders, products, sessions, chunks] = await Promise.all([
    supabase.from('orders').select('id, status, contract_type, created_at, user_name, products(name)').order('created_at', { ascending: false }),
    supabase.from('products').select('is_active, category'),
    supabase.from('chat_sessions').select('created_at'),
    supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
  ])
  return {
    orders: orders.data ?? [],
    products: products.data ?? [],
    sessions: sessions.data ?? [],
    chunkCount: chunks.count ?? 0,
  }
}

const STATUS_META = {
  pending:   { label: '접수 대기',  color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  confirmed: { label: '상담 확인',  color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  preparing: { label: '배송 준비',  color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
  shipped:   { label: '배송 중',    color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
  installed: { label: '설치 완료',  color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-500' },
  active:    { label: '대여 진행',  color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  cancelled: { label: '취소',       color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
}

function StatCard({ icon, label, value, sub, subGreen, accent }) {
  const accents = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
    amber:   'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-gray-600 mt-0.5">{label}</p>
        {sub && <p className={`text-xs mt-1 font-medium ${subGreen ? 'text-emerald-600' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats().then((s) => { setStats(s); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 h-8 w-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const { orders, products, sessions, chunkCount } = stats
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const orderByStatus = orders.reduce((a, o) => { a[o.status] = (a[o.status] ?? 0) + 1; return a }, {})
  const rentalCount   = orders.filter((o) => o.contract_type === 'rental').length
  const purchaseCount = orders.filter((o) => o.contract_type === 'purchase').length
  const recentOrders  = orders.filter((o) => new Date(o.created_at) >= sevenDaysAgo)
  const activeProducts = products.filter((p) => p.is_active).length
  const categoryMap   = products.reduce((a, p) => { a[p.category] = (a[p.category] ?? 0) + 1; return a }, {})
  const recentSessions = sessions.filter((s) => new Date(s.created_at) >= sevenDaysAgo).length
  const pendingCount  = orderByStatus['pending'] ?? 0

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">스마트케어나비 운영 현황</p>
        </div>
        {pendingCount > 0 && (
          <Link to="/admin/orders"
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            접수 대기 {pendingCount}건
          </Link>
        )}
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          accent="blue" label="전체 주문" value={orders.length}
          sub={`최근 7일 +${recentOrders.length}건`} subGreen={recentOrders.length > 0}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          accent="emerald" label="활성 제품" value={activeProducts}
          sub={`전체 ${products.length}개`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          accent="violet" label="상담 세션" value={sessions.length}
          sub={`최근 7일 +${recentSessions}회`} subGreen={recentSessions > 0}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
        <StatCard
          accent="amber" label="RAG 청크" value={chunkCount}
          sub="검색 가능 텍스트"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 주문 상태 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">주문 상태</h2>
            <Link to="/admin/orders" className="text-xs text-brand-600 hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = orderByStatus[status] ?? 0
              const pct   = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className="text-gray-700">{meta.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${meta.dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{rentalCount}</p>
              <p className="text-xs text-blue-500 mt-0.5">대여</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-violet-600">{purchaseCount}</p>
              <p className="text-xs text-violet-500 mt-0.5">구매</p>
            </div>
          </div>
        </div>

        {/* 카테고리 분포 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">제품 카테고리</h2>
            <Link to="/admin/products" className="text-xs text-brand-600 hover:underline">관리</Link>
          </div>
          <div className="space-y-3.5">
            {Object.entries(categoryMap)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count], i) => {
                const pct = Math.round((count / products.length) * 100)
                const colors = ['bg-brand-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500']
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-700">{cat}</span>
                      <span className="text-xs text-gray-500">{count}개 ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 최근 주문 피드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">최근 주문</h2>
            <span className="text-xs text-gray-400">최근 7일</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">최근 주문 없음</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 6).map((o) => {
                const meta = STATUS_META[o.status] ?? STATUS_META.pending
                return (
                  <div key={o.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{o.user_name}</p>
                      <p className="text-xs text-gray-400 truncate">{o.products?.name ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
