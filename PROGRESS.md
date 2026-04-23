# 스마트케어나비 — 프로젝트 진행 현황 및 향후 개선 계획

> 최초 작성: 2026-04-16  
> 최종 수정: 2026-04-23  
> 버전: 0.1.0 (MVP)  
> 스택: React 18 + Vite 5 · TailwindCSS 3 · Zustand · React Router v6 · Supabase · OpenAI GPT-4o-mini

---

## 변경 이력 (Changelog)

| 날짜 | 작업 | 주요 변경 내용 |
|------|------|----------------|
| 2026-04-16 | 프로젝트 초기 세팅 | Vite + React 스캐폴딩, TailwindCSS 커스텀 토큰, Supabase 클라이언트 구성 |
| 2026-04-16 | DB 마이그레이션 001 | profiles, products, policy_documents, document_chunks, orders, chat_sessions, chat_messages 7개 테이블 + RLS + 시드 데이터 |
| 2026-04-16 | DB 마이그레이션 002~003 | 이미지 URL 업데이트 및 NULL 초기화 |
| 2026-04-16 | DB 마이그레이션 004 | orders 테이블 계약서 필드 7개 추가 |
| 2026-04-16 | 계약서 시스템 구현 | 4종 HTML 계약서 템플릿 + ContractPrintView 인쇄 페이지 |
| 2026-04-23 | Phase 2-A: OpenAI Edge Function 이전 | OpenAI SDK 브라우저 노출 제거, Supabase Edge Function 프록시로 이전, openai npm 패키지 제거 |
| 2026-04-23 | Phase 2-E: 제품 이미지 | DB 마이그레이션 005, Storage 버킷 생성, placehold.co 플레이스홀더 설정, ProductCard 스켈레톤 로딩 |
| 2026-04-23 | Phase 2-C: 사용자 인증 | DB 마이그레이션 006, Supabase Auth 연동, authStore, Login 페이지, Header 사용자 메뉴, Checkout 자동완성 |
| 2026-04-23 | Phase 2-D: 관리자 대시보드 | AdminLayout + AdminAnalytics + AdminOrders + AdminProducts + AdminDocuments 5개 페이지 |
| 2026-04-23 | Phase 2-B: pgvector 시맨틱 검색 | DB 마이그레이션 007, embed Edge Function, chat Edge Function 벡터 검색 우선 구조 교체, AdminDocuments 임베딩 트리거 |
| 2026-04-23 | Phase 3-①: 전역 ErrorBoundary | ErrorBoundary 컴포넌트 추가, App.jsx Routes 감싸기 |
| 2026-04-23 | Phase 3-②: 주문 상태 7단계 | DB 마이그레이션 008, AdminOrders 스텝바 UI, AdminAnalytics STATUS_META 동기화 |
| 2026-04-23 | Phase 3-③: Admin 모바일 UX | AdminLayout 햄버거 메뉴 + 오버레이 사이드바, 테이블 가로 스크롤, 반응형 패딩 |
| 2026-04-23 | Phase 3-④: AI 스트리밍 응답 | chat Edge Function SSE 스트리밍 추가, rag.js processChatStream(), chatStore 스트리밍 상태, ChatMessage 커서 효과, Edge Function 재배포 |
| 2026-04-23 | Phase 3-⑤: 상담 이력 | chatStore loadSessions()/loadSession(), Chat.jsx 이력 사이드패널 (PC 고정 / 모바일 토글) |
| 2026-04-23 | Phase 3-⑥: 번들 분할 | App.jsx React.lazy + Suspense 전면 적용, 메인 번들 508KB → 391KB (-23%) |
| 2026-04-23 | Phase 3-⑦: Checkout 모바일 UX | 제품 요약 접기/펼치기, 고정 하단 CTA 버튼, inputMode 최적화, 터치 체크박스 확대 |

---

## 1. 완료된 기능 (구현 완료)

### 1-1. 프로젝트 기반
| 항목 | 상태 | 비고 |
|------|------|------|
| 프로젝트 스캐폴딩 | ✅ | Vite + React 18 |
| TailwindCSS 커스텀 토큰 | ✅ | brand 색상, shadow-card/glow, 애니메이션 |
| 경로 alias (`@/`) | ✅ | vite.config.js |
| Supabase 클라이언트 | ✅ | `src/lib/supabase.js` |
| 환경변수 구조 | ✅ | `.env.example`, `.env` (로컬) |

| `005_product_images.sql` | product-images Storage 버킷 + 제품 플레이스홀더 URL ✅ 실행 완료 |
| `006_auth_trigger.sql` | 회원가입 시 profiles 자동 생성 트리거 ✅ 실행 완료 |
| `007_pgvector.sql` | pgvector 확장, embedding 컬럼, IVFFlat 인덱스, match_* RPC ✅ 실행 완료 |
| `008_order_status_expand.sql` | orders.status CHECK 제약 7단계로 확장 (pending/confirmed/preparing/shipped/installed/active/cancelled) ✅ 실행 완료 |
### 1-2. 데이터베이스 (Supabase)
| 마이그레이션 | 내용 |
|-------------|------|
| `001_initial.sql` | profiles, products, policy_documents, document_chunks, orders, chat_sessions, chat_messages 7개 테이블 + RLS + 시드 데이터 |
| `002_update_images.sql` | 이미지 URL 관련 작업 |
| `003_clear_images.sql` | 모든 제품 image_url → NULL 초기화 |
| `004_add_contract_fields.sql` | orders 테이블에 계약서 필드 7개 추가 ✅ 실행 완료 |
| `005_product_images.sql` | product-images Storage 버킷 + 제품 플레이스홀더 URL ✅ 실행 완료 |
| `006_auth_trigger.sql` | 회원가입 시 profiles 자동 생성 트리거 ✅ 실행 완료 |
| `007_pgvector.sql` | pgvector 확장, embedding 컬럼, IVFFlat 인덱스, match_* RPC ✅ 실행 완료 |
| `008_order_status_expand.sql` | orders.status CHECK 제약 7단계로 확장 (pending/confirmed/preparing/shipped/installed/active/cancelled) ✅ 실행 완료 |

**orders 테이블 현재 필드:**
```스트리밍 응답 + 상담 이력 사이드패널
id, product_id, user_name, phone, notes, + 모바일 UX (고정 CTA, 요약 접기, tel 키패드)s, created_at
contract_type, address, address_detail, birth_date, care_grade, agreed_privacy, contract_at
```

### 1-3. 프론트엔드 페이지
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 홈 | `/` | ✅ 프리미엄 히어로 + 카테고리 쇼케이스 |
| 제품 목록 | `/products` | ✅ 탭 필터 + 스켈레톤 로딩 |
| 제품 상세 | `/product/:id` | ✅ glass-card 패널 + CTA 배너 |
| AI 상담 | `/chat` | ✅ RAG 연동 + 스트리밍 응답 + 상담 이력 사이드패널 |
| 주문서 | `/checkout` | ✅ 대여/구매 선택 + 계약 필드 + 모바일 UX (고정 CTA, 요약 접기, tel 키패드) |
| 주문 완료 | `/order-complete` | ✅ 계약서 4종 다운로드 버튼 |
| 계약서 인쇄 | `/contract/:orderId/:type` | ✅ 브라우저 인쇄/PDF 저장 |

### 1-4. 계약서 시스템 (4종)
| 계약서 | 키 | 표시 조건 |
|-**벡터 우선 검색**: `text-embedding-3-small` → `match_products` / `match_document_chunks` RPC, 결과 부족 시 키워드 LIKE fallback
- **스트리밍 응답**: Edge Function SSE → `processChatStream()` ReadableStream → ChatMessage 타이핑 커서 효과
- **Fallback 체계**: 스트리밍 실패 → `processChat()` 일반 호출 → Edge Function 오류 → Mock 응답
- 채팅 세션/메시지 Supabase 저장 (`chat_sessions`, `chat_messages`)
- **상담 이력**: `loadSessions()` / `loadSession()` — Chat 좌측 사이드패널에서 과거 세션 재열람
| 복지용구 구매 계약서 | `purchase` | 구매 선택 시 |
| 장기요양 급여 제공 계약서 | `care` | 항상 |

- 계약서는 브라우저 `window.print()` → PDF 저장 방식 (한글 폰트 깨짐 없음)
- `src/lib/contractTemplates.js` — 4종 HTML 템플릿 함수
- `src/pages/ContractPrintView.jsx` — iframe 격리 렌더링 + 인쇄 컨트롤바

### 1-5. RAG + AI 상담
- **벡터 우선 검색**: `text-embedding-3-small` → `match_products` / `match_document_chunks` RPC, 결과 부족 시 키워드 LIKE fallback
- **스트리밍 응답**: Edge Function SSE → `processChatStream()` ReadableStream → ChatMessage 타이핑 커서 효과
- **Fallback 체계**: 스트리밍 실패 → `processChat()` 일반 호출 → Edge Function 오류 → Mock 응답
- 채팅 세션/메시지 Supabase 저장 (`chat_sessions`, `chat_messages`)
- **상담 이력**: `loadSessions()` / `loadSession()` — Chat 좌측 사이드패널에서 과거 세션 재열람
- 제품 추천 파싱: AI 응답에서 `[[제품추천: id1, id2]]` 패턴 추출 → 카드 자동 표시

---

## 2. 현재 알려진 제한사항

| 항목 | 상태 | 설명 |
|------|------|------|
| OpenAI API 키 | ⚠️ 미설정 | `.env`에 `VITE_OPENAI_API_KEY` 없으면 Mock 모드 |
| pgvector 임베딩 | ✅ 구현 | `007_pgvector.sql` + `embed` Edge Function. 배포 후 관리자 UI에서 임베딩 생성 필요 |
| 이미지 없음 | ✅ 해결 | placehold.co 플레이스홀더 설정 (005 마이그레이션). Supabase Storage 버킷 구성 완료 |
| 인증 없음 | ✅ 구현 | 이메일/Google/카카오 로그인 + 회원가입. profiles 자동 생성 트리거 |
| API 키 프론트 노출 | ✅ 해결 | Supabase Edge Function 프록시로 이전 완료. 브라우저 노출 없음 |
| 관리자 페이지 없음 | ✅ 구현 | `/admin` 대시보드 4종 구현 (주문/제품/문서/분석) |
| 모바일 최적화 | ⚠️ | 기본 반응형만 적용. 세부 터치 UX 미완 |

---

## 3. 향후 기능 개선 계획

### Phase 2 — 핵심 기능 완성 (우선순위 높음)

#### A. OpenAI API 보안 처리 ✅ 완료 (2026-04-23)
**변경 내용:**
- `src/lib/openai.js` — OpenAI SDK(`dangerouslyAllowBrowser: true`) 제거, `getMockResponse` 만 유지
- `src/lib/rag.js` — `processChat`이 `supabase.functions.invoke('chat')` 호출로 변경
- `openai` npm 패키지 제거 (번들 크기 감소)
- Edge Function 미배포 시 자동으로 Mock 모드 fallback

**배포 시 필요한 작업:**
```bash
supabase functions deploy chat
supabase secrets set OPENAI_API_KEY=sk-...
```

---

#### B. pgvector 임베딩 기반 시맨틱 검색 ✅ 완료 (2026-04-23)
**변경 내용:**
- `supabase/migrations/007_pgvector.sql` — `vector` 확장 활성화, `document_chunks.embedding` + `products.embedding` (vector(1536)) 컬럼 추가, IVFFlat 인덱스, `match_document_chunks()` + `match_products()` RPC 함수 생성
- `supabase/functions/embed/index.ts` — 임베딩 일괄 생성 Edge Function (`target: 'all'|'products'|'chunks'`, 배치 20건, `text-embedding-3-small`)
- `supabase/functions/chat/index.ts` — 벡터 유사도 검색 우선 적용, 결과 부족 시 키워드 LIKE 검색으로 자동 fallback
- `src/pages/admin/AdminDocuments.jsx` — 문서 저장 후 `embed` Edge Function 자동 호출 + "전체 임베딩 재생성" 버튼 추가

**배포 시 필요한 작업:**
```bash
# Supabase Dashboard > SQL Editor 에서 007_pgvector.sql 실행
supabase functions deploy embed
supabase functions deploy chat
supabase secrets set OPENAI_API_KEY=sk-...
# 이후 관리자 > 문서 관리 > "전체 임베딩 재생성" 버튼 클릭
```

**검색 우선순위:**
1. `text-embedding-3-small` 임베딩 → `match_products` / `match_document_chunks` RPC (코사인 유사도)
2. Fallback: 키워드 LIKE 검색 (임베딩 생성 전 또는 유사도 낮은 경우)

---

#### C. 사용자 인증 (Supabase Auth) ✅ 완료 (2026-04-23)
**변경 내용:**
- `supabase/migrations/006_auth_trigger.sql` — 회원가입 시 `public.profiles` 자동 생성 트리거
- `src/store/authStore.js` — Zustand 인증 스토어 (이메일, Google, 카카오, 로그아웃)
- `src/pages/Login.jsx` — 이메일/Google/카카오 로그인+회원가입 통합 페이지
- `src/App.jsx` — `/login` 라우트 + 앱 초기화 시 세션 복원
- `src/components/layout/Header.jsx` — 로그인 상태에 따른 사용자 메뉴 / 로그인 버튼
- `src/pages/Checkout.jsx` — 로그인 시 이름·연락처·등급 자동완성, `user_id` 주문 연결
- `src/store/orderStore.js` — `userId` 파라미터 추가

**배포 전 Supabase 설정 필요:**
- Google OAuth: Supabase Dashboard → Auth → Providers → Google (Client ID/Secret 입력)
- 카카오 OAuth: Dashboard → Auth → Providers → Kakao (카카오 개발자 앱 등록 필요)

---

#### D. 관리자 대시보드 ✅ 완료 (2026-04-23)
**변경 내용:**
- `src/pages/admin/AdminLayout.jsx` — 사이드바 레이아웃, 로그인 인증 + `VITE_ADMIN_EMAIL` 이메일 제한
- `src/pages/admin/AdminAnalytics.jsx` (`/admin`) — 주문/제품/상담 통계 카드, 상태별 바 차트
- `src/pages/admin/AdminOrders.jsx` (`/admin/orders`) — 주문 목록, 상태 필터, 인라인 상태 변경
- `src/pages/admin/AdminProducts.jsx` (`/admin/products`) — 제품 카드 그리드, 신규 등록/수정, 이미지 업로드
- `src/pages/admin/AdminDocuments.jsx` (`/admin/documents`) — RAG 문서 텍스트 등록, 500자 자동 청크 분할, 청크 미리보기
- `src/App.jsx` — `/admin/*` 라우트 추가
- `.env.example` — `VITE_ADMIN_EMAIL` 항목 추가

**접근 방법:** `/admin` 경로 직접 접속 (로그인 필요, `VITE_ADMIN_EMAIL` 설정 시 제한)

---

#### E. 제품 이미지 처리 ✅ 완료 (2026-04-23)
**변경 내용:**
- `supabase/migrations/005_product_images.sql` — `product-images` Storage 버킷 생성 + 공개 읽기/인증 업로드 정책 + 제품 8종 플레이스홀더 URL 설정
- `src/lib/supabase.js` — `uploadProductImage()`, `updateProductImageUrl()` 헬퍼 추가
- `src/components/products/ProductCard.jsx` — 로딩 스켈레톤 추가, Storage path → 공개 URL 자동 변환(`resolveImageUrl`)

**실제 이미지 교체 방법:**
```bash
# 관리자 UI(Task D) 구현 후 업로드 가능
# 또는 Supabase Dashboard > Storage > product-images 에서 직접 업로드
# 업로드 후 image_url을 storage path(예: products/xxx.jpg) 또는 공개 URL로 UPDATE
```

---

### Phase 3 — 서비스 품질 향상
상태 | 개선 내용 |
|------|------|-----------|
| 스트리밍 응답 | ✅ 완료 | SSE 스트리밍 + 타이핑 커서 효과 |
| 상담 이력 | ✅ 완료 | 좌측 사이드패널, 세션 선택 시 메시지 복원 |
| 제품 추천 카드 | ⏳ 미완 | 채팅 내 인라인 제품 카드 (현재는 채팅 아래 별도 영역) |
| 문서 업로드 RAG | ⏳ 미완 | 장기요양인정서 PDF → 텍스트 추출 → 맞춤 상담 |
| 다국어 | ⏳ 미완 | 영어, 중국어 지원 (외국인 가족 보호자) |

---

#### H. 주문/배송 프로세스
```
주문 접수(pending) → 상담원 확인(confirmed) → 배송 준비(preparing)
→ 배송 중(shipped) → 설치 완료(installed) → 대여 진행 중(active)
```
**주문 상태 7단계** ✅ 완료 (DB migration 008, AdminOrders 스텝바 UI)

미완 항목:| 스트리밍 응답 | ✅ 완료 | SSE 스트리밍 + 타이핑 커서 효과 |
| 상담 이력 | ✅ 완료 | 좌측 사이드패널, 세션 선택 시 메시지 복원 |
| 제품 추천 카드 | ⏳ 미완 | 채팅 내 인라인 제품 카드 (현재는 채팅 아래 별도 영역) |
| 문서 업로드 RAG | ⏳ 미완 | 장기요양인정서 PDF → 텍스트 추출 → 맞춤 상담 |
| 다국어 | ⏳ 미완 | 영어, 중국어 지원 (외국인 가족 보호자) |

---

#### H. 주문/배송 프로세스
```
주문 접수(pending) → 상담원 확인(confirmed) → 배송 준비(preparing)
→ 배송 중(shipped) → 설치 완료(installed) → 대여 진행 중(active)
```
**주문 상태 7단계** ✅ 완료 (DB migration 008, AdminOrders 스텝바 UI)

미완 항목:
- SMS/카카오 알림톡 자동 발송 (주문 단계별)
- 배송 추적 링크 연결
- 렌탈 만료일 D-30 알림

---

#### I. 모바일 앱 (React Native / PWA)
- PWA manifest 추가 → 홈화면 설치
- 푸시 알림 (계약 갱신, 점검 일정)
- 바코드 스캔으로 제품 즉시 검색

---

### Phase 4 — 사업 확장
### 보안 (즉시 조치 권장)

| 항목 | 설명 | 영향 |
|------|------|------|
| 🔴 **관리자 인증 클라이언트 우회 가능** | `VITE_ADMIN_EMAIL`은 빌드 번들에 포함됨 → DevTools에서 값 확인 가능, 로컬 변수 조작으로 우회 가능 | 관리자 기능 무단 접근 |
| 🔴 **익명 세션 RLS 취약점** | `chat_sessions` SELECT 정책: `user_id IS NULL OR auth.uid() = user_id` → 익명 세션(`user_id=NULL`)이 모든 로그인 사용자에게 노출됨 | 타인 상담 내용 열람 가능 |

**관리자 인증 권장 해결책:** Supabase `admin_roles` 테이블 + RLS 정책으로 서버사이드 검증
```sql
CREATE TABLE admin_roles (user_id UUID PRIMARY KEY REFERENCES auth.users(id));
-- AdminLayout에서 해당 테이블 SELECT 성공 여부로 검증
```

**익명 세션 RLS 권장 해결책:** session_key (UUID) 쿠키 기반 소유권 검증 또는 익명 세션 데이터 최소화

---

### 기능 결함

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| 🟡 **스트리밍 부분 실패 처리** | 스트리밍 중 연결이 끊기면 `streamingContent`에 불완전한 응답이 남음. 완료(`type:'done'`) 미수신 시 UI가 스트리밍 상태로 고착될 수 있음 | 중간 |
| 🟡 **상담 이력 — 비로그인 세션 미연결** | `loadSessions()`가 `user_id` 기반으로만 조회 → 비로그인 상태로 대화 후 로그인해도 이전 상담이 이력에 나타나지 않음 | 중간 |
| 🟡 **`useEffect` deps 누락 (Chat.jsx)** | `useEffect(() => { loadSessions() }, [])` — `loadSessions` 함수가 deps 배열에 없음 (eslint-plugin-react-hooks 경고, 실제 동작은 정상) | 낮음 |

---

### 아키텍처 / 코드 품질

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| ✅ ~~OpenAI Edge Function 이동~~ | 완료 (2026-04-23) | — |
| ✅ ~~에러 바운더리 추가~~ | 완료 (2026-04-23) | — |
| ✅ ~~번들 분할~~ | 완료 (2026-04-23), 391KB (-23%) | — |
| 🟡 **로딩/에러 상태 표준화** | 페이지마다 다른 패턴 (일부 `isLoading`, 일부 `loading`, 일부 `try/catch`) | 중간 |
| 🟡 **React Query 미도입** | Supabase 쿼리 캐싱·재시도 없음. 동일 데이터 중복 요청 가능 | 중간 |
| 🟢 **번들 추가 최적화** | `supabase-js`를 `manualChunks`로 분리하면 391KB → ~280KB 예상 | 낮음 |
| 🟢 **TypeScript 마이그레이션** | 현재 JSX만 사용, 타입 오류 런타임에서만 발견 | 낮음 |
| 🟢 **단위/통합 테스트 없음** | CI 품질 보증 없음 |
- 청구서 상태 추적

---

## 4. 기술 부채 및 리팩토링 필요 항목

### 보안 (즉시 조치 권장)

| 항목 | 설명 | 영향 |
|------|------|------|
| 🔴 **관리자 인증 클라이언트 우회 가능** | `VITE_ADMIN_EMAIL`은 빌드 번들에 포함됨 → DevTools에서 값 확인 가능, 로컬 변수 조작으로 우회 가능 | 관리자 기능 무단 접근 |
| 🔴 **익명 세션 RLS 취약점** | `chat_sessions` SELECT 정책: `user_id IS NULL OR auth.uid() = user_id` → 익명 세션(`user_id=NULL`)이 모든 로그인 사용자에게 노출됨 | 타인 상담 내용 열람 가능 |

**관리자 인증 권장 해결책:** Supabase `admin_roles` 테이블 + RLS 정책으로 서버사이드 검증
```sql + 로그인 메뉴
│   │   ├── chat/
│   │   │   ├── ChatMessage.jsx         # AI/유저 말풍선 + 스트리밍 커서
│   │   │   └── ChatInput.jsx           # 전송 입력창
│   │   ├── products/
│   │   │   ├── ProductCard.jsx         # 제품 카드 (스켈레톤 로딩)
│   │   │   └── ProductFilter.jsx       # 카테고리 탭 필터
│   │   └── ErrorBoundary.jsx           # 전역 에러 경계 (React class)
│   ├── pages/
│   │   ├── Home.jsx                    # 랜딩 히어로 페이지
│   │   ├── Products.jsx                # 제품 목록
│   │   ├── ProductDetail.jsx           # 제품 상세
│   │   ├── Chat.jsx                    # AI 상담 채팅 + 이력 사이드패널
│   │   ├── Checkout.jsx                # 주문서 + 모바일 고정 CTA
│   │   ├── OrderComplete.jsx           # 주문 완료 + 계약서 버튼
│   │   ├── Login.jsx                   # 이메일/소셜 로그인
│   │   ├── ContractPrintView.jsx       # 계약서 인쇄/PDF 페이지
│   │   └── admin/
│   │       ├── AdminLayout.jsx         # 관리자 사이드바 (모바일 햄버거)
│   │       ├── AdminAnalytics.jsx      # 통계 대시보드
│   │       ├── AdminOrders.jsx         # 주문 관리 + 7단계 스텝바
│   │       ├── AdminProducts.jsx       # 제품 관리 CRUD
│   │       └── AdminDocuments.jsx      # RAG 문서 등록 + 임베딩 트리거
│   ├── store/
│   │   ├── orderStore.js               # 주문 상태 (Zustand)
│   │   ├── chatStore.js                # 채팅 + 스트리밍 + 이력 (Zustand)
│   │   └── authStore.js               # 인증 상태 (Zustand)
│   └── lib/
│       ├── supabase.js                 # Supabase 클라이언트 + Storage 헬퍼
│       ├── openai.js                   # Mock 응답만 유지 (SDK 제거)
│       ├── rag.js                      # processChat + processChatStream
│       ├── documentProcessor.js        # 문서 청킹 유틸
│       └── contractTemplates.js        # 계약서 HTML 템플릿 (4종)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql             # 스키마 + RLS + 시드 데이터
│   │   ├── 002_update_images.sql
│   │   ├── 003_clear_images.sql
│   │   ├── 004_add_contract_fields.sql # 계약서 필드 추가 ✅
│   │   ├── 005_product_images.sql      # Storage 버킷 + 플레이스홀더 ✅
│   │   ├── 006_auth_trigger.sql        # 회원가입 profiles 트리거 ✅
│   │   ├── 007_pgvector.sql            # 벡터 검색 + match_* RPC ✅
│   │   └── 008_order_status_expand.sql # 주문 상태 7단계 확장 ✅
│   └── functions/
│       ├── chat/index.ts               # RAG 검색 + OpenAI 스트리밍 SSE
│       └── embed/index.ts              # 임베딩 일괄 생성 (배치 20건)

---

## 5. 파일 구조 전체 현황

```
smart-carenavi/
├── src/
│   ├── App.jsx                         # 라우터 (7개 경로)
│   ├── main.jsx
│   ├── index.css                       # 글로벌 스타일 + @media print
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layo                                           ✅ 불필요 (Edge Function 프록시로 이전)
VITE_ADMIN_EMAIL=admin@example.com                             ⚠️ 선택 (미설정 시 모든 로그인 사용자가 관리자 접근 가능)

# Supabase Edge Function 환경변수 (supabase secrets)
OPENAI_API_KEY=sk-...                                          ✅ 설정됨
```

> ⚠️ `VITE_ADMIN_EMAIL`은 클라이언트 번들에 노출됩니다. 현재는 MVP 편의용이며, 프로덕션에서는 DB 기반 관리자 역할 검증으로 교체해야 합니다. │   │   └── Header.jsx              # 스크롤 blur 헤더 + 로그인 메뉴
│   │   ├── chat/
│   │   │   ├── ChatMessage.jsx         # AI/유저 말풍선 + 스트리밍 커서
│   │   │   └── ChatInput.jsx           # 전송 입력창
│   │   ├── products/
│   │   │   ├── ProductCard.jsx         # 제품 카드 (스켈레톤 로딩)
### 보안 (권장)
1. **관리자 역할 DB화** — `admin_roles` 테이블 생성 + AdminLayout에서 SELECT로 서버사이드 검증
2. **익명 세션 RLS 수정** — `user_id IS NULL` 세션을 로그인 사용자에게 노출하지 않도록 정책 수정

### 콘텐츠 / 운영
3. **제품 이미지 업로드** — Supabase Storage에 이미지 넣고 `UPDATE products SET image_url = '...'` 실행  
4. **정책 문서 추가** — 관리자 > RAG 문서 등록 → 장기요양 정책 텍스트 입력 → 임베딩 생성 → RAG 품질 향상
5. **임베딩 생성** — `/admin/documents`에서 "전체 임베딩 재생성" 클릭 (products + chunks 대상)

### 배포
6. **Vercel 배포** — `vercel --prod` (환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 필요)
7. **소셜 로그인 활성화** — Supabase Dashboard > Auth > Providers > Google/Kakao 설정
│   │   ├── Products.jsx                # 제품 목록
│   │   ├── ProductDetail.jsx           # 제품 상세
│   │   ├── Chat.jsx                    # AI 상담 채팅 + 이력 사이드패널
│   │   ├── Checkout.jsx                # 주문서 + 모바일 고정 CTA
│   │   ├── OrderComplete.jsx           # 주문 완료 + 계약서 버튼
│   │   ├── Login.jsx                   # 이메일/소셜 로그인
│   │   ├── ContractPrintView.jsx       # 계약서 인쇄/PDF 페이지
│   │   └── admin/
│   │       ├── AdminLayout.jsx         # 관리자 사이드바 (모바일 햄버거)
│   │       ├── AdminAnalytics.jsx      # 통계 대시보드
│   │       ├── AdminOrders.jsx         # 주문 관리 + 7단계 스텝바
│   │       ├── AdminProducts.jsx       # 제품 관리 CRUD
│   │       └── AdminDocuments.jsx      # RAG 문서 등록 + 임베딩 트리거
│   ├── store/
│   │   ├── orderStore.js               # 주문 상태 (Zustand)
│   │   ├── chatStore.js                # 채팅 + 스트리밍 + 이력 (Zustand)
│   │   └── authStore.js               # 인증 상태 (Zustand)
│   └── lib/
│       ├── supabase.js                 # Supabase 클라이언트 + Storage 헬퍼
│       ├── openai.js                   # Mock 응답만 유지 (SDK 제거)
│       ├── rag.js                      # processChat + processChatStream
│       ├── documentProcessor.js        # 문서 청킹 유틸
│       └── contractTemplates.js        # 계약서 HTML 템플릿 (4종)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql             # 스키마 + RLS + 시드 데이터
│   │   ├── 002_update_images.sql
│   │   ├── 003_clear_images.sql
│   │   ├── 004_add_contract_fields.sql # 계약서 필드 추가 ✅
│   │   ├── 005_product_images.sql      # Storage 버킷 + 플레이스홀더 ✅
│   │   ├── 006_auth_trigger.sql        # 회원가입 profiles 트리거 ✅
│   │   ├── 007_pgvector.sql            # 벡터 검색 + match_* RPC ✅
│   │   └── 008_order_status_expand.sql # 주문 상태 7단계 확장 ✅
│   └── functions/
│       ├── chat/index.ts               # RAG 검색 + OpenAI 스트리밍 SSE
│       └── embed/index.ts              # 임베딩 일괄 생성 (배치 20건)
├── tailwind.config.js                  # 커스텀 디자인 토큰
├── vite.config.js
└── PROGRESS.md                         # 이 문서
```

---

## 6. 환경변수 체크리스트

```bash
# .env (로컬)
VITE_SUPABASE_URL=https://asyxxgwlywhfuyxtoflw.supabase.co   ✅ 설정됨
VITE_SUPABASE_ANON_KEY=eyJ...                                  ✅ 설정됨
VITE_OPENAI_API_KEY=                                           ✅ 불필요 (Edge Function 프록시로 이전)
VITE_ADMIN_EMAIL=admin@example.com                             ⚠️ 선택 (미설정 시 모든 로그인 사용자가 관리자 접근 가능)

# Supabase Edge Function 환경변수 (supabase secrets)
OPENAI_API_KEY=sk-...                                          ✅ 설정됨
```

> ⚠️ `VITE_ADMIN_EMAIL`은 클라이언트 번들에 노출됩니다. 현재는 MVP 편의용이며, 프로덕션에서는 DB 기반 관리자 역할 검증으로 교체해야 합니다.

---

## 7. 다음 즉시 실행 가능한 작업

### 보안 (권장)
1. **관리자 역할 DB화** — `admin_roles` 테이블 생성 + AdminLayout에서 SELECT로 서버사이드 검증
2. **익명 세션 RLS 수정** — `user_id IS NULL` 세션을 로그인 사용자에게 노출하지 않도록 정책 수정

### 콘텐츠 / 운영
3. **제품 이미지 업로드** — Supabase Storage에 이미지 넣고 `UPDATE products SET image_url = '...'` 실행  
4. **정책 문서 추가** — 관리자 > RAG 문서 등록 → 장기요양 정책 텍스트 입력 → 임베딩 생성 → RAG 품질 향상
5. **임베딩 생성** — `/admin/documents`에서 "전체 임베딩 재생성" 클릭 (products + chunks 대상)

### 배포
6. **Vercel 배포** — `vercel --prod` (환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 필요)
7. **소셜 로그인 활성화** — Supabase Dashboard > Auth > Providers > Google/Kakao 설정

### 배포
6. **Vercel 배포** — `vercel --prod` (환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 필요)
7. **소셜 로그인 활성화** — Supabase Dashboard > Auth > Providers > Google/Kakao 설정

---

## 8. 향후 작업 로드맵

> 우선순위 기준: 🔴 높음 (보안/핵심) · 🟡 중간 (사용자 경험) · 🟢 낮음 (품질/확장)

---

### Phase 4 — 배포 & 보안 안정화

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 4-1 | **관리자 인증 DB화** | `admin_roles` 테이블 + RLS → AdminLayout에서 SELECT 성공 여부로 서버사이드 검증 | 🔴 |
| 4-2 | **익명 세션 RLS 수정** | `user_id IS NULL` 세션이 모든 로그인 사용자에게 노출되는 버그 수정. session_key(UUID) 쿠키 기반 소유권 검증 또는 익명 세션 비저장으로 전환 | 🔴 |
| 4-3 | **Vercel 프로덕션 배포** | `vercel --prod`, 커스텀 도메인 연결, HTTPS 설정 | 🔴 |
| 4-4 | **소셜 로그인 활성화** | Supabase Dashboard → Auth → Providers → Google(Client ID/Secret), 카카오(개발자 앱 등록) | 🟡 |
| 4-5 | **제품 이미지 실사 등록** | Supabase Storage `product-images` 버킷에 실제 이미지 업로드 후 `UPDATE products SET image_url` 실행 | 🟡 |
| 4-6 | **RAG 문서 등록 + 임베딩 생성** | 관리자 → RAG 문서 등록 → 장기요양 정책 텍스트 입력 → "전체 임베딩 재생성" 클릭 | 🟡 |

---

### Phase 5 — 사용자 경험 개선

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 5-1 | **마이페이지** | 주문 이력 조회, 계약서 재출력, 회원정보 수정, 장기요양 등급 관리 | 🟡 |
| 5-2 | **채팅 내 인라인 제품 카드** | AI 추천 제품이 채팅 말풍선 안에 바로 표시 (현재는 채팅 아래 별도 영역) | 🟡 |
| 5-3 | **스트리밍 중단 복구** | 연결 끊김 시 `type:'done'` 미수신 → 타임아웃 후 isStreaming 강제 해제 + 재시도 버튼 | 🟡 |
| 5-4 | **비로그인 → 로그인 상담이력 연결** | 익명 세션에 임시 `session_key` 부여 → 로그인 후 `user_id` 연결 | 🟡 |
| 5-5 | **장기요양인정서 PDF 업로드 RAG** | PDF 텍스트 추출 → 사용자별 등급/상태 반영 → 맞춤 상담 품질 향상 | 🟡 |
| 5-6 | **주문 상태 사용자 페이지** | 주문 상세 페이지에서 현재 처리 단계 시각화 (스텝바 + 예상 일정) | 🟢 |

---

### Phase 6 — 알림 & 자동화

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 6-1 | **카카오 알림톡 자동 발송** | 주문 단계 변경(confirmed/shipped/installed) 시 보호자에게 자동 알림 | 🟡 |
| 6-2 | **렌탈 만료일 D-30 알림** | `orders.rental_end_date` 기준 30일 전 이메일/알림톡 발송 (Supabase Edge Function cron) | 🟡 |
| 6-3 | **배송 추적 링크** | 택배사 운송장 번호 입력 → 사용자에게 추적 링크 자동 전달 | 🟢 |
| 6-4 | **계약 갱신 안내** | 만료 1개월 전 재계약/반납 선택 안내 자동 발송 | 🟢 |

---

### Phase 7 — 코드 품질 & 아키텍처

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 7-1 | **React Query 도입** | Supabase 쿼리 캐싱·재시도·낙관적 업데이트. 중복 요청 제거 | 🟡 |
| 7-2 | **supabase-js 번들 분리** | `vite.config.js` `manualChunks`에 `supabase-js` 추가 → 391KB → ~280KB 예상 | 🟡 |
| 7-3 | **로딩/에러 상태 표준화** | 공통 `useAsync` 훅 또는 React Query로 페이지별 패턴 통일 | 🟡 |
| 7-4 | **TypeScript 마이그레이션** | `.jsx` → `.tsx`, `supabase gen types typescript`로 DB 타입 자동 생성 | 🟢 |
| 7-5 | **단위/통합 테스트** | Vitest + Testing Library. chatStore, orderStore, rag.js 우선 커버리지 | 🟢 |
| 7-6 | **CI/CD 파이프라인** | GitHub Actions: PR 시 빌드 + 테스트, main 머지 시 Vercel 자동 배포 | 🟢 |

---

### Phase 8 — 사업 확장

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 8-1 | **보험급여 자동 계산기** | 장기요양 등급별 월 한도액 기준 대여/구매 비용 자동 산정 | 🟡 |
| 8-2 | **AI 상담 품질 평가** | 채팅 응답별 좋아요/싫어요 + 상담원 에스컬레이션 버튼 | 🟡 |
| 8-3 | **B2B 기관 계정** | 복지관·요양원 단위 계정, 다수 수급자 일괄 주문, 기관별 계약서 커스텀 | 🟢 |
| 8-4 | **제품 리뷰 시스템** | 실제 사용자 후기 + 별점 → 제품 상세 + AI 상담 컨텍스트 반영 | 🟢 |
| 8-5 | **PWA + 푸시 알림** | `manifest.json` 추가 → 홈화면 설치, 서비스워커 기반 주문 알림 | 🟢 |
| 8-6 | **다국어 지원** | `i18next` 도입, 영어·중국어 번역 (외국인 가족 보호자 대상) | 🟢 |
