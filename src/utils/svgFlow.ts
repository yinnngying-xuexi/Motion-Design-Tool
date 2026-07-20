import type { SvgFlowConfig, SvgFlowSource, SvgPreviewAsset } from "@/types/svgFlow";

const SHAPE_SELECTOR = "path,line,polyline,polygon,circle,ellipse,rect";

export const SVG_FLOW_DRAFT_KEY = "visual-motion-svg-flow-draft-v2";
export const SVG_FLOW_LEGACY_DRAFT_KEY = "visual-motion-svg-flow-draft";
export const SVG_FLOW_OPEN_KEY = "visual-motion-svg-flow-open";

export function createDefaultSvgFlowConfig(): SvgFlowConfig {
  return {
    direction: "ltr",
    duration: 7.5,
    pause: 2,
    tail: 820,
    borderWidth: 3,
    glow: 12,
    headColor: "#FFFFFF",
    tailColor: "#0070F3",
    endColor: "#8F8F8F"
  };
}

export function parseSvgFlowSource(text: string, fileName: string): SvgFlowSource {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg || doc.querySelector("parsererror")) {
    throw new Error("无法读取这个 SVG 文件");
  }

  svg.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  svg.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const value = attribute.value.trim().toLowerCase();
      if (attribute.name.toLowerCase().startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  const shape = svg.querySelector(SHAPE_SELECTOR);
  if (!shape) {
    throw new Error("SVG 中没有可用于流光的线条元素");
  }

  const clean = document.createElementNS("http://www.w3.org/2000/svg", shape.tagName.toLowerCase());
  ["d", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "rx", "ry", "cx", "cy", "r", "points"].forEach((name) => {
    const value = shape.getAttribute(name);
    if (value !== null) clean.setAttribute(name, value);
  });

  const rawViewBox = svg.getAttribute("viewBox")?.trim();
  const viewBox = rawViewBox && rawViewBox.split(/[\s,]+/).length === 4 ? rawViewBox : "0 0 1000 180";

  return {
    fileName,
    viewBox,
    shape: new XMLSerializer().serializeToString(clean)
  };
}

function parseSafeSvg(text: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror")) throw new Error("无法读取这个 SVG 文件");

  svg.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  svg.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:") || name === "href" && value.startsWith("data:text/html")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

export async function readSvgPreviewFile(file: File): Promise<SvgPreviewAsset> {
  validateSvgFile(file);
  const svg = parseSafeSvg(await file.text());
  return { fileName: file.name, markup: new XMLSerializer().serializeToString(svg) };
}

function validateSvgFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".svg") || file.type && file.type !== "image/svg+xml") {
    throw new Error("只允许上传 SVG 文件");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG 文件不能超过 2MB");
}

export async function readSvgFlowFile(file: File): Promise<SvgFlowSource> {
  validateSvgFile(file);
  return parseSvgFlowSource(await file.text(), file.name);
}
