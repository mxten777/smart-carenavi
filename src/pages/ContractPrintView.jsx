import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  rentalContractHTML,
  purchaseContractHTML,
  privacyConsentHTML,
  careContractHTML,
} from '../lib/contractTemplates'

const CONTRACT_LABELS = {
  rental: '복지용구 대여 계약서',
  purchase: '복지용구 구매 계약서',
  privacy: '개인정보 수집·이용 동의서',
  care: '장기요양 급여 제공 계약서',
}

export default function ContractPrintView() {
  const { orderId, type } = useParams()
  const navigate = useNavigate()
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: order, error: oErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()
        if (oErr) throw oErr

        let product = null
        if (order.product_id) {
          const { data: p, error: pErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', order.product_id)
            .single()
          if (!pErr) product = p
        }

        // fallback product when not found
        if (!product) {
          product = { name: '복지용구', category: '복지용구', price: 0, target_grade: [] }
        }

        const contractOrder = {
          id: order.id,
          user_name: order.user_name,
          phone: order.phone,
          birth_date: order.birth_date ?? null,
          address: order.address ?? null,
          address_detail: order.address_detail ?? null,
          care_grade: order.care_grade ?? null,
          contract_type: order.contract_type ?? 'purchase',
        }

        let generated = ''
        if (type === 'rental') generated = rentalContractHTML(contractOrder, product)
        else if (type === 'purchase') generated = purchaseContractHTML(contractOrder, product)
        else if (type === 'privacy') generated = privacyConsentHTML(contractOrder)
        else if (type === 'care') generated = careContractHTML(contractOrder, product)
        else setError('알 수 없는 계약서 종류입니다.')

        setHtml(generated)
      } catch (e) {
        console.error(e)
        setError('계약서를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, type])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">계약서를 준비하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print controls — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm"
          >
            ← 뒤로
          </button>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800 text-sm">
            {CONTRACT_LABELS[type] ?? '계약서'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            인쇄 / PDF 저장
          </button>
        </div>
      </div>

      {/* Contract content rendered inside an iframe for isolated styling */}
      <div className="pt-[56px] min-h-screen bg-gray-100 no-print-wrapper">
        <iframe
          srcDoc={html}
          className="w-full contract-frame"
          style={{ minHeight: 'calc(100vh - 56px)', border: 'none', background: 'white' }}
          title={CONTRACT_LABELS[type] ?? '계약서'}
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-wrapper { padding-top: 0 !important; background: white !important; }
          .contract-frame {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
          }
        }
      `}</style>
    </>
  )
}
