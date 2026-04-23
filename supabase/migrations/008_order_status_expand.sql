-- 008_order_status_expand.sql
-- 주문 상태를 7단계로 세분화

-- orders.status CHECK 제약 제거 후 새 제약 추가
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',    -- 접수 대기
    'confirmed',  -- 상담 확인
    'preparing',  -- 배송 준비
    'shipped',    -- 배송 중
    'installed',  -- 설치 완료
    'active',     -- 대여 진행 중
    'cancelled'   -- 취소
  ));
