import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_CONFIG = {
  pending:   { label: '접수 대기',   cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',   step: 1 },
  confirmed: { label: '상담 확인',   cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    step: 2 },
  preparing: { label: '배송 준비',   cls: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500',  step: 3 },
  shipped:   { label: '배송 중',     cls: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500',  step: 4 },
  installed: { label: '설치 완료',   cls: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-500',    step: 5 },
  active:    { label: '대여 진행',   cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', step: 6 },
  cancelled: { label: '취소',        cls: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     step: 0 },
}
// 표시 순서: 진행 단계 순, 취소는 마지막
const STATUS_OPTIONS = [
  'pending','confirmed','preparing','shipped','installed','active','cancelled'
].map((v) => ({ value: v, label: STATUS_CONFIG[v].label }))

function DetailPanel({ order, onClose, onStatusChange, updating }) {
  if (!order) return null
  const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

  // 진행 단계 (취소 제외한 순서)
  const STEPS = ['pending','confirmed','preparing','shipped','installed','active']
  const currentStep = STATUS_CONFIG[order.status]?.step ?? 0
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">주문 상세</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">

          {/* 진행 단계 스텝바 */}
          {!isCancelled ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">진행 단계</p>
              <div className="relative">
                {/* 연결선 */}
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100" />
                <div
                  className="absolute top-3 left-3 h-0.5 bg-brand-500 transition-all"
                  style={{ width: `calc(${Math.max(0, currentStep - 1)} / 5 * (100% - 0px))` }}
                />
                <div className="relative flex justify-between">
                  {STEPS.map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    const done = currentStep > cfg.step
                    const active = currentStep === cfg.step
                    return (
                      <button
                        key={s}
                        disabled={updating === order.id}
                        onClick={() => onStatusChange(order.id, s)}
                        className="flex flex-col items-center gap-1.5 group"
                        title={cfg.label}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                          active ? 'bg-brand-600 border-brand-600' :
                          done  ? 'bg-brand-100 border-brand-400' :
                                  'bg-white border-gray-200 group-hover:border-gray-400'
                        }`}>
                          {done && (
                            <svg className="w-3 h-3 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${active ? 'text-brand-600 font-semibold' : done ? 'text-brand-400' : 'text-gray-400'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-sm text-red-600 font-medium">취소된 주문입니다</span>
            </div>
          )}

          {/* 상태 변경 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">상태 변경</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = order.status === opt.value
                const cfg = STATUS_CONFIG[opt.value]
                return (
                  <button
                    key={opt.value}
                    disabled={updating === order.id}
                    onClick={() => onStatusChange(order.id, opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? `${cfg.cls} border-current`
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 신청자 정보 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">신청자</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="이름" value={order.user_name} />
              <Row label="연락처" value={order.phone} />
              {order.care_grade && <Row label="장기요양등급" value={`${order.care_grade}등급`} />}
              {order.birth_date && <Row label="생년월일" value={order.birth_date} />}
            </div>
          </div>

          {/* 제품 & 방식 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">주문 내용</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="제품" value={order.products?.name ?? '—'} />
              <Row label="카테고리" value={order.products?.category ?? '—'} />
              <Row label="방식" value={order.contract_type === 'rental' ? '대여' : '구매'} />
              <Row label="접수일" value={new Date(order.created_at).toLocaleString('ko-KR')} />
            </div>
          </div>

          {/* 주소 */}
          {order.address && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">배송지</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <Row label="주소" value={order.address} />
                {order.address_detail && <Row label="상세" value={order.address_detail} />}
              </div>
            </div>
          )}

          {/* 비고 */}
          {order.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">비고</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    const query = supabase
      .from('orders')
      .select('*, products(name, category)')
      .order('created_at', { ascending: false })
      .limit(200)
    const { data } = filter === 'all' ? await query : await query.eq('status', filter)
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [filter])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
    setSelected((prev) => prev?.id === orderId ? { ...prev, status: newStatus } : prev)
    setUpdating(null)
  }

  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc }, {})

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter((o) =>
      o.user_name?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.products?.name?.toLowerCase().includes(q)
    )
  }, [orders, search])

  return (
    <div className="p-4 md:p-8">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {orders.length}건</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-brand-300 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 연락처, 제품명 검색…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: 'all', label: '전체' }, ...STATUS_OPTIONS].map((opt) => {
            const count = opt.value === 'all' ? orders.length : (counts[opt.value] ?? 0)
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === opt.value
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.value !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[opt.value]?.dot}`} />}
                {opt.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === opt.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">주문이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['접수일', '신청자', '제품', '방식', '상태', '변경', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900">{order.user_name}</p>
                      <p className="text-xs text-gray-400">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <p className="text-gray-800 truncate">{order.products?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{order.products?.category ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        order.contract_type === 'rental'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-violet-50 text-violet-600'
                      }`}>
                        {order.contract_type === 'rental' ? '대여' : '구매'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-400 bg-white disabled:opacity-50 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelected(order)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-brand-600 hover:underline transition-opacity"
                      >
                        상세 →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length}건 표시 {search && `(검색: "${search}")`}
          </div>
        </div>
      )}

      {/* 상세 패널 */}
      <DetailPanel
        order={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        updating={updating}
      />
    </div>
  )
}
