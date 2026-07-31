import type { SvgFlowConfig, SvgFlowSource, SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";

const SHAPE_SELECTOR = "path,line,polyline,polygon,circle,ellipse,rect";

export const SVG_FLOW_DRAFT_KEY = "visual-motion-svg-flow-draft-v2";
export const SVG_FLOW_LEGACY_DRAFT_KEY = "visual-motion-svg-flow-draft";
export const SVG_FLOW_OPEN_KEY = "visual-motion-svg-flow-open";

export function createDefaultSvgFlowConfig(): SvgFlowConfig {
  return {
    direction: "ltr",
    duration: 5,
    pause: 0.8,
    tail: 420,
    borderWidth: 3,
    glow: 14,
    headColor: "#7AB8FF",
    tailColor: "#0070F3",
    endColor: "#003B82"
  };
}

export function parseSvgFlowSource(text: string, fileName: string): SvgFlowSource {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg || doc.querySelector("parsererror")) {
    throw new Error("无法读取这个 SVG 文件");
  }

  svg.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  [svg, ...svg.querySelectorAll("*")].forEach((element) => {
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

  svg.querySelectorAll("script,style,link,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  [svg, ...svg.querySelectorAll("*")].forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const isExternalReference = (name === "href" || name === "xlink:href") && value && !value.startsWith("#");
      const hasUnsafeUrl = /url\s*\(\s*(?!['"]?#)/i.test(attribute.value) || /javascript:|expression\s*\(/i.test(attribute.value);
      if (name.startsWith("on") || isExternalReference || hasUnsafeUrl || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function detectPrimarySvgColor(svg: SVGSVGElement): string {
  const candidates = [...svg.querySelectorAll("*")].flatMap((element) => {
    const style = element.getAttribute("style") ?? "";
    const styleFill = style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i)?.[1];
    const styleStroke = style.match(/(?:^|;)\s*stroke\s*:\s*([^;]+)/i)?.[1];
    return [element.getAttribute("fill"), styleFill, element.getAttribute("stroke"), styleStroke];
  });
  const color = candidates.find((value) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized !== "none" && normalized !== "transparent" && normalized !== "currentcolor" && !normalized.startsWith("url(");
  });
  return color?.trim() || "#0070F3";
}

export function createDefaultSvgStyleConfig(primaryColor = "#0070F3"): SvgStyleConfig {
  return {
    colorMode: "original",
    fillColor: primaryColor,
    strokeColor: primaryColor,
    strokeWidth: 1,
    opacity: 1
  };
}

export async function readSvgPreviewFile(file: File): Promise<SvgPreviewAsset> {
  validateSvgFile(file);
  const svg = parseSafeSvg(await file.text());
  return {
    fileName: file.name,
    markup: new XMLSerializer().serializeToString(svg),
    primaryColor: detectPrimarySvgColor(svg)
  };
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
