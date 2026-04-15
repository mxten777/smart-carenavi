/**
 * 계약서 템플릿 라이브러리
 * - 복지용구 대여 계약서
 * - 복지용구 구매 계약서
 * - 개인정보 수집·이용 동의서
 * - 장기요양 급여 제공 계약서
 *
 * 각 함수는 HTML 문자열을 반환합니다.
 * ContractPrintView에서 iframe srcDoc으로 렌더링 후
 * window.print() → 브라우저 인쇄 → PDF 저장 방식으로 다운로드합니다.
 */

// 사용자 입력값을 HTML에 삽입하기 전 반드시 이스케이프
const esc = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`
}

const orderNum = (id) => esc(id?.slice(0, 8).toUpperCase() ?? '--------')

const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
      font-size: 13px;
      line-height: 1.8;
      color: #1a1a1a;
      background: #fff;
      padding: 40px 50px;
    }
    h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 6px; letter-spacing: -0.5px; }
    h2 { font-size: 14px; font-weight: 700; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1.5px solid #1a1a1a; }
    h3 { font-size: 13px; font-weight: 700; margin: 14px 0 4px; }
    .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 24px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-table td { padding: 6px 10px; border: 1px solid #ccc; font-size: 12.5px; }
    .info-table td:first-child { background: #f5f5f5; font-weight: 600; width: 28%; white-space: nowrap; }
    .clause { margin-bottom: 12px; }
    .clause p { margin-bottom: 4px; }
    ol { padding-left: 20px; }
    ol li { margin-bottom: 4px; }
    .sign-area { margin-top: 40px; }
    .sign-row { display: flex; justify-content: space-between; }
    .sign-box { text-align: center; width: 44%; }
    .sign-box p { font-size: 13px; }
    .sign-box .line { border-bottom: 1px solid #333; height: 36px; margin: 8px 0 4px; }
    .sign-box .label { font-size: 11px; color: #777; }
    .company-box { text-align: center; margin-bottom: 24px; background: #f8f8f8; border: 1px solid #ddd; padding: 12px; border-radius: 4px; }
    .company-box strong { font-size: 15px; }
    .indent { padding-left: 16px; }
    .amount { color: #1d4ed8; font-weight: 700; }
    @media print {
      body { padding: 20px 30px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
`

// ─────────────────────────────────────────────
// 1. 복지용구 대여 계약서
// ─────────────────────────────────────────────
export function rentalContractHTML(order, product) {
  const monthlyFee = Math.round(product.price * 0.15).toLocaleString()
  const grades = esc(product.target_grade?.join(', ') ?? '해당 없음')

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${baseStyle}</head><body>
<h1>복지용구 대여 계약서</h1>
<p class="subtitle">장기요양보험 급여 적용 복지용구 대여에 관한 계약</p>

<div class="company-box">
  <strong>스마트케어나비</strong><br>
  <span style="font-size:12px; color:#555;">사업자등록번호: 000-00-00000 &nbsp;|&nbsp; 대표자: 홍길동 &nbsp;|&nbsp; Tel: 1599-0000</span>
</div>

<h2>제1조 계약 당사자</h2>
<table class="info-table">
  <tr><td>계약 번호</td><td>${orderNum(order.id)}</td></tr>
  <tr><td>계약 일자</td><td>${today()}</td></tr>
  <tr><td>수급자 성명</td><td>${esc(order.user_name)}</td></tr>
  <tr><td>생년월일</td><td>${esc(order.birth_date) || '　　　　년　　월　　일'}</td></tr>
  <tr><td>연락처</td><td>${esc(order.phone)}</td></tr>
  <tr><td>주소</td><td>${esc(order.address)}${order.address_detail ? ' ' + esc(order.address_detail) : ''}</td></tr>
  <tr><td>장기요양등급</td><td>${order.care_grade ? Number(order.care_grade) + '등급' : '　　 등급'}</td></tr>
</table>

<h2>제2조 대여 대상 물품</h2>
<table class="info-table">
  <tr><td>품목명</td><td>${esc(product.name)}</td></tr>
  <tr><td>카테고리</td><td>${esc(product.category)}</td></tr>
  <tr><td>정가</td><td>${product.price.toLocaleString()}원</td></tr>
  <tr><td>급여지원 대상 등급</td><td>${grades}등급</td></tr>
  <tr><td>월 본인부담금 (15%)</td><td class="amount">월 약 ${esc(monthlyFee)}원</td></tr>
</table>

<h2>제3조 대여 조건</h2>
<div class="clause">
  <h3>① 대여 기간</h3>
  <p class="indent">본 계약은 계약 체결일로부터 효력이 발생하며, 수급자의 장기요양 인정 기간을 대여 기간으로 한다. 단, 장기요양 인정 갱신 시 자동으로 연장될 수 있다.</p>
  <h3>② 대여료 납부</h3>
  <p class="indent">대여료는 매월 1일 기준으로 산정하며, 공단 급여비는 사업자가 국민건강보험공단에 청구하고, 수급자 본인부담금은 익월 5일까지 납부한다.</p>
  <h3>③ 물품 관리 의무</h3>
  <p class="indent">수급자 또는 보호자는 대여 물품을 선량한 관리자의 주의 의무로 관리하여야 하며, 고의 또는 중과실로 인한 파손·분실 시 수리비 또는 교환비용을 부담한다.</p>
  <h3>④ 계약 해지</h3>
  <p class="indent">수급자 또는 사업자는 14일 전 서면 통보로 계약을 해지할 수 있다. 수급자가 장기요양 자격을 상실한 경우 즉시 계약이 종료된다.</p>
  <h3>⑤ 물품 반환</h3>
  <p class="indent">계약 종료 시 수급자는 대여 물품을 원상태로 반환하여야 한다.</p>
</div>

<h2>제4조 개인정보 처리</h2>
<p class="indent">사업자는 서비스 제공에 필요한 최소한의 개인정보만을 수집·이용하며, 수급자의 동의 없이 제3자에게 제공하지 않는다. 단, 국민건강보험공단 급여 청구를 위한 정보 제공은 예외로 한다.</p>

<div class="sign-area">
  <p style="text-align:center; margin-bottom:20px;">위 계약의 내용을 충분히 이해하고 이에 동의하여 본 계약서에 서명합니다.</p>
  <p style="text-align:center; margin-bottom:28px;">${today()}</p>
  <div class="sign-row">
    <div class="sign-box">
      <p><strong>수급자 (또는 보호자)</strong></p>
      <div class="line"></div>
      <p>${esc(order.user_name)} (서명 또는 날인)</p>
      <p class="label">연락처: ${esc(order.phone)}</p>
    </div>
    <div class="sign-box">
      <p><strong>사업자 스마트케어나비</strong></p>
      <div class="line"></div>
      <p>대표자 홍길동 (직인)</p>
      <p class="label">사업자등록번호: 000-00-00000</p>
    </div>
  </div>
</div>
</body></html>`
}

// ─────────────────────────────────────────────
// 2. 복지용구 구매 계약서
// ─────────────────────────────────────────────
export function purchaseContractHTML(order, product) {
  const selfPay = Math.round(product.price * 0.15).toLocaleString()
  const govSupport = Math.round(product.price * 0.85).toLocaleString()
  const grades = esc(product.target_grade?.join(', ') ?? '해당 없음')

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${baseStyle}</head><body>
<h1>복지용구 구매 계약서</h1>
<p class="subtitle">장기요양보험 급여 적용 복지용구 구매에 관한 계약</p>

<div class="company-box">
  <strong>스마트케어나비</strong><br>
  <span style="font-size:12px; color:#555;">사업자등록번호: 000-00-00000 &nbsp;|&nbsp; 대표자: 홍길동 &nbsp;|&nbsp; Tel: 1599-0000</span>
</div>

<h2>제1조 계약 당사자</h2>
<table class="info-table">
  <tr><td>계약 번호</td><td>${orderNum(order.id)}</td></tr>
  <tr><td>계약 일자</td><td>${today()}</td></tr>
  <tr><td>구매자 성명</td><td>${esc(order.user_name)}</td></tr>
  <tr><td>생년월일</td><td>${esc(order.birth_date) || '　　　　년　　월　　일'}</td></tr>
  <tr><td>연락처</td><td>${esc(order.phone)}</td></tr>
  <tr><td>주소</td><td>${esc(order.address)}${order.address_detail ? ' ' + esc(order.address_detail) : ''}</td></tr>
  <tr><td>장기요양등급</td><td>${order.care_grade ? Number(order.care_grade) + '등급' : '　　 등급'}</td></tr>
</table>

<h2>제2조 구매 대상 물품</h2>
<table class="info-table">
  <tr><td>품목명</td><td>${esc(product.name)}</td></tr>
  <tr><td>카테고리</td><td>${esc(product.category)}</td></tr>
  <tr><td>급여지원 대상 등급</td><td>${grades}등급</td></tr>
  <tr><td>물품 가격 (정가)</td><td>${product.price.toLocaleString()}원</td></tr>
  <tr><td>국민건강보험공단 지원금 (85%)</td><td>${govSupport}원</td></tr>
  <tr><td>구매자 본인부담금 (15%)</td><td class="amount">${selfPay}원</td></tr>
</table>

<h2>제3조 구매 조건</h2>
<div class="clause">
  <h3>① 소유권 이전</h3>
  <p class="indent">물품의 소유권은 본인부담금 완납 및 공단 급여 처리 완료 후 구매자에게 이전된다.</p>
  <h3>② 배송 및 설치</h3>
  <p class="indent">사업자는 계약 체결 후 영업일 기준 3~5일 이내에 배송 및 설치를 완료한다. 단, 천재지변 등 불가피한 사유가 있을 경우 별도 협의한다.</p>
  <h3>③ 품질 보증</h3>
  <p class="indent">사업자는 물품 인도일로부터 1년간 제품 결함에 의한 무상 수리를 보증한다.</p>
  <h3>④ 청약 철회</h3>
  <p class="indent">구매자는 물품 수령일로부터 14일 이내에 청약 철회를 신청할 수 있다. 단, 포장을 개봉하여 사용한 경우 등 전자상거래법 제17조에서 정한 사유에 해당하는 경우에는 철회가 제한될 수 있다.</p>
  <h3>⑤ 연간 한도 적용</h3>
  <p class="indent">장기요양 복지용구 구매 급여는 연간 160만 원 한도 내에서 지원된다. 한도 초과분은 전액 구매자 부담이다.</p>
</div>

<h2>제4조 개인정보 처리</h2>
<p class="indent">사업자는 구매 서비스 제공에 필요한 최소한의 개인정보만을 수집·이용하며, 구매자의 동의 없이 제3자에게 제공하지 않는다.</p>

<div class="sign-area">
  <p style="text-align:center; margin-bottom:20px;">위 계약의 내용을 충분히 이해하고 이에 동의하여 본 계약서에 서명합니다.</p>
  <p style="text-align:center; margin-bottom:28px;">${today()}</p>
  <div class="sign-row">
    <div class="sign-box">
      <p><strong>구매자</strong></p>
      <div class="line"></div>
      <p>${esc(order.user_name)} (서명 또는 날인)</p>
      <p class="label">연락처: ${esc(order.phone)}</p>
    </div>
    <div class="sign-box">
      <p><strong>사업자 스마트케어나비</strong></p>
      <div class="line"></div>
      <p>대표자 홍길동 (직인)</p>
      <p class="label">사업자등록번호: 000-00-00000</p>
    </div>
  </div>
</div>
</body></html>`
}

// ─────────────────────────────────────────────
// 3. 개인정보 수집·이용 동의서
// ─────────────────────────────────────────────
export function privacyConsentHTML(order) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${baseStyle}</head><body>
<h1>개인정보 수집·이용 동의서</h1>
<p class="subtitle">「개인정보 보호법」 제15조에 의거한 개인정보 수집·이용 동의</p>

<div class="company-box">
  <strong>스마트케어나비</strong> — 개인정보처리자<br>
  <span style="font-size:12px; color:#555;">사업자등록번호: 000-00-00000 &nbsp;|&nbsp; Tel: 1599-0000 &nbsp;|&nbsp; 개인정보보호책임자: 홍길동</span>
</div>

<h2>1. 수집·이용 목적</h2>
<table class="info-table">
  <tr>
    <td style="width:40%; background:#f5f5f5; font-weight:600;">목적</td>
    <td>복지용구 구매·대여 상담 및 계약 체결, 배송·설치 서비스 제공, 장기요양 급여 청구, 고객 문의 처리</td>
  </tr>
  <tr>
    <td style="background:#f5f5f5; font-weight:600;">수집 항목</td>
    <td>성명, 생년월일, 연락처, 주소, 장기요양등급, 상담 내용</td>
  </tr>
  <tr>
    <td style="background:#f5f5f5; font-weight:600;">보유·이용 기간</td>
    <td>서비스 이용 계약 종료 후 5년 (관계 법령에 따른 보존 기간 적용)</td>
  </tr>
</table>

<h2>2. 개인정보 제3자 제공</h2>
<table class="info-table">
  <tr>
    <td style="width:30%; background:#f5f5f5; font-weight:600;">제공 대상</td>
    <td>국민건강보험공단</td>
  </tr>
  <tr>
    <td style="background:#f5f5f5; font-weight:600;">제공 목적</td>
    <td>장기요양 급여 청구 및 자격 확인</td>
  </tr>
  <tr>
    <td style="background:#f5f5f5; font-weight:600;">제공 항목</td>
    <td>성명, 생년월일, 장기요양등급, 급여 이용 내역</td>
  </tr>
  <tr>
    <td style="background:#f5f5f5; font-weight:600;">보유 기간</td>
    <td>제공 목적 달성 후 즉시 파기</td>
  </tr>
</table>

<h2>3. 동의 거부 권리 및 불이익</h2>
<p class="indent">귀하는 개인정보 수집·이용에 동의를 거부할 권리가 있습니다. 단, 위 정보는 서비스 제공을 위한 필수 정보이므로, 동의 거부 시 복지용구 구매·대여 서비스 이용이 불가합니다.</p>

<h2>4. 개인정보 처리 방침</h2>
<p class="indent">기타 개인정보 처리에 관한 사항은 스마트케어나비 개인정보 처리방침(홈페이지 내 게시)을 참고하시기 바랍니다.</p>

<div style="margin-top:32px; border:2px solid #1d4ed8; border-radius:6px; padding:16px; background:#eff6ff;">
  <p style="font-weight:700; font-size:14px; margin-bottom:8px;">동의 확인</p>
  <p>본인은 위 개인정보 수집·이용 및 제3자 제공에 관한 내용을 확인하고 이에 동의합니다.</p>
  <br>
  <p>동의자 성명: <strong>${esc(order.user_name)}</strong> &nbsp;&nbsp; 연락처: <strong>${esc(order.phone)}</strong></p>
  <p>동의 일자: ${today()}</p>
  <div style="margin-top:20px; border-bottom:1px solid #333; height:32px;"></div>
  <p style="font-size:11px; color:#777; margin-top:4px;">서명 또는 날인</p>
</div>
</body></html>`
}

// ─────────────────────────────────────────────
// 4. 장기요양 급여 제공 계약서
// ─────────────────────────────────────────────
export function careContractHTML(order, product) {
  const selfPay = Math.round(product.price * 0.15).toLocaleString()
  const contractLabel = order.contract_type === 'rental' ? '대여' : '구매'

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${baseStyle}</head><body>
<h1>장기요양 급여 제공 계약서</h1>
<p class="subtitle">「노인장기요양보험법」 제23조 및 동법 시행규칙 제14조에 따른 복지용구 급여 제공 계약</p>

<div class="company-box">
  <p style="font-size:11px; color:#888; margin-bottom:4px;">복지용구 사업자</p>
  <strong>스마트케어나비</strong><br>
  <span style="font-size:12px; color:#555;">
    지정번호: 00-0000-00 &nbsp;|&nbsp; 사업자등록번호: 000-00-00000<br>
    소재지: 서울특별시 ○○구 ○○로 000 &nbsp;|&nbsp; Tel: 1599-0000
  </span>
</div>

<h2>제1조 계약 당사자</h2>
<table class="info-table">
  <tr>
    <td colspan="2" style="background:#e8f0fe; font-weight:700; text-align:center;">수급자 (이용자)</td>
  </tr>
  <tr><td>성 명</td><td>${esc(order.user_name)}</td></tr>
  <tr><td>생년월일</td><td>${esc(order.birth_date) || '　　　　년　　월　　일'}</td></tr>
  <tr><td>주 소</td><td>${esc(order.address)}${order.address_detail ? ' ' + esc(order.address_detail) : ''}</td></tr>
  <tr><td>연락처</td><td>${esc(order.phone)}</td></tr>
  <tr><td>장기요양등급</td><td>${order.care_grade ? Number(order.care_grade) + '등급' : '　　 등급'}</td></tr>
</table>

<h2>제2조 급여 내용</h2>
<table class="info-table">
  <tr><td>급여 종류</td><td>복지용구 ${contractLabel}</td></tr>
  <tr><td>품 목</td><td>${esc(product.name)}</td></tr>
  <tr><td>급여 제공 시작일</td><td>${today()}</td></tr>
  <tr><td>급여 비용 (월/건)</td><td>${product.price.toLocaleString()}원</td></tr>
  <tr><td>본인부담금</td><td class="amount">${selfPay}원 (전체 비용의 15%)</td></tr>
  <tr><td>공단 부담금</td><td>${Math.round(product.price * 0.85).toLocaleString()}원 (전체 비용의 85%)</td></tr>
</table>

<h2>제3조 급여 제공자의 의무</h2>
<div class="clause">
  <ol>
    <li>사업자는 수급자의 심신 상태와 욕구에 맞는 복지용구 급여를 제공하여야 한다.</li>
    <li>사업자는 급여 제공 기준, 내용, 비용 및 본인부담금에 관한 정보를 수급자에게 사전에 충분히 설명하여야 한다.</li>
    <li>사업자는 수급자의 비밀을 보장하고 인격을 존중하여야 한다.</li>
    <li>사업자는 수급자에게 급여 제공 기록지를 작성·보관하고 수급자의 요청 시 열람하게 하여야 한다.</li>
    <li>사업자는 물품의 품질 유지를 위해 적절한 점검·수리 서비스를 제공하여야 한다 (대여의 경우).</li>
  </ol>
</div>

<h2>제4조 수급자의 권리와 의무</h2>
<div class="clause">
  <ol>
    <li>수급자는 제공받은 복지용구 급여에 대하여 이의를 제기할 수 있으며, 사업자는 이에 성실히 응하여야 한다.</li>
    <li>수급자는 급여 비용 청구에 관한 자료를 요청할 수 있다.</li>
    <li>수급자는 본인부담금을 계약서에 명시된 기일까지 납부하여야 한다.</li>
    <li>수급자는 제공받은 복지용구를 지정된 목적 외로 사용하여서는 안 된다.</li>
  </ol>
</div>

<h2>제5조 계약의 해지 및 변경</h2>
<div class="clause">
  <p>수급자 또는 사업자 중 일방이 본 계약을 해지하고자 할 경우 상대방에게 14일 전 서면으로 통보하여야 한다. 단, 다음 각 호에 해당하는 경우 즉시 해지할 수 있다.</p>
  <ol style="margin-top:6px;">
    <li>수급자가 장기요양 인정을 받지 못하거나 인정이 취소된 경우</li>
    <li>수급자가 사망한 경우</li>
    <li>사업자가 장기요양 지정을 취소당한 경우</li>
  </ol>
</div>

<h2>제6조 분쟁 해결</h2>
<p class="indent">본 계약과 관련한 분쟁은 노인장기요양보험법 및 관계 법령에 따라 처리하며, 소송이 필요한 경우 사업자 소재지 관할 법원을 제1심 법원으로 한다.</p>

<div class="sign-area">
  <p style="text-align:center; margin-bottom:20px;">위와 같이 계약을 체결하고 계약서 2부를 작성하여 각 1부씩 보관한다.</p>
  <p style="text-align:center; margin-bottom:28px;">${today()}</p>
  <div class="sign-row">
    <div class="sign-box">
      <p><strong>수급자 (또는 보호자)</strong></p>
      <div class="line"></div>
      <p>${esc(order.user_name)} (서명 또는 날인)</p>
      <p class="label">생년월일: ${esc(order.birth_date) || '미기재'}</p>
    </div>
    <div class="sign-box">
      <p><strong>복지용구 사업자</strong></p>
      <div class="line"></div>
      <p>스마트케어나비 대표 홍길동 (직인)</p>
      <p class="label">지정번호: 00-0000-00</p>
    </div>
  </div>
</div>
</body></html>`
}
