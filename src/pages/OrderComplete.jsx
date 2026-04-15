import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOrderStore } from '@/store/orderStore'

const CONTRACT_TYPES = [
  {
    key: 'privacy',
    label: '개인정보 수집·이용 동의서',
    icon: '🔒',
    always: true,
  },
  {
    key: 'rental',
    label: '복지용구 대여 계약서',
    icon: '📋',
    contractType: 'rental',
  },
  {
    key: 'purchase',
    label: '복지용구 구매 계약서',
    icon: '📋',
    contractType: 'purchase',
  },
  {
    key: 'care',
    label: '장기요양 급여 제공 계약서',
    icon: '📑',
    always: true,
  },
]

export default function OrderComplete() {
  const { lastOrder, clearOrder } = useOrderStore()

  useEffect(() => {
    return () => clearOrder()
  }, [clearOrder])

  if (!lastOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">주문 정보가 없습니다.</p>
        <Link to="/" className="text-brand-600 hover:underline">홈으로 이동</Link>
      </div>
    )
  }

  const orderedContractType = lastOrder.contract_type ?? 'purchase'
  const visibleContracts = CONTRACT_TYPES.filter(
    (c) => c.always || c.contractType === orderedContractType,
  )

  const openContract = (type) => {
    window.open(`/contract/${lastOrder.id}/${type}`, '_blank')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">✅</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">신청이 완료되었습니다!</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        <strong>{lastOrder.user_name}</strong>님, 상담 신청을 접수했습니다.
        <br />
        담당 상담원이 <strong>{lastOrder.phone}</strong>으로 연락드릴 예정입니다.
      </p>

      {/* 주문 정보 카드 */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">신청 정보 확인</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">주문번호</dt>
            <dd className="font-mono text-gray-700 text-xs">{lastOrder.id.slice(0, 8).toUpperCase()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">신청자</dt>
            <dd className="text-gray-800">{lastOrder.user_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">연락처</dt>
            <dd className="text-gray-800">{lastOrder.phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">이용 방식</dt>
            <dd className="text-gray-800">{orderedContractType === 'rental' ? '대여' : '구매'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">상태</dt>
            <dd className="text-amber-600 font-medium">접수 완료 (확인 중)</dd>
          </div>
        </dl>
      </div>

      {/* 계약서 다운로드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 text-left">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">📄 계약서 출력 / PDF 저장</h2>
        <p className="text-xs text-gray-400 mb-4">
          아래 버튼을 클릭하면 계약서가 새 탭에서 열립니다. 브라우저 인쇄 기능으로 PDF 저장이 가능합니다.
        </p>
        <div className="flex flex-col gap-2">
          {visibleContracts.map((c) => (
            <button
              key={c.key}
              onClick={() => openContract(c.key)}
              className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-sm text-blue-800 font-medium"
            >
              <span className="text-lg">{c.icon}</span>
              <span>{c.label}</span>
              <svg className="w-4 h-4 ml-auto text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-700 text-left">
        <p className="font-semibold mb-1">📞 상담원 연락 안내</p>
        <ul className="space-y-1 text-blue-600">
          <li>• 영업일 기준 1~2일 이내 연락드립니다</li>
          <li>• 장기요양인정서 준비 시 빠른 처리 가능합니다</li>
          <li>• 문의: 1599-0000 (평일 09:00~18:00)</li>
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-3">
        <Link
          to="/products"
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          다른 제품 더 보기
        </Link>
        <Link
          to="/chat"
          className="bg-white text-brand-700 font-medium py-3 px-6 rounded-xl border border-brand-200 hover:bg-brand-50 transition-colors"
        >
          AI 상담 계속하기
        </Link>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 py-2">
          홈으로
        </Link>
      </div>
    </div>
  )
}
