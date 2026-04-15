import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

/**
 * 주문 상태 관리 (Zustand)
 */
export const useOrderStore = create((set) => ({
  pendingProduct: null, // 주문 진행 중인 제품
  lastOrder: null,       // 마지막 완료 주문
  isSubmitting: false,
  error: null,

  /** 주문할 제품 설정 (checkout 진입 시 호출) */
  setPendingProduct: (product) => set({ pendingProduct: product }),

  /** 주문 생성 */
  submitOrder: async ({
    productId,
    userName,
    phone,
    contractType,
    address,
    addressDetail,
    birthDate,
    careGrade,
    notes,
    agreedPrivacy,
  }) => {
    set({ isSubmitting: true, error: null })

    const { data, error } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        user_name: userName,
        phone,
        contract_type: contractType ?? 'purchase',
        address: address ?? null,
        address_detail: addressDetail ?? null,
        birth_date: birthDate ?? null,
        care_grade: careGrade ?? null,
        notes,
        agreed_privacy: agreedPrivacy ?? false,
        contract_at: new Date().toISOString(),
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) {
      console.error('[submitOrder]', error)
      set({ isSubmitting: false, error: '주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' })
      throw error
    }

    set({ lastOrder: data, isSubmitting: false, pendingProduct: null })
    return data
  },

  clearOrder: () => set({ pendingProduct: null, lastOrder: null, error: null }),
}))
