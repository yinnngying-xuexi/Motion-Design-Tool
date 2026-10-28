import type { SavedMotionArtifact } from "@/types/motion";
import { toPng } from "html-to-image";
import { initializeLightDocument, releaseLightDocument, type LightRendererElement } from "@/utils/lightWebgl";

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
  const previewImage = await renderPreviewImage(html, width, height);

  return {
    html,
    previewImage,
    htmlFileName: `${safeName}.html`,
    imageFileName: `${safeName}-预览.png`,
    width,
    height
  };
}

async function renderPreviewImage(html: string, width: number, height: number): Promise<string> {
  // Capture the deliverable, not the editor canvas (which may be hidden by the code tab).
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;height:${height}px;border:0;pointer-events:none`;
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("生成预览图超时，请重试")), 8000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
      frame.onerror = () => { clearTimeout(timeout); reject(new Error("无法生成动效预览图")); };
      frame.srcdoc = html;
      document.body.append(frame);
    });
    const doc = frame.contentDocument;
    if (!doc) throw new Error("无法读取动效预览");
    await doc.fonts.ready;
    fitMotionPreviewDocument(doc, width, height);
    // Only install our trusted renderer from the application; iframe scripts stay sandboxed.
    initializeLightDocument(doc);
    const lights = doc.querySelectorAll<LightRendererElement>("dm-light-renderer");
    lights.forEach((item) => {
      item.setPlayback(false);
      item.seek(item.dataset.motion === "off" ? 0 : Number(item.dataset.duration) * 0.2);
      if (item.dataset.ready !== "true") throw new Error("WebGL 不可用，无法生成光效预览图");
    });
    const animations = doc.getAnimations();
    animations.forEach((animation) => {
      const timing = animation.effect?.getComputedTiming();
      animation.pause();
      animation.currentTime = Number(timing?.delay ?? 0) + Number(timing?.duration ?? 1000) * (timing?.iterations === Infinity ? 0.45 : 1);
    });
    // Rasterization clones the DOM; CSS animations would otherwise restart at opacity 0.
    const snapshots = animations.flatMap((animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target as HTMLElement | SVGElement | null;
      if (!target || !effect) return [];
      const computed = getComputedStyle(target);
      const properties = new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)).filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)));
      return [{ target, values: [...properties].map((key) => {
        const property = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
        return [property, computed.getPropertyValue(property)] as const;
      }) }];
    });
    snapshots.forEach(({ target, values }) => {
      values.forEach(([property, value]) => target.style.setProperty(property, value, "important"));
      target.style.setProperty("animation", "none", "important");
    });
    return await toPng(doc.body, { width, height, canvasWidth: width, canvasHeight: height, pixelRatio: 1, skipFonts: true, backgroundColor: "#000000" });
  } finally { releaseLightDocument(frame.contentDocument); frame.remove(); }
}

// Preview-only containment; never modifies the stored/exported HTML string.
export function fitMotionPreviewDocument(doc: Document, width: number, height: number): void {
  let wrapper = doc.querySelector<HTMLElement>("[data-dm-saved-preview]");
  if (!wrapper) {
    wrapper = doc.createElement("div");
    wrapper.dataset.dmSavedPreview = "true";
    wrapper.style.cssText = "position:absolute;left:50%;top:50%;width:max-content;height:max-content;display:grid;place-items:center;transform-origin:center;";
    [...doc.body.children].filter((node) => !["STYLE", "SCRIPT"].includes(node.tagName)).forEach((node) => wrapper!.append(node));
    doc.body.append(wrapper);
  }
  doc.documentElement.style.cssText = "width:100%;height:100%;margin:0;overflow:hidden";
  doc.body.style.cssText = "margin:0;padding:0;width:100%;height:100vh;min-height:0;overflow:hidden;display:block;background:#000;";
  const scale = Math.min(1, (width - 32) / Math.max(1, wrapper.offsetWidth), (height - 32) / Math.max(1, wrapper.offsetHeight));
  wrapper.style.transform = `translate(-50%,-50%) scale(${Math.max(0.01, scale)})`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
}
