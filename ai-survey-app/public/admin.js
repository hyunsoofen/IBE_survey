import { STAGES, LIKERT } from './questions.js';
import { HIDDEN, ROUTES } from './story.js';
import { DEMO, adminSignIn, adminSignOut, onAdmin, loadResponses } from './db.js';

const $root = document.getElementById('root');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const QS = STAGES.flatMap((s) => s.questions.map((q) => ({ ...q, stage: s })));
const HQS = HIDDEN.map((h) => ({ ...h, text: `[히든] ${h.text}` }));
const ALLQ = [...QS, ...HQS];
let ALL = [], user = null;
const F = { A2: '', A3: '', A6: '' };

onAdmin(async (u) => {
  user = u;
  if (!u) return renderLogin();
  try { ALL = await loadResponses(); renderDash(); }
  catch (e) {
    console.error(e);
    $root.innerHTML = `<div class="center">데이터를 읽을 권한이 없습니다.<br>(${esc(u.email)})<br><br>firestore.rules의 관리자 이메일 목록을 확인하세요.<br><br><button class="sub" id="out">로그아웃</button></div>`;
    document.getElementById('out').onclick = () => adminSignOut();
  }
});

function renderLogin() {
  $root.innerHTML = `<div class="center"><h1>설문 결과 대시보드</h1><p>관리자 Google 계정으로 로그인하세요.</p><button id="in">Google로 로그인</button></div>`;
  document.getElementById('in').onclick = () => adminSignIn().catch((e) => alert(e.message));
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const agreeRate = (rows, id) => {
  const v = rows.map((r) => r.answers?.[id]).filter((x) => typeof x === 'number');
  return { n: v.length, agree: pct(v.filter((x) => x >= 4).length, v.length), mean: v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : '–' };
};

function filtered() {
  return ALL.filter((r) => Object.entries(F).every(([k, v]) => !v || r.answers?.[k] === v));
}

function dist(q, rows) {
  let opts, counts, total;
  if (q.type === 'likert') {
    opts = LIKERT.map((l) => `${l.v} ${l.label}`);
    const vals = rows.map((r) => r.answers?.[q.id]).filter((x) => typeof x === 'number');
    counts = LIKERT.map((l) => vals.filter((x) => x === l.v).length);
    total = vals.length;
  } else if (q.type === 'multi') {
    opts = q.options;
    const sets = rows.map((r) => r.answers?.[q.id]).filter(Array.isArray);
    counts = opts.map((o) => sets.filter((s) => s.includes(o)).length);
    total = sets.length;
  } else {
    opts = q.options;
    const vals = rows.map((r) => r.answers?.[q.id]).filter(Boolean);
    counts = opts.map((o) => vals.filter((x) => x === o).length);
    total = vals.length;
  }
  const max = Math.max(1, ...counts);
  const lines = opts.map((o, i) => `<div class="row"><span>${esc(o)}</span><span class="bar"><i style="width:${(counts[i] / max) * 100}%"></i></span><span class="n">${counts[i]} · ${pct(counts[i], total)}%</span></div>`).join('');
  const extra = q.type === 'likert' ? (() => { const a = agreeRate(rows, q.id); return `<div class="agree">동의(4~5) <b>${a.agree}%</b> · 평균 <b>${a.mean}</b></div>`; })() : q.type === 'multi' ? `<div class="agree">복수 응답 · 응답자 기준 %</div>` : '';
  return `<div class="card"><h3>${q.id}. ${esc(q.text)} <small>(n=${total})</small></h3>${lines}${extra}</div>`;
}

function texts(q, rows) {
  const t = rows.map((r) => r.answers?.[q.id]).filter((x) => x && String(x).trim());
  return `<div class="card" style="grid-column:1/-1"><h3>${q.id}. ${esc(q.text)} <small>(${t.length}건)</small></h3>
    <ul class="texts">${t.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>아직 응답이 없습니다.</li>'}</ul></div>`;
}

function select(id) {
  const q = QS.find((x) => x.id === id);
  return `<label>${esc(q.text.replace('귀하의 ', '').replace('?', ''))} <select data-f="${id}"><option value="">전체</option>${q.options.map((o) => `<option ${F[id] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
}

function renderDash() {
  const rows = filtered();
  const users = rows.filter((r) => r.answers?.A6 && r.answers.A6 !== '사용하지 않음').length;
  const avgMin = rows.length ? (rows.reduce((a, r) => a + (r.durationSec || 0), 0) / rows.length / 60).toFixed(1) : '–';
  const b1 = agreeRate(rows, 'B1'), b4 = agreeRate(rows, 'B4'), f1 = agreeRate(rows, 'F1'), f2 = agreeRate(rows, 'F2');
  $root.innerHTML = `
  <header>
    <h1>설문 결과 대시보드 ${DEMO ? '<small style="font-size:13px;color:var(--soft)">(데모 · 이 브라우저 응답만)</small>' : ''}</h1>
    <div style="display:flex;gap:8px">
      <button id="csv">CSV 다운로드</button>
      <button class="sub" id="reload">새로고침</button>
      ${DEMO ? '' : '<button class="sub" id="out">로그아웃</button>'}
    </div>
  </header>
  <div class="filters">필터 ${select('A2')} ${select('A3')} ${select('A6')}</div>
  <div class="kpis">
    <div class="kpi"><b>${rows.length}</b><span>응답 수${rows.length !== ALL.length ? ` (전체 ${ALL.length})` : ''}</span></div>
    <div class="kpi"><b>${pct(users, rows.length)}%</b><span>AI 사용자 비율</span></div>
    <div class="kpi"><b>${avgMin}분</b><span>평균 소요 시간</span></div>
    <div class="kpi"><b>${b1.agree}% → ${b4.agree}%</b><span>H1 내 일 빨라짐(B1) → 회사 이익 기여(B4)</span></div>
    <div class="kpi"><b>${f1.agree}% → ${f2.agree}%</b><span>H7 기록 의향(F1) → 평가 반영(F2)</span></div>
  </div>
  <div class="kpis">${Object.values(ROUTES).map((r) => { const c = rows.filter((x) => x.route === r.id).length; return `<div class="kpi"><b>${r.emoji} ${pct(c, rows.length)}%</b><span>${r.name} (${c}명)</span></div>`; }).join('')}</div>
  ${STAGES.map((s) => `
    <h2 class="section">${s.emoji} ${s.id}. ${esc(s.title)}</h2>
    <div class="grid">${s.questions.map((q) => (q.type === 'text' ? texts(q, rows) : dist(q, rows))).join('')}</div>`).join('')}
  <h2 class="section">💎 히든 퀘스트 (조건부 문항)</h2>
  <div class="grid">${HQS.map((q) => dist(q, rows)).join('')}</div>
  `;
  document.getElementById('csv').onclick = () => downloadCSV(rows);
  document.getElementById('reload').onclick = async () => { ALL = await loadResponses(); renderDash(); };
  document.getElementById('out')?.addEventListener('click', () => adminSignOut());
  document.querySelectorAll('[data-f]').forEach((el) => (el.onchange = () => { F[el.dataset.f] = el.value; renderDash(); }));
}

function downloadCSV(rows) {
  const head = ['submittedAt', 'durationSec', 'route', ...ALLQ.map((q) => q.id)];
  const cell = (v) => {
    const s = Array.isArray(v) ? v.join(' | ') : v ?? '';
    return /[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s);
  };
  const lines = [head.join(','), ...rows.map((r) => [r.submittedAt, r.durationSec, r.route, ...ALLQ.map((q) => r.answers?.[q.id])].map(cell).join(','))];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ai-survey-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
