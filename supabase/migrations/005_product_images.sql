-- ============================================================
-- Migration 005: 제품 이미지 설정 + Supabase Storage 버킷 구성
-- ============================================================

-- ============================================================
-- 1. product-images 버킷 생성 (공개 읽기)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,            -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 공개 읽기 정책 (누구나 이미지 조회 가능)
CREATE POLICY IF NOT EXISTS "product_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- 인증된 사용자만 업로드 가능 (향후 관리자 롤로 교체)
CREATE POLICY IF NOT EXISTS "product_images_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "product_images_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "product_images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- ============================================================
-- 2. 제품별 플레이스홀더 이미지 URL 설정
--    실제 이미지 업로드 전까지 placehold.co 사용
--    Supabase Storage 업로드 후 아래 URL을 교체
-- ============================================================

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/dbeafe/1d4ed8?text=Electric+Bed'
WHERE name = '전동침대 (3모터)';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/dcfce7/166534?text=Air+Mattress'
WHERE name = '욕창예방 에어매트리스';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/fef9c3/854d0e?text=Wheelchair'
WHERE name = '수동 휠체어 (경량)';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/f3e8ff/7e22ce?text=Shower+Chair'
WHERE name = '이동식 욕조 샤워체어';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/ffedd5/c2410c?text=Commode+Chair'
WHERE name = '이동식 변기 (손잡이 포함)';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/d1fae5/065f46?text=Walker'
WHERE name = '실내 보행보조기 (워커)';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/e0f2fe/0c4a6e?text=Safety+Rail'
WHERE name = '욕실 안전 손잡이 SET';

UPDATE public.products
SET image_url = 'https://placehold.co/400x300/fef08a/713f12?text=Safety+Mat'
WHERE name = '미끄럼방지 욕실 매트';
