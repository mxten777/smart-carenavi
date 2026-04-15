import { Link } from 'react-router-dom'

const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI 맞춤 상담',
    desc: '등급·상황에 맞는 정확한 제품 추천',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: '보험 혜택 안내',
    desc: '복잡한 장기요양보험을 쉽게 설명',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: '빠른 배송',
    desc: '전국 당일/익일 배송 가능',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    title: '전문 상담원',
    desc: '주문 후 상담원이 직접 연락',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
]

const GRADE_INFO = [
  { grade: '1등급', level: '최중증', color: 'bg-red-500',    light: 'bg-red-50 border-red-100',       text: 'text-red-700',    desc: '일상생활 전반 수발 필요',        products: '전동침대, 욕창예방 매트리스, 휠체어' },
  { grade: '2등급', level: '중증',   color: 'bg-orange-500', light: 'bg-orange-50 border-orange-100', text: 'text-orange-700', desc: '일상생활 대부분 수발 필요',       products: '전동침대, 보행보조기, 휠체어' },
  { grade: '3등급', level: '중등증', color: 'bg-yellow-500', light: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-700', desc: '일상생활 상당 부분 수발 필요',     products: '휠체어, 보행보조기, 목욕의자' },
  { grade: '4등급', level: '경증',   color: 'bg-green-500',  light: 'bg-green-50 border-green-100',   text: 'text-green-700',  desc: '일상생활 일정 부분 수발 필요',   products: '보행보조기, 이동변기, 안전손잡이' },
  { grade: '5등급', level: '치매',   color: 'bg-blue-500',   light: 'bg-blue-50 border-blue-100',     text: 'text-blue-700',   desc: '치매 증상 보유',                 products: '안전손잡이, 미끄럼방지용품, 보행보조기' },
]

const STATS = [
  { value: '연 160만원', label: '보험 지원 한도', icon: '💰' },
  { value: '15%',       label: '본인 부담률',    icon: '📊' },
  { value: '18종+',     label: '급여 품목 수',  icon: '🏥' },
  { value: '3분',       label: 'AI 상담 소요',  icon: '⚡' },
]

const STEPS = [
  { step: '01', title: 'AI 상담',    desc: '상황과 등급을 입력', icon: '💬' },
  { step: '02', title: '맞춤 추천',  desc: '최적 복지용구 제안', icon: '✨' },
  { step: '03', title: '간편 주문',  desc: '이름·연락처만 입력', icon: '📋' },
  { step: '04', title: '상담원 연락', desc: '전문가가 직접 안내', icon: '📞' },
]

export default function Home() {
  return (
    <div className="overflow-hidden">

      {/* ══════════════════════════════
          히어로 — 다크 배경 + 컬러 글로우
      ══════════════════════════════ */}
      <section
        className="relative py-28 sm:py-36 px-4 overflow-hidden"
        style={{ background: '#070c1f' }}
      >
        {/* 배경 글로우 오브 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.30) 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-1/3 -right-20 w-[480px] h-[480px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-20 -left-16 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)' }}
          />
          {/* 도트 그리드 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="section-container relative text-center">
          {/* 플랫폼 태그 */}
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 px-4 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            장기요양보험 AI 상담 플랫폼
          </span>

          {/* 헤드라인 */}
          <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-extrabold leading-[1.06] tracking-tight mb-6 text-white">
            복지용구,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8 0%, #a78bfa 40%, #38bdf8 100%)' }}
            >
              이제 AI가 찾아드립니다
            </span>
          </h1>

          {/* 서브 카피 */}
          <p className="text-slate-400 text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            장기요양보험을 몰라도 괜찮습니다.<br />
            3분 상담으로 맞춤 복지용구와 보험 혜택을 안내해 드립니다.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link
              to="/chat"
              className="btn-primary px-8 py-4 text-base rounded-2xl"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              AI 상담 무료 시작
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-2xl transition-all duration-200 text-base text-slate-200 hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              전체 제품 보기
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <p className="text-lg mb-1">{s.icon}</p>
                <p className="text-2xl font-extrabold text-white leading-none mb-1">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          혜택
      ══════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-brand-600 text-sm font-bold tracking-widest uppercase mb-2">WHY US</p>
            <h2 className="text-3xl font-extrabold text-gray-900">왜 스마트케어나비인가요?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className={`${b.bg} border ${b.border} rounded-3xl p-6 hover:shadow-card hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-white shadow-md mb-4`}>
                  {b.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          등급 안내
      ══════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-brand-600 text-sm font-bold tracking-widest uppercase mb-2">GRADE GUIDE</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">등급별 지원 가이드</h2>
            <p className="text-gray-400">연간 160만원 한도 · 본인부담 15%</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRADE_INFO.map((g) => (
              <div
                key={g.grade}
                className={`${g.light} border rounded-3xl p-6 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl ${g.color} flex items-center justify-center text-white font-bold text-sm shadow`}>
                    {g.grade[0]}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${g.text}`}>{g.grade}</p>
                    <p className="text-xs text-gray-400">{g.level}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-2">{g.desc}</p>
                <p className="text-xs text-gray-500 leading-relaxed">추천 용구: {g.products}</p>
              </div>
            ))}

            {/* AI 상담 유도 카드 */}
            <div className="hero-gradient rounded-3xl p-6 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
              <div>
                <p className="font-extrabold text-lg mb-2">등급을 모르시나요?</p>
                <p className="text-blue-100 text-sm leading-relaxed">AI 상담사가 상황에 맞게 분석하고 추천해 드립니다</p>
              </div>
              <Link
                to="/chat"
                className="mt-6 inline-flex items-center gap-2 bg-white text-brand-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 active:scale-95 transition-all duration-150 w-fit"
              >
                무료 상담 시작
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          이용 흐름
      ══════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="text-brand-600 text-sm font-bold tracking-widest uppercase mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl font-extrabold text-gray-900">3분이면 충분합니다</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {i < 3 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+32px)] right-0 h-px"
                    style={{ background: 'linear-gradient(to right, #c7d2fe, transparent)' }}
                  />
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-200/60">
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-brand-400 tracking-widest mb-1">STEP {s.step}</span>
                <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/chat" className="btn-primary px-10 py-4 text-base rounded-2xl">
              지금 바로 시작하기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
