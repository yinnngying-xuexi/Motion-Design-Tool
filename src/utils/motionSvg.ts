const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

export const MOTION_SVG_COPY_HINT = "复制包含当前动效的 SVG 源码。HTML/CSS 案例使用 foreignObject，适合现代浏览器；前端集成优先使用复制代码，不用于重新导入编辑器。";

export function motionSvgUnsupportedReason(htmlCss = ""): string {
  if (htmlCss.includes('data-light-format="animated-webp"')) return "此光效使用原始动态 WebP 素材，不提供动态 SVG。请复制代码或导出 HTML。";
  return htmlCss.includes("<dm-light-renderer") ? "此光效使用 WebGL，不支持动态 SVG。请复制代码或导出 HTML。" : "";
}

/** Reuse the deliverable verbatim; do not flatten CSS animations into a still image. */
export async function createAnimatedMotionSvg(htmlCss: string, name: string): Promise<string> {
  const unsupported = motionSvgUnsupportedReason(htmlCss);
  if (unsupported) throw new Error(unsupported);
  const source = new DOMParser().parseFromString(htmlCss, "text/html");
  source.querySelectorAll("script,iframe,object,embed,link").forEach((node) => node.remove());
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.style.cssText = "position:fixed;left:-100000px;top:0;width:4096px;height:4096px;border:0;pointer-events:none";
  const content = document.createElement("div");
  content.setAttribute("data-dm-svg-content", "");
  content.style.cssText = "display:grid;place-items:center;width:max-content;height:max-content;position:relative;font:14px Arial,sans-serif;color:#fff;line-height:normal;";
  [...source.head.querySelectorAll("style"), ...source.body.childNodes].forEach((node) => content.append(node.cloneNode(true)));
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("生成 SVG 超时，请重试")), 8000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
      frame.onerror = () => { clearTimeout(timeout); reject(new Error("无法生成当前动效 SVG")); };
      frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:transparent">${content.outerHTML}</body></html>`;
      document.body.append(frame);
    });
    const doc = frame.contentDocument;
    const root = doc?.querySelector<HTMLElement>("[data-dm-svg-content]");
    if (!doc || !root) throw new Error("无法读取当前动效内容");
    await doc.fonts.ready;
    const width = Math.max(1, Math.ceil(root.offsetWidth));
    const height = Math.max(1, Math.ceil(root.offsetHeight));
    // Transparent bleed keeps glows and moving edges away from the SVG viewport clip.
    const padding = 64;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", String(width + padding * 2));
    svg.setAttribute("height", String(height + padding * 2));
    svg.setAttribute("viewBox", `0 0 ${width + padding * 2} ${height + padding * 2}`);
    svg.setAttribute("data-dm-content-width", String(width));
    svg.setAttribute("data-dm-content-height", String(height));
    svg.setAttribute("role", "img");
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = name;
    const desc = document.createElementNS(SVG_NS, "desc");
    desc.textContent = "DataMotion 动态 SVG，保留原始 HTML/CSS 动效（foreignObject）；透明背景，不包含编辑器画布。请在支持 foreignObject 的现代浏览器中使用。";
    const foreignObject = document.createElementNS(SVG_NS, "foreignObject");
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.setAttribute("overflow", "visible");
    const stage = document.createElementNS(XHTML_NS, "div");
    stage.setAttribute("style", `box-sizing:border-box;width:100%;height:100%;padding:${padding}px;display:grid;place-items:center;background:transparent;overflow:visible;`);
    stage.append(root.cloneNode(true));
    foreignObject.append(stage);
    svg.append(title, desc, foreignObject);
    const result = new XMLSerializer().serializeToString(svg);
    if (new DOMParser().parseFromString(result, "image/svg+xml").querySelector("parsererror")) throw new Error("SVG 序列化失败");
    return result;
  } finally { frame.remove(); }
}
