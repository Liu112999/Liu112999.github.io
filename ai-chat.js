/* =====================================================================
   苏考图谱 · AI 学习助手（js/ai-chat.js）
   ---------------------------------------------------------------------
   自包含模块：在页面上生成右下角悬浮入口 + 站内对话面板。
   哪个页面想要 AI 助手，就在该页面加一行：
     <script src="js/ai-chat.js" defer></script>

   安全边界：本文件只知道我们自己的代理地址（Cloudflare Worker），
   DeepSeek 的 API key 永远只存在服务端环境变量里，前端没有任何秘密。

   渲染安全：AI 返回的 Markdown 走「先转义、再排版」的白名单渲染器，
   模型输出的任何 HTML 都会被当作纯文本，杜绝脚本注入。
   ===================================================================== */
(function () {
  "use strict";

  /* =========== 配置（要改的都在这里） =========== */
  const AI_CFG = {
    /* 我们自己的后端地址（Cloudflare Worker）。换 Worker 就改这一行，结尾要带 /api/chat */
    endpoint: "https://sukao-ai.zongnan999.workers.dev/api/chat",

    /* 本地开发（node server/dev.mjs）时自动使用，不用改 */
    devEndpoint: "http://127.0.0.1:8787/api/chat",

    name: "AI 学习助手",
    subtitle: "苏考图谱 · 有问题随时问",
    launcherText: "有疑问？问问 AI",
    welcome: "你好，我是 AI 学习助手 👋\n数学题卡住了、语文英语有疑问，都可以直接问我，公式和解题步骤我都能写清楚。",
    /* 欢迎界面的建议问题（点一下直接发送） */
    chips: [
      "错位相减法求和的步骤是什么？",
      "三角函数求最值有什么通用套路？",
      "议论文开头怎么写更抓人？",
    ],
    placeholder: "输入你的问题…",
    footNote: "内容由 AI 生成，可能出错，重要结论请自己再核对",

    maxInputChars: 4000,   /* 与服务端 MAX_INPUT_CHARS 保持一致 */
    keepMessages: 30,      /* 本地会话最多保留多少条消息 */
    dailyMax: 30,          /* 每天最多提问次数（与服务端 DAILY_MAX 保持一致） */
    storageKey: "sukao.ai.chat.v1",
    quotaKey: "sukao.ai.quota.v1",
    searchKey: "sukao.ai.search.v1",   /* 联网开关的记忆 */
    dockKey: "sukao.ai.dock.v1",       /* 入口收起/展开的记忆 */
    maxAttach: 3,                      /* 一条消息最多带几个附件（总数上限，图/文件任意组合） */

    /* 附件：图片发送前在浏览器里压缩；txt/md 文件直接读成文字 */
    imageMaxDim: 1600,               /* 压缩后最长边（像素） */
    imageQuality: 0.85,
    imageMaxSrcMB: 10,               /* 原图超过这个大小直接拒收 */
    imageMaxChars: 4 * 1024 * 1024,  /* 压缩后 base64 上限，与服务端 MAX_IMAGE_CHARS 一致 */
    thumbDim: 320,                   /* 会话里保留的缩略图尺寸 */
    fileMaxKB: 200,
    fileMaxChars: 20000,             /* 附件正文最多取多少字（服务端 MAX_INPUT_CHARS 要装得下） */
    docMaxMB: 20,                    /* Word/Excel/PPT/PDF 原文件大小上限 */
    pdfMaxPages: 30,                 /* PDF 最多读多少页 */

    /* PDF 解析用的本地 pdf.js（build-github 会把路径拍平，别改成 CDN）。
       必须用 v3 的传统脚本版（.js 不是 .mjs）：老板的标准验收动作是双击 index.html，
       file:// 协议下浏览器一律禁止加载 ES 模块——换 .mjs 版会让本地所有 PDF 全挂，实测教训。
       cmaps 是中文 PDF 的编码表：考试机构工具链的 PDF 常用预定义 CMap，
       没有它们提取结果是「空」（不是乱码），也是实测教训 */
    pdfJs: "pdf.min.js",
    pdfWorker: "pdf.worker.min.js",
    pdfCmaps: "./",

    /* KaTeX 本地文件（build-github 会把路径拍平，别改成 CDN） */
    katexCss: "katex.min.css",
    katexJs: "katex.min.js",
    katexAuto: "auto-render.min.js",
  };

  /* =========== 小工具 =========== */
  const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function apiEndpoint() {
    if (AI_CFG.endpoint) return AI_CFG.endpoint;
    const h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || location.protocol === "file:") return AI_CFG.devEndpoint;
    return "";   /* 线上但还没配置 → 面板里给出友好提示 */
  }

  /* 会话存取：只存在本标签页（sessionStorage），关标签即清，不留隐私 */
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem(AI_CFG.storageKey) || "[]"); }
    catch (e) { return []; }
  }
  function saveHistory() {
    try {
      /* 压缩原图（imageFulls，每张 1–2MB）不落存储：识别完就没用了，留着会把 sessionStorage 撑爆 */
      const slim = history.slice(-AI_CFG.keepMessages).map(m => {
        if (!m.imageFulls && !m.imageFull) return m;
        const copy = Object.assign({}, m);
        delete copy.imageFulls;
        delete copy.imageFull;
        return copy;
      });
      sessionStorage.setItem(AI_CFG.storageKey, JSON.stringify(slim));
    } catch (e) {}
  }

  /* 发给服务端的消息：历史图片已换成识别文字；只有最新一条可能带真图片 */
  function apiMessages() {
    const msgs = history.slice(-AI_CFG.keepMessages);
    return msgs.map((m, i) => {
      const out = { role: m.role, content: m.content || "" };
      if (m.visionText) {
        out.content = `【图片内容（自动识别）】\n${m.visionText}` + (m.content ? `\n\n${m.content}` : "");
      }
      if (i === msgs.length - 1 && !m.visionText) {
        const fulls = m.imageFulls || (m.imageFull ? [m.imageFull] : []);
        if (fulls.length) out.images = fulls;
      }
      return out;
    });
  }

  /* 每日提问计数（localStorage，按本机自然日）。管住正常使用就够；服务端另有一道兜底 */
  function quotaToday() {
    try {
      const q = JSON.parse(localStorage.getItem(AI_CFG.quotaKey) || "{}");
      return q.d === new Date().toDateString() ? (q.n || 0) : 0;
    } catch (e) { return 0; }
  }
  function quotaBump() {
    try {
      localStorage.setItem(AI_CFG.quotaKey,
        JSON.stringify({ d: new Date().toDateString(), n: quotaToday() + 1 }));
    } catch (e) {}
  }

  /* =========== 安全 Markdown 渲染（先转义，再排版） =========== */
  /* 支持：段落/标题/有序无序列表/引用/表格/分隔线/粗斜体/行内代码/代码块/链接，
     以及 KaTeX 公式 \( \) \[ \] $$ $$（公式先摘出来保护，不参与 Markdown 解析） */
  function mdRender(src) {
    const stash = [];
    /* 占位符用私有区字符 \uE000/\uE001 包住编号：正文里不可能出现这两个字符，
       还原时不会误伤普通数字 */
    const keep = html => "\uE000" + (stash.push(html) - 1) + "\uE001";

    /* 先剥掉输入里万一出现的哨兵字符本身，杜绝伪造占位符混进还原环节 */
    let s = String(src || "").replace(/[\uE000\uE001]/g, "").replace(/\r\n?/g, "\n");

    /* 1) 代码块（未闭合的也接住，流式输出时常见） */
    s = s.replace(/```[^\n]*\n([\s\S]*?)(```|$)/g, (m, code) =>
      keep(`<pre><code>${esc(code.replace(/\n$/, ""))}</code></pre>`));

    /* 2) 数学公式整段摘出（保留原始定界符，交给 KaTeX auto-render） */
    s = s.replace(/\\\[[\s\S]*?\\\]/g, m => keep(esc(m)));
    s = s.replace(/\$\$[\s\S]*?\$\$/g, m => keep(esc(m)));
    s = s.replace(/\\\([\s\S]*?\\\)/g, m => keep(esc(m)));

    /* 3) 其余全部转义：模型给的任何 HTML 从这里开始都只是文字 */
    s = esc(s);

    /* 4) 行内格式 */
    const inline = t => t
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]\n]*)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    /* 5) 块级结构：逐行扫描 */
    const lines = s.split("\n");
    const out = [];
    let i = 0;
    const isTableSep = l => /^\s*\|?[\s:|\-]+\|?\s*$/.test(l) && l.indexOf("-") >= 0;
    const cells = l => {
      let t = l.trim();
      if (t.startsWith("|")) t = t.slice(1);
      if (t.endsWith("|")) t = t.slice(0, -1);
      return t.split("|").map(c => c.trim());
    };

    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();

      if (!t) { i++; continue; }

      /* 标题 */
      const h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) { out.push(`<h3>${inline(h[2])}</h3>`); i++; continue; }

      /* 分隔线 */
      if (/^([-*_])\1{2,}$/.test(t)) { out.push("<hr>"); i++; continue; }

      /* 引用 */
      if (/^&gt;\s?/.test(t)) {
        const q = [];
        while (i < lines.length && /^&gt;\s?/.test(lines[i].trim())) {
          q.push(lines[i].trim().replace(/^&gt;\s?/, "")); i++;
        }
        out.push(`<blockquote>${inline(q.join("<br>"))}</blockquote>`);
        continue;
      }

      /* 列表（有序/无序、支持缩进嵌套）。
         按缩进空格数分层：以前一律 trim() 会把子步骤拍平并重新编号，
         学生看到的步骤序号就是错的——数学分步讲解里这是硬伤。
         有序列表保留 start：推导常被独立公式打断，否则每段都从 1 重数。 */
      const isItem = l => /^\s*([-*+]|\d+[.、)])\s+/.test(l);
      if (isItem(line)) {
        const items = [];
        while (i < lines.length && isItem(lines[i]) ) {
          const raw = lines[i];
          const indent = (raw.match(/^\s*/) || [""])[0].replace(/\t/g, "  ").length;
          const body = raw.trim();
          const ordered = /^\d+[.、)]\s+/.test(body);
          items.push({
            indent,
            ordered,
            num: ordered ? (parseInt(body, 10) || 1) : 0,
            html: inline(body.replace(/^([-*+]|\d+[.、)])\s+/, "")),
          });
          i++;
        }
        /* 缩进栈 → 嵌套 HTML */
        const build = (from, depth) => {
          let html = "", k = from;
          const ordered = items[k].ordered;
          html += ordered ? `<ol start="${items[k].num}">` : "<ul>";
          while (k < items.length && items[k].indent >= depth) {
            if (items[k].indent > depth) {                 /* 更深一层 → 递归成子列表 */
              const sub = build(k, items[k].indent);
              html = html.replace(/<\/li>$/, "") + sub.html + "</li>";
              k = sub.next;
              continue;
            }
            if (items[k].ordered !== ordered) break;        /* 同层换了列表类型 → 另起一段 */
            html += `<li>${items[k].html}</li>`;
            k++;
          }
          html += ordered ? "</ol>" : "</ul>";
          return { html, next: k };
        };
        let k = 0;
        while (k < items.length) { const r = build(k, items[k].indent); out.push(r.html); k = r.next; }
        continue;
      }

      /* 表格：本行含 | 且下一行是分隔行 */
      if (t.indexOf("|") >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const head = cells(t).map(c => `<th>${inline(c)}</th>`).join("");
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().indexOf("|") >= 0) {
          rows.push(`<tr>${cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`); i++;
        }
        out.push(`<div class="ai-tbl"><table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`);
        continue;
      }

      /* 段落：连续普通行合并，行间用 <br> */
      const p = [t];
      i++;
      while (i < lines.length) {
        const nt = lines[i].trim();
        if (!nt || /^(#{1,6}\s|[-*+]\s|\d+[.、)]\s|&gt;)/.test(nt) ||
            (nt.indexOf("|") >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1]))) break;
        p.push(nt); i++;
      }
      out.push(`<p>${p.map(inline).join("<br>")}</p>`);
    }

    /* 6) 放回代码块与公式 */
    return out.join("").replace(/\uE000(\d+)\uE001/g, (m, n) => stash[+n]);
  }

  /* =========== KaTeX 懒加载（打开面板才加载，不拖慢首页） =========== */
  let katexPromise = null;
  function loadScript(src) {
    return new Promise((ok, bad) => {
      const el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = bad;
      document.head.appendChild(el);
    });
  }
  function loadKatex() {
    if (katexPromise) return katexPromise;
    /* 题目页(question.html)本来就加载了 KaTeX：直接复用，别重复注入 */
    if (typeof window.renderMathInElement === "function") {
      katexPromise = Promise.resolve();
      return katexPromise;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = AI_CFG.katexCss;
    document.head.appendChild(link);
    katexPromise = loadScript(AI_CFG.katexJs)
      .then(() => loadScript(AI_CFG.katexAuto))
      .catch(() => {});   /* KaTeX 加载失败不影响聊天，公式显示为原文 */
    return katexPromise;
  }
  function typeset(el) {
    if (typeof window.renderMathInElement !== "function") return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    } catch (e) {}
  }

  /* =========== 状态 =========== */
  let history = loadHistory();   /* [{role:"user"|"assistant", content:"…"}] */
  /* 联网开关：默认开（AI 只在需要最新信息时才真的去搜，普通解题不搜） */
  let searchOn = (() => {
    try { return localStorage.getItem(AI_CFG.searchKey) !== "0"; } catch (e) { return true; }
  })();
  let built = false;             /* 面板 DOM 是否已创建 */
  let busy = false;              /* 正在等待/接收回答 */
  let ctrl = null;               /* 当前请求的 AbortController */
  let sendAt = 0;                /* 本轮请求发出的时刻（用来挡住误触「停止」）*/
  let stick = true;              /* 是否自动滚到底部 */
  let attachs = [];              /* 待发送附件数组（≤maxAttach）：{kind:"image",full,thumb,name} 或 {kind:"text",name,text}；
                                    学生常常一次带两三个文件（试卷PDF+作业Word），必须支持混搭 */
  const ui = {};                 /* DOM 引用集合 */

  const ICON_SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l1.8 5.1a2.2 2.2 0 0 0 1.34 1.34l5.1 1.8-5.1 1.8a2.2 2.2 0 0 0-1.34 1.34L12 20.1l-1.8-5.1a2.2 2.2 0 0 0-1.34-1.34l-5.1-1.8 5.1-1.8a2.2 2.2 0 0 0 1.34-1.34L12 2.6z"/><path d="M19.4 2.8l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" opacity=".75"/></svg>';
  const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  const ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg>';
  const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
  const ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';

  /* =========== 悬浮入口 =========== */
  function buildLauncher() {
    /* 入口坞 = 左侧一条极细的收纳箭头 + 右侧药丸按钮。
       点箭头把药丸收进屏幕右缘（只留箭头），再点弹回来；状态记在 localStorage，全站生效 */
    const dock = document.createElement("div");
    dock.className = "ai-dock";

    const fold = document.createElement("button");
    fold.type = "button";
    fold.className = "ai-fold";
    fold.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

    const b = document.createElement("button");
    b.type = "button";
    b.className = "ai-launcher";
    b.setAttribute("aria-label", "打开" + AI_CFG.name);
    b.innerHTML = `<span class="ai-lch-ico">${ICON_SPARK}</span><span>${esc(AI_CFG.launcherText)}</span>`;
    b.addEventListener("click", openPanel);

    dock.appendChild(fold);
    dock.appendChild(b);
    document.body.appendChild(dock);
    ui.dock = dock;
    ui.launcher = b;
    ui.fold = fold;

    let folded = false;
    try { folded = localStorage.getItem(AI_CFG.dockKey) === "1"; } catch (e) {}
    applyFold(folded);
    fold.addEventListener("click", () => {
      const f = !ui.dock.classList.contains("folded");
      applyFold(f);
      try { localStorage.setItem(AI_CFG.dockKey, f ? "1" : "0"); } catch (e) {}
    });
  }

  function applyFold(f) {
    ui.dock.classList.toggle("folded", f);
    ui.fold.setAttribute("aria-label", f ? "展开 AI 助手入口" : "收起 AI 助手入口");
    ui.fold.setAttribute("aria-expanded", f ? "false" : "true");
  }

  /* =========== 面板 =========== */
  function buildPanel() {
    if (built) return;
    built = true;

    const p = document.createElement("section");
    p.className = "ai-panel";
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-label", AI_CFG.name);
    p.innerHTML = `
      <div class="ai-head">
        <div class="ai-avatar">${ICON_SPARK}</div>
        <div class="ai-head-t"><b>${esc(AI_CFG.name)}</b><small>${esc(AI_CFG.subtitle)}</small></div>
        <button type="button" class="ai-hbtn ai-clear">清空对话</button>
        <button type="button" class="ai-hbtn ai-close" aria-label="关闭">✕</button>
      </div>
      <div class="ai-body"></div>
      <div class="ai-sr" role="status"></div>
      <div class="ai-foot">
        <div class="ai-preview" hidden></div>
        <div class="ai-composer">
          <span class="ai-attach-wrap">
            <button type="button" class="ai-attach" aria-label="添加图片或文件"
              aria-haspopup="true" aria-expanded="false">${ICON_PLUS}</button>
            <div class="ai-menu" role="menu" aria-label="添加内容"></div>
          </span>
          <button type="button" class="ai-web" aria-pressed="true" aria-label="联网搜索"
            title="联网搜索">${ICON_GLOBE}</button>
          <textarea class="ai-input" rows="1" placeholder="${esc(AI_CFG.placeholder)}"
            aria-label="输入问题" maxlength="${AI_CFG.maxInputChars + 100}"></textarea>
          <button type="button" class="ai-send" aria-label="发送" disabled>${ICON_UP}</button>
        </div>
        <div class="ai-count" hidden></div>
        <div class="ai-foot-note">${esc(AI_CFG.footNote)}</div>
        <div class="ai-toast" role="status"></div>
      </div>`;
    document.body.appendChild(p);

    ui.panel = p;
    ui.body = p.querySelector(".ai-body");
    ui.input = p.querySelector(".ai-input");
    ui.send = p.querySelector(".ai-send");
    ui.count = p.querySelector(".ai-count");
    ui.toast = p.querySelector(".ai-toast");
    ui.sr = p.querySelector(".ai-sr");   /* 屏幕阅读器专用的完成播报区 */

    /* 移动端全屏时把 Tab 圈在面板里（桌面浮窗不拦，页面其余部分仍可用） */
    p.addEventListener("keydown", e => {
      if (e.key !== "Tab" || !matchMedia("(max-width: 620px)").matches) return;
      const f = Array.from(p.querySelectorAll("button, textarea"))
        .filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* —— 事件 —— */
    p.querySelector(".ai-close").addEventListener("click", closePanel);
    p.querySelector(".ai-clear").addEventListener("click", () => {
      if (!history.length) return;
      if (!window.confirm("清空这次对话？")) return;
      if (ctrl) ctrl.abort();
      history = [];
      saveHistory();
      renderAll();
    });

    /* 发送后按钮立刻变「停止」：手快双击会把自己刚发出的提问掐掉，
       表现就是「问了没反应、配额还扣了」。开头 800ms 内忽略停止，躲开误触 */
    ui.send.addEventListener("click", () => {
      if (!busy) { sendFromInput(); return; }
      if (Date.now() - sendAt < 800) return;
      if (ctrl) ctrl.abort();
    });

    ui.input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (!busy) sendFromInput();
      }
    });
    ui.input.addEventListener("input", () => { autosize(); refreshSend(); });

    /* 联网开关：点亮=允许联网（AI 自己判断要不要搜），熄灭=完全不联网 */
    ui.web = p.querySelector(".ai-web");
    applySearchState();
    ui.web.addEventListener("click", () => {
      searchOn = !searchOn;
      try { localStorage.setItem(AI_CFG.searchKey, searchOn ? "1" : "0"); } catch (e) {}
      applySearchState();
      toast(searchOn ? "联网功能已开启" : "联网功能已关闭");
    });

    /* 附件：菜单选择 / 粘贴 / 拖入 */
    ui.attach = p.querySelector(".ai-attach");
    ui.menu = p.querySelector(".ai-menu");
    ui.preview = p.querySelector(".ai-preview");
    buildAttachMenu();
    ui.attach.addEventListener("click", e => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener("click", () => closeMenu());
    ui.input.addEventListener("paste", e => {
      const files = e.clipboardData && e.clipboardData.files;
      if (files && files.length) { e.preventDefault(); Array.from(files).forEach(handleFile); }
    });
    p.addEventListener("dragover", e => e.preventDefault());
    p.addEventListener("drop", e => {
      e.preventDefault();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) Array.from(files).forEach(handleFile);   /* 一次拖多个也接得住 */
    });

    ui.body.addEventListener("scroll", () => {
      stick = ui.body.scrollHeight - ui.body.scrollTop - ui.body.clientHeight < 80;
    });

    document.addEventListener("keydown", e => {
      if (e.key !== "Escape" || e.isComposing) return;
      if (ui.menu && ui.menu.classList.contains("open")) { closeMenu(); return; }   /* 先关菜单再关面板 */
      if (ui.panel.classList.contains("open")) closePanel();
    });

    renderAll();
    loadKatex().then(() => typeset(ui.body));
  }

  function openPanel() {
    buildPanel();
    /* 移动端是全屏（模态），桌面是浮窗（非模态），语义跟着走 */
    if (matchMedia("(max-width: 620px)").matches) ui.panel.setAttribute("aria-modal", "true");
    else ui.panel.removeAttribute("aria-modal");
    ui.panel.classList.add("open");
    ui.dock.classList.add("hide");
    if (matchMedia("(max-width: 620px)").matches) document.body.style.overflow = "hidden";
    scrollBottom(true);
    ui.input.focus();
  }
  function closePanel() {
    ui.panel.classList.remove("open");
    ui.dock.classList.remove("hide");
    document.body.style.overflow = "";
    /* 焦点还给可见的那个：入口收着时药丸是隐藏的，聚焦箭头。
       两个坑：①面板的 visibility 有 .28s 过渡，过渡结束时浏览器会把面板内仍聚焦的元素
       强制 blur，把刚设好的焦点打回 body——所以先主动把焦点移出面板；
       ②刚移除 .hide 的这一帧目标还在过渡态，focus() 会静默失败，故放到下一帧。 */
    if (ui.panel.contains(document.activeElement)) document.activeElement.blur();
    const back = ui.dock.classList.contains("folded") ? ui.fold : ui.launcher;
    void ui.dock.offsetWidth;        /* 强制同步重算样式：坞刚从 visibility:hidden 恢复，
                                        样式没刷新时 focus() 会被静默拒绝（rAF 也早于重算） */
    back.focus();
  }

  /* =========== 消息渲染 =========== */
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.firstElementChild;
  }

  function welcomeHTML() {
    const chips = AI_CFG.chips.map(c =>
      `<button type="button" class="ai-chip">${esc(c)}</button>`).join("");
    return `<div class="ai-msg ai-msg-a ai-hello">
      <div class="ai-bubble"><div class="ai-md"><p>${esc(AI_CFG.welcome).replace(/\n/g, "<br>")}</p></div></div>
      <div class="ai-chips">${chips}</div>
    </div>`;
  }

  /* 用户气泡：文字 / 图片缩略图 / 多个文件名标签，可任意组合
     （m.files 是新格式；m.fileName 是旧会话的单文件格式，兼容渲染） */
  function userBubbleHTML(m) {
    const thumbs = m.images || (m.image ? [m.image] : []);
    const imgs = thumbs.filter(s => /^data:image\//.test(s))
      .map(s => `<img class="ai-uimg" src="${s}" alt="题目图片">`).join("");
    const names = m.files || (m.fileName ? [m.fileName] : []);
    const files = names.map(n => `<span class="ai-filechip">📄 ${esc(n)}</span>`).join("");
    const text = names.length ? (m.displayText || "") : (m.content || "");
    return `<div class="ai-msg ai-msg-u"><div class="ai-bubble">${imgs}${files}${esc(text)}</div></div>`;
  }
  function addUser(entry) {
    ui.body.appendChild(el(userBubbleHTML(entry)));
    scrollBottom();
  }

  /* 助手消息壳：先显示"正在思考"，收到正文后逐步替换 */
  function addAssistantShell() {
    const m = el(`<div class="ai-msg ai-msg-a">
      <div class="ai-bubble"><div class="ai-think" role="status">
        <span class="dots"><i></i><i></i><i></i></span><span class="ai-think-t">正在思考…</span>
      </div><div class="ai-md" hidden></div></div>
    </div>`);
    ui.body.appendChild(m);
    scrollBottom();
    return m;
  }

  function attachCopy(msgEl, raw) {
    const acts = el(`<div class="ai-acts"><button type="button" class="ai-act">复制</button></div>`);
    acts.querySelector(".ai-act").addEventListener("click", () => {
      const done = () => toast("已复制");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(raw).then(done, () => fallbackCopy(raw, done));
      } else fallbackCopy(raw, done);
    });
    msgEl.appendChild(acts);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    ta.remove();
  }

  function showError(message, canRetry) {
    const m = el(`<div class="ai-msg ai-msg-a ai-msg-err">
      <div class="ai-bubble">${esc(message)}</div>
      ${canRetry ? '<button type="button" class="ai-retry">重试</button>' : ""}
    </div>`);
    if (canRetry) m.querySelector(".ai-retry").addEventListener("click", () => {
      if (busy) return;          /* 正在生成别的回答时不允许并发重试 */
      m.remove();
      streamAnswer();
    });
    ui.body.appendChild(m);
    scrollBottom();
  }

  /* 整体重绘（初始化 / 清空后） */
  function renderAll() {
    ui.body.innerHTML = "";
    if (!history.length) {
      const w = el(welcomeHTML());
      w.querySelectorAll(".ai-chip").forEach(c =>
        c.addEventListener("click", () => { if (!busy) send(c.textContent); }));
      ui.body.appendChild(w);
      return;
    }
    history.forEach(m => {
      if (m.role === "user") {
        ui.body.appendChild(el(userBubbleHTML(m)));
      } else {
        const box = el(`<div class="ai-msg ai-msg-a"><div class="ai-bubble"><div class="ai-md"></div></div></div>`);
        box.querySelector(".ai-md").innerHTML = mdRender(m.content);
        const srcs = sourcesHTML(m.sources);
        if (srcs) box.querySelector(".ai-bubble").appendChild(el(srcs));
        attachCopy(box, m.content);
        ui.body.appendChild(box);
      }
    });
    typeset(ui.body);
    scrollBottom(true);
  }

  /* 联网搜索的来源小块：链接全部来自真实搜索结果（服务端 sukao_sources），
     不让模型手写链接——它会有几率写错甚至编造 */
  function sourcesHTML(list) {
    const items = (list || []).slice(0, 5).map(s => {
      const title = esc(String(s.title || "").slice(0, 60));
      if (!title) return "";
      const u = String(s.url || "");
      /* 有链接给链接；没链接（便宜搜索档位）就只列标题，绝不编 */
      return /^https?:\/\//.test(u)
        ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : `<span>${title}</span>`;
    }).filter(Boolean).join("");
    return items ? `<div class="ai-srcs"><b>来源</b>${items}</div>` : "";
  }

  function scrollBottom(force) {
    if (force || stick) ui.body.scrollTop = ui.body.scrollHeight;
  }

  function toast(text) {
    closeMenu();                          /* 同上：提示条要出来时先收菜单 */
    ui.toast.textContent = text;
    ui.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.remove("show"), 2200);
  }

  /* =========== 附件（图片 / 文本文件） =========== */
  function drawScaled(img, maxDim, quality) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);   /* jpeg 没有透明，先铺白底 */
    ctx.drawImage(img, 0, 0, w, h);
    return cv.toDataURL("image/jpeg", quality);
  }
  /* 压缩：手机原图动辄七八 MB，压到长边 1600px 的 jpeg，识别足够清晰、上传又快 */
  function compressImage(file) {
    return new Promise(res => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          let full = drawScaled(img, AI_CFG.imageMaxDim, AI_CFG.imageQuality);
          if (full.length > AI_CFG.imageMaxChars) full = drawScaled(img, 1100, 0.8);
          if (full.length > AI_CFG.imageMaxChars) { res(null); return; }
          res({ full, thumb: drawScaled(img, AI_CFG.thumbDim, 0.8) });
        } catch (e) { res(null); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }

  /* =====================================================================
     Office 文档解析（零依赖）
     docx/xlsx/pptx 本质都是 ZIP 包，里面是 XML。浏览器自带 DecompressionStream
     能解 deflate，所以不用引任何库——自己走一遍 ZIP 目录就能把 XML 抠出来。
     ===================================================================== */

  /* 从 ZIP 里取出指定路径的文件（返回文本）。ZIP 结构：末尾中央目录列出所有条目 */
  async function zipRead(buf, wanted) {
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    /* 1) 找中央目录结束记录（EOCD，签名 0x06054b50），从尾部往前扫 */
    let eocd = -1;
    for (let i = u8.length - 22; i >= 0 && i > u8.length - 66000; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("not a zip");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);          /* 中央目录起始偏移 */

    const out = {};
    const dec = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const compSize = dv.getUint32(p + 20, true);
      const nameLen = dv.getUint16(p + 28, true);
      const extraLen = dv.getUint16(p + 30, true);
      const cmtLen = dv.getUint16(p + 32, true);
      const localOff = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
      p += 46 + nameLen + extraLen + cmtLen;
      if (!wanted(name)) continue;

      /* 2) 跳到本地文件头，算出数据真正的起点（本地头的 name/extra 长度可能和中央目录不同） */
      const lNameLen = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = u8.subarray(start, start + compSize);
      if (method === 0) { out[name] = dec.decode(raw); continue; }   /* 未压缩 */
      if (method !== 8) continue;                                     /* 只支持 deflate */
      const ds = new DecompressionStream("deflate-raw");
      const blob = new Blob([raw]).stream().pipeThrough(ds);
      out[name] = await new Response(blob).text();
    }
    return out;
  }

  /* XML 转纯文本：先把段落/换行类标签变成换行，再去掉所有标签、还原实体 */
  function xmlText(xml, breakTags) {
    let s = String(xml || "");
    (breakTags || []).forEach(t => {
      s = s.replace(new RegExp(`</w:${t}>|</a:${t}>|<${t}/>`, "g"), "\n");
    });
    s = s.replace(/<w:br\s*\/>|<w:tab\s*\/>/g, m => (m.indexOf("tab") > 0 ? "\t" : "\n"));
    s = s.replace(/<[^>]+>/g, "");
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&")
      .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  async function readDocx(buf) {
    const f = await zipRead(buf, n => n === "word/document.xml");
    const xml = f["word/document.xml"];
    if (!xml) throw new Error("no document.xml");
    return xmlText(xml, ["p", "tr"]);
  }

  async function readPptx(buf) {
    const f = await zipRead(buf, n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    const names = Object.keys(f).sort((a, b) =>
      (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    if (!names.length) throw new Error("no slides");
    return names.map((n, i) => `【第 ${i + 1} 页】\n` + xmlText(f[n], ["p"])).join("\n\n").trim();
  }

  async function readXlsx(buf) {
    const f = await zipRead(buf, n =>
      n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
    /* 共享字符串表：单元格里存的是这张表的下标 */
    const shared = [];
    const ss = f["xl/sharedStrings.xml"];
    if (ss) (ss.match(/<si>[\s\S]*?<\/si>/g) || []).forEach(si => shared.push(xmlText(si, [])));

    const sheets = Object.keys(f).filter(n => n.indexOf("worksheets") > 0)
      .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    if (!sheets.length) throw new Error("no sheet");

    const parts = [];
    sheets.forEach((sn, si) => {
      const rows = (f[sn].match(/<row[\s\S]*?<\/row>/g) || []).slice(0, 300).map(row => {
        const cells = (row.match(/<c[\s\S]*?(?:\/>|<\/c>)/g) || []).map(c => {
          const isStr = /t="s"/.test(c);
          const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
          const inline = (c.match(/<is>[\s\S]*?<\/is>/) || [])[0];
          if (inline) return xmlText(inline, []);
          if (v == null) return "";
          return isStr ? (shared[+v] || "") : v;
        });
        return cells.join("\t").replace(/\t+$/, "");
      }).filter(r => r.trim());
      if (rows.length) parts.push((sheets.length > 1 ? `【工作表 ${si + 1}】\n` : "") + rows.join("\n"));
    });
    return parts.join("\n\n").trim();
  }

  /* =====================================================================
     PDF：本地 pdf.js（Apache-2.0，），点开 PDF 时才加载。
     先抠文字；抠不到（扫描件/图片版试卷）就把第一页渲染成图片交给视觉模型。
     ===================================================================== */
  let pdfLibPromise = null;
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise;
    /* 传统 <script> 注入：file:// 和 http(s) 都能加载。
       file:// 下 Worker 构造会失败，pdf.js 自带「假 worker」回退（主线程解析），
       同样是普通脚本加载，双击打开也能用 */
    pdfLibPromise = loadScript(AI_CFG.pdfJs).then(() => {
      const lib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
      if (!lib) throw new Error("pdfjs missing");
      lib.GlobalWorkerOptions.workerSrc = new URL(AI_CFG.pdfWorker, location.href).href;
      return lib;
    });
    return pdfLibPromise;
  }

  function handlePdf(file, name) {
    toast("正在读取 PDF…");
    let task = null;
    loadPdfLib()
      .then(lib => file.arrayBuffer().then(buf => {
        task = lib.getDocument({
          data: buf,
          cMapUrl: new URL(AI_CFG.pdfCmaps, location.href).href,   /* 必须绝对路径且以 / 结尾 */
          cMapPacked: true,
          isEvalSupported: false,   /* v3 系的官方安全缓解（CVE-2024-4367），别删 */
        });
        return task.promise;
      }))
      .then(async doc => {
        const pages = Math.min(doc.numPages, AI_CFG.pdfMaxPages);
        let text = "";
        for (let i = 1; i <= pages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          const s = tc.items.map(it => it.str).join("").trim();
          if (s) text += (pages > 1 ? `【第 ${i} 页】\n` : "") + s + "\n\n";
        }
        if (text.trim().length >= 30) {
          attachText(name, text);
          if (doc.numPages > pages) toast(`PDF 较长，只读了前 ${pages} 页`);
          return;
        }
        /* 文字太少 = 扫描件或图片版：渲染第一页成图，让视觉模型来看 */
        toast("这份 PDF 是图片版，正在转成图片识别…");
        const page = await doc.getPage(1);
        const vp = page.getViewport({ scale: 2 });
        const cv = document.createElement("canvas");
        cv.width = Math.min(vp.width, AI_CFG.imageMaxDim);
        cv.height = Math.round(vp.height * (cv.width / vp.width));
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cv.width, cv.height);
        await page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: cv.width / page.getViewport({ scale: 1 }).width }),
        }).promise;
        const full = cv.toDataURL("image/jpeg", AI_CFG.imageQuality);
        if (full.length > AI_CFG.imageMaxChars) { toast("这页内容太大了，截图其中一题再传吧"); return; }
        const th = document.createElement("canvas");
        const k = AI_CFG.thumbDim / cv.width;
        th.width = AI_CFG.thumbDim; th.height = Math.round(cv.height * k);
        th.getContext("2d").drawImage(cv, 0, 0, th.width, th.height);
        if (!canAttach()) return;
        attachs.push({ kind: "image", full, thumb: th.toDataURL("image/jpeg", 0.8), name: name });
        renderPreview();
        if (doc.numPages > 1) toast("图片版 PDF 只识别了第 1 页");
      })
      .catch(() => toast("这份 PDF 读不出来，可能是加密的；可以截图其中一题再传"))
      .finally(() => { try { task && task.destroy(); } catch (e) {} });   /* 释放 worker 内存 */
  }

  /* 提取出来的文字统一走这里：截断 + 落成附件 */
  function attachText(name, text) {
    let t = String(text || "").trim();
    if (!t) { toast("这个文件里没读到文字"); return; }
    if (t.length > AI_CFG.fileMaxChars) t = t.slice(0, AI_CFG.fileMaxChars) + "\n…（内容过长已截断）";
    if (!canAttach()) return;
    attachs.push({ kind: "text", name: name, text: t });
    renderPreview();
  }

  function handleFile(file) {
    if (!file) return;
    const name = file.name || "";
    const ext = (name.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
    const isImgExt = /^(png|jpe?g|webp|gif|bmp|heic|heif|avif|tiff?)$/.test(ext);
    /* 手机上 MIME 和文件名都不可靠（安卓相册常给空 type、微信会改写文件名），
       所以图片判定放宽：MIME 是 image/* 或后缀像图片都算 */
    const isImg = /^image\//.test(file.type) || isImgExt;

    if (isImg) {
      if (!canAttach()) return;   /* 提前拦：别等压缩完才说带不了 */
      if (file.size > AI_CFG.imageMaxSrcMB * 1048576) { toast(`图片太大了，请小于 ${AI_CFG.imageMaxSrcMB}MB`); return; }
      compressImage(file).then(r => {
        if (!r) {
          /* HEIC 是 iPhone 默认格式，安卓/电脑浏览器解不开（专利限制），
             正常「拍照/相册」路径 iOS 会自动转 JPEG，只有从「文件」里选才会漏过来 */
          toast(/^(heic|heif)$/.test(ext)
            ? "这是 iPhone 的 HEIC 格式，换成截图或用「拍照」重拍一张就行"
            : "这张图片读不了，换一张或改存成 JPG 再试");
          return;
        }
        if (!canAttach()) return;   /* 压缩期间可能又加了图，再校验一次 */
        attachs.push({ kind: "image", full: r.full, thumb: r.thumb, name: name || "图片" });
        renderPreview();
      });
      return;
    }

    if (!canAttach()) return;
    if (file.size > AI_CFG.docMaxMB * 1048576) { toast(`文件太大了，请小于 ${AI_CFG.docMaxMB}MB`); return; }

    /* Office 三件套：浏览器原生解 ZIP，不引任何库 */
    if (/^(docx|xlsx|pptx)$/.test(ext)) {
      toast("正在读取文件…");
      const reader = { docx: readDocx, xlsx: readXlsx, pptx: readPptx }[ext];
      file.arrayBuffer()
        .then(reader)
        .then(t => attachText(name, t))
        .catch(() => toast("这个文件读不出来，可能是加密或损坏的"));
      return;
    }

    /* 老版 Office（.doc/.xls/.ppt）是二进制私有格式，解不了，直说 */
    if (/^(doc|xls|ppt)$/.test(ext)) {
      toast(`.${ext} 是旧格式，用 Word/Excel 另存为 .${ext}x 再传`);
      return;
    }

    if (ext === "pdf") { handlePdf(file, name); return; }

    /* 其余按纯文本读：txt/md/csv/json/代码文件等都能直接读 */
    const fr = new FileReader();
    fr.onload = () => {
      const t = String(fr.result || "");
      /* 读出一堆乱码/控制字符 = 其实是二进制文件，不要硬塞给 AI */
      const bad = (t.slice(0, 2000).match(/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
      if (bad > 20) { toast("这个格式暂时读不了，可以转成 PDF、Word 或图片再传"); return; }
      attachText(name, t);
    };
    fr.onerror = () => toast("文件读取失败，换一个试试");
    fr.readAsText(file);
  }

  /* =========== 联网开关 =========== */
  function applySearchState() {
    ui.web.setAttribute("aria-pressed", searchOn ? "true" : "false");
    ui.web.setAttribute("title", searchOn ? "联网搜索已开启，点击关闭" : "联网搜索已关闭，点击开启");
  }

  /* =========== 「+」附件菜单 =========== */
  /* 关键：图片和文本用两个独立的 input。
     把 image/* 和 .txt 混写在同一个 accept 里，iOS 会退化成只给「浏览文件」，
     学生就点不到「照片图库 / 拍照」了——这是手机端最容易踩的坑。 */
  function pickFile(accept, capture) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = accept;
    /* 必须写成属性：Chromium 桌面版没实现 capture 这个 IDL 属性，
       直接赋值只会挂个无用的 JS 字段，手机上就不会直接开相机 */
    if (capture) inp.setAttribute("capture", capture);
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", () => {
      if (inp.files && inp.files[0]) handleFile(inp.files[0]);
      inp.remove();
    });
    /* 用户取消时 change 不触发，靠 focus 回来后延迟清理，避免 input 堆积 */
    window.addEventListener("focus", () => setTimeout(() => inp.remove(), 800), { once: true });
    inp.click();
  }

  function buildAttachMenu() {
    /* 手机（粗指针）多给一个「拍照」直达相机；桌面没摄像头场景就不显示 */
    const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    /* accept 里 MIME 必须排在扩展名前面：微信内置浏览器认不出纯 .txt/.md 写法。
       类型列全一点，别让学生在文件框里「什么都看不见」 */
    const DOC_ACCEPT = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain", "text/markdown", "text/csv",
      ".pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.json,.log",
    ].join(",");
    const items = [
      { icon: "🖼️", text: "添加图片", run: () => pickFile("image/*") },
      { icon: "📄", text: "添加文件", run: () => pickFile(DOC_ACCEPT) },
    ];
    if (touch) items.splice(1, 0, { icon: "📷", text: "拍照", run: () => pickFile("image/*", "environment") });

    ui.menu.innerHTML = items.map(it =>
      `<button type="button" role="menuitem"><span class="mi">${it.icon}</span>${esc(it.text)}</button>`).join("");
    Array.from(ui.menu.children).forEach((btn, i) => {
      btn.addEventListener("click", e => { e.stopPropagation(); closeMenu(); items[i].run(); });
    });
    /* 菜单内键盘：上下移动、Esc 关闭 */
    ui.menu.addEventListener("keydown", e => {
      const btns = Array.from(ui.menu.children);
      const at = btns.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); btns[(at + 1) % btns.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); btns[(at - 1 + btns.length) % btns.length].focus(); }
      else if (e.key === "Escape") { e.stopPropagation(); closeMenu(); ui.attach.focus(); }
    });
  }

  function toggleMenu() {
    ui.menu.classList.contains("open") ? closeMenu() : openMenu();
  }
  function openMenu() {
    ui.toast.classList.remove("show");   /* 两者都浮在输入区上方，同时出现会打架 */
    ui.menu.classList.add("open");
    ui.attach.setAttribute("aria-expanded", "true");
    const first = ui.menu.firstElementChild;
    if (first) first.focus();
  }
  function closeMenu() {
    if (!ui.menu || !ui.menu.classList.contains("open")) return;
    ui.menu.classList.remove("open");
    ui.attach.setAttribute("aria-expanded", "false");
  }

  function renderPreview() {
    if (!attachs.length) { ui.preview.hidden = true; ui.preview.innerHTML = ""; refreshSend(); return; }
    ui.preview.innerHTML = attachs.map((a, i) => {
      const lead = a.kind === "image"
        ? `<img src="${a.thumb}" alt="待发送的图片">`
        : `<span class="ai-pv-ico">📄</span>`;
      return `<div class="ai-pv-chip">${lead}
        <span class="ai-pv-name">${esc(a.name)}</span>
        <button type="button" class="ai-pv-x" data-i="${i}" aria-label="移除附件 ${esc(a.name)}">✕</button></div>`;
    }).join("");
    ui.preview.hidden = false;
    ui.preview.querySelectorAll(".ai-pv-x").forEach(btn =>
      btn.addEventListener("click", () => { attachs.splice(+btn.dataset.i, 1); renderPreview(); }));
    refreshSend();
  }

  /* 附件数量准入检查（true=还能加）。上限只看总数：3 张图、3 个文件、混搭都行 */
  function canAttach() {
    if (attachs.length >= AI_CFG.maxAttach) {
      toast(`一次最多带 ${AI_CFG.maxAttach} 个附件`);
      return false;
    }
    return true;
  }

  /* =========== 输入区 =========== */
  function autosize() {
    ui.input.style.height = "auto";
    ui.input.style.height = Math.min(ui.input.scrollHeight, 132) + "px";
    const n = ui.input.value.length;
    if (n > AI_CFG.maxInputChars - 400) {
      ui.count.hidden = false;
      ui.count.textContent = `${n} / ${AI_CFG.maxInputChars}`;
    } else ui.count.hidden = true;
  }
  function refreshSend() {
    if (busy) { ui.send.disabled = false; return; }
    ui.send.disabled = !ui.input.value.trim() && !attachs.length;
  }
  function setBusy(v) {
    busy = v;
    ui.send.classList.toggle("stop", v);
    ui.send.innerHTML = v ? ICON_STOP : ICON_UP;
    ui.send.setAttribute("aria-label", v ? "停止生成" : "发送");
    refreshSend();
  }

  function sendFromInput() {
    const text = ui.input.value.trim();
    if (!text && !attachs.length) return;
    if (text.length > AI_CFG.maxInputChars) { toast("这条消息太长了，拆小一点再发"); return; }
    /* 先送再清：清空必须发生在 send() 确认受理之后。
       否则「上一条还在生成时手快点了第二次」或「配额刚好用完」这两种情况下，
       学生辛苦打的整段问题会被静默清掉——提问没发出去、输入框还空了 */
    if (send(text)) { ui.input.value = ""; autosize(); }
  }

  /* 返回 true = 这条已受理（调用方可以清空输入框）*/
  function send(text) {
    if (busy) { toast("上一条还在回答，稍等一下"); return false; }
    if (quotaToday() >= AI_CFG.dailyMax) {
      showError(`今天的提问次数已经用完了（每天 ${AI_CFG.dailyMax} 次），明天再来吧。`, false);
      return false;
    }
    quotaBump();
    const entry = { role: "user", content: text };
    const imgs = attachs.filter(a => a.kind === "image");
    const docs = attachs.filter(a => a.kind === "text");
    if (imgs.length) {
      entry.images = imgs.map(a => a.thumb);      /* 缩略图：会话展示用 */
      entry.imageFulls = imgs.map(a => a.full);   /* 压缩原图：只随本次请求发给服务端识别 */
    }
    if (docs.length) {
      entry.files = docs.map(d => d.name);
      entry.displayText = text;
      /* 多个文件的正文合并进消息，共享一个总字数预算（服务端单条上限要装得下） */
      let budget = AI_CFG.fileMaxChars;
      const blocks = docs.map(d => {
        if (budget <= 200) return `【文件：${d.name}】（篇幅限制，正文未能附上，可以单独再发一次）`;
        let body = d.text;
        if (body.length > budget) body = body.slice(0, budget) + "\n…（篇幅限制已截断）";
        budget -= body.length;
        return `【文件：${d.name}】\n${body}`;
      });
      entry.content = (text ? text + "\n\n" : "") + blocks.join("\n\n");
    }
    attachs = [];
    if (built) renderPreview();
    if (!history.length) ui.body.innerHTML = "";   /* 收起欢迎界面 */
    history.push(entry);
    saveHistory();
    addUser(entry);
    streamAnswer();
    return true;
  }

  /* =========== 请求与流式接收 =========== */
  function streamAnswer() {
    const ep = apiEndpoint();
    if (!ep) {
      showError("AI 学习助手还在部署配置中，暂时用不了，过阵子再来吧。", false);
      return;
    }

    setBusy(true);
    stick = true;
    const shell = addAssistantShell();
    const mdBox = shell.querySelector(".ai-md");
    const thinkBox = shell.querySelector(".ai-think");
    const thinkLabel = shell.querySelector(".ai-think-t");

    let answer = "";
    let finish = "";
    let sources = null;   /* 联网搜索的真实来源（服务端 sukao_sources 信号） */
    let renderTimer = 0;
    const t0 = Date.now();

    /* 思考中：5 秒后显示已思考秒数，让人知道没死。
       每 5 秒才更新一次文字——它是 role=status 活动区，逐秒改会让读屏软件念个不停。
       thinkMode 会被联网搜索信号切换成「联网搜索」，计时器要跟着念对词 */
    let thinkMode = "思考";
    const thinkTick = setInterval(() => {
      const sec = Math.round((Date.now() - t0) / 1000);
      if (sec >= 5 && sec % 5 === 0) thinkLabel.textContent = `正在${thinkMode}… ${sec} 秒`;
    }, 1000);

    const paint = () => {
      renderTimer = 0;
      if (!answer) return;
      if (thinkBox.parentNode) thinkBox.remove();
      mdBox.hidden = false;
      mdBox.innerHTML = mdRender(answer);
      typeset(mdBox);
      scrollBottom();
    };
    const schedule = () => { if (!renderTimer) renderTimer = setTimeout(paint, 120); };

    const done = (stopped) => {
      clearInterval(thinkTick);
      if (renderTimer) clearTimeout(renderTimer);
      setBusy(false);
      ctrl = null;
      /* 「清空对话」会把消息区整体重建，这条流的壳已不在页面上 → 整条作废，
         绝不能把半截回答塞回刚清空的历史里 */
      if (!shell.isConnected) return;
      paint();

      if (!answer) {
        shell.remove();
        if (stopped) return;                       /* 没内容时被停止 → 静默移除 */
        showError("AI 没有返回内容，请重试一次。", true);
        return;
      }
      if (stopped) {
        mdBox.appendChild(el('<p class="ai-note">（已停止生成）</p>'));
      } else if (finish === "length") {
        mdBox.appendChild(el('<p class="ai-note">（回答到达长度上限，回复「继续」可以让我接着说）</p>'));
      }
      const entry = { role: "assistant", content: answer };
      if (sources && sources.length) {
        entry.sources = sources;
        const srcs = sourcesHTML(sources);
        if (srcs) shell.querySelector(".ai-bubble").appendChild(el(srcs));
      }
      history.push(entry);
      saveHistory();
      attachCopy(shell, answer);
      /* 读屏软件只在回答完成时播报一次，而不是流式过程里反复重读 */
      ui.sr.textContent = "";
      setTimeout(() => { ui.sr.textContent = "AI 已回答完毕"; }, 60);
      scrollBottom();
    };

    ctrl = new AbortController();
    sendAt = Date.now();
    fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages(), webSearch: searchOn }),
      signal: ctrl.signal,
    }).then(async res => {
      if (!res.ok) {
        let msg = "AI 服务暂时不可用，请稍后再试。";
        try {
          const j = await res.json();
          if (j && j.error && j.error.message) msg = j.error.message;
        } catch (e) {}
        clearInterval(thinkTick);
        shell.remove();
        setBusy(false);
        ctrl = null;
        showError(msg, true);
        return;
      }

      /* 解析 SSE 流：data: {...} / data: [DONE] */
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done: eof, value } = await reader.read();
        if (eof) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          let j;
          try { j = JSON.parse(data); } catch (e) { continue; }
          /* 服务端在流最前面塞的识别文字：挂到刚才那条 user 消息上，
             追问时就带文字不带图，图片只识别一次 */
          /* 服务端信号：真实来源列表（回答完成后渲染成「来源」小块） */
          if (j.sukao_sources) {
            sources = j.sukao_sources;
            continue;
          }
          /* 服务端信号：开始联网搜索 / 搜索完成（只影响指示器文案） */
          if (j.sukao_search !== undefined) {
            thinkMode = "联网搜索";
            thinkLabel.textContent = "正在联网搜索…";
            continue;
          }
          if (j.sukao_search_done !== undefined) {
            thinkMode = "思考";
            thinkLabel.textContent = "正在思考…";
            continue;
          }
          if (j.sukao_vision) {
            for (let k = history.length - 1; k >= 0; k--) {
              if (history[k].role === "user") {
                history[k].visionText = String(j.sukao_vision);
                delete history[k].imageFulls;
                delete history[k].imageFull;
                break;
              }
            }
            saveHistory();
            continue;
          }
          const ch = j.choices && j.choices[0];
          if (!ch) continue;
          if (ch.finish_reason) finish = ch.finish_reason;
          const d = ch.delta || {};
          /* 思考过程不上屏，只让指示器動着；正文才渲染 */
          if (typeof d.content === "string" && d.content) {
            answer += d.content;
            schedule();
          }
        }
      }
      done(false);
    }).catch(e => {
      if (e && e.name === "AbortError") { done(true); return; }
      clearInterval(thinkTick);
      if (renderTimer) clearTimeout(renderTimer);
      shell.remove();
      setBusy(false);
      ctrl = null;
      showError("网络连接失败，检查一下网络后重试。", true);
    });
  }

  /* =========== 启动 =========== */
  function init() {
    buildLauncher();
    /* 上次会话没结束的话，面板保持可恢复（打开时自动重绘历史） */
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
