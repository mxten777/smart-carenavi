-- Migration 003: 제품 이미지 URL 초기화
-- loremflickr 랜덤 이미지 제거 → 카테고리별 그라디언트 + 이모지 fallback UI 사용

UPDATE public.products SET image_url = NULL WHERE is_active = true;
