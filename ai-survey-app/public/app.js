import { SURVEY, STAGES, LIKERT, pickPersona } from './questions.js';
import { GUIDE, ROUTES, routeOf, forkFor, HIDDEN, ENABLE_HIDDEN, SKIP_RULES, stageStory, reactionFor, journey } from './story.js';
import { saveResponse, DEMO } from './db.js';
import { icon } from './icons.js';

const $app = document.getElementById('app');
const $fx = document.getElementById('fx');
const STORE = 'aiSurvey.progress.' + SURVEY.version;
// 개척 거리(km): 문항 10, 주관식 20, 숨은 지류 30, 구역 개척 50
const KM_Q = 10, KM_TEXT = 20, KM_HIDDEN = 30, KM_STAGE = 50;
const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ───────── 상태 ─────────
const fresh = () => ({
  rid: (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2)),
  answers: {}, rewarded: [], seen: [], pos: null, xp: 0, startedAt: null, submitted: false, durationSec: 0,
});
let S = load() || fresh();
let busy = false;
let bubble = null; // 다음 화면에서 길잡이가 할 말 (직전 응답에 대한 반응)

function load() { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} }

// ───────── 흐름 계산: 응답이 바뀔 때마다 다시 계산 ─────────
function currentRoute() { return S.answers.A6 ? routeOf(S.answers) : null; }
function stageOrder() {
  const r = currentRoute();
  return (r ? r.order : STAGES.map((s) => s.id)).map((id) => STAGE_BY_ID[id]);
}
function qsOf(st) {
  const out = [];
  for (const q of st.questions) {
    if (SKIP_RULES[q.id]?.(S.answers)) continue;
    out.push(q);
    if (ENABLE_HIDDEN)
      for (const h of HIDDEN) if (h.after === q.id && h.when(S.answers)) out.push({ ...h, hidden: true });
  }
  return out;
}
function screens() {
  const list = [];
  const fork = S.answers.A6 ? forkFor(S.answers) : null;
  const order = stageOrder();
  order.forEach((st, si) => {
    const qs = qsOf(st);
    list.push({ key: 'intro:' + st.id, kind: 'intro', st, si, total: order.length });
    qs.forEach((q, i) => list.push({ key: 'q:' + q.id, kind: 'q', st, q, i, n: qs.length }));
    list.push({ key: 'clear:' + st.id, kind: 'clear', st, last: si === order.length - 1 });
    if (fork && fork.after === st.id) list.push({ key: 'fork', kind: 'fork', fork });
  });
  list.push({ key: 'submit', kind: 'submit' });
  return list;
}
const allVisibleQs = () => stageOrder().flatMap(qsOf);
function isAnswered(q) {
  const v = S.answers[q.id];
  if (q.type === 'text') return S.seen.includes(q.id);
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  return v !== undefined && v !== null && v !== '';
}
function progress() {
  const qs = allVisibleQs();
  return qs.length ? qs.filter(isAnswered).length / qs.length : 0;
}
function go(key) { S.pos = key; persist(); render(); window.scrollTo({ top: 0 }); }
function next() {
  const list = screens();
  const i = list.findIndex((s) => s.key === S.pos);
  go(list[Math.min(i + 1, list.length - 1)].key);
}
function back() {
  bubble = null;
  const list = screens();
  const i = list.findIndex((s) => s.key === S.pos);
  for (let j = i - 1; j >= 0; j--) if (list[j].kind === 'q') return go(list[j].key);
  go(null);
}

// ───────── 보상 효과 ─────────
function reward(id, amount, el) {
  if (S.rewarded.includes(id)) return;
  S.rewarded.push(id);
  S.xp += amount;
  persist();
  const km = document.querySelector('.km b');
  if (km) { km.textContent = S.xp; km.parentElement.classList.remove('pop'); void km.offsetWidth; km.parentElement.classList.add('pop'); }
  if (el) {
    const r = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'float-km';
    f.textContent = '+' + amount + ' km';
    f.style.left = r.left + r.width / 2 + 'px';
    f.style.top = r.top + 'px';
    $fx.appendChild(f);
    setTimeout(() => f.remove(), 1000);
    burst(r.left + r.width / 2, r.top + r.height / 2, 10);
  }
  navigator.vibrate?.(10);
}
const AURORA = ['#3ef0c8', '#8b7bff', '#ff7ac6', '#ffb547', '#5fb4ff', '#ffffff'];
// 반짝이 입자: (x, y)에서 사방으로 퍼짐
function burst(x, y, count = 40, colors = AURORA, spread = 160) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'spark' + (i % 3 === 0 ? ' star' : '');
    const ang = Math.random() * Math.PI * 2;
    const dist = spread * (0.35 + Math.random() * 0.65);
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist - 30 + 'px');
    p.style.setProperty('--c', colors[i % colors.length]);
    p.style.animationDelay = Math.random() * 0.12 + 's';
    $fx.appendChild(p);
    setTimeout(() => p.remove(), 1500);
  }
}
function centerBurst(count, colors) { burst(innerWidth / 2, innerHeight * 0.32, count, colors, Math.min(innerWidth * 0.6, 260)); }

// ───────── 렌더링 ─────────
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const plain = (s) => String(s).replace(/\p{Extended_Pictographic}️?/gu, '').replace(/\s{2,}/g, ' ').trim();

function guideSays(text, cls = '') {
  if (!text) return '';
  return `<div class="guide ${cls}">
    <div class="orb" aria-hidden="true">${icon('compass')}</div>
    <div class="guide-bubble"><span class="who">${GUIDE.name} · ${GUIDE.role}</span>${esc(plain(text))}</div>
  </div>`;
}
function takeBubble() { const b = bubble; bubble = null; return b; }

function routeBadge() {
  const r = currentRoute();
  if (!r || !S.seen.includes('fork')) return '';
  return `<span class="route-badge" style="--rc:${r.color}">${icon(r.icon)}${esc(r.name)}</span>`;
}

function render() {
  const r = S.seen.includes('fork') && currentRoute();
  document.body.dataset.route = (r && r.id) || '';
  document.documentElement.style.setProperty('--route', r ? r.color : '#8b7bff');
  if (S.submitted) return renderResult();
  const list = screens();
  let cur = list.find((s) => s.key === S.pos);
  if (!cur && S.pos) {
    // 응답이 바뀌어 루트가 달라졌다면, 아직 안 푼 첫 문항으로 이동
    cur = list.find((s) => s.kind === 'q' && !isAnswered(s.q)) || list.find((s) => s.kind === 'submit');
    S.pos = cur.key; persist();
  }
  if (!cur) return renderLanding();
  if (cur.kind === 'intro') return renderStageIntro(cur);
  if (cur.kind === 'q') return renderQuestion(cur);
  if (cur.kind === 'clear') return renderClear(cur);
  if (cur.kind === 'fork') return renderFork(cur.fork);
  if (cur.kind === 'submit') return submit();
}

// 원정 지도: 루트 순서대로 구역을 잇고, 닫힌 구역은 자물쇠로 표시
function expeditionMap(currentId) {
  const order = stageOrder().map((s) => s.id);
  const decided = !!S.answers.A6;
  const ids = decided ? [...order, ...STAGES.map((s) => s.id).filter((id) => !order.includes(id))] : order;
  return `<ol class="xmap">${ids.map((id, k) => {
    const s = STAGE_BY_ID[id];
    const skip = decided && !order.includes(id);
    const done = S.rewarded.includes('stage:' + id);
    const cls = skip ? 'skip' : done ? 'done' : id === currentId ? 'now' : '';
    return `<li class="${cls}" style="--c:${s.color}"><span class="node">${icon(skip ? 'lock' : done ? 'check' : s.icon)}</span><span class="lbl">${skip ? '닫힌 구역' : esc(s.name)}</span></li>`;
  }).join('')}</ol>`;
}

function renderLanding() {
  const inProgress = S.startedAt && Object.keys(S.answers).length > 0;
  $app.innerHTML = `
  <section class="screen landing">
    ${DEMO ? `<div class="notice">체험 모드: 응답은 이 브라우저에만 저장돼요. <a href="admin.html">결과 대시보드 →</a></div>` : ''}
    <div class="hero">
      <div class="eyebrow"><span class="dot"></span>AI FRONTIER EXPEDITION · ${new Date().getFullYear()}</div>
      <h1>아직 지도가 없는 땅,<br><span class="grad">AI 시대의 일터</span></h1>
      <p>당신은 이 땅을 먼저 걷는 개척자입니다. 6개 구역을 지나며 당신의 현장을 기록해 주세요. 당신의 답이 다음 길을 엽니다.</p>
      <ul class="facts">
        <li><b>${esc(SURVEY.minutes)}</b><span>탐사 시간</span></li>
        <li><b>익명</b><span>개인정보 없음</span></li>
        <li><b>3갈래</b><span>답에 따라 갈리는 루트</span></li>
      </ul>
    </div>
    ${expeditionMap()}
    <p class="fine">${esc(SURVEY.aiDefinition)}</p>
    <div class="spacer"></div>
    <div class="footer">
      ${inProgress
        ? `<button class="btn" data-act="resume">원정 이어가기 ${icon('arrow')}</button>
           <button class="btn ghost" data-act="restart">처음부터 다시 출발</button>`
        : `<button class="btn" data-act="start">개척자로 출발하기 ${icon('arrow')}</button>`}
      <p class="fine">${esc(SURVEY.org)} · 응답은 연구 목적으로만 사용됩니다.</p>
    </div>
  </section>`;
}

function renderStageIntro({ st, si, total }) {
  const r = currentRoute();
  const reaction = takeBubble();
  const qn = qsOf(st).length;
  $app.innerHTML = `
  <section class="screen region" style="--c:${st.color}">
    <div class="region-top"><span class="mono">REGION ${String(si + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>${routeBadge()}</div>
    <div class="emblem"><span class="halo"></span>${icon(st.icon)}</div>
    <h2 class="region-name">${esc(st.name)}</h2>
    <p class="region-sub">${esc(st.title)}</p>
    <div class="region-meta mono"><span>${qn}문항</span><span>+${qn * KM_Q + KM_STAGE} km</span></div>
    ${guideSays((reaction ? plain(reaction) + ' ' : '') + stageStory(st.id, S.answers, r || ROUTES.accel), 'center')}
    <div class="spacer"></div>
    <div class="footer">
      <button class="btn" data-act="next">구역에 들어가기 ${icon('arrow')}</button>
      ${si > 0 ? `<button class="btn ghost" data-act="back">이전 문항으로</button>` : `<button class="btn ghost" data-act="home">처음 화면으로</button>`}
    </div>
  </section>`;
}

function hud() {
  const p = progress();
  return `<div class="hud">
    <button class="back" data-act="back" aria-label="이전">${icon('back')}</button>
    <div class="trail-bar" role="progressbar" aria-label="원정 진행률" aria-valuenow="${Math.round(p * 100)}" aria-valuemin="0" aria-valuemax="100">
      <i style="width:${Math.max(3, p * 100)}%"><em></em></i>
    </div>
    <div class="km mono"><b>${S.xp}</b> km</div>
  </div>`;
}

function renderQuestion({ st, q, i, n }) {
  const v = S.answers[q.id];
  const color = q.hidden ? '#ffb547' : st.color;
  const keys = 'ABCDEFGHIJ';
  let body = '', hint = '', actions = '';
  if (q.type === 'single') {
    hint = '하나를 골라 주세요';
    body = `<div class="opts">${q.options.map((o, k) => `
      <button class="opt ${v === o ? 'sel' : ''}" data-act="pick" data-v="${esc(o)}"><span class="k">${keys[k]}</span><span class="t">${esc(o)}</span><span class="tick">${icon('check')}</span></button>`).join('')}</div>`;
  } else if (q.type === 'likert') {
    hint = '얼마나 동의하나요? 높을수록 동의해요';
    body = `<div class="elev">${LIKERT.map((l) => `
      <button class="lv ${Number(v) === l.v ? 'sel' : ''}" data-act="pick" data-v="${l.v}" style="--h:${l.v * 20}%" aria-label="${l.v}점 ${l.label}">
        <span class="col"><span class="bar"></span></span><span class="num mono">${l.v}</span><span class="lb">${l.label}</span></button>`).join('')}</div>`;
  } else if (q.type === 'multi') {
    const arr = Array.isArray(v) ? v : [];
    hint = `최대 ${q.max}개까지 골라 주세요 (${arr.length}/${q.max})`;
    body = `<div class="opts">${q.options.map((o, k) => `
      <button class="opt ${arr.includes(o) ? 'sel' : ''}" data-act="toggle" data-v="${esc(o)}"><span class="k">${keys[k]}</span><span class="t">${esc(o)}</span><span class="tick">${icon('check')}</span></button>`).join('')}</div>`;
    actions = `<button class="btn" data-act="multiNext" ${arr.length ? '' : 'disabled'}>다음 ${icon('arrow')}</button>`;
  } else if (q.type === 'text') {
    hint = '선택 응답이에요. 한두 문장이면 충분해요.';
    body = `<textarea id="ta" maxlength="1000" placeholder="${esc(q.placeholder || '')}">${esc(v || '')}</textarea><div class="count mono"><span id="cnt">${(v || '').length}</span> / 1000</div>`;
    actions = `<button class="btn" data-act="textNext">기록 남기기 ${icon('arrow')}</button><button class="btn ghost" data-act="textSkip">건너뛰기</button>`;
  }
  const reaction = takeBubble();
  $app.innerHTML = `
  <section class="screen" style="--c:${color}">
    ${hud()}
    ${guideSays(reaction)}
    <div class="panel q-card ${q.hidden ? 'hidden-quest' : ''}" data-qid="${q.id}">
      ${q.hidden ? `<div class="hq-banner">${icon('spark')}<span>숨은 지류 발견 · ${esc(q.title)}</span><b class="mono">+${KM_HIDDEN} km</b></div>` : ''}
      <div class="q-meta">
        <span class="chip">${icon(st.icon)}${esc(st.name)}</span>
        <span class="q-count mono">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>
        ${routeBadge()}
      </div>
      <h2 class="q-text">${esc(q.text)}</h2>
      <p class="q-hint">${hint}</p>
      ${body}
      ${actions ? `<div class="q-actions">${actions}</div>` : ''}
    </div>
  </section>`;
  if (q.hidden && !S.seen.includes('hq:' + q.id)) {
    S.seen.push('hq:' + q.id); persist();
    const c = document.querySelector('.hq-banner').getBoundingClientRect();
    burst(c.left + 30, c.top + c.height / 2, 18, ['#ffb547', '#ffe08a', '#ffffff'], 90);
  }
  const ta = document.getElementById('ta');
  if (ta) ta.addEventListener('input', () => {
    S.answers[q.id] = ta.value; persist();
    document.getElementById('cnt').textContent = ta.value.length;
  });
}

function renderClear({ st, last }) {
  const first = !S.rewarded.includes('stage:' + st.id);
  const reaction = takeBubble();
  $app.innerHTML = `
  <section class="screen region cleared" style="--c:${st.color}">
    <div class="region-top"><span class="mono">REGION CHARTED</span></div>
    <div class="flagpole" aria-hidden="true"><span class="pole"></span><span class="cloth">${icon(st.icon)}</span><span class="ground"></span></div>
    <h2 class="clear-title">${esc(st.name)}<br><span class="grad">개척 완료</span></h2>
    <div class="reward mono">+${KM_STAGE} km · 구역 깃발 획득</div>
    ${guideSays(reaction || (last ? '모든 구역을 개척했어요! 당신의 개척자 패스를 발급할게요.' : `${st.name}에 깃발을 꽂았어요. 다음 구역으로 가 볼까요?`), 'center')}
    ${expeditionMap(st.id)}
    <div class="spacer"></div>
    <div class="footer">
      <button class="btn" data-act="next">${last ? '개척자 패스 발급받기' : '다음 길로'} ${icon('arrow')}</button>
      <button class="btn ghost" data-act="back">이전 문항 고치기</button>
    </div>
  </section>`;
  if (first) {
    reward('stage:' + st.id, KM_STAGE, null);
    document.querySelector('.xmap').outerHTML = expeditionMap(st.id); // 깃발 획득을 지도에 반영
    setTimeout(() => centerBurst(last ? 90 : 50, [st.color, '#ffffff', '#3ef0c8', '#8b7bff']), 450);
  }
}

function renderFork(f) {
  const r = f.chosen;
  const rest = r.order.slice(r.order.indexOf(f.after) + 1).map((id) => STAGE_BY_ID[id]);
  const otherIcon = f.other.icon || 'lock';
  $app.innerHTML = `
  <section class="screen fork" style="--rc:${r.color}">
    <div class="region-top"><span class="mono">${esc(f.title)} · CROSSROADS</span></div>
    <h2 class="fork-title">당신의 답이 <span class="grad">길을 골랐어요</span></h2>
    <svg class="fork-map" viewBox="0 0 320 120" aria-hidden="true">
      <defs><linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="#3ef0c8"/><stop offset=".5" stop-color="${r.color}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
      <path class="road-off" d="M160 116 C160 80 240 70 270 22"/>
      <path class="road-on" d="M160 116 C160 80 80 70 50 22" stroke="url(#fg)"/>
      <circle cx="160" cy="116" r="4" class="pin"/>
      <circle cx="50" cy="22" r="6" class="pin-on"/>
      <circle cx="270" cy="22" r="5" class="pin-off"/>
    </svg>
    <div class="paths">
      <div class="path chosen">${icon(r.icon)}<b>${esc(r.name)}</b><small>${esc(r.tagline)}</small><em class="mono">선택된 길</em></div>
      <div class="path closed">${icon(otherIcon)}<b>${esc(f.other.name)}</b><small>${esc(f.other.note || f.other.tagline || '')}</small><em class="mono">닫힌 길</em></div>
    </div>
    ${guideSays(f.reason, 'center')}
    <ol class="next-trail">${rest.map((s) => `<li style="--c:${s.color}">${icon(s.icon)}<span>${esc(s.name)}</span></li>`).join('')}<li style="--c:#ffffff">${icon('finish')}<span>개척자 패스</span></li></ol>
    <div class="spacer"></div>
    <div class="footer">
      <button class="btn" data-act="forkGo">이 길로 출발 ${icon('arrow')}</button>
      <button class="btn ghost" data-act="back">이전 문항 고치기</button>
    </div>
  </section>`;
  if (!S.seen.includes('forkfx:' + f.after)) { S.seen.push('forkfx:' + f.after); persist(); setTimeout(() => burst(innerWidth / 2 - 90, 190, 28, [r.color, '#ffffff', '#3ef0c8'], 120), 900); }
}

function cleanAnswers() {
  const out = {};
  for (const q of allVisibleQs()) {
    const v = S.answers[q.id];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    out[q.id] = q.type === 'likert' ? Number(v) : q.type === 'text' ? String(v).trim().slice(0, 1000) : v;
  }
  return out;
}

async function submit() {
  $app.innerHTML = `<section class="screen region"><div class="spacer"></div><div class="loader"></div><p class="region-sub" style="text-align:center">개척자 패스를 발급하고 있어요…</p><div class="spacer"></div></section>`;
  const durationSec = Math.round((Date.now() - (S.startedAt || Date.now())) / 1000);
  try {
    await saveResponse({
      rid: S.rid,
      version: SURVEY.version,
      route: routeOf(S.answers).id,
      answers: cleanAnswers(),
      durationSec,
      xp: S.xp,
    });
    S.submitted = true; S.durationSec = durationSec; persist();
    renderResult();
    setTimeout(() => centerBurst(110), 300);
  } catch (e) {
    console.error(e);
    $app.innerHTML = `
    <section class="screen region" style="--c:#ff7ac6">
      <div class="emblem"><span class="halo"></span>${icon('compass')}</div>
      <h2 class="region-name">신호가 끊겼어요</h2>
      <p class="region-sub">네트워크를 확인한 뒤 다시 보내 주세요. 응답은 이 기기에 그대로 남아 있어요.</p>
      <div class="spacer"></div>
      <div class="footer"><button class="btn" data-act="retry">다시 보내기</button><button class="btn ghost" data-act="back">응답 고치기</button></div>
    </section>`;
  }
}

function renderResult() {
  const p = pickPersona(S.answers);
  const r = routeOf(S.answers);
  const cleared = stageOrder().filter((s) => S.rewarded.includes('stage:' + s.id));
  const hq = HIDDEN.filter((h) => S.answers[h.id] !== undefined && S.seen.includes('hq:' + h.id)).length;
  const mins = Math.max(1, Math.round((S.durationSec || 0) / 60));
  const no = (S.rid || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase().padEnd(6, '0');
  const d = new Date();
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  $app.innerHTML = `
  <section class="screen result">
    <article class="pass" style="--rc:${r.color}">
      <header class="pass-head mono"><span>FRONTIER PASS</span><span>No. ${no}</span></header>
      <div class="pass-id">
        <div class="emblem small"><span class="halo"></span>${icon(p.icon)}</div>
        <div>
          <div class="pass-label">나의 개척자 유형</div>
          <h2 class="persona">${esc(p.name)}</h2>
          <span class="route-badge" style="--rc:${r.color}">${icon(r.icon)}${esc(r.name)}</span>
        </div>
      </div>
      <p class="persona-desc">${esc(p.desc)}</p>
      <dl class="stats">
        <div><dt>개척 거리</dt><dd class="mono">${S.xp}<small>km</small></dd></div>
        <div><dt>개척한 구역</dt><dd class="mono">${cleared.length}${hq ? `<small>+${hq} 지류</small>` : ''}</dd></div>
        <div><dt>탐사 시간</dt><dd class="mono">${mins}<small>분</small></dd></div>
      </dl>
      <div class="log">
        <div class="log-h mono">EXPEDITION LOG</div>
        <ol>${journey(S.answers, r).map((l, k) => `<li><span class="mono">${String(k + 1).padStart(2, '0')}</span><p>${esc(plain(l.t))}</p></li>`).join('')}</ol>
      </div>
      <footer class="stamps">${cleared.map((s) => `<span class="stamp" style="--c:${s.color}" title="${esc(s.name)}">${icon(s.icon)}</span>`).join('')}${hq ? `<span class="stamp" style="--c:#ffb547" title="숨은 지류">${icon('spark')}</span>` : ''}<span class="issued mono">ISSUED ${date}</span></footer>
    </article>
    <p class="thanks">원정에 함께해 주셔서 고맙습니다. 응답은 익명으로 저장됐어요.<br>동료는 어떤 길로 가게 될까요?</p>
    <div class="spacer"></div>
    <div class="footer">
      <button class="btn" data-act="share">동료를 원정에 초대하기 ${icon('share')}</button>
      ${DEMO ? `<button class="btn ghost" data-act="reset">(체험) 처음부터 다시 하기</button>` : ''}
    </div>
  </section>`;
}

// ───────── 이벤트 ─────────
function markSeen(id) { if (!S.seen.includes(id)) S.seen.push(id); }
function answered(q, el, amount) {
  bubble = reactionFor(q, S.answers[q.id], S.answers);
  reward(q.id, q.hidden ? KM_HIDDEN : amount, el);
  busy = true;
  setTimeout(() => { busy = false; next(); }, 380);
}

$app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || busy) return;
  const act = b.dataset.act;
  const cur = screens().find((s) => s.key === S.pos);

  switch (act) {
    case 'start':
    case 'restart':
      S = fresh(); S.startedAt = Date.now(); go(screens()[0].key); break;
    case 'resume': go(S.pos || screens()[0].key); break;
    case 'home': go(null); break;
    case 'next': next(); break;
    case 'back': back(); break;
    case 'forkGo': markSeen('fork'); next(); break;
    case 'retry': submit(); break;
    case 'reset':
      try { localStorage.removeItem(STORE); } catch {}
      S = fresh(); render(); break;
    case 'pick': {
      const q = cur.q;
      S.answers[q.id] = q.type === 'likert' ? Number(b.dataset.v) : b.dataset.v;
      persist();
      b.parentElement.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      answered(q, b, KM_Q);
      break;
    }
    case 'toggle': {
      const q = cur.q;
      const arr = Array.isArray(S.answers[q.id]) ? [...S.answers[q.id]] : [];
      const v = b.dataset.v;
      const at = arr.indexOf(v);
      if (at >= 0) arr.splice(at, 1);
      else { if (arr.length >= q.max) arr.shift(); arr.push(v); }
      S.answers[q.id] = arr; persist();
      b.parentElement.querySelectorAll('.opt').forEach((o) => o.classList.toggle('sel', arr.includes(o.dataset.v)));
      document.querySelector('.q-hint').textContent = `최대 ${q.max}개까지 골라 주세요 (${arr.length}/${q.max})`;
      document.querySelector('[data-act=multiNext]').disabled = !arr.length;
      break;
    }
    case 'multiNext': answered(cur.q, b, KM_Q); break;
    case 'textNext': {
      markSeen(cur.q.id);
      if ((S.answers[cur.q.id] || '').trim()) answered(cur.q, b, KM_TEXT);
      else { persist(); next(); }
      break;
    }
    case 'textSkip':
      markSeen(cur.q.id); delete S.answers[cur.q.id]; persist(); next(); break;
    case 'share': {
      const data = { title: SURVEY.name, text: '답에 따라 길이 갈리는 2~3분짜리 AI 시대 개척자 원정. 당신은 어떤 길로 가게 될까요?', url: location.origin + location.pathname };
      try { if (navigator.share) { await navigator.share(data); break; } } catch (err) { if (err?.name === 'AbortError') break; }
      try { await navigator.clipboard.writeText(data.url); b.innerHTML = '링크를 복사했어요 ' + icon('check'); }
      catch { b.textContent = '이 페이지 링크를 동료에게 보내 주세요'; }
      break;
    }
  }
});

render();
