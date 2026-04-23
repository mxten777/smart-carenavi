import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useOrderStore } from '@/store/orderStore'
import { useAuthStore } from '@/store/authStore'

const INPUT_CLS = (err) =>
  `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 ${
    err
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-brand-400 focus:ring-brand-100'
  }`

// 모바일에서 숫자 키패드 자동 표시
const TEL_PROPS = { type: 'tel', inputMode: 'tel', autoComplete: 'tel' }
const DATE_PROPS = { inputMode: 'numeric' }

export default function Checkout() {
  const navigate = useNavigate()
  const { pendingProduct, isSubmitting, error, submitOrder } = useOrderStore()
  const { user, profile } = useAuthStore()
  const [summaryOpen, setSummaryOpen] = useState(true)

  const [form, setForm] = useState({
    contractType: 'rental',
    userName: '',
    phone: '',
    address: '',
    addressDetail: '',
    birthDate: '',
    careGrade: '',
    notes: '',
    agreedPrivacy: false,
  })
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (!pendingProduct) navigate('/products', { replace: true })
  }, [pendingProduct, navigate])

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        userName: profile.name ?? f.userName,
        phone: profile.phone ?? f.phone,
        careGrade: profile.care_grade ? String(profile.care_grade) : f.careGrade,
      }))
    }
  }, [profile])

  if (!pendingProduct) return null

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: val }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const errs = {}
    if (!form.userName.trim()) errs.userName = '이름을 입력해 주세요'
    if (!form.phone.trim()) errs.phone = '연락처를 입력해 주세요'
    else if (!/^[0-9\-]{9,13}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = '올바른 연락처 형식: 010-1234-5678'
    if (!form.address.trim()) errs.address = '주소를 입력해 주세요'
    if (!form.birthDate.trim()) errs.birthDate = '생년월일을 입력해 주세요'
    if (!form.agreedPrivacy) errs.agreedPrivacy = '개인정보 수집·이용에 동의해 주세요'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs)
      const firstKey = Object.keys(errs)[0]
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setValidationErrors({})
    try {
      await submitOrder({
        productId: pendingProduct.id,
        userId: user?.id ?? null,
        userName: form.userName.trim(),
        phone: form.phone.trim(),
        contractType: form.contractType,
        address: form.address.trim(),
        addressDetail: form.addressDetail.trim() || null,
        birthDate: form.birthDate.trim(),
        careGrade: form.careGrade ? Number(form.careGrade) : null,
        notes: form.notes.trim() || null,
        agreedPrivacy: form.agreedPrivacy,
      })
      navigate('/order-complete')
    } catch {
      // error state handled in store
    }
  }

  const selfPay = Math.round(pendingProduct.price * 0.15).toLocaleString()
  const isRental = form.contractType === 'rental'

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
      {/* 페이지 제목 */}
      <h1 className="text-xl font-bold text-gray-900 mb-1">구매 신청</h1>
      <p className="text-sm text-gray-500 mb-5">주문 내용을 확인하고 신청 정보를 입력해 주세요</p>

      {/* 비로그인 시 로그인 유도 배너 */}
      {!user && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-brand-700">
            로그인하면 이름·연락처·등급이 자동으로 채워집니다
          </p>
          <Link to="/login" className="text-sm font-semibold text-brand-600 hover:underline flex-shrink-0">
            로그인 →
          </Link>
        </div>
      )}

      {/* 주문 제품 요약 (접기/펼치기) */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 mb-5 overflow-hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <span className="text-base">🛍️</span>
            {pendingProduct.name}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-brand-700 font-semibold">본인부담 ~{selfPay}원</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
        {summaryOpen && (
          <div className="flex gap-4 px-4 pb-4 border-t border-gray-100 pt-3">
            {pendingProduct.image_url && (
              <img
                src={pendingProduct.image_url}
                alt={pendingProduct.name}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div>
              <span className="text-xs text-brand-600 font-medium">{pendingProduct.category}</span>
              <p className="text-sm text-gray-500 mt-0.5">정가: {pendingProduct.price.toLocaleString()}원</p>
              <p className="text-sm font-semibold text-brand-700">본인부담 (15%): 약 {selfPay}원</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* 대여 / 구매 선택 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            이용 방식 <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'rental', label: '대여', desc: '월 본인부담 15%', icon: '🔄' },
              { value: 'purchase', label: '구매', desc: '일시불 본인부담 15%', icon: '🛒' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center gap-1 cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                  form.contractType === opt.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <input
                  type="radio"
                  name="contractType"
                  value={opt.value}
                  checked={form.contractType === opt.value}
                  onChange={set('contractType')}
                  className="sr-only"
                />
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-semibold text-gray-800 text-sm">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
              </label>
            ))}
          </div>
          {isRental && (
            <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-3 py-2">
              💡 대여 서비스는 월 렌탈료로 제공되며, 장기요양 인정 기간 동안 이용 가능합니다.
            </p>
          )}
        </div>

        {/* 신청자 이름 */}
        <div id="field-userName">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            신청자 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.userName}
            onChange={set('userName')}
            placeholder="홍길동"
            autoComplete="name"
            className={INPUT_CLS(validationErrors.userName)}
          />
          {validationErrors.userName && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.userName}</p>
          )}
        </div>

        {/* 연락처 */}
        <div id="field-phone">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            {...TEL_PROPS}
            value={form.phone}
            onChange={set('phone')}
            placeholder="010-1234-5678"
            className={INPUT_CLS(validationErrors.phone)}
          />
          {validationErrors.phone && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
          )}
        </div>

        {/* 생년월일 */}
        <div id="field-birthDate">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            생년월일 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...DATE_PROPS}
            value={form.birthDate}
            onChange={set('birthDate')}
            placeholder="1945-06-15"
            maxLength={10}
            className={INPUT_CLS(validationErrors.birthDate)}
          />
          {validationErrors.birthDate && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.birthDate}</p>
          )}
        </div>

        {/* 주소 */}
        <div id="field-address">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={set('address')}
            placeholder="서울특별시 ○○구 ○○로 000"
            autoComplete="street-address"
            className={`${INPUT_CLS(validationErrors.address)} mb-2`}
          />
          <input
            type="text"
            value={form.addressDetail}
            onChange={set('addressDetail')}
            placeholder="상세 주소 (동/호수 등, 선택)"
            className={INPUT_CLS(false)}
          />
          {validationErrors.address && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>
          )}
        </div>

        {/* 장기요양등급 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            장기요양등급 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <select
            value={form.careGrade}
            onChange={set('careGrade')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 bg-white"
          >
            <option value="">모름 / 없음</option>
            <option value="1">1등급</option>
            <option value="2">2등급</option>
            <option value="3">3등급</option>
            <option value="4">4등급</option>
            <option value="5">5등급</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            등급이 없으시면 비워두셔도 됩니다. 상담 시 함께 안내해 드립니다.
          </p>
        </div>

        {/* 요청사항 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            요청사항 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="방문 가능 시간, 특이사항 등을 자유롭게 입력해 주세요"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 resize-none"
          />
        </div>

        {/* 개인정보 동의 */}
        <div
          id="field-agreedPrivacy"
          className={`rounded-xl border-2 p-4 ${
            validationErrors.agreedPrivacy ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreedPrivacy}
              onChange={set('agreedPrivacy')}
              className="mt-0.5 w-5 h-5 rounded accent-brand-600 flex-shrink-0"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              <strong className="text-gray-900">[필수] 개인정보 수집·이용에 동의합니다.</strong>
              <br />
              <span className="text-gray-500">
                수집 항목: 성명, 생년월일, 연락처, 주소, 장기요양등급<br />
                목적: 복지용구 서비스 제공, 장기요양 급여 청구<br />
                보유 기간: 서비스 종료 후 5년
              </span>
            </span>
          </label>
          {validationErrors.agreedPrivacy && (
            <p className="text-xs text-red-500 mt-2">{validationErrors.agreedPrivacy}</p>
          )}
        </div>

        {/* 서버 에러 */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            주문 처리 중 오류가 발생했습니다: {error}
          </p>
        )}

        {/* 뒤로 가기 링크 */}
        <Link
          to={`/product/${pendingProduct.id}`}
          className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2"
        >
          ← 제품 상세로 돌아가기
        </Link>
      </form>

      {/* 고정 하단 제출 버튼 (모바일 thumb zone) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg z-10">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{pendingProduct.name}</p>
            <p className="text-sm font-bold text-brand-700">본인부담 ~{selfPay}원</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                처리 중...
              </span>
            ) : '상담 신청하기'}
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-1">
          신청 후 영업일 기준 1~2일 내 담당 상담원이 연락드립니다
        </p>
      </div>
    </div>
  )
}

