/* =====================================================================
   苏考图谱 · 页面渲染逻辑 (js/main.js)
   ---------------------------------------------------------------------
   从 data-math.js / data-chinese.js / data-english.js 读取数据，
   实时计算频次、难度、优先级统计，并根据 <body data-page="..."> 渲染页面。
   往数据文件里添加真题后，全站所有统计、排行、题型树、搜索、联想自动更新。
   v5：数字滚动 / 滚动渐入 / 条形生长 / 环形图 / 搜索联想 / 步骤时间线。
   ===================================================================== */

/* ---------- 科目注册表 ---------- */
const SUBJECT_DATA = { math: DATA_MATH, chinese: DATA_CHINESE, english: DATA_ENGLISH };
const SUBJECT_META = [
  { id: "math",    name: "数学", page: "math.html" },
  { id: "chinese", name: "语文", page: "chinese.html" },
  { id: "english", name: "英语", page: "english.html" }
];

/* 跨科目合并索引（题目 id 全站唯一） */
const ALL_PAPERS = [], ALL_TOPICS = [], ALL_QUESTIONS = [];
Object.values(SUBJECT_DATA).forEach(d => {
  d.papers.forEach(p => ALL_PAPERS.push({ ...p, subject: d.id }));
  d.topics.forEach(t => ALL_TOPICS.push({ ...t, subject: d.id }));
  d.questions.forEach(q => ALL_QUESTIONS.push({ ...q, subject: d.id }));
});

/* ---------- 小工具 ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const DIFF_LABEL = { 1: "易", 2: "较易", 3: "中等", 4: "较难", 5: "难" };
const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =====================================================================
   练习记忆（localStorage）—— 纯前端、零后端，双击 index.html 也能用。
   只存题号，不存任何个人信息；换浏览器或清缓存会丢，这一点在页面上说清楚。
   ===================================================================== */
const DONE_KEY = "sukao.done.v1";
function doneSet() {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); }
  catch (e) { return new Set(); }                 /* 隐私模式/禁用 storage 时静默降级 */
}
function doneSave(set) {
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...set])); } catch (e) {}
}
function isDone(id) { return doneSet().has(id); }
function toggleDone(id) {
  const s = doneSet();
  s.has(id) ? s.delete(id) : s.add(id);
  doneSave(s);
  return s.has(id);
}
/* 某一组题目的完成进度 */
function doneStat(ids) {
  const s = doneSet();
  const n = ids.filter(id => s.has(id)).length;
  return { n, total: ids.length, pct: ids.length ? Math.round(n / ids.length * 100) : 0 };
}

/* HTML 转义：凡是「不是我们自己写的 HTML」（URL 参数、将来的用户上传内容）
   拼进 innerHTML 之前必须过这一道，否则会被注入脚本。 */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function paperOf(q)       { return ALL_PAPERS.find(p => p.id === q.paperId); }
function topicOf(id)      { return ALL_TOPICS.find(t => t.id === id); }
function questionById(id) { return ALL_QUESTIONS.find(q => q.id === id); }
function subjectName(id)  { return (SUBJECT_META.find(s => s.id === id) || {}).name || ""; }
function qTitle(q)        { return q.title || q.type; }

function currentSubjectId() {
  const fromUrl = new URLSearchParams(location.search).get("subject");
  const id = fromUrl || document.body.dataset.subject || "math";
  return SUBJECT_DATA[id] ? id : "math";
}

/* 语文/英语板块条目没有 difficulty，兜底给"中等"——否则 undefined 会一路落到 "hard"，
   把所有语文板块显示成"难" */
function diffBand(d) { return typeof d !== "number" ? "medium" : d <= 2 ? "easy" : d === 3 ? "medium" : "hard"; }
function diffBadge(d) { return `<span class="badge badge-${diffBand(d)}">${DIFF_LABEL[d]}</span>`; }
function priBadgeShort(p) {
  const cls = p === "高" ? "hi" : p === "中" ? "mid" : "low";
  return `<span class="badge badge-${cls}">${p}</span>`;
}
function paperBadge(p) {
  return p.type === "真题"
    ? `<span class="badge badge-paper">真题</span>`
    : `<span class="badge badge-mock">模拟</span>`;
}

/* =====================================================================
   动效引擎：滚动渐入 / 数字滚动 / 条形生长
   ===================================================================== */
const _io = ("IntersectionObserver" in window)
  ? new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        _io.unobserve(el);
        if (el.classList.contains("reveal")) el.classList.add("in");
        if (el.dataset.count !== undefined) runCount(el);
        if (el.dataset.growBox !== undefined) growBars(el);
      });
    }, { threshold: .15, rootMargin: "0px 0px -30px 0px" })
  : null;

function observe(el) {
  if (!_io || REDUCED) {  /* 无观察器或用户减弱动效：直接终态 */
    if (el.classList && el.classList.contains("reveal")) el.classList.add("in");
    if (el.dataset && el.dataset.count !== undefined) { el.textContent = fmtNum(+el.dataset.count); }
    if (el.dataset && el.dataset.growBox !== undefined) growBars(el, true);
    return;
  }
  _io.observe(el);
}
function scanFx(root = document) {
  $$(".reveal:not(.in)", root).forEach(observe);
  $$("[data-count]", root).forEach(observe);
  $$("[data-grow-box]", root).forEach(observe);
}

function fmtNum(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }

/* 数字滚动：<span data-count="87">0</span>，支持 data-suffix */
function runCount(el) {
  const target = parseFloat(el.dataset.count);
  const dec = (el.dataset.count.split(".")[1] || "").length;
  const dur = 950, t0 = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = dec ? target.toFixed(dec) : String(target);
  };
  requestAnimationFrame(tick);
}

/* 条形生长：容器带 data-grow-box，内部 .bar-fill / .dist>div 带 data-w="63" */
function growBars(box, instant) {
  $$("[data-w]", box).forEach((b, i) => {
    const w = b.dataset.w + "%";
    if (instant) { b.style.width = w; return; }
    setTimeout(() => { b.style.width = w; }, 60 + i * 55);
  });
  /* 环形图弧线 */
  $$(".arc[data-len]", box).forEach((a, i) => {
    const len = +a.dataset.len, gap = 1.6;
    const fin = `${Math.max(len - gap, 0)} ${100 - len + gap}`;
    if (instant) { a.setAttribute("stroke-dasharray", fin); return; }
    a.style.transitionDelay = (i * .09) + "s";
    setTimeout(() => a.setAttribute("stroke-dasharray", fin), 80);
  });
}

/* =====================================================================
   搜索联想（Google 式下拉，全站输入框通用）
   ===================================================================== */
let SG_INDEX = null;
function buildSuggestIndex() {
  if (SG_INDEX) return SG_INDEX;
  const types = {}, methods = {};
  ALL_QUESTIONS.forEach(q => {
    (types[q.type] = types[q.type] || { n: 0, sub: q.subTopic, topic: q.topic }).n++;
    if (q.method) q.method.split("+").concat([q.method]).forEach(m => {
      m = m.trim(); if (!m) return;
      (methods[m] = methods[m] || { n: 0 }).n++;
    });
  });
  const list = [];
  Object.entries(types).forEach(([name, o]) => {
    const t = topicOf(o.topic);
    list.push({ kind: "题型", text: name, meta: `${o.n} 题`, n: o.n * 3, url: "search.html?q=" + encodeURIComponent(name) });
  });
  Object.entries(methods).forEach(([name, o]) => {
    if (o.n < 1 || name.length < 2) return;
    list.push({ kind: "方法", text: name, meta: `${o.n} 次`, n: o.n * 2, url: "search.html?q=" + encodeURIComponent(name) });
  });
  ALL_TOPICS.forEach(t => {
    const n = SUBJECT_DATA[t.subject].questions.filter(q => q.topic === t.id).length;
    /* 英语走频率统计（无逐题条目），考点直接指到英语板块页 */
    if (t.subject === "english") {
      list.push({ kind: "考点", text: t.name, meta: "频率统计", n: 1, url: "english.html" });
      return;
    }
    list.push({ kind: "考点", text: t.name, meta: n ? `${n} 题` : "整理中", n: n * 2 + 1, url: "search.html?topic=" + t.id });
    t.subTopics.forEach(s => {
      const sn = SUBJECT_DATA[t.subject].questions.filter(q => q.subTopic === s).length;
      if (sn) list.push({ kind: "考点", text: s, meta: `${sn} 题`, n: sn * 2, url: `search.html?sub=${encodeURIComponent(s)}&subject=${t.subject}` });
    });
  });
  ALL_QUESTIONS.forEach(q => {
    const p = paperOf(q);
    list.push({ kind: "题目", text: qTitle(q), meta: `${p.year}·第${q.number}题`, n: 1, url: "question.html?id=" + q.id, extra: (q.method || "") + " " + q.type });
  });
  SG_INDEX = list;
  return list;
}

function suggestFor(kw) {
  const idx = buildSuggestIndex();
  kw = kw.trim().toLowerCase();
  if (!kw) {  /* 空输入：热门搜索（考得最多的题型和方法） */
    return idx.filter(it => it.kind === "题型").sort((a, b) => b.n - a.n).slice(0, 5)
      .concat(idx.filter(it => it.kind === "方法").sort((a, b) => b.n - a.n).slice(0, 3));
  }
  const scored = [];
  idx.forEach(it => {
    const hay = (it.text + " " + (it.extra || "")).toLowerCase();
    let s = -1;
    if (it.text.toLowerCase().startsWith(kw)) s = 300;
    else if (it.text.toLowerCase().includes(kw)) s = 200;
    else if (hay.includes(kw)) s = 100;
    if (s < 0) return;
    scored.push({ it, s: s + Math.min(it.n, 40) });
  });
  scored.sort((a, b) => b.s - a.s);
  /* 每类最多 4 条、总共 8 条 */
  const out = [], per = {};
  for (const { it } of scored) {
    if ((per[it.kind] || 0) >= 4) continue;
    per[it.kind] = (per[it.kind] || 0) + 1;
    out.push(it);
    if (out.length >= 8) break;
  }
  return out;
}

function markKw(text, kw) {
  if (!kw) return text;
  const i = text.toLowerCase().indexOf(kw.toLowerCase());
  if (i < 0) return text;
  return text.slice(0, i) + "<b>" + text.slice(i, i + kw.length) + "</b>" + text.slice(i + kw.length);
}

function attachSuggest(input) {
  const wrap = input.closest("form") || input.parentElement;
  if (!wrap || wrap.querySelector(".sg-box")) return;
  wrap.style.position = wrap.style.position || "relative";
  const box = document.createElement("div");
  box.className = "sg-box";
  wrap.appendChild(box);
  let items = [], active = -1;

  const close = () => { box.classList.remove("open"); active = -1; };
  const render = kw => {
    items = suggestFor(kw);
    if (!items.length) { box.innerHTML = `<div class="sg-empty">没有匹配，回车直接全文搜索</div>`; box.classList.add("open"); return; }
    const title = kw.trim() ? "" : `<div class="sg-title">🔥 大家都在搜</div>`;
    box.innerHTML = title + items.map((it, i) => `
      <div class="sg-item${i === active ? " on" : ""}" data-kind="${it.kind}" data-i="${i}">
        <span class="sg-k">${it.kind}</span>
        <span class="sg-main">${markKw(it.text, kw.trim())}</span>
        <span class="sg-meta">${it.meta}</span>
      </div>`).join("")
      + `<div class="sg-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 直达</span><span><kbd>Esc</kbd> 关闭</span></div>`;
    box.classList.add("open");
    $$(".sg-item", box).forEach(el => {
      el.addEventListener("mousedown", e => { e.preventDefault(); location.href = items[+el.dataset.i].url; });
      el.addEventListener("mouseenter", () => { active = +el.dataset.i; paint(); });
    });
  };
  const paint = () => $$(".sg-item", box).forEach(el => el.classList.toggle("on", +el.dataset.i === active));

  input.setAttribute("autocomplete", "off");
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("blur", () => setTimeout(close, 140));
  input.addEventListener("keydown", e => {
    if (!box.classList.contains("open")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; paint(); }
    else if (e.key === "Enter" && active >= 0 && items[active]) { e.preventDefault(); location.href = items[active].url; }
    else if (e.key === "Escape") close();
  });
}

/* =====================================================================
   统计计算
   ===================================================================== */
function computeTopicStats(subId) {
  const data = SUBJECT_DATA[subId];
  const totalScore = data.questions.reduce((s, q) => s + q.score, 0);
  return data.topics.map(t => {
    const qs = data.questions.filter(q => q.topic === t.id);
    const count = qs.length;
    const score = qs.reduce((s, q) => s + q.score, 0);
    const avgDiff = count ? qs.reduce((s, q) => s + q.difficulty, 0) / count : 0;
    const dist = { easy: 0, medium: 0, hard: 0 };
    qs.forEach(q => dist[diffBand(q.difficulty)]++);
    return { topic: t, count, score, scoreShare: totalScore ? (score / totalScore * 100) : 0, avgDiff, dist, questions: qs };
  });
}

/* ---------- 通用渲染片段 ---------- */
function barRowHTML(label, value, max, extra) {
  const w = max ? Math.round(value / max * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill" data-w="${w}"></div></div>
    <div class="bar-num">${extra}</div>
  </div>`;
}

function distHTML(dist) {
  const total = dist.easy + dist.medium + dist.hard || 1;
  const p = k => (dist[k] / total * 100).toFixed(1);
  return `<div class="dist">
    <div class="d-easy" data-w="${p("easy")}"></div>
    <div class="d-mid"  data-w="${p("medium")}"></div>
    <div class="d-hard" data-w="${p("hard")}"></div>
  </div>
  <div class="dist-legend">
    <span><span class="dot" style="background:var(--easy)"></span>易 ${dist.easy}</span>
    <span><span class="dot" style="background:var(--medium)"></span>中 ${dist.medium}</span>
    <span><span class="dot" style="background:var(--hard)"></span>难 ${dist.hard}</span>
  </div>`;
}

/* 环形图（SVG，弧线扫入动画；色板经色觉安全校验，顺序固定） */
const SERIES = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"];
const S_OTHER = "#A8B0C2";
function donutHTML(items, centerN, centerL) {
  /* 最多 6 片 + 其他（保证相邻色可分辨） */
  items = [...items].sort((a, b) => b.value - a.value);
  let main = items, other = 0;
  if (items.length > 7) { main = items.slice(0, 6); other = items.slice(6).reduce((s, i) => s + i.value, 0); }
  const slices = other ? [...main, { label: "其他", value: other }] : main;
  const total = slices.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  const R = 62, C = 95;
  const circles = slices.map((it, i) => {
    const len = it.value / total * 100;
    const color = it.label === "其他" ? S_OTHER : SERIES[i % SERIES.length];
    const off = 25 - acc; acc += len;
    return `<circle class="arc" r="${R}" cx="${C}" cy="${C}" pathLength="100" stroke="${color}"
      stroke-dasharray="0 100" stroke-dashoffset="${off.toFixed(3)}" data-len="${len.toFixed(3)}">
      <title>${it.label}：${it.value}（${(len).toFixed(1)}%）</title></circle>`;
  }).join("");
  const legend = slices.map((it, i) => `<div class="pie-leg-row">
      <span class="dot" style="background:${it.label === "其他" ? S_OTHER : SERIES[i % SERIES.length]}"></span>
      ${it.label}<small>${(it.value / total * 100).toFixed(1)}%</small><b>${it.value}${it.unit || ""}</b>
    </div>`).join("");
  return `<div class="donut-wrap" data-grow-box>
    <svg class="donut-svg" viewBox="0 0 190 190">
      <circle r="${R}" cx="${C}" cy="${C}" fill="none" stroke="var(--low-soft)" stroke-width="30"></circle>
      ${circles}
      <text class="donut-center-n" x="${C}" y="${C + 2}">${centerN}</text>
      <text class="donut-center-l" x="${C}" y="${C + 20}">${centerL}</text>
    </svg>
    <div class="donut-legend">${legend}</div>
  </div>`;
}

function subjectTabsHTML(current, page) {
  return SUBJECT_META.map(m => {
    const beta = SUBJECT_DATA[m.id].status === "beta" ? `<span class="beta-dot">◐</span>` : "";
    return `<a class="${m.id === current ? "on" : ""}" href="${page}?subject=${m.id}">${m.name}${beta}</a>`;
  }).join("");
}

/* 内联题目卡（题型树、搜索结果共用） */
function qCardHTML(q, opts = {}) {
  const p = paperOf(q);
  const subj = opts.showSubject ? `<span class="badge badge-low">${subjectName(q.subject)}</span> ` : "";
  return `<div class="q-card">
    <div class="q-card-top">
      <span class="q-card-src">${subj}${p.year} ${p.type} · ${q.label || `第${q.number}题`} · ${q.section} ${q.score}分</span>
      ${q.difficulty ? diffBadge(q.difficulty) : ""}
    </div>
    <div class="q-card-title">${qTitle(q)}</div>
    <div class="q-card-tags">
      <span class="chip">${q.type}</span>
      ${q.method ? `<span class="chip method-chip">🔧 ${q.method}</span>` : ""}
      ${(q.tags || []).map(t => `<span class="chip">${t}</span>`).join("")}
    </div>
    ${q.note ? `<div class="q-card-note">💡 ${q.note}</div>` : ""}
    <a class="q-card-more" href="question.html?id=${q.id}">${q.parts ? "看题目 + 答案 + 怎么答 →" : q.solution ? "看题目 + 分步解析 →" : "看分类与相似题 →"}</a>
  </div>`;
}

function questionTableHTML(qs) {
  /* 语言学科（语文/英语）按板块条目展示：无难度/方法列，label 为卷面题号 */
  if (qs.length && qs[0].label) {
    const rows = qs.map(q => `
      <tr class="clickable" data-id="${q.id}">
        <td><b>${q.label}</b></td>
        <td>${q.section}</td>
        <td>${q.score}分</td>
        <td>${q.title}</td>
        <td>${priBadgeShort(topicOf(q.topic).priority)}</td>
      </tr>`).join("");
    return `<div class="table-wrap"><table>
      <thead><tr>
        <th>题号</th><th>板块</th><th>分值</th><th>本卷内容</th><th>优先级</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }
  const rows = qs.map(q => `
    <tr class="clickable" data-id="${q.id}">
      <td><b>第${q.number}题</b></td>
      <td>${q.section}</td>
      <td>${q.score}分</td>
      <td>${topicOf(q.topic).name}</td>
      <td>${q.type}</td>
      <td>${q.method || "—"}</td>
      <td>${diffBadge(q.difficulty)}</td>
      <td>${priBadgeShort(q.priority)}</td>
    </tr>`).join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>题号</th><th>位置</th><th>分值</th><th>主专题</th>
      <th>题型</th><th>解题方法</th><th>难度</th><th>优先级</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function bindRowClicks(root = document) {
  $$("tr.clickable", root).forEach(tr => {
    const go = () => { location.href = "question.html?id=" + tr.dataset.id; };
    tr.setAttribute("tabindex", "0");
    tr.setAttribute("role", "link");
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); go(); }
    });
  });
}

function openRow(row) {
  const children = row.nextElementSibling;
  if (!children) return;
  row.classList.add("open");
  if (children.classList.contains("hidden")) {
    children.classList.remove("hidden");
    children.classList.add("anim");
    growBars(children, REDUCED);
    setTimeout(() => children.classList.remove("anim"), 400);
  }
}
function bindTreeToggles(root) {
  $$("[data-toggle]", root).forEach(row => {
    /* 折叠行本身是 div，不加这几个属性的话键盘完全 Tab 不到、读屏也念不出状态 */
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    const kids = row.nextElementSibling;
    row.setAttribute("aria-expanded", String(!!kids && !kids.classList.contains("hidden")));
    row.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); row.click(); }
    });
    row.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const children = row.nextElementSibling;
      const willOpen = children && children.classList.contains("hidden");
      row.classList.toggle("open");
      row.setAttribute("aria-expanded", String(willOpen));
      if (children) {
        children.classList.toggle("hidden");
        if (willOpen) {
          children.classList.add("anim");
          growBars(children, REDUCED);
          setTimeout(() => children.classList.remove("anim"), 400);
        }
      }
    });
  });
}

/* 锚点 #y2026：精准定位并自动展开该年整行 */
function openFromHash(root) {
  const id = (location.hash || "").replace("#", "");
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const row = target.matches("[data-toggle]") ? target : $("[data-toggle]", target);
  if (row) openRow(row);
  setTimeout(() => target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" }), 120);
}

/* =====================================================================
   各页面渲染
   ===================================================================== */

/* ---------- 首页 ---------- */
function renderHome() {
  const M = SUBJECT_DATA.math, C = SUBJECT_DATA.chinese, E = SUBJECT_DATA.english;
  const types = new Set(M.questions.map(q => q.type)).size;

  const set = (id, v) => { const el = $(id); if (el) { el.dataset.count = v; el.textContent = "0"; } };
  set("#hs-papers", M.papers.length + C.papers.length + E.papers.length);  /* 全站真题总数 */
  set("#hs-questions", M.questions.length);                   /* 数学题 */
  set("#hs-types", types);                                    /* 数学题型 */
  set("#hs-dict", (C.knowledge && C.knowledge.dictation || []).length);  /* 语文默写篇目 */
  set("#hs-essay", (C.knowledge && C.knowledge.essays || []).length);    /* 语文作文题库（若页面保留该位） */
  set("#hs-words", (E.stats && E.stats.words || []).length);  /* 英语高频难词 */

  const cm = $("#cnt-math");
  if (cm) cm.textContent = M.questions.length;
  const cc = $("#cnt-chinese");
  if (cc) cc.textContent = C.papers.length;
}

/* ---------- 科目页分发 ---------- */
function renderSubject() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  if (data.status === "beta") { renderBeta(subId); return; }
  if (data.stats) { renderEnglishPage(data); return; }       /* 英语：频率统计页 */
  if (data.knowledge) { renderChinesePage(data); return; }   /* 语文：背诵频率页 */
  const total = data.questions.length;

  const full = data.papers.filter(p => p.status === "已拆解").length;
  const typeCounts = {};
  data.questions.forEach(q => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  const setC = (sel, v) => { const el = $(sel); if (el) { el.dataset.count = v; el.textContent = "0"; } };
  setC("#s-questions", total);
  setC("#s-papers", data.papers.length);
  setC("#s-types", Object.keys(typeCounts).length);
  if ($("#s-top")) $("#s-top").textContent = topType ? topType[0] : "—";

  const line = $("#subject-stat-line");
  if (line) line.textContent = `已收录 ${data.papers.length} 套新高考Ⅰ卷（${full} 套完整拆解）· ${total} 道题全部标注题型和解法，点开任意题型直接看题。`;

  /* 优先拿分板块（考得多 + 拿得稳） */
  const priBox = $("#priority-chips");
  if (priBox) {
    const stats = computeTopicStats(subId);
    priBox.innerHTML = `<div class="pri-grid">` + stats
      .filter(s => s.topic.priority === "高" && s.count)
      .sort((a, b) => b.score - a.score)
      .map(s => `<a class="pri-card" href="search.html?topic=${s.topic.id}" title="${s.topic.advice}">
        <b>${s.topic.name}</b>
        <small>${s.count} 题 · 占分 ${s.scoreShare.toFixed(0)}% · 平均难度 ${s.avgDiff.toFixed(1)}</small>
      </a>`).join("") + `</div>`;
  }

  drawTypeRank(subId);
  drawTree(subId);
  scanFx();
}

/* ---------- 英语主页：频率统计（词/短语/动词/语法考点/阅读题型）+ 写作模板 ---------- */
function enRankRow(name, sub, n, max, unit) {
  return `<div class="rank-row">
      <div class="rank-main"><div class="rank-name">${name}</div>${sub ? `<div class="rank-path">${sub}</div>` : ""}</div>
      <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(n / max * 100)}"></div></div>
      <span class="rank-count">${n}${unit}</span>
    </div>`;
}
/* 词条行：单词 + 词性 + 中文释义 + 频次条。裸单词对基础差的学生没用，必须带释义 */
function enWordRow(w, d, n, max) {
  const meaning = d && d.cn ? `<span class="ew-cn">${d.pos ? `<i>${d.pos}</i>` : ""}${d.cn}</span>` : "";
  const tip = d && d.tip ? `<div class="ew-tip">${d.tip}</div>` : "";
  return `<div class="rank-row ew-row">
      <div class="rank-main"><div class="rank-name"><span class="en-word">${w}</span>${meaning}</div>${tip}</div>
      <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(n / max * 100)}"></div></div>
      <span class="rank-count">${n} 次</span>
    </div>`;
}
/* 长列表统一折叠：一屏塞不下的东西一律收起来，默认只展开第一组 */
function foldHTML(title, desc, inner, open) {
  return `<details class="rc-item fold-item reveal"${open ? " open" : ""}>
    <summary><b>${title}</b><span class="rc-meta">${desc}</span></summary>
    <div class="rc-body"><div data-grow-box>${inner}</div></div>
  </details>`;
}
/* 按频次把词表切成几段，每段一个折叠组——一次只面对十几个词，不是一百个 */
function bandFolds(rows, bands, render) {
  return bands.map((b, i) => {
    const list = rows.filter(x => x.n >= b.min && x.n <= b.max);
    if (!list.length) return "";
    const max = list[0].n;
    return foldHTML(b.title, `${list.length} 个 · ${b.hint}`, list.map(x => render(x, max)).join(""), i === 0);
  }).join("");
}

function renderEnglishPage(data) {
  const st = $("#en-structure");
  if (st) st.innerHTML = structureRowsHTML(data.topics);
  scanFx();
}

/* 卷面结构行（语文/英语共用，原先是两段逐字相同的代码） */
function structureRowsHTML(topics) {
  return topics.map(t => `
      <div class="cn-row">
        <span class="pos">${t.sections[0] || ""}</span>
        <b>${t.name}</b>
        <small>${t.advice.split("：")[0].split("；")[0]}</small>
        ${priBadgeShort(t.priority)}
      </div>`).join("");
}

/* ---------- 英语子页：高频词汇 / 额外练习 / 写作技巧 / 语法考点 ---------- */
function renderEnSub() {
  const data = SUBJECT_DATA.english, S = data.stats, G = data.glossary || {}, W = data.writingGuide;
  const sec = document.body.dataset.sec;
  const box = $("#en-sub-main");
  if (!box) return;
  const def = w => G[String(w).toLowerCase()] || null;

  if (sec === "words") {
    const wordFolds = bandFolds(S.words,
      [{ min: 10, max: 999, title: "考了 10 次以上", hint: "五年反复出现，必须会" },
       { min: 6, max: 9, title: "考了 6–9 次", hint: "高频，优先背" },
       { min: 3, max: 5, title: "考了 3–5 次", hint: "常客，背完上面就背这批" }],
      (x, max) => enWordRow(x.w, x, x.n, max));
    const phraseFold = (() => {
      const max = S.phrases[0] ? S.phrases[0].n : 1;
      return foldHTML("🔗 高频短语", `${S.phrases.length} 个 · 写作直接能用`,
        S.phrases.map(x => enWordRow(x.p, def(x.p), x.n, max)).join(""), false);
    })();
    const verbFold = (() => {
      const max = S.verbs[0] ? S.verbs[0].n : 1;
      return foldHTML("⚙️ 高频动词", `${S.verbs.length} 个 · 写作换掉 do/make/get`,
        S.verbs.map(x => enWordRow(x.w, def(x.w), x.n, max)).join(""), false);
    })();
    box.innerHTML = `<div class="notice reveal" style="margin-bottom:16px">
        这些词全部来自五套真题原文——<b>不是背词表，是背卷子里真考过的</b>。每个词都带释义，点开分组看，先背次数多的。</div>`
      + `<div class="section-head reveal" style="margin-bottom:10px"><h2 class="section-title" style="font-size:19px">📚 高频难词</h2>
         <p class="section-desc">共 ${S.words.length} 个，按出现次数分三档。</p></div>`
      + wordFolds + phraseFold + verbFold
      + `<div class="card reveal" style="margin-top:22px">
          <h3 style="font-size:16px;margin-bottom:6px">🚀 背完了？还有进阶的</h3>
          <p style="font-size:14px;color:var(--ink-2);line-height:1.9;margin-bottom:12px">
            真题里只出现过 1–2 次的难词还有 ${S.rareWords.length} 个、难词组 ${S.rarePhrases.length} 个。
            出现频率越低往往越难——主线背完再来，背下来就是赢在起跑线。</p>
          <a class="btn btn-brand" href="english-extra.html">去额外练习 →</a></div>`;
  }

  if (sec === "extra") {
    /* 这页词量大（200+），全部默认收起：点开哪组看哪组，别一进来就是十屏 */
    const bands = [{ min: 2, max: 2, title: "考过 2 次", hint: "比 1 次的更值得先背" },
                   { min: 1, max: 1, title: "考过 1 次", hint: "生僻但真考过，认识就是赚到" }];
    const wf = bands.map(bd => {
      const list = S.rareWords.filter(x => x.n >= bd.min && x.n <= bd.max);
      if (!list.length) return "";
      const max = list[0].n;
      return foldHTML(bd.title, `${list.length} 个 · ${bd.hint}`, list.map(x => enWordRow(x.w, x, x.n, max)).join(""), false);
    }).join("");
    const maxP = S.rarePhrases[0] ? S.rarePhrases[0].n : 1;
    const pf = foldHTML("🔗 难词组", `${S.rarePhrases.length} 个 · 只考过 1–2 次的搭配`,
      S.rarePhrases.map(x => enWordRow(x.p, def(x.p), x.n, maxP)).join(""), false);
    box.innerHTML = `<div class="notice reveal" style="margin-bottom:16px">
        ⚠️ <b>这页是进阶内容，不是主线。</b>先把<a href="english-words.html">高频词汇</a>背完再来——
        那边的词考得多、性价比高；这边的词考得少但更难，属于「别人不会你会」的部分。</div>` + wf + pf;
  }

  if (sec === "grammar") {
    const max = S.grammar[0] ? S.grammar[0].n : 1;
    const rows = S.grammar.map(x =>
      enRankRow(x.point, `${x.years.join("/")} 年考过 · 如 ${x.examples.join("、")}`, x.n, max, " 题")).join("");
    const maxR = S.reading[0] ? S.reading[0].n : 1;
    const rRows = S.reading.map(x => enRankRow(x.type, `${x.years.join("/")} 年出现`, x.n, maxR, " 题")).join("");
    box.innerHTML = `<div class="card reveal" style="margin-bottom:18px">
        <h3 style="font-size:16px;margin-bottom:6px">🧩 语法填空考什么</h3>
        <p style="font-size:13px;color:var(--ink-3);margin-bottom:12px">五年共 ${S.grammarTotal} 个空，官方解析逐题标了「考查什么」——练语法先练前三行。</p>
        <div data-grow-box>${rows}</div></div>
      <div class="card reveal">
        <h3 style="font-size:16px;margin-bottom:6px">📖 阅读考什么题型</h3>
        <p style="font-size:13px;color:var(--ink-3);margin-bottom:12px">官方解析给 ${S.readingTotal} 道阅读题标了题型——细节理解和推理判断占绝对大头，先练「题干定位 + 同义替换」这一件事。</p>
        <div data-grow-box>${rRows}</div></div>
      <p style="margin-top:20px"><a class="btn btn-brand" href="years.html?subject=english">去看真题里怎么考 →</a></p>`;
  }

  if (sec === "writing" && W) {
    const stepHTML = st => `<div class="sol-step">
        <b class="g-name">${st.name}</b>
        <div class="g-how">${st.how}</div>
        <div class="g-demo">✍️ ${st.demo}</div>
      </div>`;
    const genres = W.genres.map((g, i) => `
      <details class="rc-item genre-item reveal"${i === 0 ? " open" : ""}>
        <summary><span class="chip chip-cat">${g.tag}</span><b>${g.name}</b><span class="rc-meta">${g.when}</span></summary>
        <div class="rc-body">
          <p class="guide-intro">${g.intro}</p>
          <div class="steps">${g.steps.map(stepHTML).join("")}</div>
          ${g.bank ? `<div class="g-bridge"><b>🧰 万能句型</b><p>${g.bank.join("<br>")}</p></div>` : ""}
          ${g.rules ? `<div class="sol-takeaway" style="margin-top:14px"><b>🗝️ 铁律：</b>${g.rules.join("　")}</div>` : ""}
        </div>
      </details>`).join("");
    const tasks = foldHTML("🗂 五年写作真题一览", `${W.tasks.length} 年 · 看看都考过什么情境`,
      W.tasks.map(t => `<div class="cn-row"><span class="pos">${t.year}</span><small style="flex:1">${t.task}</small></div>`).join(""), false);
    box.innerHTML = `<div class="notice reveal" style="margin-bottom:16px">${W.examNote}</div>` + genres + tasks;
  }
  scanFx();
}

/* ---------- 语文主页（瘦身版：入口 + 卷面结构一览） ---------- */
function renderChinesePage(data) {
  const box = $("#cn-structure");
  if (box) box.innerHTML = structureRowsHTML(data.topics);
  scanFx();
}

/* 古文读本排版：把 PDF 提取文本按「材料头 / 正文段 / 出处行 / 注释行」分块重排
   （提取文本以换行为界；正文行直接拼接还原成流动段落，衬线大字宽行距在 CSS） */
function fmtClassicalHTML(text, mode) {
  const lines = String(text || "").split(/\n+/).map(s => s.trim()).filter(Boolean);
  let out = "", buf = [];
  const flush = () => { if (buf.length) { out += `<p>${buf.join("")}</p>`; buf = []; } };
  lines.forEach((ln, i) => {
    if (/^材料[一二三四五六七八九十][：:]?$/.test(ln)) { flush(); out += `<div class="cn-mat">${ln.replace(/[：:]$/, "")}</div>`; return; }
    if (/^（(节选自|摘编自|选自|改编自)[^）]*）$/.test(ln)) { flush(); out += `<div class="cn-cite">${ln}</div>`; return; }
    if (/^[【\[]注[】\]]/.test(ln)) { flush(); out += `<div class="cn-note-line">${ln}</div>`; return; }
    if (mode === "poem") {
      if (i === 0) { out += `<div class="cn-poem-title">${ln}</div>`; return; }
      if (i === 1 && ln.length <= 6) { out += `<div class="cn-poem-author">${ln}</div>`; return; }
      out += `<div class="cn-verse">${ln}</div>`; return;
    }
    buf.push(ln);
  });
  flush();
  return out;
}

/* ---------- 语文子页面：必背默写 / 作文专区 / 文言诗歌 ---------- */
function renderCnSub() {
  const data = SUBJECT_DATA.chinese, K = data.knowledge, G = data.essayGuide;
  const sec = document.body.dataset.sec;
  const box = $("#cn-sub-main");
  if (!box) return;

  if (sec === "recite") {
    const tip = `<div class="notice" style="margin-bottom:14px">背诵策略：考过的篇目优先滚动背（命题人明显在射程内）；《关雎》《送杜少府》是初中篇目——<b>初中背过的也会考</b>。点每一篇可展开考过的原句，全文可跳转权威来源古诗文网。</div>`;
    box.innerHTML = tip + K.dictation.map(d => `
      <details class="rc-item reveal">
        <summary><span class="k-year">${d.year}</span><b>《${d.piece}》</b><span class="rc-meta">${d.author} · ${d.era}</span></summary>
        <div class="rc-body">
          <div class="rc-quote">考过的句子：${d.quote}</div>
          <a class="btn btn-soft" style="font-size:13px;padding:7px 16px" href="${d.link}" target="_blank" rel="noopener">查看全文（古诗文网）→</a>
        </div>
      </details>`).join("");
  }

  if (sec === "essay") {
    const years = K.essays.map(e => `
      <details class="rc-item reveal">
        <summary><span class="k-year">${e.year}</span><span class="chip chip-cat">${e.cat}</span><span class="chip">${e.sub}</span><b style="font-weight:600;font-size:13.5px;color:var(--ink-2)">${e.prompt.slice(0, 26)}…</b></summary>
        <div class="rc-body">
          <p style="font-size:14px;line-height:1.95;margin-top:8px"><b>材料：</b>${e.prompt}</p>
          <div class="eg-eye">🎯 <b>题眼：</b>${e.eye}</div>
          ${e.angles.map((a, i) => `<div class="eg-angle"><span class="no2">${i + 1}</span>立意方向：${a}</div>`).join("")}
          <div class="eg-hook">📚 可引名句：${e.hook}</div>
          <small style="color:var(--ink-3);display:block;margin-top:8px">💡 ${e.note}</small>
        </div>
      </details>`).join("");
    /* 文体工具箱：按文体折叠（议论文默认展开） */
    const stepHTML = st => `<div class="sol-step">
        <b class="g-name">${st.name}</b>
        <div class="g-how">${st.how}</div>
        <div class="g-demo">✍️ ${st.demo}</div>
      </div>`;
    const genreHTML = G.genres.map((g, i) => {
      const steps = (g.steps || []).map(stepHTML).join("");
      const bridge = g.bridge ? `<div class="g-bridge"><b>🔁 ${g.bridge.title}</b><p>${g.bridge.body}</p></div>` : "";
      const opening = g.opening ? `<div class="g-open"><b>🚪 ${g.opening.title}</b>
          <p class="g-open-note">${g.opening.note}</p>
          <div class="steps">${g.opening.steps.map(stepHTML).join("")}</div></div>` : "";
      const subs = (g.subs || []).map(s => `<div class="g-sub">
          <div class="g-sub-head"><b>${s.name}</b><span class="rc-meta">${s.when}</span></div>
          <p class="g-sub-fmt"><b>格式：</b>${s.format}</p>
          <div class="g-demo">✍️ ${s.demo}</div>
        </div>`).join("");
      const rules = g.rules ? `<div class="sol-takeaway" style="margin-top:14px"><b>🗝️ 铁律：</b>${g.rules.join("　")}</div>` : "";
      const note = g.note ? `<p class="g-note">💡 ${g.note}</p>` : "";
      return `<details class="rc-item genre-item reveal"${i === 0 ? " open" : ""}>
        <summary><span class="chip chip-cat">${g.tag}</span><b>${g.name}</b><span class="rc-meta">${g.when}</span></summary>
        <div class="rc-body">
          ${g.intro ? `<p class="guide-intro">${g.intro}</p>` : ""}
          ${steps ? `<div class="steps">${steps}</div>` : ""}
          ${bridge}${opening}${subs}${note}${rules}
        </div>
      </details>`;
    }).join("");
    const bank = `<div class="section-head reveal" style="margin:26px 0 12px"><h2 class="section-title" style="font-size:19px">📚 引经据典弹药库</h2>
      <p class="section-desc">按大类各备两三句，写作时用上一句就能提档次——引用要准，宁可不用不可用错。</p></div>
      <div class="grid grid-2">${G.quoteBank.map(qb => `<div class="qb-card reveal"><h4>${qb.cat}</h4>${qb.quotes.map(q => `<p>${q}</p>`).join("")}</div>`).join("")}</div>`;
    box.innerHTML = `<div class="section-head reveal" style="margin-bottom:12px"><h2 class="section-title" style="font-size:19px">🗂 五年真题 · 逐题审题</h2>
      <p class="section-desc">每道题：材料 → 题眼 → 立意方向 → 可引名句。先学会「怎么想」，再背「怎么写」。</p></div>` + years
      + `<div class="section-head reveal" style="margin:30px 0 12px"><h2 class="section-title" style="font-size:19px">🧰 写作文体工具箱</h2>
      <p class="section-desc">${G.examNote}</p></div>` + genreHTML + bank;
  }

  if (sec === "classics") {
    const wy = K.classical.map(c => `
      <details class="rc-item reveal">
        <summary><span class="k-year">${c.year}</span><b>${c.source}</b><span class="chip">${c.genre}</span></summary>
        <div class="rc-body"><div class="rc-text">${fmtClassicalHTML(c.text, "prose")}</div>
        <small style="color:var(--ink-3)">💡 ${c.note}</small></div>
      </details>`).join("");
    const sh = K.poetry.map(c => `
      <details class="rc-item reveal">
        <summary><span class="k-year">${c.year}</span><b>《${c.title}》</b><span class="rc-meta">${c.author} · ${c.genre}</span><span class="chip">${c.theme}</span></summary>
        <div class="rc-body"><div class="rc-text rc-poem">${fmtClassicalHTML(c.text, "poem")}</div></div>
      </details>`).join("");
    box.innerHTML = `<div class="section-head reveal" style="margin-bottom:12px"><h2 class="section-title" style="font-size:19px">📖 文言文 · 五年考题原文</h2>
      <p class="section-desc">文本形态逐年升级：史传 → 双文本对读 → 多文本互证。点开读原文（提取自官方解析卷）。</p></div>` + wy +
      `<div class="section-head reveal" style="margin:28px 0 12px"><h2 class="section-title" style="font-size:19px">🖋 古代诗歌 · 五年全诗</h2>
      <p class="section-desc">诗歌鉴赏这一题五年里有四年考宋代（仅 2021 考唐诗）——先熟悉宋诗宋词的路数最划算。<small style="color:var(--ink-3)">（注：<a href="stats.html?subject=chinese">语文统计</a>的朝代频率把默写篇目也算进去了，那张图唐排第一，口径不同别看混。）</small></p></div>` + sh;
  }
  scanFx();
}

/* ---------- 语文/英语（整理中）页 ---------- */
function renderBeta(subId) {
  const data = SUBJECT_DATA[subId];
  const line = $("#subject-stat-line");
  if (line) line.textContent = `${data.name}板块的复习框架已经建好，真题正在逐题拆解录入——录入后所有统计自动上线。`;
  const fw = $("#framework-list");
  if (fw) {
    fw.innerHTML = data.topics.map((t, i) => `
      <div class="card topic-card reveal d${(i % 3) + 1}">
        <div class="t-head"><h3>${t.name}</h3>${priBadgeShort(t.priority)}</div>
        <div class="t-sections">${t.sections.join("、")}</div>
        <div>${t.subTopics.map(x => `<span class="chip">${x}</span>`).join("")}</div>
        <div class="t-advice">📌 ${t.advice}</div>
      </div>`).join("");
  }
  scanFx();
}

/* 高频题型排行 */
function drawTypeRank(subId) {
  const box = $("#type-rank");
  if (!box) return;
  const qs = SUBJECT_DATA[subId].questions;
  const total = qs.length || 1;
  const map = {};
  qs.forEach(q => {
    if (!map[q.type]) map[q.type] = { count: 0, sample: q, years: new Set() };
    map[q.type].count++;
    map[q.type].years.add(paperOf(q).year);
  });
  const arr = Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  if (!arr.length) { box.innerHTML = `<p class="q-empty">数据整理中。</p>`; return; }
  const max = arr[0][1].count;
  box.innerHTML = `<div data-grow-box>` + arr.map(([name, o], i) => {
    const t = topicOf(o.sample.topic);
    return `<div class="rank-row">
      <span class="rank-no ${i < 3 ? "top" : ""}">${i + 1}</span>
      <div class="rank-main">
        <div class="rank-name"><a href="search.html?q=${encodeURIComponent(name)}">${name}</a></div>
        <div class="rank-path">${t.name} · 近${o.years.size}个年份出现</div>
      </div>
      <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(o.count / max * 100)}"></div></div>
      <span class="rank-count">${o.count}次·${(o.count / total * 100).toFixed(0)}%</span>
    </div>`;
  }).join("") + `</div>`;
}

/* 题型树：专题 → 子专题 → 题型 → 题目卡 */
function drawTree(subId) {
  const box = $("#tree-container");
  if (!box) return;
  const stats = computeTopicStats(subId).sort((a, b) => b.count - a.count);

  box.innerHTML = stats.map(s => {
    let children = `<div class="tree-advice">📌 ${s.topic.advice}</div>`;
    if (!s.count) {
      children += `<div class="empty-ph">暂无题目 — 数据整理中</div>`;
    } else {
      const subGroups = {};
      s.questions.forEach(q => { (subGroups[q.subTopic] = subGroups[q.subTopic] || []).push(q); });
      children += Object.entries(subGroups).sort((a, b) => b[1].length - a[1].length)
        .map(([subName, qs1]) => {
          const typeGroups = {};
          qs1.forEach(q => { (typeGroups[q.type] = typeGroups[q.type] || []).push(q); });
          const typesHTML = Object.entries(typeGroups).sort((a, b) => b[1].length - a[1].length)
            .map(([typeName, qs2]) => {
              const cards = qs2.sort((a, b) => paperOf(b).year - paperOf(a).year).map(q => qCardHTML(q)).join("");
              return `<div>
                <div class="tree-row t3-row" data-toggle>
                  <span class="tree-arrow">›</span><span class="t3-name">${typeName}</span>
                  <span class="tree-count">${qs2.length} 题</span>
                </div>
                <div class="tree-children hidden">${cards}</div>
              </div>`;
            }).join("");
          return `<div>
            <div class="tree-row t2-row" data-toggle>
              <span class="tree-arrow">›</span><span>${subName}</span>
              <span class="tree-count">${qs1.length} 题 <a class="tree-all" href="search.html?sub=${encodeURIComponent(subName)}&subject=${subId}">看全部 →</a></span>
            </div>
            <div class="tree-children hidden">${typesHTML}</div>
          </div>`;
        }).join("");
    }
    const meta = s.count ? `${s.count} 题 · 占分 ${s.scoreShare.toFixed(1)}%` : "整理中";
    return `<div class="tree-t1 reveal">
      <div class="tree-row t1-row" data-toggle>
        <span class="tree-arrow">›</span><b>${s.topic.name}</b>${priBadgeShort(s.topic.priority)}
        <span class="t1-meta">${meta}${s.count ? ` <a class="tree-all" href="search.html?topic=${s.topic.id}">看全部 →</a>` : ""}</span>
      </div>
      <div class="tree-children hidden">${children}</div>
    </div>`;
  }).join("");

  bindTreeToggles(box);
}

/* ---------- 统计页 ---------- */
function renderStats() {
  const subId = currentSubjectId();
  $("#subject-tabs").innerHTML = subjectTabsHTML(subId, "stats.html");
  const data = SUBJECT_DATA[subId];
  const qs = data.questions;

  if (data.stats) {  /* 英语：语法考点 + 阅读题型 + 高频词（按次数统计） */
    const S = data.stats;
    $("#stats-main").innerHTML = `
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:6px">🧩 语法填空考点（五年 ${S.grammarTotal} 个空逐题统计）</h3>
        <p style="font-size:13px;color:var(--ink-3);margin-bottom:10px">官方解析对每个空都标了「考查什么」——按出现次数排，练语法先练前三行。</p>
        <div data-grow-box>${S.grammar.map(x => enRankRow(x.point, "", x.n, S.grammar[0].n, " 题")).join("")}</div>
      </div>
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:10px">📖 阅读题型分布（官方解析标签）</h3>
        <div data-grow-box>${S.reading.map(x => enRankRow(x.type, "", x.n, S.reading[0].n, " 题")).join("")}</div>
      </div>
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:10px">📚 高频难词 TOP10（已滤初中基础词）</h3>
        <div data-grow-box>${S.words.slice(0, 10).map(x => enRankRow(`<span class="en-word">${x.w}</span>`, "", x.n, S.words[0].n, " 次")).join("")}</div>
      </div>
      <p style="margin-top:6px">
        <a class="btn btn-brand" href="english.html">→ 英语板块看完整词表与写作模板</a>
        <a class="btn btn-soft" href="years.html?subject=english">五套真题 PDF</a>
      </p>`;
    scanFx();
    return;
  }

  if (!qs.length) {  /* 未录入学科：真实数据为空 */
    $("#stats-main").innerHTML = `<div class="card">
      <h3 style="font-size:16px">📊 ${data.name}统计 · 整理中</h3>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px">
        ${data.name}真题正在逐题拆解，录入后这里会自动生成占分环形图、高频题型、难度分布和复习四象限。
        可以先看 <a href="stats.html?subject=math">数学统计</a>，或到<a href="${SUBJECT_META.find(m => m.id === subId).page}">${data.name}板块</a>看复习框架。</p>
    </div>`;
    return;
  }

  if (data.knowledge) {  /* 语言学科：朝代频率 + 文体 + 语用考点（按次数统计，不按分值） */
    const K = data.knowledge;
    const lead = $("#stats-lead");
    if (lead) lead.textContent = "所有数字从五套真题实时算出来——按考过的频率决定先背什么、先练什么。";
    /* 朝代频率：默写篇目 + 诗歌考题（20条真实数据） */
    const eraCnt = {};
    [...K.dictation, ...K.poetry].forEach(x => { eraCnt[x.era] = (eraCnt[x.era] || 0) + 1; });
    const eras = Object.entries(eraCnt).sort((x, y) => y[1] - x[1]);
    const maxE = eras[0][1];
    const eraBars = eras.map(([e, n]) => `
      <div class="rank-row">
        <div class="rank-main"><div class="rank-name">${e}</div></div>
        <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(n / maxE * 100)}"></div></div>
        <span class="rank-count">${n} 篇</span>
      </div>`).join("");
    /* 写作考情：文体 + 主题大类频率（备素材的优先级依据） */
    const catCnt = {};
    K.essays.forEach(e => { catCnt[e.cat] = (catCnt[e.cat] || 0) + 1; });
    const cats = Object.entries(catCnt).sort((x, y) => y[1] - x[1]);
    const maxC = cats[0][1];
    const catBars = cats.map(([c, n]) => `
      <div class="rank-row">
        <div class="rank-main"><div class="rank-name">${c}</div></div>
        <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(n / maxC * 100)}"></div></div>
        <span class="rank-count">${n} 年</span>
      </div>`).join("");
    const wenti = `<div class="cn-row" style="margin-bottom:10px"><span class="pos">考过的文体</span><b>材料作文</b><small>${K.essays.length}/${K.essays.length} 年全是「明确文体」的材料作文——议论文最稳，模板见<a href="chinese-essay.html">作文专区</a></small></div>
      <p style="font-size:13px;color:var(--ink-3);margin:0 0 10px">主题大类出现次数——名句和例子先备高频大类的：</p>
      <div data-grow-box>${catBars}</div>`;
    $("#stats-main").innerHTML = `
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:6px">🏛 诗文朝代频率（默写篇目 + 诗歌考题，按出现次数）</h3>
        <p style="font-size:13px;color:var(--ink-3);margin-bottom:10px">背诗先背高频朝代——数据说话，别按喜好背。</p>
        <div data-grow-box>${eraBars}</div>
      </div>
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:10px">✍️ 写作考情（文体 + 主题大类）</h3>
        ${wenti}
      </div>
      <div class="card reveal" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:12px">🔁 语用考点五年出现频次</h3>
        <div data-grow-box>${K.langUse.map(p => `
          <div class="rank-row">
            <div class="rank-main"><div class="rank-name">${p.point}</div><div class="rank-path">${p.note}</div></div>
            <div class="bar-track rank-bar"><div class="bar-fill" data-w="${Math.round(p.years.length / data.papers.length * 100)}"></div></div>
            <span class="rank-count">${p.years.length}/${data.papers.length} 年</span>
          </div>`).join("")}</div>
      </div>
      <p style="margin-top:6px">
        <a class="btn btn-brand" href="chinese-recite.html">📜 去背默写</a>
        <a class="btn btn-soft" href="chinese-essay.html">✍️ 作文专区</a>
        <a class="btn btn-soft" href="years.html?subject=chinese">五套真题</a>
      </p>`;
    scanFx();
    return;
  }

  const stats = computeTopicStats(subId);
  const nonzero = stats.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const totalQ = qs.length;
  const totalScore = qs.reduce((s, q) => s + q.score, 0);
  const avgD = qs.reduce((s, q) => s + q.difficulty, 0) / totalQ;

  /* KPI 带 */
  const kpi = $("#stats-kpi");
  if (kpi) {
    kpi.innerHTML = [
      [totalQ, "已拆解题目"],
      [data.papers.length, "已收录试卷"],
      [new Set(qs.map(q => q.type)).size, "归并后题型"],
      [avgD.toFixed(1), "平均难度 / 5"]
    ].map(([n, l], i) => `<div class="stat reveal d${i + 1}"><div class="num" data-count="${n}">0</div><div class="lbl">${l}</div></div>`).join("");
  }

  /* 环形图：主专题题数占比（口径与全站统一：按出现次数，不按分值——分值大小不同不可混比） */
  $("#pie-topics").innerHTML = donutHTML(
    nonzero.map(s => ({ label: s.topic.name, value: s.count, unit: "题" })),
    String(totalQ), "已拆解题目"
  );

  /* 条形图：主专题出现次数 */
  $("#bars-topics").innerHTML = `<div data-grow-box>` + nonzero.map(s => barRowHTML(
    `<a href="search.html?topic=${s.topic.id}">${s.topic.name}</a>`,
    s.count, nonzero[0].count,
    `${s.count} 题 · ${(s.count / totalQ * 100).toFixed(0)}%`)).join("") + `</div>`;

  /* 小题型 TOP10（子专题维度） */
  const subMap = {};
  qs.forEach(q => {
    if (!subMap[q.subTopic]) subMap[q.subTopic] = { count: 0, topic: q.topic };
    subMap[q.subTopic].count++;
  });
  const topicCount = {};
  qs.forEach(q => { topicCount[q.topic] = (topicCount[q.topic] || 0) + 1; });
  const subArr = Object.entries(subMap).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  $("#bars-subtopics").innerHTML = `<div data-grow-box>` + subArr.map(([n, o]) => barRowHTML(
    `<a href="search.html?sub=${encodeURIComponent(n)}&subject=${subId}">${n}</a>`,
    o.count, subArr[0][1].count,
    `${o.count} 题 · 全卷 ${(o.count / totalQ * 100).toFixed(0)}% · 组内 ${(o.count / (topicCount[o.topic] || 1) * 100).toFixed(0)}%`)).join("") + `</div>`;

  /* 解题方法 TOP10 */
  const mCounts = {};
  qs.forEach(q => { if (q.method) mCounts[q.method] = (mCounts[q.method] || 0) + 1; });
  const mArr = Object.entries(mCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $("#bars-methods").innerHTML = `<div data-grow-box>` + mArr.map(([n, c]) => barRowHTML(
    `<a href="search.html?q=${encodeURIComponent(n)}">${n}</a>`,
    c, mArr[0][1], `${c} 次 · ${(c / totalQ * 100).toFixed(0)}%`)).join("") + `</div>`;

  /* 难度分布 */
  $("#dist-list").innerHTML = `<div data-grow-box>` + nonzero.map(s => `<div class="dist-item">
    <div class="dist-label">${s.topic.name}<span>${s.count}题 · 平均难度 ${s.avgDiff.toFixed(1)}</span></div>
    ${distHTML(s.dist)}
  </div>`).join("") + `</div>`;

  drawQuadrant(subId);

  /* 对比总表 */
  $("#topic-table-body").innerHTML = stats.sort((a, b) => b.count - a.count).map(s => `
    <tr>
      <td><a href="search.html?topic=${s.topic.id}"><b>${s.topic.name}</b></a></td>
      <td>${s.count} 题</td>
      <td>${s.scoreShare.toFixed(1)}%</td>
      <td>${s.count ? s.avgDiff.toFixed(1) + "（" + DIFF_LABEL[Math.round(s.avgDiff)] + "）" : "—"}</td>
      <td>${s.topic.sections.join("、")}</td>
      <td>${priBadgeShort(s.topic.priority)}</td>
    </tr>`).join("");

  scanFx();
}

/* =====================================================================
   必拿分（卷面固定送分位）：选择题前1/2 + 填空题前40% + 解答题前2题
   —— 这是给中下游学生的"保底分"范围：难度天然从易到中，先练到一分不丢。
   ===================================================================== */
function mustGetNumbers(p) {
  if (p.total === 19) return [1, 2, 3, 4, 5, 12, 13, 15, 16];        /* 19题制：单选1-8+多选9-11 → 前5；填空12-14 → 前2；解答15-19 → 前2 */
  if (p.total === 22) return [1, 2, 3, 4, 5, 6, 13, 14, 17, 18];     /* 22题制：选择1-12 → 前6；填空13-16 → 前2；解答17-22 → 前2 */
  return [];
}
function mustGetPacks(subId) {
  if (subId !== "math") return [];  /* 必拿分是数学卷面规则；语英的「必拿」在各自板块页 */
  const data = SUBJECT_DATA[subId];
  return data.papers
    .filter(p => p.status === "已拆解")
    .sort((a, b) => b.year - a.year)
    .map(p => {
      const nums = mustGetNumbers(p);
      const qs = nums.map(n => data.questions.find(q => q.paperId === p.id && q.number === n)).filter(Boolean);
      return { paper: p, questions: qs, score: qs.reduce((s, q) => s + q.score, 0) };
    })
    .filter(pk => pk.questions.length);
}

/* 复习四象限 */
function drawQuadrant(subId) {
  const box = $("#quadrant");
  if (!box) return;
  const stats = computeTopicStats(subId).filter(s => s.count > 0);
  if (!stats.length) { box.innerHTML = `<p class="q-empty">数据整理中。</p>`; return; }
  const counts = stats.map(s => s.count).sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)];
  const chips = (hiFreq, hard) => {
    const list = stats.filter(s => (s.count >= median) === hiFreq && (s.avgDiff >= 3) === hard);
    return list.length
      ? list.map(s => `<a class="chip" href="search.html?topic=${s.topic.id}" title="出现${s.count}次 · 平均难度${s.avgDiff.toFixed(1)}">${s.topic.name}</a>`).join("")
      : `<span class="q-empty">暂无</span>`;
  };
  /* 必拿分区 = 卷面固定送分位（位置规则），直接联动必拿分练习 */
  const packs = mustGetPacks(subId);
  const avgScore = packs.length ? Math.round(packs.reduce((s, p) => s + p.score, 0) / packs.length) : 0;
  const easyTopics = stats.filter(s => s.count >= median && s.avgDiff < 3);
  const secureBody = packs.length
    ? `<p class="quad-tip">每张卷子里<b>最该先拿到手</b>的分——难度低、套路清晰，练到一分不丢，及格线就稳了。每卷约 <b style="color:var(--easy)">${avgScore} 分</b>。</p>
       ${packs.map(pk => `<a class="chip" href="practice.html#y${pk.paper.year}" title="${pk.paper.name} 必拿 ${pk.questions.length} 题 · ${pk.score} 分">${pk.paper.year} · ${pk.questions.length}题${pk.score}分</a>`).join("")}
       <div style="margin-top:10px"><a class="btn btn-brand btn-sm" href="practice.html">去刷必拿题 →</a></div>
       ${easyTopics.length ? `<p class="quad-tip" style="margin:10px 0 4px">这些板块最容易稳分：</p>${chips(true, false)}` : ""}`
    : `<p class="quad-tip">数据整理中。</p>`;
  box.innerHTML = `<div class="quad-grid">
    <div class="quad q-secure"><h4>✅ 必拿分区 <small>每卷最该先拿的分</small></h4>
      ${secureBody}</div>
    <div class="quad q-choice"><h4>⚖️ 量力挑战区 <small>高频 × 难</small></h4>
      <p class="quad-tip">考得多但难——前面的小问、步骤分要抢，压轴问不恋战。</p>${chips(true, true)}</div>
    <div class="quad q-side"><h4>🌱 顺带巩固区 <small>低频 × 易</small></h4>
      <p class="quad-tip">考得少、难度低——随主专题顺带过一遍即可。</p>${chips(false, false)}</div>
    <div class="quad q-attack"><h4>🚫 战略放弃区 <small>低频 × 难</small></h4>
      <p class="quad-tip">考得少、难度高——大家都不会，拉不开分；冲刺期最后再看。</p>${chips(false, true)}</div>
  </div>`;
}

/* ---------- 搜索页 ---------- */
function renderSearch() {
  const params = new URLSearchParams(location.search);
  const input = $("#search-input");
  input.value = params.get("q") || "";
  const topicParam = params.get("topic") || "";
  const subParam = params.get("sub") || "";
  const subjParam = params.get("subject") || "";
  const easyParam = params.get("easy") === "1";
  const filtered = !!(topicParam || subParam || easyParam);

  const base = ALL_QUESTIONS.filter(q =>
    (!topicParam || q.topic === topicParam) &&
    (!subParam || q.subTopic === subParam) &&
    (!subjParam || q.subject === subjParam) &&
    (!easyParam || q.difficulty <= 3));

  const ctxBox = $("#search-ctx");
  if (ctxBox) {
    let label = "";
    if (subjParam && SUBJECT_DATA[subjParam]) label = "科目：" + subjectName(subjParam);
    if (topicParam) { const t = topicOf(topicParam); if (t) label = (label ? label + " · " : "") + "专题：" + t.name; }
    if (subParam) label = (label ? label + " · " : "") + "子专题：" + esc(subParam);
    if (easyParam) label = (label ? label + " · " : "") + "只看简单题（难度≤3）";
    ctxBox.innerHTML = label
      ? `<span class="search-ctx">📂 ${label}<a href="search.html" title="清除筛选">✕ 清除</a></span>` : "";
  }

  const run = () => {
    const kw = input.value.trim().toLowerCase();
    let list = base;
    if (kw) {
      const words = kw.split(/\s+/);
      list = base.filter(q => {
        const p = paperOf(q), t = topicOf(q.topic);
        const hay = [q.id, q.type, qTitle(q), q.subTopic, t.name, q.method || "", q.note || "",
          q.stem || "", (q.tags || []).join(" "), p.name, String(p.year), q.section
        ].join(" ").toLowerCase();
        return words.every(w => hay.includes(w));
      });
    } else if (!filtered) {
      list = [];
    }
    list = [...list].sort((a, b) => paperOf(b).year - paperOf(a).year);

    if (topicParam && !kw && !easyParam && list.length) {
      const t = topicOf(topicParam);
      const subjQs = ALL_QUESTIONS.filter(q => q.subject === list[0].subject);
      const share = (list.length / (subjQs.length || 1) * 100).toFixed(0);
      /* 语文/英语板块条目没有 difficulty：整段难度统计跳过，不显示 NaN */
      const ds = list.map(q => q.difficulty).filter(d => typeof d === "number");
      const hasDiff = ds.length === list.length;
      const avgD = hasDiff ? (ds.reduce((a, d) => a + d, 0) / ds.length).toFixed(1) : null;
      const dist = { easy: 0, medium: 0, hard: 0 };
      if (hasDiff) list.forEach(q => dist[diffBand(q.difficulty)]++);
      const groups = {};
      list.forEach(q => { (groups[q.subTopic] = groups[q.subTopic] || []).push(q); });
      const groupHTML = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
        .map(([name, qs2]) => `<div class="tree-t1">
          <div class="tree-row t1-row" data-toggle>
            <span class="tree-arrow">›</span><b>${name}</b>
            <span class="t1-meta">${qs2.length} 题 · 组内 ${(qs2.length / list.length * 100).toFixed(0)}%</span>
          </div>
          <div class="tree-children hidden">${qs2.sort((a, b) => paperOf(b).year - paperOf(a).year).map(q => qCardHTML(q)).join("")}</div>
        </div>`).join("");
      const years = new Set(list.map(q => paperOf(q).year)).size;
      $("#search-count").textContent = hasDiff
        ? `${t ? t.name : ""} · 共 ${list.length} 题 · 占全卷 ${share}% · 平均难度 ${avgD}`
        : `${t ? t.name : ""} · 共 ${list.length} 个板块条目 · 覆盖 ${years} 个年份`;
      $("#search-results").innerHTML = `<div class="topic-view-head card">
          <h3 style="font-size:16px;margin-bottom:10px">📂 ${t ? t.name : ""}${hasDiff ? " · 难度分布" : ""}</h3>
          ${hasDiff ? `<div data-grow-box>${distHTML(dist)}</div>` : ""}
          <div class="t-advice" style="margin-top:12px;background:var(--bg);border-radius:9px;padding:9px 13px;font-size:13px;color:var(--ink-2)">📌 ${t ? t.advice : ""}</div>
        </div>` + groupHTML;
      bindTreeToggles($("#search-results"));
      scanFx();
      return;
    }
    const HINT = {
      chinese: "输入关键词试试：默写 / 文言文 / 材料作文 / 李白；或回语文板块按入口浏览",
      english: "输入关键词试试：语法填空 / 读后续写 / 完形填空，或直接搜一个单词",
      math: "输入关键词试试：导数 / 离心率 / 隐零点 / 错位相减；或从题型树点「看全部」按分类浏览"
    };
    $("#search-count").textContent = (kw || filtered)
      ? `共 ${list.length} 道题目`
      : (HINT[subjParam] || HINT.math);
    $("#search-results").innerHTML = list.map(q => qCardHTML(q, { showSubject: true })).join("");
    scanFx();
  };

  input.addEventListener("input", run);
  run();
  if (!filtered && !input.value) input.focus();
}

/* ---------- 历年试卷页 ---------- */
function renderYears() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  $("#subject-tabs").innerHTML = subjectTabsHTML(subId, "years.html");

  /* 页头导语按学科给：三科的入口结构不一样，一句通用文案必然对不上 */
  const lead = $("#years-lead");
  if (lead) lead.textContent = {
    math: "左边刷整卷真题，右边直奔必拿分——点任意一题进档案，看提示、分步解析和「为什么这么做」。",
    chinese: "五套卷按年份折叠——点开任意一卷，每个板块都有题目、答案和「怎么答」。",
    english: "五套卷按年份折叠——点开任意一卷，每个板块都有原文、答案和「为什么这么选」（听力不拆，那个靠练耳朵）。"
  }[subId] || "";

  /* 顶部双入口：按学科渲染，点哪科给哪科的东西 */
  const ent = $("#year-entries");
  if (ent) {
    const E = {
      math: [
        ["📄", "历年真题", "按年份折叠 · 点开看整卷 · 逐题直达档案", "#paper-list", "↓"],
        ["✅", "必拿分练习", "每张卷里最该先拿到手的分 · 直接给题", "practice.html?subject=math", "→"]
      ],
      chinese: [
        /* 第一张必须锚到本页的卷列表——用户从"考题练习→语文"进来就是要刷卷子，
           两张卡都往外跳会让他以为本页没内容 */
        ["📄", "历年真题", "五套卷逐卷看 · 点任意板块进档案", "#paper-list", "↓"],
        ["📜", "必背默写", "五年考过的 15 篇 · 先背命题人射程内的", "chinese-recite.html", "→"]
      ],
      english: [
        ["📄", "历年真题", "五套卷逐题拆解 · 点开看为什么这么选", "#paper-list", "↓"],
        ["📚", "高频词汇", "考过的难词带释义 · 按频率背", "english-words.html", "→"]
      ]
    };
    ent.innerHTML = (E[subId] || E.math).map(([ic, t, d, href, ar], i2) => `
      <a class="tile reveal${i2 ? " d1" : ""}" href="${href}">
        <span class="tile-icon">${ic}</span>
        <span class="tile-body"><b>${t}</b><small>${d}</small></span>
        <span class="tile-arrow">${ar}</span>
      </a>`).join("");
  }

  const era = $("#era-card");
  if (era) {
    era.innerHTML = subId !== "math" ? "" : `<div class="card reveal" style="margin-bottom:24px">
      <h3 style="font-size:16px;margin-bottom:6px">📜 为什么跨年对比按「题型」而不是「题号」</h3>
      <p style="font-size:13px;color:var(--ink-2);margin-bottom:14px">
        近十年江苏数学卷结构变过两次——题号会漂移，但题型是稳定的，所以我们的统计全部按题型聚合。</p>
      <div class="era-grid">
        <div class="era"><span class="era-years">2016 – 2020</span><br><b>江苏卷（自主命题）</b>
          <p>14填空 + 6解答，160分（理科+附加40分）。无选择题。</p></div>
        <div class="era"><span class="era-years">2021 – 2023</span><br><b>新高考Ⅰ卷 · 22题</b>
          <p>8单选 + 4多选 + 4填空 + 6解答，150分。</p></div>
        <div class="era"><span class="era-years">2024 – 至今</span><br><b>新高考Ⅰ卷 · 19题</b>
          <p>8单选 + 3多选 + 3填空 + 5解答。新定义压轴成常态。</p></div>
      </div>
    </div>`;
  }

  if (!data.papers.length) {
    $("#years-container").innerHTML = `<div class="card">
      <h3 style="font-size:16px">📄 ${data.name}试卷 · 整理中</h3>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px">
        ${data.name}真题正在逐题拆解，完成后会在这里按年份列出逐题表。先到<a href="${SUBJECT_META.find(m => m.id === subId).page}">${data.name}板块</a>看复习框架，或切换到数学。</p>
    </div>`;
    return;
  }


  /* 年份手风琴：默认全部折叠，点开才展开该卷的题目表——页面不臃肿 */
  const papers = [...data.papers].sort((a, b) => b.year - a.year);
  $("#years-container").innerHTML = papers.map(p => {
    const qs = data.questions.filter(q => q.paperId === p.id).sort((a, b) => a.number - b.number);
    const pct = Math.round(qs.length / p.total * 100);
    const note = p.status === "部分整理"
      ? `<div class="notice" style="margin:10px 0 12px">部分整理（已录入 ${qs.length}/${p.total} 题），持续更新中。</div>` : "";
    const isLang = qs.length && qs[0].label;
    const mgNums = new Set(isLang ? [] : mustGetNumbers(p));
    const quick = qs.length
      ? `<div style="margin:10px 0 12px">${qs.map(q => `<a class="chip" href="question.html?id=${q.id}"
           title="${qTitle(q)}" ${mgNums.has(q.number) ? 'style="border-color:var(--easy);color:var(--easy)"' : ""}>${isLang ? q.section : q.number}</a>`).join("")}
         ${isLang ? "" : `<span style="font-size:12px;color:var(--ink-3)">（绿色 = 建议先拿）</span>`}</div>`
      : "";
    return `<div class="tree-t1 reveal" id="y${p.year}">
      <div class="tree-row t1-row" data-toggle>
        <span class="tree-arrow">›</span><b>${p.name}</b>${paperBadge(p)}
        <span class="badge badge-low">${p.status}</span>
        <span class="t1-meta">已录入 ${qs.length}/${p.total} 题 · 点开看整卷</span>
      </div>
      <div class="tree-children hidden">
        <div class="paper-topbar">
          <div class="paper-topbar-l">
            <div class="paper-meta" style="margin-top:10px">${p.structure || ""}</div>
            <div class="paper-progress" data-grow-box>
              <div class="bar-track"><div class="bar-fill" data-w="${pct}"></div></div>
              <span>已录入 ${qs.length}/${p.total} 题</span>
            </div>
          </div>
          ${(p.pdfs && p.pdfs.length) ? `<div class="paper-pdfs">${p.pdfs.map(f =>
            `<a class="pdf-btn" href="${f.file}" download>📄 ${f.label}<small>点击下载 · ${f.size || "PDF"}</small></a>`).join("")}</div>`
            : `<div class="paper-pdfs"><span class="pdf-none">📄 暂无官方 PDF<small>这一年还没拿到干净的官方卷</small></span></div>`}
        </div>
        ${note}${quick}${qs.length ? questionTableHTML(qs) : `<div class="empty-ph">该卷题目整理中</div>`}
      </div>
    </div>`;
  }).join("");

  bindTreeToggles($("#years-container"));
  bindRowClicks();
  openFromHash($("#years-container"));
  scanFx();
}

/* ---------- 必拿分练习页 ---------- */
function renderPractice() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  const box = $("#practice-main");
  if (!box) return;
  /* 科目切换 + 面包屑带上 subject（否则语文/英语学生点"考题练习"会被甩回数学卷） */
  const tabs = $("#subject-tabs");
  if (tabs) tabs.innerHTML = subjectTabsHTML(subId, "practice.html");
  const crumb = $("#crumb-years");
  if (crumb) crumb.href = "years.html?subject=" + subId;
  const packs = mustGetPacks(subId);

  if (!packs.length) {
    /* 语文/英语没有卷面送分位这套逻辑：把只对数学成立的静态区块藏掉，别留空壳 */
    const hide = sel => { const el = $(sel); if (el) el.style.display = "none"; };
    hide("#practice-lead"); hide("#practice-topics-sec");
    const sum = $("#practice-sum");
    if (sum) sum.textContent = `${data.name}的"必拿分"不靠刷整卷，靠把最稳的那部分吃透。`;
    const tip = subId === "english"
      ? `英语最稳的分在<b>积累</b>：<a href="english.html">英语板块</a>的高频词表和语法考点频率就是最该先背的部分——那些词年年出现。整卷练习去<a href="years.html?subject=english">真题练习</a>下载 PDF。`
      : `语文最稳的分是<b>背诵</b>：<a href="chinese-recite.html">必背默写</a>是全卷唯一"背了就一定拿到"的 6 分，先拿它；再去<a href="chinese-essay.html">作文专区</a>把结构模板背熟。`;
    box.innerHTML = `<div class="card"><h3 style="font-size:16px">✅ ${data.name} · 最该先拿的分</h3>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px;line-height:1.95">${tip}</p></div>`;
    return;
  }

  const totalQ = packs.reduce((s, p) => s + p.questions.length, 0);
  const avgScore = Math.round(packs.reduce((s, p) => s + p.score, 0) / packs.length);
  const allIds = packs.flatMap(pk => pk.questions.map(q => q.id));
  const st = doneStat(allIds);
  const sum = $("#practice-sum");
  if (sum) sum.innerHTML = `${packs.length} 套真题 · 每套约 ${avgScore} 分保底分——全部刷熟，及格线就稳了。`
    + (st.n ? `<br><b style="color:var(--easy)">你已经练过 ${st.n}/${st.total} 题（${st.pct}%）</b>` : "");

  /* 各年折叠（与历年真题一致）：默认只显示年份行，点开才出题卡
     题卡带 ?from=practice：题目页据此把翻页限制在必拿分集合内，不会静默滑进压轴题 */
  box.innerHTML = packs.map(pk => {
    const s = doneStat(pk.questions.map(q => q.id));
    return `
    <div class="tree-t1 reveal" id="y${pk.paper.year}">
      <div class="tree-row t1-row" data-toggle>
        <span class="tree-arrow">›</span><b>${pk.paper.name}</b>${paperBadge(pk.paper)}
        <span class="pk-score">${pk.questions.length} 题 · ${pk.score} 分</span>
        ${s.n ? `<span class="pk-done">${s.n === s.total ? "✅ 已刷完" : `已练 ${s.n}/${s.total}`}</span>` : ""}
        <span class="t1-meta"><a class="tree-all" href="years.html#y${pk.paper.year}">看整卷 →</a></span>
      </div>
      <div class="tree-children hidden">
        <div class="pick-grid" style="margin-top:10px">
          ${pk.questions.map(q => `<a class="pick${isDone(q.id) ? " picked" : ""}" href="question.html?id=${q.id}&from=practice">
            <span class="pk-top"><span>第${q.number}题 · ${q.section} ${q.score}分</span>${diffBadge(q.difficulty)}</span>
            <b>${isDone(q.id) ? "✅ " : ""}${qTitle(q)}</b>
            <span class="pk-go">做题 + 分步解析 →</span>
          </a>`).join("")}
        </div>
      </div>
    </div>`;
  }).join("");
  bindTreeToggles(box);
  openFromHash(box);
  /* 无锚点时默认展开最新一年，别让学生进来面对一排折叠条不知道点哪 */
  if (!location.hash) { const first = $(".t1-row", box); if (first) openRow(first); }

  /* 专项练习：各板块只刷简单题 */
  const spec = $("#practice-topics");
  if (spec) {
    const rows = computeTopicStats(subId)
      .map(s => ({ t: s.topic, n: s.questions.filter(q => q.difficulty <= 3).length }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n);
    spec.innerHTML = rows.map(x =>
      `<a class="chip" href="search.html?topic=${x.t.id}&easy=1">${x.t.name} · ${x.n}道简单题</a>`).join("");
  }
  scanFx();
}

/* ---------- 可拖拽 3D 线框模型（零依赖 Canvas，立体几何辅助） ---------- */
function initModel3D(host, model) {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const INK = css("--ink") || "#101828", RED = css("--mark") || "#E11D48",
        FAR = "#B9C7DC", LAB = css("--ink-2") || "#414E68";
  const W = Math.max(240, Math.min(430, host.clientWidth || 430)), H = Math.round(W * 0.84);
  const dpr = window.devicePixelRatio || 1;
  const cv = document.createElement("canvas");
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + "px"; cv.style.height = H + "px";
  host.appendChild(cv);
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);

  const V = model.v, E = model.e || [], D = model.dash || [], L = model.labels || [];
  const cx = V.reduce((s, p) => s + p[0], 0) / V.length,
        cy = V.reduce((s, p) => s + p[1], 0) / V.length,
        cz = V.reduce((s, p) => s + p[2], 0) / V.length;
  const rad = Math.max(...V.map(p => Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz)));
  const SC = (Math.min(W, H) / 2 - 36) / rad;
  let yaw = 0.72, pitch = 0.46;

  /* 正交投影：yaw 绕竖直轴转，pitch 俯仰；数据坐标 z 轴向上 */
  function proj(p) {
    const x = p[0] - cx, y = p[1] - cy, z = p[2] - cz;
    const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
    const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
    const z2 = z * Math.cos(pitch) - y1 * Math.sin(pitch);
    const d = z * Math.sin(pitch) + y1 * Math.cos(pitch);
    return { X: W / 2 + x1 * SC, Y: H / 2 - z2 * SC, d };
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const P = V.map(proj);
    /* 实线棱：按深度排序，远处淡、近处深，形成立体感 */
    E.map(([a, b]) => ({ a: P[a], b: P[b], d: (P[a].d + P[b].d) / 2 }))
      .sort((u, v) => u.d - v.d)
      .forEach((e, i, arr) => {
        const near = e.d >= arr[Math.floor(arr.length / 2)].d;
        ctx.strokeStyle = near ? INK : FAR;
        ctx.lineWidth = near ? 2 : 1.4;
        ctx.beginPath(); ctx.moveTo(e.a.X, e.a.Y); ctx.lineTo(e.b.X, e.b.Y); ctx.stroke();
      });
    /* 虚线辅助线（高、对角线等） */
    ctx.setLineDash([5, 4]); ctx.strokeStyle = RED; ctx.lineWidth = 1.6;
    D.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(P[a].X, P[a].Y); ctx.lineTo(P[b].X, P[b].Y); ctx.stroke(); });
    ctx.setLineDash([]);
    /* 顶点与标签：沿"离画面中心向外"方向偏移，避免压线 */
    ctx.font = "13px system-ui, -apple-system, 'Segoe UI', sans-serif";
    L.forEach((t, i) => {
      if (!t) return;
      const p = P[i];
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(p.X, p.Y, 2.6, 0, Math.PI * 2); ctx.fill();
      const dx = p.X - W / 2, dy = p.Y - H / 2, len = Math.hypot(dx, dy) || 1;
      ctx.fillStyle = LAB;
      ctx.fillText(t, p.X + (dx / len) * 13 - 4, p.Y + (dy / len) * 13 + 4);
    });
  }
  /* 拖拽旋转（鼠标+触屏通用） */
  let last = null;
  cv.style.touchAction = "none"; cv.style.cursor = "grab";
  cv.addEventListener("pointerdown", e => { last = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
  cv.addEventListener("pointermove", e => {
    if (!last) return;
    yaw += (e.clientX - last[0]) * 0.011;
    pitch = Math.max(-1.35, Math.min(1.35, pitch + (e.clientY - last[1]) * 0.011));
    last = [e.clientX, e.clientY]; draw();
  });
  ["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, () => { last = null; cv.style.cursor = "grab"; }));
  draw();
}

/* ---------- 题目档案页 ---------- */
/* 语文板块条目页：材料 → 逐小题（题目 → 答案 → 怎么答）
   语文按板块不按单题，没有难度/方法/相似题这些数学概念，单独渲染 */
function renderChineseBlock(q, box) {
  document.body.classList.add("sub-" + q.subject);   /* 语文页走水墨主题 */
  const lead = $("#q-lead");
  if (lead) lead.textContent = "这个板块的完整档案：材料、逐小题的题目、标准答案和「怎么答」。";
  const p = paperOf(q);
  const t = topicOf(q.topic);

  const parts = (q.parts || []).map(pt => `
    <section class="cn-part">
      <div class="cn-part-head"><b>${pt.no}</b>${pt.kind ? `<span class="cn-kind">${pt.kind}</span>` : ""}</div>
      <div class="cn-q">${pt.q}</div>
      <details class="sol-box cn-sol">
        <summary>📖 看答案与怎么答</summary>
        <div class="sol-ans"><b>✅ 答案</b><div class="ans-c">${pt.ans}</div></div>
        <div class="cn-how"><b>🧭 怎么答</b><div class="cn-how-c">${pt.how}</div></div>
      </details>
    </section>`).join("");

  const siblings = ALL_QUESTIONS.filter(x => x.paperId === q.paperId).sort((a, b) => a.number - b.number);
  const sibHTML = siblings.map(x => `<a href="question.html?id=${x.id}" class="${x.id === q.id ? "current" : ""}"
                 title="${x.title}">${x.section}</a>`).join("");
  const idx = siblings.findIndex(x => x.id === q.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  box.innerHTML = `<div class="card">
    <div class="paper-head">
      <h2 style="font-size:20px">${p.name} · ${q.section}</h2>
      ${paperBadge(p)} ${priBadgeShort(t.priority)}
      <span class="badge badge-low">${subjectName(q.subject)}</span>
    </div>
    <p style="color:var(--ink-2);font-size:15px;margin-top:4px">${q.label} · ${q.score}分 —— ${q.title}</p>

    <div class="q-detail-grid">
      <div class="q-field"><div class="k">年份 / 位置</div><div class="v">${p.year} · ${q.label} · ${q.score}分</div></div>
      <div class="q-field"><div class="k">板块</div><div class="v"><a href="search.html?topic=${q.topic}">${t.name}</a></div></div>
      <div class="q-field"><div class="k">复习优先级</div><div class="v">${t.priority}</div></div>
    </div>

    ${q.intro ? `<div class="cn-intro">${q.intro}</div>` : ""}
    ${parts || `<div class="notice" style="margin-top:20px">该板块内容录入中。</div>`}
    ${q.note ? `<div class="q-note">💡 复习备注：${q.note}</div>` : ""}

    ${doneBtnHTML(q.id)}

    <h3 style="margin-top:26px">📄 本卷板块</h3>
    <div class="paper-nav cn-nav">${sibHTML}</div>
    <div class="q-pager">
      ${prev ? `<a class="btn btn-soft" href="question.html?id=${prev.id}">← ${prev.section}</a>` : ""}
      ${next ? `<a class="btn btn-brand" href="question.html?id=${next.id}">${next.section} →</a>` : ""}
    </div>

    ${doneBtnHTML(q.id)}

    <p style="margin-top:24px">
      <a class="btn btn-brand" href="${SUBJECT_META.find(m => m.id === q.subject).page}">← 返回${subjectName(q.subject)}</a>
      <a class="btn btn-soft" href="years.html?subject=${q.subject}">考题练习</a>
    </p>
  </div>`;
  bindDoneBtn(box, q.id);
  scanFx();
}

/* 「我练过了」按钮：本地记忆，纯前端 */
function doneBtnHTML(id) {
  const on = isDone(id);
  return `<div class="done-bar">
    <button type="button" class="done-btn${on ? " on" : ""}" data-done-id="${id}">
      <span class="done-tick">${on ? "✅" : "⭕"}</span>
      <span class="done-label">${on ? "已练过 · 点一下取消" : "我练过了"}</span>
    </button>
    <small>只存在你自己的浏览器里，不上传；换设备或清缓存会丢。</small>
  </div>`;
}
function bindDoneBtn(root, id) {
  const btn = $(".done-btn", root);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const on = toggleDone(id);
    btn.classList.toggle("on", on);
    $(".done-tick", btn).textContent = on ? "✅" : "⭕";
    $(".done-label", btn).textContent = on ? "已练过 · 点一下取消" : "我练过了";
  });
}

/* 生词：把 <w>word</w> 换成可点的下划线词，点开显示 词性+中文+用法提示。
   词库是全站唯一一份（DATA_ENGLISH.glossary），题目、词频表、额外练习共用。 */
function glossHTML(html) {
  const G = (SUBJECT_DATA.english && SUBJECT_DATA.english.glossary) || {};
  return String(html || "").replace(/<w>([\s\S]*?)<\/w>/g, (m, word) => {
    const plain = word.replace(/<[^>]*>/g, "");
    const d = G[plain.toLowerCase()] || G[plain] || null;
    if (!d) return plain;                       /* 词库里没有就别加下划线，免得点了没内容 */
    const tip = d.tip ? `<i>${d.tip}</i>` : "";
    return `<span class="gw" tabindex="0" role="button">${plain}<span class="gw-pop"><b>${d.pos || ""}</b>${d.cn || ""}${tip}</span></span>`;
  });
}

/* 英语语篇块页：原文（生词可点）→ 一句话大意 → 逐小题（题目/答案/为什么这么选/定位句） */
function renderEnglishBlock(q, box) {
  document.body.classList.add("sub-english");
  const lead = $("#q-lead");
  if (lead) lead.textContent = "整篇原文 + 逐题讲解：为什么选它、答案在原文哪一句、干扰项错在哪。";
  const p = paperOf(q), t = topicOf(q.topic);

  const opts = q.options && q.options.length
    ? `<div class="en-options"><b>七个选项</b>${q.options.map(o => `<div class="en-opt">${glossHTML(o)}</div>`).join("")}</div>`
    : "";

  const parts = (q.parts || []).map(pt => `
    <section class="cn-part">
      <div class="cn-part-head"><b>${pt.no}</b>${pt.kind ? `<span class="cn-kind">${pt.kind}</span>` : ""}</div>
      <div class="cn-q en-q">${glossHTML(pt.q)}</div>
      <details class="sol-box cn-sol">
        <summary>📖 看答案与为什么这么选</summary>
        <div class="sol-ans"><b>✅ 答案</b><div class="ans-c">${pt.ans}</div></div>
        ${pt.locate ? `<div class="en-locate"><b>📍 答案在这句</b><div>${glossHTML(pt.locate)}</div></div>` : ""}
        <div class="cn-how"><b>🧭 为什么</b><div class="cn-how-c">${pt.how}</div></div>
      </details>
    </section>`).join("");

  const sibs = ALL_QUESTIONS.filter(x => x.paperId === q.paperId).sort((a, b) => a.number - b.number);
  const idx = sibs.findIndex(x => x.id === q.id);
  const prev = idx > 0 ? sibs[idx - 1] : null, next = idx < sibs.length - 1 ? sibs[idx + 1] : null;

  box.innerHTML = `<div class="card">
    <div class="paper-head">
      <h2 style="font-size:20px">${p.name} · ${q.section}</h2>
      ${paperBadge(p)} ${q.difficulty ? diffBadge(q.difficulty) : ""}
      <span class="badge badge-low">英语</span>
    </div>
    <p style="color:var(--ink-2);font-size:15px;margin-top:4px">${q.label} · ${q.score}分 —— ${q.title}</p>

    <div class="q-detail-grid">
      <div class="q-field"><div class="k">年份 / 位置</div><div class="v">${p.year} · ${q.label} · ${q.score}分</div></div>
      <div class="q-field"><div class="k">板块</div><div class="v"><a href="search.html?topic=${q.topic}">${t.name}</a></div></div>
      <div class="q-field"><div class="k">题型</div><div class="v">${q.type || q.subTopic || "—"}</div></div>
    </div>

    ${q.passageCn ? `<div class="en-gist"><b>这篇在讲什么</b>${q.passageCn}</div>` : ""}
    ${q.passage ? `<div class="en-passage"><div class="stem-k">原文 · 划线词点一下看意思</div>${glossHTML(q.passage)}</div>` : ""}
    ${opts}
    ${parts}
    ${doneBtnHTML(q.id)}

    <h3 style="margin-top:26px">📄 本卷板块</h3>
    <div class="paper-nav cn-nav">${sibs.map(x => `<a href="question.html?id=${x.id}" class="${x.id === q.id ? "current" : ""}${isDone(x.id) ? " done" : ""}" title="${x.title}">${x.section}</a>`).join("")}</div>
    <div class="q-pager">
      ${prev ? `<a class="btn btn-soft" href="question.html?id=${prev.id}">← ${prev.section}</a>` : ""}
      ${next ? `<a class="btn btn-brand" href="question.html?id=${next.id}">${next.section} →</a>` : ""}
    </div>

    <p style="margin-top:24px">
      <a class="btn btn-brand" href="english.html">← 返回英语</a>
      <a class="btn btn-soft" href="years.html?subject=english">考题练习</a>
    </p>
  </div>`;

  /* 生词点击展开（键盘也能用） */
  box.addEventListener("click", e => {
    const w = e.target.closest(".gw");
    if (w && !e.target.closest(".gw-pop")) w.classList.toggle("open");
  });
  box.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("gw")) {
      e.preventDefault(); e.target.classList.toggle("open");
    }
  });
  bindDoneBtn(box, q.id);
  scanFx();
}

function renderQuestion() {
  const id = new URLSearchParams(location.search).get("id") || (ALL_QUESTIONS[0] && ALL_QUESTIONS[0].id);
  const q = questionById(id);
  const box = $("#q-container");

  if (!q) {
    box.innerHTML = `<div class="card"><h2>未找到该题目</h2>
      <p style="margin-top:8px;color:var(--ink-2)">编号 ${esc(id)} 不存在，可能尚未录入。</p>
      <p style="margin-top:14px"><a class="btn btn-brand" href="years.html">← 返回考题练习</a>
      <a class="btn btn-soft" href="search.html">去搜索</a></p></div>`;
    return;
  }

  /* 面包屑带上本题科目，别让语文/英语学生点回去落到数学卷 */
  const crumb = $("#crumb-years");
  if (crumb) crumb.href = "years.html?subject=" + q.subject;

  if (q.subject === "english" && q.parts) { renderEnglishBlock(q, box); return; }
  if (q.parts) { renderChineseBlock(q, box); return; }   /* 语言学科板块条目走专用渲染 */

  const p = paperOf(q);
  const t = topicOf(q.topic);
  const sameType = ALL_QUESTIONS.filter(x => x.type === q.type).length;
  const tags = (q.tags || []).map(tag => `<span class="chip">${tag}</span>`).join("");

  const stemBlock = q.stem
    ? `<div class="stem-block"><div class="stem-k">题干 · ${p.year} 第${q.number}题</div>${q.stem}
       ${q.image ? `<img class="q-img${q.imageWide ? " q-img-wide" : ""}" src="${q.image}" alt="第${q.number}题配图" loading="lazy">` : ""}</div>`
    : (q.image ? `<img class="q-img${q.imageWide ? " q-img-wide" : ""}" src="${q.image}" alt="第${q.number}题配图" loading="lazy">` : "");

  const related = (q.related || []).map(rid => {
    const rq = questionById(rid);
    if (!rq) return "";
    const rp = paperOf(rq);
    return `<a class="related-item" href="question.html?id=${rq.id}">
      <span><b>${rp.name}</b> · 第${rq.number}题 —— ${qTitle(rq)}${rq.method ? `（${rq.method}）` : ""}</span>
      <span>${diffBadge(rq.difficulty)}</span>
    </a>`;
  }).join("");
  const relatedBlock = related
    ? `<h3 style="margin-top:26px">🔁 相似题（同结构跨年出现）</h3>${related}`
    : `<p style="margin-top:26px;color:var(--ink-3);font-size:14px">该题暂未关联相似题。</p>`;

  /* 从必拿分练习进来（?from=practice）时，翻页只在必拿分集合内走。
     必拿分题号是跳跃的（如 1-5 之后是 12），按卷面顺序翻会静默滑进压轴题，
     而中下游学生正是最容易在那里受挫的。 */
  const fromPractice = new URLSearchParams(location.search).get("from") === "practice";
  const inPack = fromPractice ? new Set(mustGetNumbers(p)) : null;
  const siblings = ALL_QUESTIONS
    .filter(x => x.paperId === q.paperId && (!inPack || inPack.has(x.number)))
    .sort((a, b) => a.number - b.number);
  const keep = fromPractice ? "&from=practice" : "";
  const sibHTML = siblings.map(x => `<a href="question.html?id=${x.id}${keep}" class="${x.id === q.id ? "current" : ""}${isDone(x.id) ? " done" : ""}"
                 title="${qTitle(x)}">${x.number}</a>`).join("");
  const idx = siblings.findIndex(x => x.id === q.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const packDone = fromPractice && !next
    ? `<div class="notice" style="margin:16px 0 0">🎉 <b>本卷必拿分已经刷完了。</b>回<a href="practice.html#y${p.year}">必拿分练习</a>换一年，或去<a href="years.html#y${p.year}">整卷</a>挑战后面的题。</div>`
    : "";
  const pager = `<div class="q-pager">
    ${prev ? `<a class="btn btn-soft" href="question.html?id=${prev.id}${keep}">← 第${prev.number}题</a>` : ""}
    ${next ? `<a class="btn btn-brand" href="question.html?id=${next.id}${keep}">第${next.number}题 →</a>` : ""}
    ${fromPractice ? `<a class="btn btn-soft" href="practice.html#y${p.year}">↩ 回必拿分练习</a>` : ""}
  </div>${packDone}`;

  /* 提示层：从解析中抽出破题句，先给提示不剧透 */
  let hintBlock = "";
  const ideaMatch = (q.solution || "").match(/<div class="sol-idea">[\s\S]*?<\/div>/);
  if (ideaMatch) {
    hintBlock = `<details class="sol-box sol-hint">
      <summary>💡 卡住了？先看提示（不剧透答案）</summary>
      <div class="sol-body">${ideaMatch[0]}</div>
    </details>`;
  }

  const figInner = q.figure
    ? (String(q.figure).trim().startsWith("<svg") ? q.figure : `<img src="${q.figure}" alt="辅助图" loading="lazy">`)
    : "";
  const figBlock = figInner
    ? `<figure class="sol-fig">${figInner}<figcaption>${q.figureCap ? `📐 ${q.figureCap}` : ""}<span class="fig-note">示意图 · 帮助理解，非考场原图</span></figcaption></figure>`
    : "";

  box.innerHTML = `<div class="card">
    <div class="paper-head">
      <h2 style="font-size:20px">${p.name} · 第${q.number}题</h2>
      ${paperBadge(p)} ${priBadgeShort(q.priority)}
      <span class="badge badge-low">${subjectName(q.subject)}</span>
    </div>
    <p style="color:var(--ink-2);font-size:15px;margin-top:4px">${qTitle(q)}</p>

    <div class="q-detail-grid">
      <div class="q-field"><div class="k">年份 / 位置</div><div class="v">${p.year} · ${q.section} ${q.label || `第${q.number}题`} · ${q.score}分</div></div>
      <div class="q-field"><div class="k">难度</div><div class="v">${q.difficulty ? `${DIFF_LABEL[q.difficulty]}（${q.difficulty}/5）` : "—"}</div></div>
      <div class="q-field"><div class="k">复习优先级</div><div class="v">${q.priority || topicOf(q.topic).priority}</div></div>
      <div class="q-field"><div class="k">主专题</div><div class="v"><a href="search.html?topic=${q.topic}">${t.name}</a></div></div>
      <div class="q-field"><div class="k">子专题</div><div class="v"><a href="search.html?sub=${encodeURIComponent(q.subTopic)}&subject=${q.subject}">${q.subTopic}</a></div></div>
      <div class="q-field"><div class="k">题型</div><div class="v"><a href="search.html?q=${encodeURIComponent(q.type)}" title="看同题型的题">${q.type}${sameType > 1 ? ` · ${sameType}题` : ""}</a></div></div>
    </div>

    ${q.method ? `<div style="margin-top:16px"><a class="chip method-chip" href="search.html?q=${encodeURIComponent(q.method)}" title="看用同一方法的题">🔧 解题方法：${q.method}</a>${tags}
      ${q.methodDetail ? `<div class="method-detail">这道题具体怎么走：${q.methodDetail}</div>` : ""}</div>`
      : `<div style="margin-top:16px">${tags}</div>`}
    ${stemBlock}
    ${q.model ? `<figure class="sol-fig m3d-fig"><div class="m3d"></div><figcaption>🧊 ${q.model.cap || "立体示意模型"}<span class="fig-note"><b>🖐 按住拖拽，转着看</b> · 示意模型 · 帮助理解，非考场原图</span></figcaption></figure>` : ""}
    ${hintBlock}
    ${(q.answer || q.solution) ? `
    <details class="sol-box" ${q.stem ? "" : "open"}>
      <summary>📖 查看答案与分步解析</summary>
      ${q.answer ? `<div class="sol-ans"><b>✅ 答案</b><div class="ans-c">${q.answer}</div></div>` : ""}
      ${q.solution ? `<div class="sol-body">${figBlock}${q.solution}</div>` : (figBlock ? `<div class="sol-body">${figBlock}</div>` : "")}
    </details>` : `<div class="notice" style="margin-top:20px">该题解析整理中——先看下方相似题的完整解析。</div>`}
    ${q.note ? `<div class="q-note">💡 复习备注：${q.note}</div>` : ""}
    ${doneBtnHTML(q.id)}
    ${relatedBlock}

    <h3 style="margin-top:26px">📄 本卷已录入题目</h3>
    <div class="paper-nav">${sibHTML}</div>
    ${pager}

    <p style="margin-top:24px">
      <a class="btn btn-brand" href="${SUBJECT_META.find(m => m.id === q.subject).page}">← 返回${subjectName(q.subject)}</a>
      <a class="btn btn-soft" href="years.html?subject=${q.subject}">考题练习</a>
    </p>
  </div>`;

  bindDoneBtn(box, q.id);

  /* 把解析里连续的 .sol-step 包进 .steps 时间线容器 */
  $$(".sol-body", box).forEach(body => {
    let runStart = null;
    const wrapRun = (from, to) => {
      const wrap = document.createElement("div");
      wrap.className = "steps";
      from.parentNode.insertBefore(wrap, from);
      let cur = from;
      while (cur) { const nx = cur === to ? null : cur.nextElementSibling; wrap.appendChild(cur); cur = nx; }
    };
    const scan = root => {
      const kids = Array.from(root.children);
      let first = null, last = null;
      const flush = () => { if (first) wrapRun(first, last); first = last = null; };
      kids.forEach(k => {
        if (k.classList && k.classList.contains("sol-step")) { if (!first) first = k; last = k; }
        else { flush(); if (k.classList && k.classList.contains("sol-part")) scan(k); }
      });
      flush();
    };
    scan(body);
  });

  /* 3D 模型初始化 */
  const m3 = $(".m3d", box);
  if (m3 && q.model) initModel3D(m3, q.model);

  /* 定义词条：点击展开/收起 */
  box.addEventListener("click", e => {
    if (e.target.closest(".term-pop")) return;
    const term = e.target.closest(".term");
    if (term) term.classList.toggle("open");
  });

  /* 数学公式渲染 */
  if (window.renderMathInElement) {
    renderMathInElement(box, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true }
      ],
      throwOnError: false
    });
  }
  scanFx();
}

/* =====================================================================
   页面分发 + 全局交互
   ===================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  /* 页头滚动态 */
  /* 分科主题色（语文=水墨暖色 / 英语=淡草绿） */
  const themeSub = new URLSearchParams(location.search).get("subject") || document.body.dataset.subject;
  if (themeSub && themeSub !== "math" && SUBJECT_DATA[themeSub]) document.body.classList.add("sub-" + themeSub);

  /* 导航分科下拉：点开选科，点外面关闭 */
  $$(".ndd-t").forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const dd = btn.parentElement;
    $$(".ndd.open").forEach(x => { if (x !== dd) x.classList.remove("open"); });
    dd.classList.toggle("open");
  }));
  document.addEventListener("click", () => $$(".ndd.open").forEach(x => x.classList.remove("open")));

  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const page = document.body.dataset.page;
  const renderers = {
    home: renderHome,
    subject: renderSubject,
    stats: renderStats,
    search: renderSearch,
    years: renderYears,
    practice: renderPractice,
    question: renderQuestion,
    "cn-sub": renderCnSub,
    "en-sub": renderEnSub
  };
  (renderers[page] || (() => {}))();

  /* 搜索联想：全站所有搜索框 */
  $$("input[type=search], #search-input").forEach(attachSuggest);

  /* 静态元素动效 */
  scanFx();
});
