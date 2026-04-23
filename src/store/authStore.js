import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

/**
 * 인증 상태 관리 (Zustand)
 * - user: Supabase auth user 객체
 * - profile: public.profiles 레코드 (이름, 전화번호, 등급 등)
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true, // 초기 세션 로드 중

  /** 앱 시작 시 세션 복원 */
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile(session.user.id)
    }
    set({ loading: false })

    // 세션 변경 구독 (로그인/로그아웃/토큰 갱신)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        await get().fetchProfile(user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  /** 프로필 로드 */
  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    set({ profile: data ?? null })
  },

  /** 이메일/비밀번호 로그인 */
  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  },

  /** 이메일/비밀번호 회원가입 */
  signUpWithEmail: async (email, password, name, phone) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    })
    if (error) throw new Error(error.message)
  },

  /** Google OAuth 로그인 */
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw new Error(error.message)
  },

  /** 카카오 OAuth 로그인 */
  signInWithKakao: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw new Error(error.message)
  },

  /** 프로필 업데이트 */
  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    set({ profile: data })
  },

  /** 로그아웃 */
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
