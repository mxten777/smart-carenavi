import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useOrderStore } from '@/store/orderStore'

const INPUT_CLS = (err) =>
  `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 ${
    err
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-brand-400 focus:ring-brand-100'
  }`

export default function Checkout() {
  const navigate = useNavigate()
  const { pendingProduct, isSubmitting, error, submitOrder } = useOrderStore()

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
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">구매 신청</h1>
      <p className="text-gray-500 mb-8">주문 내용을 확인하고 신청 정보를 입력해 주세요</p>

      {/* 주문 제품 요약 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 flex gap-4 border border-gray-100">
        {pendingProduct.image_url && (
          <img
            src={pendingProduct.image_url}
            alt={pendingProduct.name}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div>
          <span className="text-xs text-brand-600 font-medium">{pendingProduct.category}</span>
          <h2 className="font-semibold text-gray-900 mt-0.5 mb-1">{pendingProduct.name}</h2>
          <p className="text-sm text-gray-500">정가: {pendingProduct.price.toLocaleString()}원</p>
          <p className="text-sm font-semibold text-brand-700">
            본인부담 (15%): 약 {selfPay}원
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

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
                className={`flex flex-col items-center gap-1 cursor-pointer rounded-xl border-2 p-4 transition-all ${
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
                <span className="font-semibold text-gray-800">{opt.label}</span>
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
            type="tel"
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
              className="mt-0.5 w-4 h-4 rounded accent-brand-600 flex-shrink-0"
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

        {/* 제출 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '처리 중...' : '상담 신청하기'}
        </button>

        <p className="text-xs text-center text-gray-400">
          신청 후 영업일 기준 1~2일 내 담당 상담원이 연락드립니다
        </p>

        <Link
          to={`/product/${pendingProduct.id}`}
          className="block text-center text-sm text-gray-400 hover:text-gray-600"
        >
          ← 제품 상세로 돌아가기
        </Link>
      </form>
    </div>
  )
}
