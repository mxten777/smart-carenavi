# smart-carenavi

RAG 기반 복지용구 큐레이션 플랫폼 MVP

## 기술 스택

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: OpenAI GPT-4o-mini (RAG 구조)
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
supabase/migrations/001_initial.sql   # 테이블 7개 + RLS + Mock 데이터
supabase/migrations/004_add_contract_fields.sql  # 계약서 필드 추가
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
| AI 상담 | `/chat` | RAG 기반 복지용구 추천 채팅 |
| 제품 목록 | `/products` | 카테고리/등급 필터 + 스켈레톤 로딩 |
| 제품 상세 | `/product/:id` | 상세 스펙 + 상담 신청 |
| 주문서 | `/checkout` | 대여/구매 선택 + 개인정보 동의 |
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
│   │   ├── supabase.js          # Supabase 클라이언트
│   │   ├── openai.js            # OpenAI API 래퍼 + Mock
│   │   ├── rag.js               # RAG 처리 코어
│   │   ├── contractTemplates.js # 계약서 HTML 템플릿 (4종)
│   │   └── documentProcessor.js # 문서 업로드/청킹 파이프라인
│   ├── store/
│   │   ├── chatStore.js         # 채팅 상태 (Zustand)
│   │   └── orderStore.js        # 주문 상태 (Zustand)
│   ├── components/
│   │   ├── layout/              # Header, Layout
│   │   ├── chat/                # ChatMessage, ChatInput
│   │   └── products/            # ProductCard, ProductFilter
│   └── pages/
│       ├── Home.jsx
│       ├── Chat.jsx             # AI 상담 (RAG)
│       ├── Products.jsx         # 제품 목록 + 필터
│       ├── ProductDetail.jsx    # 제품 상세
│       ├── Checkout.jsx         # 주문 폼 (계약서 필드 포함)
│       ├── OrderComplete.jsx    # 주문 완료 + 계약서 버튼
│       └── ContractPrintView.jsx # 계약서 인쇄/PDF 페이지
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql      # DB 스키마 + Mock 데이터
│   │   ├── 003_clear_images.sql # 이미지 URL 초기화
│   │   └── 004_add_contract_fields.sql # 계약서 필드
│   └── functions/               # Edge Function 예정 위치
├── PROGRESS.md                  # 진행현황 및 개선 계획
└── .env.example
```

---

## RAG 아키텍처

```
사용자 질문
    ↓
키워드 추출 (extractKeywords)
    ↓
Supabase 검색
  ├── products 테이블 (LIKE 검색)
  └── document_chunks 테이블 (Full-text Search → LIKE fallback)
    ↓
Context 빌드 (formatProductsContext + formatChunksContext)
    ↓
OpenAI GPT-4o-mini 호출 (system prompt + context + 대화 히스토리)
    ↓
응답 생성 + 추천 제품 파싱
    ↓
chat_messages 테이블 저장
```

### Vector 검색으로 확장하기

1. Supabase에서 `pgvector` 확장 활성화
2. `document_chunks`에 `embedding vector(1536)` 컬럼 추가
3. `documentProcessor.js`의 주석 코드 활성화
4. `rag.js`의 `searchPolicyChunks`를 `vectorSearch`로 교체

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

## Edge Function 배포 (프로덕션)

> ⚠️ 현재 MVP는 브라우저에서 OpenAI를 직접 호출합니다.  
> 프로덕션 배포 전에 반드시 Edge Function 프록시로 교체하세요.

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 환경변수 설정
supabase secrets set OPENAI_API_KEY=sk-...

# 배포
supabase functions deploy chat
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
- `VITE_OPENAI_API_KEY` (MVP용, 프로덕션에서는 Edge Function으로 이동)
