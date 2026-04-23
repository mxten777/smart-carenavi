import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithKakao } = useAuthStore()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(form.email, form.password)
        navigate(-1)
      } else {
        if (!form.name.trim()) throw new Error('이름을 입력해 주세요')
        await signUpWithEmail(form.email, form.password, form.name.trim(), form.phone.trim())
        setSignupDone(true)
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    try { await signInWithGoogle() } catch (err) { setError(err.message) }
  }

  const handleKakao = async () => {
    setError(null)
    try { await signInWithKakao() } catch (err) { setError(err.message) }
  }

  if (signupDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인해 주세요</h2>
          <p className="text-gray-500 text-sm mb-6">
            <span className="font-medium text-gray-700">{form.email}</span>로<br />
            인증 메일을 발송했습니다. 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <button
            onClick={() => { setMode('login'); setSignupDone(false) }}
            className="btn-primary w-full rounded-xl py-3"
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">스마트케어나비</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login'
              ? '주문 내역 조회 및 정보 자동완성을 이용하세요'
              : '간편하게 가입하고 서비스를 이용하세요'}
          </p>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>

          <button
            onClick={handleKakao}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-gray-800 hover:brightness-95 transition-all"
            style={{ backgroundColor: '#FEE500' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.74 5.19 4.36 6.62l-.91 3.33c-.08.29.22.53.48.37L9.7 18.9c.75.1 1.52.15 2.3.15 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z"/>
            </svg>
            카카오로 계속하기
          </button>
        </div>

        {/* 구분선 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-gray-400">또는 이메일로</span>
          </div>
        </div>

        {/* 이메일 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="홍길동"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="example@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={mode === 'signup' ? '8자 이상' : ''}
              required
              minLength={mode === 'signup' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중…' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        {/* 모드 전환 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? (
            <>아직 계정이 없으신가요?{' '}
              <button onClick={() => { setMode('signup'); setError(null) }} className="text-brand-600 font-medium hover:underline">
                회원가입
              </button>
            </>
          ) : (
            <>이미 계정이 있으신가요?{' '}
              <button onClick={() => { setMode('login'); setError(null) }} className="text-brand-600 font-medium hover:underline">
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다'
  if (msg.includes('Email not confirmed')) return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요'
  if (msg.includes('User already registered')) return '이미 가입된 이메일입니다'
  if (msg.includes('Password should be at least')) return '비밀번호는 8자 이상이어야 합니다'
  if (msg.includes('Unable to validate email')) return '올바른 이메일 형식이 아닙니다'
  return msg
}
