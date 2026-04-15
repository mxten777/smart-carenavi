# 스마트케어나비 — 프로젝트 진행 현황 및 향후 개선 계획

> 기준일: 2026-04-16  
> 버전: 0.1.0 (MVP)  
> 스택: React 18 + Vite 5 · TailwindCSS 3 · Zustand · React Router v6 · Supabase · OpenAI GPT-4o-mini

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

### 1-2. 데이터베이스 (Supabase)
| 마이그레이션 | 내용 |
|-------------|------|
| `001_initial.sql` | profiles, products, policy_documents, document_chunks, orders, chat_sessions, chat_messages 7개 테이블 + RLS + 시드 데이터 |
| `002_update_images.sql` | 이미지 URL 관련 작업 |
| `003_clear_images.sql` | 모든 제품 image_url → NULL 초기화 |
| `004_add_contract_fields.sql` | orders 테이블에 계약서 필드 7개 추가 ✅ 실행 완료 |

**orders 테이블 현재 필드:**
```
id, product_id, user_name, phone, notes, status, created_at
contract_type, address, address_detail, birth_date, care_grade, agreed_privacy, contract_at
```

### 1-3. 프론트엔드 페이지
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 홈 | `/` | ✅ 프리미엄 히어로 + 카테고리 쇼케이스 |
| 제품 목록 | `/products` | ✅ 탭 필터 + 스켈레톤 로딩 |
| 제품 상세 | `/product/:id` | ✅ glass-card 패널 + CTA 배너 |
| AI 상담 | `/chat` | ✅ RAG 연동 + 그라디언트 버블 UI |
| 주문서 | `/checkout` | ✅ 대여/구매 선택 + 계약 필드 전면 개선 |
| 주문 완료 | `/order-complete` | ✅ 계약서 4종 다운로드 버튼 |
| 계약서 인쇄 | `/contract/:orderId/:type` | ✅ 브라우저 인쇄/PDF 저장 |

### 1-4. 계약서 시스템 (4종)
| 계약서 | 키 | 표시 조건 |
|--------|----|-----------| 
| 개인정보 수집·이용 동의서 | `privacy` | 항상 |
| 복지용구 대여 계약서 | `rental` | 대여 선택 시 |
| 복지용구 구매 계약서 | `purchase` | 구매 선택 시 |
| 장기요양 급여 제공 계약서 | `care` | 항상 |

- 계약서는 브라우저 `window.print()` → PDF 저장 방식 (한글 폰트 깨짐 없음)
- `src/lib/contractTemplates.js` — 4종 HTML 템플릿 함수
- `src/pages/ContractPrintView.jsx` — iframe 격리 렌더링 + 인쇄 컨트롤바

### 1-5. RAG + AI 상담
- Supabase `products` + `document_chunks` 키워드 검색 → 시스템 프롬프트 컨텍스트 주입
- OpenAI GPT-4o-mini 호출 (API 키 없을 시 Mock 응답 자동 전환)
- 채팅 세션/메시지 Supabase 저장 (`chat_sessions`, `chat_messages`)
- 제품 추천 파싱: AI 응답에서 `[[제품추천: id1, id2]]` 패턴 추출 → 카드 자동 표시

---

## 2. 현재 알려진 제한사항

| 항목 | 상태 | 설명 |
|------|------|------|
| OpenAI API 키 | ⚠️ 미설정 | `.env`에 `VITE_OPENAI_API_KEY` 없으면 Mock 모드 |
| pgvector 임베딩 | ⚠️ 미활성화 | `001_initial.sql`에서 주석 처리됨. 키워드 검색만 사용 중 |
| 이미지 없음 | ⚠️ | 모든 제품 image_url = NULL. 카테고리 그라디언트 fallback 표시 |
| 인증 없음 | ⚠️ | 로그인/회원가입 미구현. 비로그인 주문만 가능 |
| API 키 프론트 노출 | ⚠️ | OpenAI 직접 호출 방식. 프로덕션 전 Edge Function으로 이동 필요 |
| 관리자 페이지 없음 | ⚠️ | 주문 관리, 제품 관리 UI 없음 |
| 모바일 최적화 | ⚠️ | 기본 반응형만 적용. 세부 터치 UX 미완 |

---

## 3. 향후 기능 개선 계획

### Phase 2 — 핵심 기능 완성 (우선순위 높음)

#### A. OpenAI API 보안 처리
**현재:** 브라우저에서 OpenAI API 직접 호출 (`dangerouslyAllowBrowser: true`)  
**개선:** Supabase Edge Function으로 프록시 처리

```
supabase/functions/
  chat/
    index.ts   ← OpenAI 호출을 서버사이드로 이동
```

- API 키가 클라이언트에 노출되지 않음
- Rate limiting, 비용 제어 가능
- CORS, 인증 처리 통합

---

#### B. pgvector 임베딩 기반 시맨틱 검색
**현재:** 키워드 LIKE 검색 (정확도 낮음)  
**개선:** OpenAI `text-embedding-3-small` → pgvector `<=>` 코사인 유사도 검색

```sql
-- 001_initial.sql에서 주석 해제 필요
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE document_chunks ADD COLUMN embedding vector(1536);
ALTER TABLE products ADD COLUMN embedding vector(1536);
```

임베딩 생성 스크립트 → Edge Function or 배치 처리

---

#### C. 사용자 인증 (Supabase Auth)
```
로그인 → profiles 테이블 연결 → 등급 자동 저장
주문 → user_id 연결 → 주문 내역 조회 가능
```

- 소셜 로그인 (카카오, Google)
- 보호자/어르신 구분 페르소나
- 저장된 주소, 등급 자동 채우기

---

#### D. 관리자 대시보드
```
/admin (별도 빌드 또는 서브도메인)
  /admin/orders       주문 목록, 상태 변경
  /admin/products     제품 등록/수정/삭제, 이미지 업로드
  /admin/documents    RAG 정책 문서 업로드 → 청크 자동 분할
  /admin/analytics    상담 통계, 인기 제품
```

---

#### E. 제품 이미지 처리
**현재:** image_url 모두 NULL, 카테고리 그라디언트 fallback  
**개선:**
- Supabase Storage에 실제 제품 이미지 업로드
- `UPDATE products SET image_url = 'https://...supabase.co/storage/...'`
- 관리자 페이지에서 이미지 업로드 UI

---

### Phase 3 — 서비스 품질 향상

#### F. 계약서 고도화
| 항목 | 개선 내용 |
|------|----------|
| 자동 완성 | 주소 API 연동 (카카오/도로명주소 API) |
| 디지털 서명 | canvas 또는 서명 라이브러리 연동 |
| 이메일 발송 | 계약서 PDF를 이메일로 자동 발송 |
| 계약번호 체계 | 연도-월-일련번호 형식 (예: 2026-04-001) |
| 계약서 보관 | 계약서 HTML을 Supabase Storage에 저장 |

---

#### G. AI 상담 고도화
| 항목 | 개선 내용 |
|------|----------|
| 스트리밍 응답 | `stream: true` → 타자 치는 효과 |
| 제품 추천 카드 | 채팅 내 인라인 제품 카드 (현재는 채팅 아래 별도 영역) |
| 상담 이력 | 로그인 사용자의 과거 상담 내역 불러오기 |
| 문서 업로드 RAG | 장기요양인정서 PDF → 텍스트 추출 → 맞춤 상담 |
| 다국어 | 영어, 중국어 지원 (외국인 가족 보호자) |

---

#### H. 주문/배송 프로세스
```
주문 접수(pending) → 상담원 확인(confirmed) → 배송 준비(preparing) 
→ 배송 중(shipped) → 설치 완료(installed) → 대여 진행 중(active)
```

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

#### J. B2B 기관 포털
- 요양원/주간보호센터 단체 계약
- 기관별 계정 분리, 대량 주문
- 세금계산서 자동 발행

#### K. 급여 청구 자동화
- 국민건강보험공단 EDI 연동
- 월별 급여 청구 자동 생성
- 청구서 상태 추적

---

## 4. 기술 부채 및 리팩토링 필요 항목

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| OpenAI Edge Function 이동 | 보안 이슈 | 🔴 높음 |
| 에러 바운더리 추가 | 전역 에러 핸들링 없음 | 🟡 중간 |
| 로딩/에러 상태 표준화 | 페이지마다 다른 패턴 | 🟡 중간 |
| React Query 도입 | Supabase 캐싱, 재시도 로직 | 🟡 중간 |
| TypeScript 마이그레이션 | 현재 JSX만 사용 | 🟢 낮음 |
| 단위 테스트 | 테스트 코드 없음 | 🟢 낮음 |
| 번들 분할 (code split) | 현재 542KB 단일 번들 | 🟢 낮음 |

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
│   │   │   ├── Layout.jsx              # 공통 레이아웃 (Outlet)
│   │   │   └── Header.jsx              # 스크롤 blur 헤더
│   │   ├── chat/
│   │   │   ├── ChatMessage.jsx         # AI/유저 말풍선
│   │   │   └── ChatInput.jsx           # 전송 입력창
│   │   └── products/
│   │       ├── ProductCard.jsx         # 제품 카드 (hover scale)
│   │       └── ProductFilter.jsx       # 카테고리 탭 필터
│   ├── pages/
│   │   ├── Home.jsx                    # 랜딩 히어로 페이지
│   │   ├── Products.jsx                # 제품 목록
│   │   ├── ProductDetail.jsx           # 제품 상세
│   │   ├── Chat.jsx                    # AI 상담 채팅
│   │   ├── Checkout.jsx                # 주문서 (계약 필드 포함)
│   │   ├── OrderComplete.jsx           # 주문 완료 + 계약서 버튼
│   │   └── ContractPrintView.jsx       # 계약서 인쇄/PDF 페이지
│   ├── store/
│   │   ├── orderStore.js               # 주문 상태 (Zustand)
│   │   └── chatStore.js                # 채팅 상태 (Zustand)
│   └── lib/
│       ├── supabase.js                 # Supabase 클라이언트
│       ├── openai.js                   # OpenAI 클라이언트 + Mock
│       ├── rag.js                      # RAG 컨텍스트 빌더
│       ├── documentProcessor.js        # 문서 청킹 유틸
│       └── contractTemplates.js        # 계약서 HTML 템플릿 (4종)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql             # 스키마 + 시드 데이터
│   │   ├── 002_update_images.sql
│   │   ├── 003_clear_images.sql
│   │   └── 004_add_contract_fields.sql # 계약서 필드 추가 ✅
│   └── functions/                      # Edge Function 예정 위치
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
VITE_OPENAI_API_KEY=sk-...                                     ⚠️ 미설정 (Mock 모드)
```

---

## 7. 다음 즉시 실행 가능한 작업

1. **OpenAI API 키 설정** — `.env`에 `VITE_OPENAI_API_KEY=sk-...` 추가 후 재시작 → 실제 AI 상담 활성화  
2. **제품 이미지 업로드** — Supabase Storage에 이미지 넣고 `UPDATE products SET image_url = '...'` 실행  
3. **정책 문서 추가** — Supabase `policy_documents` 테이블에 장기요양 관련 정책 텍스트 삽입 → RAG 품질 향상  
4. **도메인 연결 + Vercel 배포** — `vercel deploy` (Vite 프로젝트 즉시 배포 가능)
