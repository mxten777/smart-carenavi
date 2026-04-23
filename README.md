# smart-carenavi

RAG 기반 복지용구 큐레이션 플랫폼 MVP

## 기술 스택

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: OpenAI GPT-4o-mini — Edge Function 프록시 (및 스트리밍 SSE), pgvector 시맨틱 검색
- **상태관리**: Zustand
- **라우팅**: React Router v6
- **배포**: Vercel

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 실제 값을 입력하세요:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-your-key  # 없으면 Mock 모드로 동작
```

### 3. Supabase DB 초기화

Supabase 대시보드 → SQL Editor에서 순서대로 실행:

```
supabase/migrations/001_initial.sql          # 테이블 7개 + RLS + Mock 데이터
supabase/migrations/004_add_contract_fields.sql  # 계약서 필드 추가
supabase/migrations/005_product_images.sql   # Storage 버킷 + 플레이스홀더
supabase/migrations/006_auth_trigger.sql     # 회원가입 profiles 트리거
supabase/migrations/007_pgvector.sql         # pgvector + match_* RPC
supabase/migrations/008_order_status_expand.sql  # 주문 상태 7단계
```

### 4. 개발 서버 실행

```bash
npm run dev
```

---

## 주요 기능

| 기능 | 경로 | 설명 |
|------|------|------|
| 홈 | `/` | 히어로 랜딩 + 카테고리 쇼케이스 |
| AI 상담 | `/chat` | RAG 기반 복지용구 추천 채팅 (스트리밍 + 상담 이력) |
| 제품 목록 | `/products` | 카테고리/등급 필터 + 스켈레톤 로딩 |
| 제품 상세 | `/product/:id` | 상세 스펙 + 상담 신청 |
| 주문서 | `/checkout` | 대여/구매 선택 + 개인정보 동의 + 모바일 CTA |
| 주문 완료 | `/order-complete` | 계약서 4종 다운로드 버튼 |
| 계약서 인쇄 | `/contract/:orderId/:type` | 브라우저 인쇄 → PDF 저장 |

### 계약서 종류 (`type` 파라미터)

| type | 계약서 |
|------|--------|
| `rental` | 복지용구 대여 계약서 |
| `purchase` | 복지용구 구매 계약서 |
| `privacy` | 개인정보 수집·이용 동의서 |
| `care` | 장기요양 급여 제공 계약서 |

---

## 프로젝트 구조

```
smart-carenavi/
├── src/
│   ├── lib/
│   │   ├── supabase.js          # Supabase 클라이언트 + Storage 헬퍼
│   │   ├── openai.js            # Mock 응답만 유지 (SDK 제거됨)
│   │   ├── rag.js               # processChat + processChatStream
│   │   ├── contractTemplates.js # 계약서 HTML 템플릿 (4종)
│   │   └── documentProcessor.js # 문서 업로드/청킹 파이프라인
│   ├── store/
│   │   ├── chatStore.js         # 채팅 + 스트리밍 + 이력 (Zustand)
│   │   ├── orderStore.js        # 주문 상태 (Zustand)
│   │   └── authStore.js         # 인증 상태 (Zustand)
│   ├── components/
│   │   ├── layout/              # Header (로그인 메뉴), Layout
│   │   ├── chat/                # ChatMessage (스트리밍 커서), ChatInput
│   │   ├── products/            # ProductCard (스켈레톤), ProductFilter
│   │   └── ErrorBoundary.jsx    # 전역 에러 경계
│   └── pages/
│       ├── Home.jsx
│       ├── Chat.jsx             # AI 상담 + 상담 이력 사이드패널
│       ├── Products.jsx         # 제품 목록 + 필터
│       ├── ProductDetail.jsx    # 제품 상세
│       ├── Checkout.jsx         # 주문 폼 (모바일 고정 CTA 포함)
│       ├── OrderComplete.jsx    # 주문 완료 + 계약서 버튼
│       ├── Login.jsx            # 이메일/소셜 로그인
│       ├── ContractPrintView.jsx # 계약서 인쇄/PDF
│       └── admin/               # AdminLayout, Analytics, Orders, Products, Documents
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql      # DB 스키마 + RLS + Mock 데이터
│   │   ├── 004_add_contract_fields.sql
│   │   ├── 005_product_images.sql
│   │   ├── 006_auth_trigger.sql
│   │   ├── 007_pgvector.sql
│   │   └── 008_order_status_expand.sql
│   └── functions/
│       ├── chat/index.ts        # RAG + OpenAI 스트리밍 SSE
│       └── embed/index.ts       # 임베딩 일괄 생성
├── PROGRESS.md                  # 진행현황 및 개선 계획
└── .env.example
```

---

## RAG + 스트리밍 아키텍처

```
사용자 질문
    ↓
Edge Function /functions/v1/chat
  ├── text-embedding-3-small 임베딩 생성
  ├── match_products() RPC (코사인 유사도)
  ├── match_document_chunks() RPC
  ├── Fallback: 키워드 LIKE 검색
  └── GPT-4o-mini 호출 (stream: true)
    ↓ SSE 청크 스트리밍
프론트엔드 processChatStream()
  ├── onMeta: 세션ID + 제품 추천 수신
  └── onDelta: 텍스트 청크 수신 → UI 실시간 업데이트
    ↓
chat_messages 테이블 저장 (스트리밍 완료 후)
```

**Fallback 체계**: SSE 스트리밍 실패 → `functions.invoke` 일반 호출 → Edge Function 오류 → Mock 응답

---

## DB 스키마

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (장기요양 등급 포함) |
| `products` | 복지용구 목록 |
| `policy_documents` | 정책/매뉴얼 원본 문서 |
| `document_chunks` | RAG 검색용 텍스트 청크 |
| `chat_sessions` | AI 상담 세션 |
| `chat_messages` | AI 상담 메시지 로그 |
| `orders` | 주문 + 계약서 필드 (contract_type, address, birth_date 등) |

---

## Edge Function 배포

> ✅ OpenAI 호출은 Supabase Edge Function에서 메디에이션됩니다. 브라우저에 API 키가 노출되지 않습니다.

```bash
# 환경변수 설정 (Supabase 서버에만 저장됨)
supabase secrets set OPENAI_API_KEY=sk-...

# 배포
supabase functions deploy chat   # RAG + 스트리밍 SSE
supabase functions deploy embed  # 임베딩 일괄 생성
```

---

## Vercel 배포

```bash
npm run build
vercel --prod
```

Vercel 환경변수 설정:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL` (관리자 이메일 제한, 선택)
