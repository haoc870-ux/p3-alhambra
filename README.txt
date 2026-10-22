Project2-AlhambraWeb / Offline-compatible 3D

使用方法
1. 先将整个 ZIP 压缩包解压，不能只从压缩包里打开一个 HTML 文件。
2. 保持所有 HTML、JS、CSS 和 assets 文件夹放在同一目录。
3. 用桌面版 Chrome、Safari 或 Edge 打开 index.html。
4. 进入 Motif，向下滚动到 GOLD BEAD BORDER、CENTRAL MATERIAL、FRAME，查看细节动效。

本版修复
3D 引擎、几何数据和原图纹理已合并为普通脚本，可通过 file:// 直接打开。
不需要安装 Node、Python 或启动服务器，也不需要联网加载 3D 库。
为保持原有手机阅读布局，3D 动效在窗口宽度超过 900px 时显示。
系统开启“减少动态效果”时会保留静态图片。

Editing / development
Source: motif-detail-3d.js, assets/motif-photo-geometry.json, assets/motif-user-beaded.png.
After editing these files, run build_offline.py with Python 3 to rebuild motif-detail-offline.js.
Three.js MIT licence: assets/vendor/LICENSE.

Designed & edited by Carol Hao.
