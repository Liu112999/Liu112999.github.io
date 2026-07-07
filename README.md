# 苏考图谱 · 江苏高考题型统计

纯静态网站，所有文件都在同一层（无子文件夹），网页上传零失败。

## 上传（网页版）

1. 仓库页 → Add file → **Upload files**。
2. 打开本文件夹，**Ctrl+A 全选 → 拖进上传区**（全是普通文件，不会丢）。
3. 点 **Commit changes**，完成。若是 `用户名.github.io` 仓库，Pages 自动开启；
   否则 Settings → Pages → Deploy from a branch → main / root。

## 更新数据

数学题库在 `data-math.js`，语文英语在 `data-chinese.js / data-english.js`，改完重传该文件即可。
题目截图直接放根目录，文件名 = 题目编号（如 2026-XK1-15.png）。
