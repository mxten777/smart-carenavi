-- ============================================================
-- smart-carenavi: Supabase DB 스키마 v1
-- Migration: 001_initial.sql
-- ============================================================

-- pgvector 확장 (embedding 지원 - 추후 활성화)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. PROFILES (사용자 프로필)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  phone       TEXT,
  care_grade  SMALLINT    CHECK (care_grade BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS '로그인 사용자 프로필 (장기요양 등급 포함)';
COMMENT ON COLUMN public.profiles.care_grade IS '장기요양인정 등급 1~5등급';

-- ============================================================
-- 2. PRODUCTS (복지용구 목록)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  category     TEXT        NOT NULL,              -- 이동보조, 욕창예방, 배설, 목욕, 기타
  price        INTEGER     NOT NULL,              -- 단위: 원
  description  TEXT,
  image_url    TEXT,
  target_grade INTEGER[]   DEFAULT '{1,2,3,4,5}', -- 지원 가능 등급
  features     JSONB       DEFAULT '{}',          -- 추가 스펙 (JSON)
  is_active    BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.products IS '복지용구 급여 품목';
COMMENT ON COLUMN public.products.target_grade IS '장기요양 지원 가능 등급 배열 (예: {1,2,3})';
COMMENT ON COLUMN public.products.features IS '제품 상세 스펙 JSON (예: {"weight":"5kg","size":"60x40cm"})';

-- ============================================================
-- 3. POLICY_DOCUMENTS (정책 문서)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.policy_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  content      TEXT,                             -- 전체 텍스트 (소형 문서)
  doc_type     TEXT        DEFAULT 'policy',     -- policy | manual | guide
  source_url   TEXT,
  storage_path TEXT,                             -- Supabase Storage 경로
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.policy_documents IS 'RAG 원본 정책/매뉴얼 문서';

-- ============================================================
-- 4. DOCUMENT_CHUNKS (RAG용 텍스트 청크)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  chunk_index INTEGER     NOT NULL DEFAULT 0,
  metadata    JSONB       DEFAULT '{}',          -- 페이지, 섹션 등
  -- embedding  vector(1536),                   -- pgvector 활성화 후 주석 해제
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.document_chunks IS 'RAG 검색용 청크 (추후 vector 검색으로 확장)';
COMMENT ON COLUMN public.document_chunks.metadata IS '청크 메타데이터 (예: {"page":3,"section":"급여기준"})';

-- 청크 검색을 위한 인덱스 (LIKE 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_chunks_content ON public.document_chunks USING gin(to_tsvector('simple', content));

-- ============================================================
-- 5. CHAT_SESSIONS (채팅 세션)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_name TEXT        DEFAULT '새 상담',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.chat_sessions IS 'AI 상담 세션 (비회원도 생성 가능)';

-- ============================================================
-- 6. CHAT_MESSAGES (채팅 메시지)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content      TEXT        NOT NULL,
  context_data JSONB       DEFAULT '{}',         -- 검색에 사용된 products/chunks 저장
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.chat_messages IS 'AI 상담 메시지 로그';
COMMENT ON COLUMN public.chat_messages.context_data IS 'RAG context (어떤 제품/문서가 사용됐는지)';

-- ============================================================
-- 7. ORDERS (주문)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  status      TEXT        DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'MVP 주문 (pending → 상담원 확인 → 처리)';

-- ============================================================
-- TRIGGERS: updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- products: 모든 사용자 읽기 허용 (비회원 포함)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

-- policy_documents: 모든 사용자 읽기 허용
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_docs_select_all"
  ON public.policy_documents FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- document_chunks: 모든 사용자 읽기 허용
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chunks_select_all"
  ON public.document_chunks FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- chat_sessions: 본인 세션만
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own"
  ON public.chat_sessions FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "sessions_insert_any"
  ON public.chat_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "sessions_update_own"
  ON public.chat_sessions FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- chat_messages: 세션 기반 접근
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_via_session"
  ON public.chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_any"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- orders: 본인 주문만 조회, 누구나 생성
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "orders_insert_any"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- ============================================================
-- SEED DATA: Mock 복지용구 (8개)
-- ============================================================
INSERT INTO public.products (name, category, price, description, image_url, target_grade, features) VALUES
(
  '전동침대 (3모터)',
  '이동보조',
  1500000,
  '등받이·다리받침·높이 조절이 가능한 3모터 전동침대. 낙상 방지 사이드레일 포함. 장기요양보험 1~2등급 지원.',
  'https://placehold.co/400x300/e0f2fe/0369a1?text=전동침대',
  '{1,2}',
  '{"motor":"3모터","weight":"70kg","size":"200x90cm","siderail":"포함","brand":"케어라인"}'
),
(
  '욕창예방 에어매트리스',
  '욕창예방',
  350000,
  '교대 압력 방식으로 욕창을 예방하는 에어 매트리스. 침대 위에 올려 사용. 소음 최소화 설계.',
  'https://placehold.co/400x300/f0fdf4/15803d?text=에어매트리스',
  '{1,2,3}',
  '{"type":"교대압력","noise":"35dB 이하","cell":"130개","brand":"에어케어"}'
),
(
  '수동 휠체어 (경량)',
  '이동보조',
  450000,
  '알루미늄 프레임 경량 수동 휠체어. 접이식 구조로 보관/이동 편리. 발판·팔걸이 탈부착 가능.',
  'https://placehold.co/400x300/fef9c3/854d0e?text=휠체어',
  '{1,2,3,4}',
  '{"weight":"11.5kg","frame":"알루미늄","foldable":true,"seat":"42cm","brand":"오토복"}'
),
(
  '이동식 욕조 샤워체어',
  '목욕',
  120000,
  '안전한 목욕을 위한 접이식 목욕의자. 미끄럼 방지 고무 발판 적용. 높이 조절 가능.',
  'https://placehold.co/400x300/fdf4ff/7e22ce?text=목욕의자',
  '{1,2,3,4,5}',
  '{"material":"알루미늄+PP","adjustable":true,"max_load":"130kg","brand":"케어스타"}'
),
(
  '이동식 변기 (손잡이 포함)',
  '배설',
  98000,
  '침실에서 사용 가능한 이동식 좌변기. 탈착 가능한 변기통과 스플래시 가드 포함.',
  'https://placehold.co/400x300/fff7ed/c2410c?text=이동변기',
  '{1,2,3,4,5}',
  '{"handle":"양측","bucket":"탈착","splash_guard":true,"brand":"메디마트"}'
),
(
  '실내 보행보조기 (워커)',
  '이동보조',
  185000,
  '4륜 실내 보행보조기. 브레이크 핸들·좌석·수납 바스켓 탑재. 문턱 통과 가능한 저상형.',
  'https://placehold.co/400x300/ecfdf5/065f46?text=보행보조기',
  '{3,4,5}',
  '{"wheels":4,"brake":true,"seat":true,"basket":true,"weight":"6.8kg","brand":"케어워크"}'
),
(
  '욕실 안전 손잡이 SET',
  '안전',
  75000,
  '욕실·화장실 낙상 방지용 L형 안전손잡이 2개 세트. 스테인리스 SUS304. 설치 앵커 포함.',
  'https://placehold.co/400x300/eff6ff/1d4ed8?text=안전손잡이',
  '{1,2,3,4,5}',
  '{"material":"SUS304","count":2,"max_load":"150kg","install":"앵커 포함","brand":"세이프홈"}'
),
(
  '미끄럼방지 욕실 매트',
  '안전',
  35000,
  '욕실 바닥 미끄럼 방지 PVC 매트. 흡착 컵 방식으로 고정. 항균 처리.',
  'https://placehold.co/400x300/f0f9ff/0c4a6e?text=안전매트',
  '{1,2,3,4,5}',
  '{"material":"PVC","size":"60x40cm","suction":true,"antibacterial":true,"brand":"세이프홈"}'
);

-- ============================================================
-- SEED DATA: Mock 정책 문서 (3개)
-- ============================================================
INSERT INTO public.policy_documents (title, content, doc_type) VALUES
(
  '장기요양보험 복지용구 급여 기준',
  '장기요양보험 복지용구 급여 기준 안내

1. 복지용구란?
복지용구는 장기요양인정자(1~5등급, 인지지원등급)의 일상생활이나 신체활동 지원에 필요한 용구입니다.

2. 급여 한도액
- 1~2등급: 연 160만원 한도 (본인부담 15%)
- 3~5등급: 연 160만원 한도 (본인부담 15%)
- 인지지원등급: 연 160만원 한도 (본인부담 15%)

3. 주요 급여 품목
구입품목: 이동변기, 목욕의자, 안전손잡이, 미끄럼방지용품, 간이변기, 지팡이
대여품목: 수동/전동 휠체어, 전동침대, 욕창예방 매트리스, 이동욕조, 보행보조기

4. 이용 절차
① 장기요양 인정 신청 (국민건강보험공단)
② 등급 판정 (1~5등급)
③ 장기요양 급여 계획 수립
④ 복지용구 사업소 선택 및 계약
⑤ 용구 수령 및 급여비 청구',
  'policy'
),
(
  '등급별 복지용구 이용 가이드',
  '등급별 복지용구 이용 가이드

1등급 (일상생활 전반 수발 필요)
- 추천: 전동침대, 욕창예방 매트리스, 수동휠체어, 이동변기, 목욕의자
- 월 이용 한도: 약 133,000원/월

2등급 (일상생활 대부분 수발 필요)
- 추천: 전동침대, 욕창예방 매트리스, 수동휠체어, 보행보조기
- 월 이용 한도: 약 133,000원/월

3등급 (일상생활 상당 부분 수발 필요)
- 추천: 수동휠체어, 보행보조기, 욕창예방 매트리스, 목욕의자
- 월 이용 한도: 약 133,000원/월

4등급 (일상생활 일정 부분 수발 필요)
- 추천: 보행보조기, 목욕의자, 이동변기, 안전손잡이
- 월 이용 한도: 약 133,000원/월

5등급 / 인지지원등급 (치매 증상 보유)
- 추천: 안전손잡이, 미끄럼방지용품, 보행보조기
- 월 이용 한도: 약 133,000원/월

* 본인부담금: 일반 수급자 15%, 감경 수급자 6~9%, 의료급여 수급자 0%',
  'guide'
),
(
  '복지용구 신청 절차 및 필요 서류',
  '복지용구 신청 절차 및 필요 서류

신청 절차
1단계: 장기요양 인정서 및 표준장기요양이용계획서 확인
2단계: 복지용구 사업소 검색 (건강보험공단 홈페이지)
3단계: 복지용구 급여확인서 발급 (고객센터 1577-1000)
4단계: 사업소 방문 또는 온라인 계약
5단계: 복지용구 수령 또는 설치
6단계: 급여비 청구 (사업소에서 공단으로 직접 청구)

필요 서류
- 장기요양인정서 사본
- 표준장기요양이용계획서 사본
- 신분증 (본인 또는 보호자)
- 통장 사본 (환급 시 필요)

주의사항
- 구입 전 반드시 급여확인서를 발급받아야 합니다
- 등급에 따라 지원 가능 품목이 다릅니다
- 연간 한도 초과 시 전액 본인 부담입니다
- 대여 품목은 기간 내 반납 필수

문의: 국민건강보험공단 고객센터 1577-1000 (평일 09:00~18:00)',
  'manual'
);

-- ============================================================
-- SEED DATA: document_chunks (정책 문서 청크)
-- ============================================================
-- 첫 번째 문서 청크 (정책 문서 ID는 실제 insert된 ID를 참조하므로 서브쿼리 사용)
INSERT INTO public.document_chunks (document_id, content, chunk_index, metadata)
SELECT
  id,
  '장기요양보험 복지용구 급여 한도액: 1~5등급 연 160만원. 본인부담금 15% (감경 대상자 6~9%). 구입품목: 이동변기, 목욕의자, 안전손잡이, 미끄럼방지용품. 대여품목: 전동침대, 휠체어, 욕창예방 매트리스, 보행보조기.',
  0,
  '{"section":"급여기준","page":1}'
FROM public.policy_documents WHERE title = '장기요양보험 복지용구 급여 기준';

INSERT INTO public.document_chunks (document_id, content, chunk_index, metadata)
SELECT
  id,
  '복지용구 이용 절차: 1. 장기요양 인정 신청 → 2. 등급 판정 (1~5등급) → 3. 급여 계획 수립 → 4. 복지용구 사업소 계약 → 5. 용구 수령. 문의: 국민건강보험공단 1577-1000.',
  1,
  '{"section":"이용절차","page":2}'
FROM public.policy_documents WHERE title = '장기요양보험 복지용구 급여 기준';

INSERT INTO public.document_chunks (document_id, content, chunk_index, metadata)
SELECT
  id,
  '1등급: 전동침대, 욕창예방 매트리스, 수동휠체어, 이동변기 추천. 2등급: 전동침대, 욕창예방 매트리스, 보행보조기 추천. 3등급: 수동휠체어, 보행보조기, 욕창예방 매트리스 추천. 4등급: 보행보조기, 목욕의자, 이동변기 추천. 5등급: 안전손잡이, 미끄럼방지용품 추천.',
  0,
  '{"section":"등급별추천","page":1}'
FROM public.policy_documents WHERE title = '등급별 복지용구 이용 가이드';
