-- ============================================================
-- Migration 002: 복지용구 제품 이미지 URL 업데이트
-- loremflickr 키워드 기반 사진으로 교체 (?lock=N 으로 이미지 고정)
-- ============================================================

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/hospital-bed,adjustable?lock=10'
WHERE name = '전동침대 (3모터)';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/air-mattress,medical?lock=20'
WHERE name = '욕창예방 에어매트리스';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/wheelchair?lock=30'
WHERE name = '수동 휠체어 (경량)';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/shower-chair,bath?lock=40'
WHERE name = '이동식 욕조 샤워체어';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/commode,toilet?lock=50'
WHERE name = '이동식 변기 (손잡이 포함)';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/rollator,walker,elderly?lock=60'
WHERE name = '실내 보행보조기 (워커)';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/grab-bar,bathroom-safety?lock=70'
WHERE name = '욕실 안전 손잡이 SET';

UPDATE public.products SET image_url =
  'https://loremflickr.com/400/300/bath-mat,non-slip?lock=80'
WHERE name = '미끄럼방지 욕실 매트';
