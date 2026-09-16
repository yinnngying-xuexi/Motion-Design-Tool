import type { SavedMotionArtifact } from "@/types/motion";
import { toPng } from "html-to-image";

interface MotionArtifactOptions {
  id: string;
  name: string;
  htmlCss: string;
  previewNode?: HTMLElement;
  width?: number;
  height?: number;
}

export function createStandaloneMotionHtml(name: string, htmlCss: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)}</title>
<style>
  html, body { margin: 0; min-height: 100%; background: #000; }
  body { min-height: 100vh; display: grid; place-items: center; overflow: hidden; }
</style>
</head>
<body>
${htmlCss}
</body>
</html>`;
}

export async function createMotionArtifact(options: MotionArtifactOptions): Promise<SavedMotionArtifact> {
  const width = options.width ?? 480;
  const height = options.height ?? 270;
  const safeName = sanitizeFileName(options.name) || options.id;
  const html = createStandaloneMotionHtml(options.name, options.htmlCss);
  const previewImage = options.previewNode
    ? await toPng(options.previewNode, {
        backgroundColor: "#000000",
        canvasWidth: width,
        canvasHeight: height,
        pixelRatio: 1,
        skipFonts: true
      })
    : await renderPreviewImage(options.htmlCss, width, height);

  return {
    html,
    previewImage,
    htmlFileName: `${safeName}.html`,
    imageFileName: `${safeName}-预览.png`,
    width,
    height
  };
}

async function renderPreviewImage(htmlCss: string, width: number, height: number): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#000;color:#ededed;font-family:Arial,'Microsoft YaHei',sans-serif;">
      ${htmlCss}
    </div>
  </foreignObject>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "sync";
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法生成动效预览图");
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
}
