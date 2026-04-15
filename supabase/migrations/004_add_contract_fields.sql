-- ============================================================
-- Migration 004: 주문에 계약서 필드 추가
-- ============================================================

-- orders 테이블에 계약 관련 필드 추가
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS contract_type  TEXT NOT NULL DEFAULT 'purchase'
                                          CHECK (contract_type IN ('rental', 'purchase')),
  ADD COLUMN IF NOT EXISTS address        TEXT,
  ADD COLUMN IF NOT EXISTS address_detail TEXT,
  ADD COLUMN IF NOT EXISTS birth_date     TEXT,
  ADD COLUMN IF NOT EXISTS care_grade     INTEGER CHECK (care_grade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS agreed_privacy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_at    TIMESTAMPTZ;

-- 주문 완료 시 contract_at 자동 기록 (status → confirmed 로 변경 시)
COMMENT ON COLUMN public.orders.contract_type  IS '대여(rental) / 구매(purchase)';
COMMENT ON COLUMN public.orders.agreed_privacy IS '개인정보 수집·이용 동의 여부';
COMMENT ON COLUMN public.orders.contract_at    IS '계약서 최초 열람/발행 일시';
