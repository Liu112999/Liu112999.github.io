/* =====================================================================
   苏考图谱 · 页面渲染逻辑 (js/main.js)
   ---------------------------------------------------------------------
   从 data-math.js / data-chinese.js / data-english.js 读取数据，
   实时计算频次、难度、优先级统计，并根据 <body data-page="..."> 渲染页面。
   往数据文件里添加真题后，全站所有统计、排行、题型树、搜索自动更新。
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

function paperOf(q)       { return ALL_PAPERS.find(p => p.id === q.paperId); }
function topicOf(id)      { return ALL_TOPICS.find(t => t.id === id); }
function questionById(id) { return ALL_QUESTIONS.find(q => q.id === id); }
function subjectName(id)  { return (SUBJECT_META.find(s => s.id === id) || {}).name || ""; }

/* 当前科目：URL ?subject= 参数 > 页面 data-subject 属性 > 默认数学 */
function currentSubjectId() {
  const fromUrl = new URLSearchParams(location.search).get("subject");
  const id = fromUrl || document.body.dataset.subject || "math";
  return SUBJECT_DATA[id] ? id : "math";
}

function diffBand(d) { return d <= 2 ? "easy" : d === 3 ? "medium" : "hard"; }
function diffBadge(d) {
  return `<span class="badge badge-${diffBand(d)}">${DIFF_LABEL[d]}</span>`;
}
function priBadgeShort(p) {
  const cls = p === "高" ? "hi" : p === "中" ? "mid" : "low";
  return `<span class="badge badge-${cls}">${p}</span>`;
}
function paperBadge(p) {
  return p.type === "真题"
    ? `<span class="badge badge-paper">真题</span>`
    : `<span class="badge badge-mock">模拟</span>`;
}

/* ---------- 统计计算 ---------- */

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
    return {
      topic: t, count, score,
      scoreShare: totalScore ? (score / totalScore * 100) : 0,
      avgDiff, dist, questions: qs
    };
  });
}

/* ---------- 通用渲染片段 ---------- */

function barRowHTML(label, value, max, extra) {
  const w = max ? Math.round(value / max * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
    <div class="bar-num">${extra}</div>
  </div>`;
}

function distHTML(dist) {
  const total = dist.easy + dist.medium + dist.hard || 1;
  const p = k => (dist[k] / total * 100).toFixed(1);
  return `<div class="dist">
    <div class="d-easy" style="width:${p("easy")}%"></div>
    <div class="d-mid"  style="width:${p("medium")}%"></div>
    <div class="d-hard" style="width:${p("hard")}%"></div>
  </div>
  <div class="dist-legend">
    <span><span class="dot" style="background:var(--easy)"></span>易 ${dist.easy}</span>
    <span><span class="dot" style="background:var(--medium)"></span>中 ${dist.medium}</span>
    <span><span class="dot" style="background:var(--hard)"></span>难 ${dist.hard}</span>
  </div>`;
}

/* 扇形图（纯 CSS conic-gradient，无需图表库） */
const PIE_COLORS = ["#23406E", "#B4532F", "#5E7C4A", "#C9A227", "#7A5C99", "#3A7C8C", "#8B6F4E", "#9BA3B0", "#D98C63", "#6B8E8E", "#A44A5E", "#4E6E9E"];
function pieHTML(items) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  const stops = items.map((it, i) => {
    const from = acc / total * 360; acc += it.value;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${from}deg ${acc / total * 360}deg`;
  });
  const legend = items.map((it, i) => `<div class="pie-leg-row">
    <span class="dot" style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></span>
    ${it.label}<b>${(it.value / total * 100).toFixed(1)}%</b>
  </div>`).join("");
  return `<div class="pie-wrap">
    <div class="pie" style="background:conic-gradient(${stops.join(",")})"></div>
    <div class="pie-legend">${legend}</div>
  </div>`;
}

/* 科目切换标签 */
function subjectTabsHTML(current, page) {
  return SUBJECT_META.map(m => {
    const beta = SUBJECT_DATA[m.id].status === "beta" ? `<span class="beta-dot">◐</span>` : "";
    return `<a class="${m.id === current ? "on" : ""}" href="${page}?subject=${m.id}">${m.name}${beta}</a>`;
  }).join("");
}

/* 内联题目卡（题型树、搜索结果共用）——点开就能看题 */
function qCardHTML(q, opts = {}) {
  const p = paperOf(q);
  const subj = opts.showSubject ? `<span class="badge badge-low">${subjectName(q.subject)}</span> ` : "";
  return `<div class="q-card">
    <div class="q-card-top">
      <span class="q-card-src">${subj}${p.year} ${p.type} · 第${q.number}题 · ${q.section} ${q.score}分</span>
      ${diffBadge(q.difficulty)}
    </div>
    <div class="q-card-title">${q.type}</div>
    <div class="q-card-tags">
      ${q.method ? `<span class="chip method-chip">🔧 ${q.method}</span>` : ""}
      ${(q.tags || []).map(t => `<span class="chip">${t}</span>`).join("")}
    </div>
    ${q.note ? `<div class="q-card-note">💡 ${q.note}</div>` : ""}
    <a class="q-card-more" href="question.html?id=${q.id}">完整档案 →</a>
  </div>`;
}

function questionTableHTML(qs) {
  const rows = qs.map(q => `
    <tr class="clickable" data-id="${q.id}">
      <td><b>第${q.number}题</b></td>
      <td>${q.section}</td>
      <td>${q.score}分</td>
      <td>${topicOf(q.topic).name}</td>
      <td>${q.subTopic}</td>
      <td>${q.type}</td>
      <td>${q.method || "—"}</td>
      <td>${diffBadge(q.difficulty)}</td>
      <td>${priBadgeShort(q.priority)}</td>
    </tr>`).join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>题号</th><th>位置</th><th>分值</th><th>主专题</th>
      <th>子专题</th><th>题型</th><th>解题方法</th><th>难度</th><th>优先级</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function bindRowClicks(root = document) {
  $$("tr.clickable", root).forEach(tr => {
    tr.addEventListener("click", () => {
      location.href = "question.html?id=" + tr.dataset.id;
    });
  });
}

/* ======================================================
   各页面渲染
   ====================================================== */

/* ---------- 首页 ---------- */
function renderHome() {
  const parsed = ALL_PAPERS.filter(p => p.status !== "整理中");
  const types = new Set(ALL_QUESTIONS.map(q => q.type)).size;
  $("#home-stat-line").textContent =
    `已拆解 ${parsed.length} 套试卷 · ${ALL_QUESTIONS.length} 道题 · ${types} 种题型（示例数据）`;
  SUBJECT_META.forEach(m => {
    const el = $("#cnt-" + m.id);
    if (el) el.textContent = SUBJECT_DATA[m.id].questions.length;
  });
}

/* ---------- 科目页（数学/语文/英语共用）：统计 + 题型排行 + 题型树 ---------- */
function renderSubject() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  const total = data.questions.length;

  /* 顶部统计 */
  const parsed = data.papers.filter(p => p.status !== "整理中");
  const typeCounts = {};
  data.questions.forEach(q => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if ($("#s-questions")) $("#s-questions").textContent = total;
  if ($("#s-papers"))    $("#s-papers").textContent = parsed.length;
  if ($("#s-types"))     $("#s-types").textContent = Object.keys(typeCounts).length;
  if ($("#s-top"))       $("#s-top").textContent = topType ? topType[0] : "—";

  const line = $("#subject-stat-line");
  if (line) {
    line.textContent = data.status === "beta"
      ? `框架已就绪，示例题目 ${total} 道，真实数据整理中——录入后所有统计自动更新。`
      : `已拆解 ${parsed.length} 套试卷、${total} 道题（示例数据），点开下方任意题型直接看题。`;
  }

  /* 优先拿分板块 chips */
  const priBox = $("#priority-chips");
  if (priBox) {
    priBox.innerHTML = data.topics.filter(t => t.priority === "高")
      .map(t => `<a class="chip" href="stats.html?subject=${subId}" title="${t.advice}">${t.name}</a>`).join("");
  }

  /* 板块框架列表（语文/英语页） */
  const fw = $("#framework-list");
  if (fw) {
    fw.innerHTML = data.topics.map(t => `
      <div class="card topic-card">
        <div class="t-head"><h3>${t.name}</h3>${priBadgeShort(t.priority)}</div>
        <div class="t-sections">位置：${t.sections.join("、")}</div>
        <div>${t.subTopics.map(x => `<span class="chip">${x}</span>`).join("")}</div>
        <div class="t-advice">📌 ${t.advice}</div>
      </div>`).join("");
  }

  drawTypeRank(subId);
  drawTree(subId);
}

/* 高频题型排行（带占比 %） */
function drawTypeRank(subId) {
  const box = $("#type-rank");
  if (!box) return;
  const qs = SUBJECT_DATA[subId].questions;
  const total = qs.length || 1;
  const map = {};
  qs.forEach(q => {
    if (!map[q.type]) map[q.type] = { count: 0, sample: q };
    map[q.type].count++;
  });
  const arr = Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  if (!arr.length) { box.innerHTML = `<p class="q-empty">数据整理中。</p>`; return; }
  const max = arr[0][1].count;
  box.innerHTML = arr.map(([name, o], i) => {
    const t = topicOf(o.sample.topic);
    return `<div class="rank-row">
      <span class="rank-no ${i < 3 ? "top" : ""}">${i + 1}</span>
      <div class="rank-main">
        <div class="rank-name">${name}</div>
        <div class="rank-path">${t.name} › ${o.sample.subTopic}</div>
      </div>
      <div class="bar-track rank-bar"><div class="bar-fill" style="width:${o.count / max * 100}%"></div></div>
      <span class="rank-count">${o.count}次·${(o.count / total * 100).toFixed(0)}%</span>
    </div>`;
  }).join("");
}

/* 题型树：专题 → 子专题 → 题型 → 题目卡（题目直接内联展示） */
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
              const cards = qs2.sort((a, b) => paperOf(b).year - paperOf(a).year)
                .map(q => qCardHTML(q)).join("");
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
              <span class="tree-count">${qs1.length} 题 · ${Object.keys(typeGroups).length} 种题型 <a class="tree-all" href="search.html?sub=${encodeURIComponent(subName)}&subject=${subId}">看全部 →</a></span>
            </div>
            <div class="tree-children hidden">${typesHTML}</div>
          </div>`;
        }).join("");
    }

    const meta = s.count ? `${s.count} 题 · 占分 ${s.scoreShare.toFixed(1)}%` : "整理中";
    return `<div class="tree-t1">
      <div class="tree-row t1-row" data-toggle>
        <span class="tree-arrow">›</span><b>${s.topic.name}</b>${priBadgeShort(s.topic.priority)}
        <span class="t1-meta">${meta}${s.count ? ` <a class="tree-all" href="search.html?topic=${s.topic.id}">看全部 →</a>` : ""}</span>
      </div>
      <div class="tree-children hidden">${children}</div>
    </div>`;
  }).join("");

  $$("#tree-container [data-toggle]").forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;   /* 点“看全部”链接时不触发折叠 */
      row.classList.toggle("open");
      const children = row.nextElementSibling;
      if (children) children.classList.toggle("hidden");
    });
  });
}

/* ---------- 统计页：大题型 / 小题型 / 方法 三个维度 + 难度 + 四象限 + 总表 ---------- */
function renderStats() {
  const subId = currentSubjectId();
  $("#subject-tabs").innerHTML = subjectTabsHTML(subId, "stats.html");

  const stats = computeTopicStats(subId);
  const nonzero = stats.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const qs = SUBJECT_DATA[subId].questions;

  /* 扇形图：大题型（主专题）占分比例——哪块占分最多，先复习哪块 */
  $("#pie-topics").innerHTML = nonzero.length
    ? pieHTML([...nonzero].sort((a, b) => b.score - a.score)
        .map(s => ({ label: s.topic.name, value: s.score })))
    : `<p class="q-empty">数据整理中。</p>`;

  /* 条形图：大题型出现次数 */
  $("#bars-topics").innerHTML = nonzero.length
    ? nonzero.map(s => barRowHTML(s.topic.name, s.count, nonzero[0].count, s.count + " 题")).join("")
    : `<p class="q-empty">数据整理中。</p>`;

  /* 条形图：小题型（子专题）出现次数 TOP10 */
  const subCounts = {};
  qs.forEach(q => { subCounts[q.subTopic] = (subCounts[q.subTopic] || 0) + 1; });
  const subArr = Object.entries(subCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $("#bars-subtopics").innerHTML = subArr.length
    ? subArr.map(([n, c]) => barRowHTML(n, c, subArr[0][1], c + " 题")).join("")
    : `<p class="q-empty">数据整理中。</p>`;

  /* 条形图：解题方法出现次数 TOP10——反复考的方法就是该练熟的套路 */
  const mCounts = {};
  qs.forEach(q => { if (q.method) mCounts[q.method] = (mCounts[q.method] || 0) + 1; });
  const mArr = Object.entries(mCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $("#bars-methods").innerHTML = mArr.length
    ? mArr.map(([n, c]) => barRowHTML(n, c, mArr[0][1], c + " 次")).join("")
    : `<p class="q-empty">数据整理中。</p>`;

  /* 难度分布 */
  $("#dist-list").innerHTML = nonzero.map(s => `<div class="dist-item">
    <div class="dist-label">${s.topic.name}<span>${s.count}题 · 平均难度 ${s.avgDiff.toFixed(1)}</span></div>
    ${distHTML(s.dist)}
  </div>`).join("") || `<p class="q-empty">数据整理中。</p>`;

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
}

/* 复习四象限：频次 × 难度 */
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
      ? list.map(s => `<span class="chip" title="出现${s.count}次 · 平均难度${s.avgDiff.toFixed(1)}">${s.topic.name}</span>`).join("")
      : `<span class="q-empty">暂无</span>`;
  };
  box.innerHTML = `<div class="quad-grid">
    <div class="quad q-secure"><h4>✅ 必拿分区 <small>高频 × 易</small></h4>
      <p class="quad-tip">考得多、难度低——第一优先级：练到一分不丢，这是中游提分的根基。</p>${chips(true, false)}</div>
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
  const filtered = !!(topicParam || subParam);

  /* 分类筛选基集（从题型树/档案页点进来时） */
  const base = ALL_QUESTIONS.filter(q =>
    (!topicParam || q.topic === topicParam) &&
    (!subParam || q.subTopic === subParam) &&
    (!subjParam || q.subject === subjParam));

  /* 筛选上下文提示条 */
  const ctxBox = $("#search-ctx");
  if (ctxBox) {
    let label = "";
    if (topicParam) { const t = topicOf(topicParam); if (t) label = "专题：" + t.name; }
    if (subParam) label = (label ? label + " · " : "") + "子专题：" + subParam;
    ctxBox.innerHTML = label
      ? `<span class="search-ctx">📂 ${label}<a href="search.html" title="清除筛选">✕ 清除</a></span>`
      : "";
  }

  const run = () => {
    const kw = input.value.trim().toLowerCase();
    let list = base;
    if (kw) {
      const words = kw.split(/\s+/);
      list = base.filter(q => {
        const p = paperOf(q), t = topicOf(q.topic);
        const hay = [q.id, q.type, q.subTopic, t.name, q.method || "", q.note || "",
          q.stem || "", (q.tags || []).join(" "), p.name, String(p.year), q.section
        ].join(" ").toLowerCase();
        return words.every(w => hay.includes(w));
      });
    } else if (!filtered) {
      list = [];
    }
    list = [...list].sort((a, b) => paperOf(b).year - paperOf(a).year);
    $("#search-count").textContent = (kw || filtered)
      ? `共 ${list.length} 道题目`
      : "输入关键词搜索，例如：导数 / 隐零点 / 双曲线 / 全概率 / 续写；或从题型树点「看全部」按分类浏览";
    $("#search-results").innerHTML = list.map(q => qCardHTML(q, { showSubject: true })).join("");
  };

  input.addEventListener("input", run);
  run();
  if (!filtered) input.focus();
}

/* ---------- 历年试卷页 ---------- */
function renderYears() {
  const subId = currentSubjectId();
  const data = SUBJECT_DATA[subId];
  $("#subject-tabs").innerHTML = subjectTabsHTML(subId, "years.html");

  const era = $("#era-card");
  if (era) {
    era.innerHTML = subId !== "math" ? "" : `<div class="card" style="margin-bottom:24px">
      <h3 style="font-size:16px;margin-bottom:6px">📜 2016–2026：江苏数学卷的三个时代</h3>
      <p style="font-size:13px;color:var(--ink-2);margin-bottom:14px">
        结构变过两次，所以跨年对比按「题型」而不是「题号」。</p>
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

  const years = [...new Set(data.papers.map(p => p.year))].sort((a, b) => b - a);
  $("#years-container").innerHTML = years.map(year => {
    const papers = data.papers.filter(p => p.year === year);
    const papersHTML = papers.map(p => {
      const qs = data.questions.filter(q => q.paperId === p.id)
        .sort((a, b) => a.number - b.number);
      let body;
      if (p.status === "整理中") {
        body = `<div class="notice">该试卷正在拆解整理中。</div>`;
      } else {
        const note = p.status === "部分整理"
          ? `<div class="notice" style="margin-bottom:12px">部分整理（已录入 ${qs.length}/${p.total} 题），持续更新中。</div>`
          : "";
        body = note + questionTableHTML(qs);
      }
      return `<div class="card paper-card">
        <div class="paper-head"><h3>${p.name}</h3>${paperBadge(p)}
          <span class="badge badge-low">${p.status}</span></div>
        <div class="paper-meta">${p.structure || ""} · 共 ${p.total} 题 · 已录入 ${qs.length} 题${qs.length ? " · 点击行看题目档案" : ""}</div>
        ${body}
      </div>`;
    }).join("");
    return `<div class="year-block"><h2>${year} 年</h2>${papersHTML}</div>`;
  }).join("");

  bindRowClicks();
}

/* ---------- 题目档案页 ---------- */
function renderQuestion() {
  const id = new URLSearchParams(location.search).get("id") || "2025-XK1-19";
  const q = questionById(id);
  const box = $("#q-container");

  if (!q) {
    box.innerHTML = `<div class="card"><h2>未找到该题目</h2>
      <p style="margin-top:8px;color:var(--ink-2)">编号 ${id} 不存在，可能尚未录入。</p>
      <p style="margin-top:14px"><a class="btn btn-brand" href="years.html">← 返回历年试卷</a>
      <a class="btn btn-brand" style="background:var(--ink-2)" href="search.html">去搜索</a></p></div>`;
    return;
  }

  const p = paperOf(q);
  const t = topicOf(q.topic);
  const tags = q.tags.length
    ? q.tags.map(tag => `<span class="chip">${tag}</span>`).join("")
    : `<span class="chip">暂无标签</span>`;

  const stemBlock = q.stem
    ? `<div class="stem-block"><div class="stem-k">题干</div>${q.stem}
       ${q.image ? `<img class="q-img${q.imageWide ? " q-img-wide" : ""}" src="${q.image}" alt="第${q.number}题截图">` : ""}</div>`
    : (q.image ? `<img class="q-img${q.imageWide ? " q-img-wide" : ""}" src="${q.image}" alt="第${q.number}题截图">` : "");

  const related = (q.related || []).map(rid => {
    const rq = questionById(rid);
    if (!rq) return "";
    const rp = paperOf(rq);
    return `<a class="related-item" href="question.html?id=${rq.id}">
      <span><b>${rp.name}</b> · 第${rq.number}题 —— ${rq.type}${rq.method ? `（${rq.method}）` : ""}</span>
      <span>${diffBadge(rq.difficulty)}</span>
    </a>`;
  }).join("");
  const relatedBlock = related
    ? `<h3 style="margin-top:26px">🔁 相似题（同结构跨年出现）</h3>${related}`
    : `<p style="margin-top:26px;color:var(--ink-3);font-size:14px">该题暂未关联相似题。</p>`;

  const siblings = ALL_QUESTIONS.filter(x => x.paperId === q.paperId)
    .sort((a, b) => a.number - b.number)
    .map(x => `<a href="question.html?id=${x.id}" class="${x.id === q.id ? "current" : ""}"
                 title="${x.type}">${x.number}</a>`).join("");

  /* 提示层：从解析中抽出破题句，先给提示不剧透 */
  let hintBlock = "";
  const ideaMatch = (q.solution || "").match(/<div class="sol-idea">[\s\S]*?<\/div>/);
  if (ideaMatch) {
    hintBlock = `<details class="sol-box sol-hint">
      <summary>💡 卡住了？先看提示（不剧透答案）</summary>
      <div class="sol-body">${ideaMatch[0]}</div>
    </details>`;
  }

  box.innerHTML = `<div class="card">
    <div class="paper-head">
      <h2 style="font-size:20px">${p.name} · 第${q.number}题</h2>
      ${paperBadge(p)} ${priBadgeShort(q.priority)}
      <span class="badge badge-low">${subjectName(q.subject)}</span>
    </div>
    <p style="color:var(--ink-2);font-size:15px;margin-top:4px">${q.type}</p>

    <div class="q-detail-grid">
      <div class="q-field"><div class="k">年份</div><div class="v">${p.year}</div></div>
      <div class="q-field"><div class="k">位置 / 分值</div><div class="v">${q.section} · ${q.score}分</div></div>
      <div class="q-field"><div class="k">难度</div><div class="v">${DIFF_LABEL[q.difficulty]}（${q.difficulty}/5）</div></div>
      <div class="q-field"><div class="k">主专题</div><div class="v"><a href="search.html?topic=${q.topic}">${t.name}</a></div></div>
      <div class="q-field"><div class="k">子专题</div><div class="v"><a href="search.html?sub=${encodeURIComponent(q.subTopic)}&subject=${q.subject}">${q.subTopic}</a></div></div>
      <div class="q-field"><div class="k">复习优先级</div><div class="v">${q.priority}</div></div>
    </div>

    ${q.method ? `<div style="margin-top:16px"><a class="chip method-chip" href="search.html?q=${encodeURIComponent(q.method)}" title="看用同一方法的题">🔧 解题方法：${q.method}</a></div>` : ""}
    <div style="margin-top:10px">${tags}</div>
    ${stemBlock}
    ${hintBlock}
    ${(q.answer || q.solution) ? `
    <details class="sol-box">
      <summary>📖 查看答案与完整解析</summary>
      ${q.answer ? `<div class="sol-ans"><b>答案：</b>${q.answer}</div>` : ""}
      ${q.solution ? `<div class="sol-body">${q.solution}</div>` : ""}
    </details>` : ""}
    ${q.note ? `<div class="q-note">💡 复习备注：${q.note}</div>` : ""}
    ${relatedBlock}

    <h3 style="margin-top:26px">📄 本卷已录入题目</h3>
    <div class="paper-nav">${siblings}</div>

    <p style="margin-top:24px">
      <a class="btn btn-brand" href="${SUBJECT_META.find(m => m.id === q.subject).page}">← 返回${subjectName(q.subject)}</a>
      <a class="btn btn-brand" style="background:var(--ink-2)" href="years.html?subject=${q.subject}">历年试卷</a>
    </p>
  </div>`;

  /* 定义词条:点击展开/收起(红色虚线词) */
  box.addEventListener("click", e => {
    if (e.target.closest(".term-pop")) return;   /* 点弹出框内部不收起 */
    const term = e.target.closest(".term");
    if (term) term.classList.toggle("open");
  });

  /* 数学公式渲染(仅档案页引入 KaTeX;未引入时自动跳过) */
  if (window.renderMathInElement) {
    renderMathInElement(box, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true }
      ],
      throwOnError: false
    });
  }
}

/* ---------- 页面分发 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const renderers = {
    home: renderHome,
    subject: renderSubject,
    stats: renderStats,
    search: renderSearch,
    years: renderYears,
    question: renderQuestion
  };
  (renderers[page] || (() => {}))();
});
