-- ============================================================
-- Migration 006: 회원가입 시 profiles 자동 생성 트리거
-- ============================================================

-- auth.users 에 새 사용자가 생기면 public.profiles 에 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- profiles: 본인 데이터 업데이트 가능
CREATE POLICY IF NOT EXISTS "profiles_update_own_v2"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- orders: 로그인 사용자의 본인 주문 조회 (user_id 매칭)
CREATE POLICY IF NOT EXISTS "orders_select_own_auth"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
