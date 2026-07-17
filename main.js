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

function diffBand(d) { return d <= 2 ? "easy" : d === 3 ? "medium" : "hard"; }
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
      <span class="q-card-src">${subj}${p.year} ${p.type} · 第${q.number}题 · ${q.section} ${q.score}分</span>
      ${diffBadge(q.difficulty)}
    </div>
    <div class="q-card-title">${qTitle(q)}</div>
    <div class="q-card-tags">
      <span class="chip">${q.type}</span>
      ${q.method ? `<span class="chip method-chip">🔧 ${q.method}</span>` : ""}
      ${(q.tags || []).map(t => `<span class="chip">${t}</span>`).join("")}
    </div>
    ${q.note ? `<div class="q-card-note">💡 ${q.note}</div>` : ""}
    <a class="q-card-more" href="question.html?id=${q.id}">${q.solution ? "看题目 + 分步解析 →" : "看分类与相似题 →"}</a>
  </div>`;
}

function questionTableHTML(qs) {
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
    tr.addEventListener("click", () => { location.href = "question.html?id=" + tr.dataset.id; });
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
    row.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const children = row.nextElementSibling;
      const willOpen = children && children.classList.contains("hidden");
      row.classList.toggle("open");
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
  const mathPapers = SUBJECT_DATA.math.papers;
  const full = mathPapers.filter(p => p.status === "已拆解").length;
  const types = new Set(SUBJECT_DATA.math.questions.map(q => q.type)).size;
  const nQ = SUBJECT_DATA.math.questions.length;

  const set = (id, v) => { const el = $(id); if (el) { el.dataset.count = v; el.textContent = "0"; } };
  set("#hs-papers", mathPapers.length);
  set("#hs-questions", nQ);
  set("#hs-types", types);
  const fullEl = $("#hs-full");
  if (fullEl) fullEl.textContent = `其中 ${full} 套完整拆解`;

  const cm = $("#cnt-math");
  if (cm) cm.textContent = nQ;
  ["chinese", "english"].forEach(s => {
    const el = $("#cnt-" + s);
    if (el) el.textContent = SUBJECT_DATA[s].questions.length || "";
  });

  /* 热门搜索芯片：考得最多的题型 */
  const chipBox = $("#hot-chips");
  if (chipBox) {
    const tc = {};
    SUBJECT_DATA.math.questions.forEach(q => tc[q.type] = (tc[q.type] || 0) + 1);
    const top = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 4);
    chipBox.innerHTML = `<span class="hint">大家都在搜：</span>` +
      top.map(([n, c]) => `<a href="search.html?q=${encodeURIComponent(n)}">${n} · ${c}次</a>`).join("");
  }
}

/* ---------- 数学科目页 ---------- */
function renderSubject() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  if (data.status === "beta") { renderBeta(subId); return; }
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

  if (!qs.length) {  /* 语文/英语：真实数据未录入 */
    $("#stats-main").innerHTML = `<div class="card">
      <h3 style="font-size:16px">📊 ${data.name}统计 · 整理中</h3>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px">
        ${data.name}真题正在逐题拆解，录入后这里会自动生成占分环形图、高频题型、难度分布和复习四象限。
        可以先看 <a href="stats.html?subject=math">数学统计</a>，或到<a href="${SUBJECT_META.find(m => m.id === subId).page}">${data.name}板块</a>看复习框架。</p>
    </div>`;
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
    <div class="quad q-secure"><h4>✅ 必拿分区 <small>卷面固定送分位</small></h4>
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
    if (topicParam) { const t = topicOf(topicParam); if (t) label = "专题：" + t.name; }
    if (subParam) label = (label ? label + " · " : "") + "子专题：" + subParam;
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
      const avgD = (list.reduce((a, q) => a + q.difficulty, 0) / list.length).toFixed(1);
      const dist = { easy: 0, medium: 0, hard: 0 };
      list.forEach(q => dist[diffBand(q.difficulty)]++);
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
      $("#search-count").textContent = `${t ? t.name : ""} · 共 ${list.length} 题 · 占全卷 ${share}% · 平均难度 ${avgD}`;
      $("#search-results").innerHTML = `<div class="topic-view-head card">
          <h3 style="font-size:16px;margin-bottom:10px">📂 ${t ? t.name : ""} · 难度分布</h3>
          <div data-grow-box>${distHTML(dist)}</div>
          <div class="t-advice" style="margin-top:12px;background:var(--bg);border-radius:9px;padding:9px 13px;font-size:13px;color:var(--ink-2)">📌 ${t ? t.advice : ""}</div>
        </div>` + groupHTML;
      bindTreeToggles($("#search-results"));
      scanFx();
      return;
    }
    $("#search-count").textContent = (kw || filtered)
      ? `共 ${list.length} 道题目`
      : "输入关键词试试：导数 / 离心率 / 隐零点 / 错位相减；或从题型树点「看全部」按分类浏览";
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
    const mgNums = new Set(mustGetNumbers(p));
    const quick = qs.length
      ? `<div style="margin:10px 0 12px">${qs.map(q => `<a class="chip" href="question.html?id=${q.id}"
           title="${qTitle(q)}" ${mgNums.has(q.number) ? 'style="border-color:var(--easy);color:var(--easy)"' : ""}>${q.number}</a>`).join("")}
         <span style="font-size:12px;color:var(--ink-3)">（绿色 = 建议先拿）</span></div>`
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
            `<a class="pdf-btn" href="${f.file}" download>📄 ${f.label}<small>点击下载 · ${f.size || "PDF"}</small></a>`).join("")}</div>` : ""}
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
  const packs = mustGetPacks(subId);

  if (!packs.length) {
    box.innerHTML = `<div class="card"><h3 style="font-size:16px">✅ 必拿分练习 · 整理中</h3>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px">${data.name}的完整试卷还在录入，先到<a href="math.html">数学板块</a>刷必拿题。</p></div>`;
    return;
  }

  const totalQ = packs.reduce((s, p) => s + p.questions.length, 0);
  const avgScore = Math.round(packs.reduce((s, p) => s + p.score, 0) / packs.length);
  const sum = $("#practice-sum");
  if (sum) sum.textContent = `${packs.length} 套真题 · 每套约 ${avgScore} 分保底分——全部刷熟，及格线就稳了。`;

  /* 各年折叠（与历年真题一致）：默认只显示年份行，点开才出题卡 */
  box.innerHTML = packs.map(pk => `
    <div class="tree-t1 reveal" id="y${pk.paper.year}">
      <div class="tree-row t1-row" data-toggle>
        <span class="tree-arrow">›</span><b>${pk.paper.name}</b>${paperBadge(pk.paper)}
        <span class="pk-score">${pk.questions.length} 题 · ${pk.score} 分</span>
        <span class="t1-meta"><a class="tree-all" href="years.html#y${pk.paper.year}">看整卷 →</a></span>
      </div>
      <div class="tree-children hidden">
        <div class="pick-grid" style="margin-top:10px">
          ${pk.questions.map(q => `<a class="pick" href="question.html?id=${q.id}">
            <span class="pk-top"><span>第${q.number}题 · ${q.section} ${q.score}分</span>${diffBadge(q.difficulty)}</span>
            <b>${qTitle(q)}</b>
            <span class="pk-go">做题 + 分步解析 →</span>
          </a>`).join("")}
        </div>
      </div>
    </div>`).join("");
  bindTreeToggles(box);
  openFromHash(box);

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
function renderQuestion() {
  const id = new URLSearchParams(location.search).get("id") || (ALL_QUESTIONS[0] && ALL_QUESTIONS[0].id);
  const q = questionById(id);
  const box = $("#q-container");

  if (!q) {
    box.innerHTML = `<div class="card"><h2>未找到该题目</h2>
      <p style="margin-top:8px;color:var(--ink-2)">编号 ${id} 不存在，可能尚未录入。</p>
      <p style="margin-top:14px"><a class="btn btn-brand" href="years.html">← 返回考题练习</a>
      <a class="btn btn-soft" href="search.html">去搜索</a></p></div>`;
    return;
  }

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

  const siblings = ALL_QUESTIONS.filter(x => x.paperId === q.paperId).sort((a, b) => a.number - b.number);
  const sibHTML = siblings.map(x => `<a href="question.html?id=${x.id}" class="${x.id === q.id ? "current" : ""}"
                 title="${qTitle(x)}">${x.number}</a>`).join("");
  const idx = siblings.findIndex(x => x.id === q.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const pager = `<div class="q-pager">
    ${prev ? `<a class="btn btn-soft" href="question.html?id=${prev.id}">← 第${prev.number}题</a>` : ""}
    ${next ? `<a class="btn btn-brand" href="question.html?id=${next.id}">第${next.number}题 →</a>` : ""}
  </div>`;

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
      <div class="q-field"><div class="k">年份 / 位置</div><div class="v">${p.year} · ${q.section} 第${q.number}题 · ${q.score}分</div></div>
      <div class="q-field"><div class="k">难度</div><div class="v">${DIFF_LABEL[q.difficulty]}（${q.difficulty}/5）</div></div>
      <div class="q-field"><div class="k">复习优先级</div><div class="v">${q.priority}</div></div>
      <div class="q-field"><div class="k">主专题</div><div class="v"><a href="search.html?topic=${q.topic}">${t.name}</a></div></div>
      <div class="q-field"><div class="k">子专题</div><div class="v"><a href="search.html?sub=${encodeURIComponent(q.subTopic)}&subject=${q.subject}">${q.subTopic}</a></div></div>
      <div class="q-field"><div class="k">题型</div><div class="v"><a href="search.html?q=${encodeURIComponent(q.type)}" title="看同题型的题">${q.type}${sameType > 1 ? ` · ${sameType}题` : ""}</a></div></div>
    </div>

    ${q.method ? `<div style="margin-top:16px"><a class="chip method-chip" href="search.html?q=${encodeURIComponent(q.method)}" title="看用同一方法的题">🔧 解题方法：${q.method}</a>${tags}</div>` : `<div style="margin-top:16px">${tags}</div>`}
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
    ${relatedBlock}

    <h3 style="margin-top:26px">📄 本卷已录入题目</h3>
    <div class="paper-nav">${sibHTML}</div>
    ${pager}

    <p style="margin-top:24px">
      <a class="btn btn-brand" href="${SUBJECT_META.find(m => m.id === q.subject).page}">← 返回${subjectName(q.subject)}</a>
      <a class="btn btn-soft" href="years.html?subject=${q.subject}">考题练习</a>
    </p>
  </div>`;

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
    question: renderQuestion
  };
  (renderers[page] || (() => {}))();

  /* 搜索联想：全站所有搜索框 */
  $$("input[type=search], #search-input").forEach(attachSuggest);

  /* 静态元素动效 */
  scanFx();
});
