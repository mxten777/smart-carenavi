import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 입력하세요.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** 현재 로그인 사용자 반환 (없으면 null) */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 제품 이미지를 Supabase Storage에 업로드하고 공개 URL 반환
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} productId - 제품 UUID (파일명에 사용)
 * @returns {Promise<string>} 공개 접근 가능한 이미지 URL
 */
export async function uploadProductImage(file, productId) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `products/${productId}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

/**
 * 제품 image_url DB 업데이트
 * @param {string} productId
 * @param {string} imageUrl
 */
export async function updateProductImageUrl(productId, imageUrl) {
  const { error } = await supabase
    .from('products')
    .update({ image_url: imageUrl })
    .eq('id', productId)
  if (error) throw new Error(`DB 업데이트 실패: ${error.message}`)
}
