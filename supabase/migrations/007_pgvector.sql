-- ============================================================
-- Migration 007: pgvector 시맨틱 검색 활성화
-- ============================================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. document_chunks 에 embedding 컬럼 추가
ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. products 에 embedding 컬럼 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 4. 코사인 유사도 인덱스 (IVFFlat — 데이터 적을 때 충분)
--    데이터가 1만건 이상 될 경우 lists 값을 늘려야 함
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_products_embedding
  ON public.products
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 20);

-- 5. 청크 벡터 검색 함수
--    query_embedding: 검색할 질문의 임베딩 (클라이언트에서 전달)
--    match_threshold: 최소 유사도 (0.0 ~ 1.0)
--    match_count: 반환할 최대 건수
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding  vector(1536),
  match_threshold  float  DEFAULT 0.5,
  match_count      int    DEFAULT 5
)
RETURNS TABLE (
  id          uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. 제품 벡터 검색 함수
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding  vector(1536),
  match_threshold  float  DEFAULT 0.4,
  match_count      int    DEFAULT 4
)
RETURNS TABLE (
  id            uuid,
  name          text,
  category      text,
  price         int,
  description   text,
  image_url     text,
  target_grade  int[],
  features      jsonb,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.category,
    p.price,
    p.description,
    p.image_url,
    p.target_grade,
    p.features,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.is_active = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 7. 함수 공개 접근 허용 (Edge Function 서비스 롤에서 호출)
GRANT EXECUTE ON FUNCTION public.match_document_chunks TO service_role;
GRANT EXECUTE ON FUNCTION public.match_products TO service_role;
