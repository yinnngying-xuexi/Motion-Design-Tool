/** Split the exact current deliverable, rather than introducing a second animation generator. */
export function lightSourceFiles(name: string, htmlCss: string): Record<string, string> {
  const doc = new DOMParser().parseFromString(htmlCss, "text/html");
  const css = [...doc.querySelectorAll("style")].map(node => node.textContent ?? "").join("\n\n");
  const js = [...doc.querySelectorAll("script")].map(node => node.textContent ?? "").join("\n\n");
  doc.querySelectorAll("style,script").forEach(node => node.remove());
  const markup = doc.body.innerHTML.trim();
  const title = name.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
  return {
    "index.html": `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="./effect.css">
  <style>html,body{margin:0;min-height:100%;background:#000}body{min-height:100vh;display:grid;place-items:center;overflow:hidden}</style>
</head>
<body>
${markup}
  <script src="./effect.js"></script>
</body>
</html>`,
    "effect.css": css,
    "effect.js": `// ${name}：程序化光效，只包含当前效果和共用最小运行器。\n${js}\n`,
    "README.md": `# ${name} · 前端源码

本包使用原生 HTML / CSS / JavaScript / WebGL，不使用 GIF、WebP、Base64 图片或第三方动画库，不依赖 DataMotion 编辑器。

## 直接预览

解压并保持三个文件相邻，用现代浏览器打开 index.html。若企业浏览器限制 file 地址，放入本地静态服务查看。

## 项目接入

1. 将 index.html 中的动效容器放入页面；不要复制演示页面的 html/body 黑底样式。
2. 加载 effect.css 和 effect.js。Vue / React 动态插入时，将 effect.js 作为普通项目脚本执行一次；不要只插入包含 script 的 HTML 字符串。
3. 组件背景本身透明，可叠在大屏背景上。颜色、大小及文字显隐已经与导出时一致。
4. 颜色在 data-color 与 --light-color / --loading-color 中；改变 data-color 后调用渲染节点 draw() 即可更新图形，CSS 变量同步控制文字。整体缩放位于最外层 data-dm-scale 包装的 zoom 样式（100% 时没有该包装）。
5. 动效节点提供 seek(seconds)、setPlayback(playing, speed=1)、dispose()；移除 DOM 会自动释放 GPU 资源。请保留运行器对隐藏页面、离屏元素及减少动态效果偏好的处理。

多款源码包接入同一项目时请避免 effect.css / effect.js 文件名覆盖。运行器可以重复注册并合并不同效果；同款多实例不使用共享 SVG ID，颜色相互独立。

## 运行要求

浏览器需支持 WebGL。渲染失败会显示提示，不会静默换成图片。严格 CSP 项目应将样式和脚本按项目规范授权；内联参数样式也需按项目策略处理。请在目标大屏设备验证性能。

这是参考视觉的程序化重建，不是原动图逐帧复刻或 AE 源文件。无需任何图片素材，不支持动态 SVG 导出。
`
  };
}

export async function lightSourceZip(name: string, htmlCss: string): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  Object.entries(lightSourceFiles(name, htmlCss)).forEach(([path, text]) => zip.file(path, text));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
