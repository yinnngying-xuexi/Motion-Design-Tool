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

export function parseSvgFlowSource(text: string, fileName: string): SvgFlowSource {
  const svg = parseSafeSvg(text);
  const dimensions = svgDimensions(svg);
  const shapes = [...svg.querySelectorAll<SVGGraphicsElement>(SHAPE_SELECTOR)]
    .filter((shape) => !shape.closest("defs,clipPath,mask,pattern"));
  const namedFlowShapes = shapes.filter((shape) => {
    const name = shape.getAttribute("id") ?? shape.getAttribute("data-name") ?? "";
    return FLOW_PATH_NAME.test(name.trim());
  });
  const flowShapes = namedFlowShapes.length
    ? namedFlowShapes
    : shapes.filter((shape) => shape.tagName.toLowerCase() === "path" && shape.getAttribute("stroke") !== "none").slice(0, 1);

  if (!flowShapes.length) throw new Error("SVG 中没有可用于流光的路径，请将目标路径命名为 flow-path-01");

  const targets: SvgFlowTarget[] = flowShapes.map((shape, index) => {
    const originalName = shape.getAttribute("id")?.trim()
      || shape.getAttribute("data-name")?.trim()
      || `flow-path-${String(index + 1).padStart(2, "0")}`;
    const safeId = FLOW_PATH_NAME.test(originalName)
      ? originalName
      : `dm-flow-path-${String(index + 1).padStart(2, "0")}`;
    shape.setAttribute("id", safeId);
    if (safeId !== originalName) shape.setAttribute("data-dm-original-id", originalName);
    const normalizedName = originalName.toLowerCase();
    const direction = normalizedName.endsWith("-right") || normalizedName.endsWith("_right")
      ? "rtl"
      : normalizedName.endsWith("-top") || normalizedName.endsWith("_top")
        ? "ttb"
        : normalizedName.endsWith("-bottom") || normalizedName.endsWith("_bottom")
          ? "btt"
          : "ltr";
    return { id: safeId, label: originalName, enabled: true, direction, delay: 0 };
  });

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

export function parseSvgBackgroundSource(text: string, fileName: string): SvgFlowSource {
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
  const content = background
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

export async function readSvgFlowFile(file: File): Promise<SvgFlowSource> {
  validateSvgFile(file);
  return parseSvgFlowSource(await file.text(), file.name);
}

export async function readSvgBackgroundFile(file: File): Promise<SvgFlowSource> {
  validateSvgFile(file);
  return parseSvgBackgroundSource(await file.text(), file.name);
}
