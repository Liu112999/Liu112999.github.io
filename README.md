# 苏考图谱 · 江苏高考题型统计

把江苏高考真题逐题拆解、按「专题→子专题→题型→解题方法」打标，统计频率与优先级，
每道题配「看到→想到」提示、红笔重点解析、可展开定义词条和「带走」方法卡。

纯静态网站（HTML + CSS + JS），字体与公式引擎均已内置，无外部依赖。

## 上传到 GitHub 并开启网站

**方法一（推荐，三条命令）**：在本文件夹打开终端

```bash
git init && git add . && git commit -m "苏考图谱"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git && git push -u origin main
```

**方法二**：用 GitHub Desktop 把本文件夹发布为仓库（文件较多，网页拖拽上传不推荐）。

然后：仓库 **Settings → Pages** → Source 选 **Deploy from a branch** → `main` / `/(root)` → 保存。
约 1 分钟后访问 `https://你的用户名.github.io/仓库名/`。

## 更新数据

题目数据都在 `js/data-math.js`（数学）、`js/data-chinese.js`、`js/data-english.js`，
改完重新 push 即可，页面统计自动更新。题目截图放 `images/questions/`，文件名 = 题目编号。
