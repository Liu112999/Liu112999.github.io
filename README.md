# 苏考图谱 · 江苏高考题型统计

把江苏高考真题逐题拆解、按「专题→子专题→题型→解题方法」打标，统计频率与优先级，
每道题配「看到→想到」提示、红笔重点解析、可展开定义词条和「带走」方法卡。
纯静态网站，字体与公式引擎均已内置，无外部依赖。

## 上传到 GitHub（网页版即可）

1. 新建仓库后点 **uploading an existing file**（或 Add file → Upload files）。
2. 在电脑上**打开 github 文件夹，Ctrl+A 全选里面的内容**，一把拖进上传区
   （拖的是文件夹里的内容，不是 github 文件夹本身）。
3. 等列表里出现 css/、js/、vendor/ 等子文件夹的文件后，点 **Commit changes**。
4. 仓库 **Settings → Pages** → Source 选 **Deploy from a branch** → `main` / `/(root)` → 保存。
5. 约 1 分钟后访问 `https://你的用户名.github.io/仓库名/`。

## 更新数据

题目数据在 `js/data-math.js`（数学）、`js/data-chinese.js`、`js/data-english.js`，改完重新上传对应文件即可。
题目截图放 `images/questions/`，文件名 = 题目编号。
