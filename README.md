# 苏考图谱 · 江苏高考题型数据分析平台

把 2016–2026 江苏高考真题与模拟卷逐题拆解、按「专题→子专题→题型→解题方法」四层打标，
统计频次与优先级，为学生生成一张清晰的复习地图。

纯静态网站（HTML + CSS + JavaScript），无需构建工具，直接部署到 GitHub Pages。

## 文件结构

```
index.html          首页（一句话介绍 + 搜索 + 三科入口，小而精）
math.html           数学页：统计卡 + 高频题型TOP10 + 题型树（点开直接看题）
chinese.html        语文页：同上结构（框架就绪，数据整理中）
english.html        英语页：同上结构（框架就绪，数据整理中）
stats.html          统计页：扇形图 / 条形图 / 难度分布 / 四象限 / 总表（?subject= 切换）
search.html         搜索页：按题型 / 方法 / 考点 / 年份即时检索
years.html          历年试卷：逐题拆解表（?subject= 切换，从科目页进入）
question.html       题目档案（?id=题目编号，从题目卡/表格行进入）
css/style.css       全站样式
js/data-math.js     ★ 数学数据（试卷、专题、题目）
js/data-chinese.js  ★ 语文数据
js/data-english.js  ★ 英语数据
js/main.js          统计计算与页面渲染（一般不需要改）
images/questions/   题目截图目录（按题目编号命名，如 2025-XK1-19.png）
```

导航只有 5 项：首页 / 数学 / 语文 / 英语 / 统计。用户路径：选科目 → 点开题型 → 直接看题；
或直接搜索。历年试卷和题目档案是从科目页和题目卡进入的二级页面。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（例如 `sukao-map`）。
2. 把 **本文件夹（个人项目）里的所有文件** 推送到仓库根目录：
   ```bash
   git init
   git add .
   git commit -m "苏考图谱 v2：四层分类 + 三科框架"
   git branch -M main
   git remote add origin https://github.com/你的用户名/sukao-map.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages** → Source 选 **Deploy from a branch** → 分支 `main`、目录 `/ (root)`。
4. 约 1 分钟后访问 `https://你的用户名.github.io/sukao-map/`。

本地预览：双击 `index.html`，或在文件夹里运行 `python -m http.server 8000`。

## 如何录入真实题目（最重要）

只改 `js/data-*.js` 数据文件，**不用碰页面代码**，全站统计自动更新。

**加一道数学题**（`js/data-math.js` 的 `questions` 数组）：

```js
{ id: "2023-XK1-08",            // 编号 = 试卷id-题号
  paperId: "2023-XK1",          // 所属试卷（papers 里要有）
  number: 8, section: "单选", score: 5,
  topic: "func-deriv",          // 主专题（topics 里的 id）
  subTopic: "指对幂与比较大小",  // 子专题
  type: "指对幂比较大小",        // 题型（第三层）
  method: "构造函数比较",        // 解题方法（第四层，推荐必填）
  difficulty: 4,                // 1易 2较易 3中等 4较难 5难
  priority: "高",               // 复习优先级：高/中/低
  tags: ["高频", "易失分"],
  note: "复习提示写这里",
  stem: "题干原文（可选）",
  image: "images/questions/2023-XK1-08.png",  // 截图（可选）
  related: ["2025-XK1-06"]      // 相似题编号（可选）
},
```

**题目截图**：把截图放进 `images/questions/`，文件名 = 题目编号（如 `2023-XK1-08.png`），
再把路径填到该题的 `image` 字段，档案页会自动显示。

**加一套试卷**：在对应科目的 `papers` 数组加一行（id、年份、名称、真题/模拟、总题数、status、structure）。
status 用 `"整理中"` → `"部分整理"` → `"已拆解"` 表示进度。

**十年结构提醒**：数学 2016–2020 是江苏卷（14填空+6解答·160分），2021–2023 是新高考Ⅰ卷22题，
2024 起是19题模式。`section` 按各卷实际填写即可，跨年统计按题型聚合，不受结构变化影响。

## 与 Claude 协作录入的建议流程

1. 每次拿一套试卷（PDF 或逐题截图）发给 Claude；
2. Claude 拆题、打四层标签、写成 `data-*.js` 里的数据条目，并给出相似题关联建议；
3. 你把截图按编号放进 `images/questions/`；
4. 本地刷新预览确认 → git push 上线。

## 下一步建议

- 逐套录入数学 2016–2026 真题（先近后远：2026 → 2016）
- 为压轴题档案补充题干原文 + 截图 + 解题思路
- 语文、英语按已建好的框架开始录入 2024–2025 两年
- 数据量上来后：增加「按子专题下钻」和跨年趋势对比视图
