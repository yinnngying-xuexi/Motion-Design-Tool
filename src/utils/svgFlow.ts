import systemPathFlowMarkup from "@/assets/title-path-flow-01.svg?raw";
import systemPathFlow02Markup from "@/assets/title-path-flow-02.svg?raw";
import systemDoubleGuideFlowMarkup from "@/assets/title-double-guide-flow.svg?raw";
import type {
  SvgFlowConfig,
  SvgFlowSource,
  SvgFlowTarget,
  SvgPreviewAsset,
  SvgStyleConfig
} from "@/types/svgFlow";

const SHAPE_SELECTOR = "path,line,polyline,polygon,circle,ellipse,rect";
const FLOW_PATH_NAME = /^flow-path(?:[-_](?:\d+|left|right|top|bottom))?$/i;

export type SvgFlowImportMode = "single" | "double";

export const SVG_FLOW_DRAFT_KEY = "visual-motion-svg-flow-draft-v2";
export const SVG_FLOW_LEGACY_DRAFT_KEY = "visual-motion-svg-flow-draft";
export const SVG_FLOW_OPEN_KEY = "visual-motion-svg-flow-open";

export function createDefaultSvgFlowConfig(): SvgFlowConfig {
  return {
    direction: "ltr",
    easing: "linear",
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
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function svgDimensions(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number) ?? [];
  const width = Number.parseFloat(svg.getAttribute("width") ?? "") || viewBox[2] || 1000;
  const height = Number.parseFloat(svg.getAttribute("height") ?? "") || viewBox[3] || 180;
  return {
    width: Math.max(1, width),
    height: Math.max(1, height)
  };
}

function firstHorizontalPosition(element: SVGElement): number | undefined {
  const shape = element.matches(SHAPE_SELECTOR)
    ? element
    : element.querySelector<SVGElement>(SHAPE_SELECTOR);
  if (!shape) return undefined;
  const tagName = shape.tagName.toLowerCase();
  const directValue = tagName === "line"
    ? shape.getAttribute("x1")
    : tagName === "circle" || tagName === "ellipse"
      ? shape.getAttribute("cx")
      : tagName === "rect"
        ? shape.getAttribute("x")
        : undefined;
  if (directValue !== undefined && directValue !== null) {
    const value = Number.parseFloat(directValue);
    if (Number.isFinite(value)) return value;
  }

  const source = tagName === "path"
    ? shape.getAttribute("d")
    : shape.getAttribute("points");
  const match = source?.match(/(?:^|[Mm]\s*|\s)(-?\d*\.?\d+(?:e[-+]?\d+)?)/i);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function fallbackFlowShapes(shapes: SVGGraphicsElement[], mode: SvgFlowImportMode): SVGElement[] {
  const lineShapes = shapes.filter((shape) => {
    const tagName = shape.tagName.toLowerCase();
    if (!['path', 'line', 'polyline'].includes(tagName)) return false;
    const style = shape.getAttribute("style") ?? "";
    return shape.getAttribute("stroke") !== "none" && !/(?:^|;)\s*stroke\s*:\s*none(?:;|$)/i.test(style);
  });
  if (mode === "single") return lineShapes.slice(0, 1);

  const uniqueShapes = lineShapes.filter((shape, index, candidates) => {
    const geometry = shape.getAttribute("d")
      ?? shape.getAttribute("points")
      ?? [shape.getAttribute("x1"), shape.getAttribute("y1"), shape.getAttribute("x2"), shape.getAttribute("y2")].join(",");
    return candidates.findIndex((candidate) => {
      const candidateGeometry = candidate.getAttribute("d")
        ?? candidate.getAttribute("points")
        ?? [candidate.getAttribute("x1"), candidate.getAttribute("y1"), candidate.getAttribute("x2"), candidate.getAttribute("y2")].join(",");
      return candidateGeometry === geometry;
    }) === index;
  });
  return uniqueShapes
    .sort((left, right) => (firstHorizontalPosition(left) ?? 0) - (firstHorizontalPosition(right) ?? 0))
    .slice(0, 2);
}

function automaticDoubleFlowShapes(svg: SVGSVGElement, shapes: SVGGraphicsElement[]): SVGElement[] {
  const containsLineShape = (element: Element) => Boolean(element.querySelector("path,line,polyline"));
  const leafGroups = [...svg.querySelectorAll<SVGGElement>("g")]
    .filter((group) => !group.closest("defs,clipPath,mask,pattern") && containsLineShape(group))
    .filter((group) => ![...group.children].some((child) => child.tagName.toLowerCase() === "g" && containsLineShape(child)));

  if (leafGroups.length >= 2) {
    const sortedGroups = leafGroups.sort((left, right) => (firstHorizontalPosition(left) ?? 0) - (firstHorizontalPosition(right) ?? 0));
    return [sortedGroups[0], sortedGroups[sortedGroups.length - 1]];
  }
  return fallbackFlowShapes(shapes, "double");
}

export function parseSvgFlowSource(text: string, fileName: string, mode: SvgFlowImportMode = "single"): SvgFlowSource {
  const svg = parseSafeSvg(text);
  const dimensions = svgDimensions(svg);
  const shapes = [...svg.querySelectorAll<SVGGraphicsElement>(SHAPE_SELECTOR)]
    .filter((shape) => !shape.closest("defs,clipPath,mask,pattern"));
  const namedFlowShapes = [...svg.querySelectorAll<SVGElement>("[id],[data-name]")]
    .filter((element) => {
      const name = element.getAttribute("id") ?? element.getAttribute("data-name") ?? "";
      return FLOW_PATH_NAME.test(name.trim()) && Boolean(element.matches(SHAPE_SELECTOR) || element.querySelector(SHAPE_SELECTOR));
    })
    .filter((element, _index, candidates) => !candidates.some((candidate) => candidate !== element && candidate.contains(element)));
  const fallbackShapes = mode === "double"
    ? automaticDoubleFlowShapes(svg, shapes)
    : fallbackFlowShapes(shapes, mode);
  const flowShapes = namedFlowShapes.length
    ? mode === "double"
      ? [...namedFlowShapes, ...fallbackShapes.filter((shape) => !namedFlowShapes.includes(shape))].slice(0, 2)
      : namedFlowShapes
    : fallbackShapes;

  if (!flowShapes.length) throw new Error("SVG 中没有可用于流光的路径，请将目标路径命名为 flow-path-01");

  const baseTargets: SvgFlowTarget[] = flowShapes.map((shape, index) => {
    const originalName = shape.getAttribute("id")?.trim()
      || shape.getAttribute("data-name")?.trim()
      || `flow-path-${String(index + 1).padStart(2, "0")}`;
    const safeId = FLOW_PATH_NAME.test(originalName)
      ? originalName
      : `dm-flow-path-${String(index + 1).padStart(2, "0")}`;
    shape.setAttribute("id", safeId);
    if (safeId !== originalName) shape.setAttribute("data-dm-original-id", originalName);
    const normalizedName = originalName.toLowerCase();
    const explicitDirection = normalizedName.endsWith("-right") || normalizedName.endsWith("_right")
      ? "rtl"
      : normalizedName.endsWith("-top") || normalizedName.endsWith("_top")
        ? "ttb"
        : normalizedName.endsWith("-bottom") || normalizedName.endsWith("_bottom")
          ? "btt"
          : undefined;
    const firstX = firstHorizontalPosition(shape);
    const inferredDoubleDirection = mode === "double"
      ? firstX === undefined
        ? index === 0 ? "ltr" : "rtl"
        : firstX <= dimensions.width / 2 ? "ltr" : "rtl"
      : "ltr";
    const direction = explicitDirection ?? inferredDoubleDirection;
    return {
      id: safeId,
      label: originalName,
      enabled: true,
      direction,
      delay: 0,
      region: mode === "double" ? direction === "rtl" ? "right" : "left" : undefined
    };
  });
  const targets: SvgFlowTarget[] = mode === "double" && baseTargets.length === 1
    ? [
      { ...baseTargets[0], label: "左侧流光", direction: "ltr", region: "left" },
      { ...baseTargets[0], label: "右侧流光", direction: "rtl", region: "right" }
    ]
    : baseTargets;

  const rawViewBox = svg.getAttribute("viewBox")?.trim();
  const viewBox = rawViewBox && rawViewBox.split(/[\s,]+/).length === 4 ? rawViewBox : "0 0 1000 180";

  return {
    fileName,
    viewBox,
    width: dimensions.width,
    height: dimensions.height,
    shape: new XMLSerializer().serializeToString(flowShapes[0].cloneNode(true)),
    content: svg.innerHTML,
    targets
  };
}

export function parseSvgBackgroundSource(text: string, fileName: string, keepWholeSvg = false): SvgFlowSource {
  const svg = parseSafeSvg(text);
  const dimensions = svgDimensions(svg);
  const rawViewBox = svg.getAttribute("viewBox")?.trim();
  const viewBox = rawViewBox && rawViewBox.split(/[\s,]+/).length === 4
    ? rawViewBox
    : `0 0 ${dimensions.width} ${dimensions.height}`;
  const background = [...svg.querySelectorAll<SVGElement>("[id],[data-name]")].find((element) => {
    const name = element.getAttribute("id") ?? element.getAttribute("data-name") ?? "";
    return name.trim().toLowerCase() === "background";
  });
  const serializer = new XMLSerializer();
  const edgeIds = background
    ? [...background.querySelectorAll<SVGRectElement>("rect")]
      .filter((rect) => {
        const rectY = Number.parseFloat(rect.getAttribute("y") ?? "0");
        const rectHeight = Number.parseFloat(rect.getAttribute("height") ?? "0");
        return rectHeight > 0 && rectHeight <= 8
          && (rectY <= 3 || rectY + rectHeight >= dimensions.height - 3);
      })
      .map((rect, index) => {
        const id = rect.getAttribute("id")?.trim() || `dm-background-edge-${index + 1}`;
        rect.setAttribute("id", id);
        return id;
      })
    : [];
  const definitions = [...svg.querySelectorAll("defs")]
    .filter((defs) => !background?.contains(defs))
    .map((defs) => serializer.serializeToString(defs))
    .join("");
  const content = keepWholeSvg
    ? svg.innerHTML
    : background
      ? `${serializer.serializeToString(background)}${definitions}`
      : svg.innerHTML;

  return {
    fileName,
    viewBox,
    width: dimensions.width,
    height: dimensions.height,
    shape: content,
    content,
    targets: [],
    roles: { lightIds: [], edgeIds }
  };
}

export function createSystemSvgFlowSource(effectId = "svg-flow-tool"): SvgFlowSource {
  const presets: Record<string, { markup: string; fileName: string }> = {
    "svg-flow-tool": { markup: systemPathFlowMarkup, fileName: "单边流光.svg" },
    "svg-flow-tool-02": { markup: systemPathFlow02Markup, fileName: "双边流光.svg" },
    "svg-flow-double-guide": { markup: systemDoubleGuideFlowMarkup, fileName: "水波纹流光.svg" }
  };
  const preset = presets[effectId] ?? presets["svg-flow-tool"];
  return effectId === "svg-flow-double-guide"
    ? parseSvgBackgroundSource(preset.markup, preset.fileName)
    : parseSvgFlowSource(preset.markup, preset.fileName);
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
  const dimensions = svgDimensions(svg);
  return {
    fileName: file.name,
    markup: new XMLSerializer().serializeToString(svg),
    primaryColor: detectPrimarySvgColor(svg),
    width: dimensions.width,
    height: dimensions.height
  };
}

function validateSvgFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".svg") || file.type && file.type !== "image/svg+xml") {
    throw new Error("只允许上传 SVG 文件");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG 文件不能超过 2MB");
}

export async function readSvgFlowFile(file: File, mode: SvgFlowImportMode = "single"): Promise<SvgFlowSource> {
  validateSvgFile(file);
  return parseSvgFlowSource(await file.text(), file.name, mode);
}

export async function readSvgBackgroundFile(file: File): Promise<SvgFlowSource> {
  validateSvgFile(file);
  // 水波纹模板将用户上传的完整 SVG 视为一个背景素材，不依赖内部图层命名。
  return parseSvgBackgroundSource(await file.text(), file.name, true);
}
