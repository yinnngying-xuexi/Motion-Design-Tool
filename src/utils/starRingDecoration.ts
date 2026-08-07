import type {
  StarRingDecorationConfig,
  StarRingLayerConfig,
  StarRingLayerMapping,
  StarRingLayerRole,
  StarRingSvgAsset
} from "@/types/decoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import starRingSvgMarkup from "@/assets/star-ring.svg?raw";

export const STAR_RING_ROLE_LABELS: Record<StarRingLayerRole, string> = {
  background: "背景层",
  "static-ring": "外环层",
  "rotating-ring": "内环层",
  center: "中心层",
  particles: "粒子层"
};

export const STAR_RING_ROLE_ORDER = Object.keys(STAR_RING_ROLE_LABELS) as StarRingLayerRole[];
export const STAR_RING_SYSTEM_PARTICLES_KEY = "system-particles";

const ROLE_ALIASES: Record<StarRingLayerRole, string[]> = {
  background: ["background", "bg", "base", "背景", "底座"],
  "static-ring": ["staticring", "outerring", "outring", "ringstatic", "静态环", "外环"],
  "rotating-ring": ["rotatingring", "rotatering", "middlering", "innerring", "旋转环", "中间旋转", "内环"],
  center: ["center", "centericon", "core", "icon", "中心", "中间", "图标"],
  particles: ["particles", "particle", "dots", "spark", "粒子", "光点", "前景"]
};

export function createStarRingLayerConfig(role?: StarRingLayerRole | "whole", overrides: Partial<StarRingLayerConfig> = {}): StarRingLayerConfig {
  const breathTemplate = basicMotions.find((motion) => motion.id === "breath");
  const roleDefaults: Partial<StarRingLayerConfig> = role === "rotating-ring"
    ? { motion: "ring-highlight", duration: 4.2 }
    : role === "center"
      ? {
          motion: "basic",
          duration: 2.2,
          minScale: 0.96,
          basicMotionId: breathTemplate?.id,
          basicMotionConfig: breathTemplate ? createBasicMotionConfig(breathTemplate) : undefined
        }
      : role === "particles"
        ? { motion: "particle-float", duration: 2.8, distance: 14, minOpacity: 0.2 }
        : role === "whole"
          ? { motion: "rotate", duration: 6 }
          : { motion: "none" };
  return {
    visible: true,
    colorMode: "original",
    fillColor: "#0070F3",
    strokeColor: "#0070F3",
    strokeWidth: 1,
    opacity: 1,
    motion: "none",
    duration: 4.2,
    delay: 0,
    direction: "clockwise",
    minScale: 0.96,
    distance: 14,
    minOpacity: 0.25,
    particleIntensity: 70,
    ...roleDefaults,
    ...overrides
  };
}

export function createDefaultStarRingConfig(): StarRingDecorationConfig {
  const config: StarRingDecorationConfig = {
    version: 1,
    sourceMode: "preset",
    overall: {
      size: 188,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      color: "#0070F3"
    },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {}
  };
  const { asset, mapping } = createStarRingAssetFromMarkup(starRingSvgMarkup, "星环粒子底座.svg", "preset-svg-layer");
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  return config;
}

function sanitizeSvg(text: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror")) throw new Error("无法读取这个 SVG 文件");

  svg.querySelectorAll("script,style,link,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  [svg, ...svg.querySelectorAll("*")].forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const externalReference = (name === "href" || name === "xlink:href") && value && !value.startsWith("#");
      const unsafeUrl = /url\s*\(\s*(?!['"]?#)/i.test(attribute.value) || /javascript:|expression\s*\(/i.test(attribute.value);
      if (name.startsWith("on") || externalReference || unsafeUrl || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function detectPrimaryColor(svg: SVGSVGElement): string {
  const values = [...svg.querySelectorAll("*")].flatMap((element) => {
    const style = element.getAttribute("style") ?? "";
    return [
      element.getAttribute("fill"),
      style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i)?.[1],
      element.getAttribute("stroke"),
      style.match(/(?:^|;)\s*stroke\s*:\s*([^;]+)/i)?.[1]
    ];
  });
  return values.find((value) => {
    const normalized = value?.trim().toLowerCase();
    return normalized && normalized !== "none" && normalized !== "transparent" && !normalized.startsWith("url(");
  })?.trim() || "#0070F3";
}

function normalizeLayerName(value: string): string {
  return value.toLowerCase().replace(/[\s_\-.:/]+/g, "");
}

const GENERIC_LAYER_NAME_PATTERN = /^(?:g|group|vector|shape|path|layer|frame|分组|矢量|图层)(?:[\s_-]*\d+)?$/i;
const GENERATED_LAYER_NAME_PATTERN = /^(?:clip(?:path)?|mask|filter|paint|lineargradient|radialgradient|gradient|pattern|image|rect|ellipse|circle|line|polygon|polyline|path|vector|union|subtract|intersect|exclude|boolean|combine|difference)[\s_-]*\d*(?:[\s_-].*)?$/i;
const NAMED_SHAPE_SELECTOR = ":scope > path, :scope > line, :scope > polyline, :scope > polygon, :scope > circle, :scope > ellipse, :scope > rect";

function cleanLayerName(value: string | null | undefined): string {
  const cleaned = (value ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  const codes = [...cleaned].map((character) => character.charCodeAt(0));
  const mayBeFigmaUtf8Bytes = codes.some((code) => code > 127) && codes.every((code) => code <= 255);
  if (!mayBeFigmaUtf8Bytes) return cleaned;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(codes));
    return /[\u3400-\u9fff]/.test(decoded) ? decoded : cleaned;
  } catch {
    return cleaned;
  }
}

function isMeaningfulLayerName(value: string): boolean {
  if (!value) return false;
  const normalized = normalizeLayerName(value);
  return Boolean(normalized)
    && !GENERIC_LAYER_NAME_PATTERN.test(value)
    && !GENERATED_LAYER_NAME_PATTERN.test(normalized);
}

function readElementLayerName(element: Element): string {
  const candidates = [
    element.getAttribute("data-dm-role"),
    element.getAttribute("data-dm-layer-name"),
    element.getAttribute("data-name"),
    element.getAttribute("aria-label"),
    element.getAttribute("inkscape:label"),
    element.getAttribute("id")
  ].map(cleanLayerName);
  return candidates.find(isMeaningfulLayerName) ?? "";
}

function resolveImportedLayerName(element: Element): string {
  const ownName = readElementLayerName(element);
  if (ownName) return ownName;

  const directTitle = [...element.children]
    .find((child) => child.tagName.toLowerCase() === "title")?.textContent;
  const titleName = cleanLayerName(directTitle);
  if (isMeaningfulLayerName(titleName)) return titleName;

  const childNames = [...element.querySelectorAll(NAMED_SHAPE_SELECTOR)]
    .map(readElementLayerName)
    .filter(isMeaningfulLayerName);
  const uniqueChildNames = [...new Set(childNames)];
  const roleName = uniqueChildNames.find((name) => {
    const normalized = normalizeLayerName(name);
    return Object.values(ROLE_ALIASES)
      .flat()
      .map(normalizeLayerName)
      .some((alias) => normalized.includes(alias));
  });
  if (roleName) return roleName;
  return uniqueChildNames.length === 1 ? uniqueChildNames[0] : "";
}

function matchesStarRingRole(name: string): boolean {
  const normalized = normalizeLayerName(name);
  return Object.values(ROLE_ALIASES)
    .flat()
    .map(normalizeLayerName)
    .some((alias) => normalized.includes(alias));
}

function matchingStarRingRole(name: string): StarRingLayerRole | undefined {
  const normalized = normalizeLayerName(name);
  return STAR_RING_ROLE_ORDER.find((role) => ROLE_ALIASES[role]
    .map(normalizeLayerName)
    .some((alias) => normalized.includes(alias)));
}

function removeDuplicateRoleDescendants(groups: SVGGElement[]): SVGGElement[] {
  const candidates = new Set(groups);
  return groups.filter((group) => {
    const role = matchingStarRingRole(resolveImportedLayerName(group));
    if (!role) return true;
    let parent = group.parentElement?.closest<SVGGElement>("g") ?? null;
    while (parent) {
      if (candidates.has(parent) && matchingStarRingRole(resolveImportedLayerName(parent)) === role) return false;
      parent = parent.parentElement?.closest<SVGGElement>("g") ?? null;
    }
    return true;
  });
}

const DIRECT_LAYER_SELECTOR = ":scope > g, :scope > path, :scope > line, :scope > polyline, :scope > polygon, :scope > circle, :scope > ellipse, :scope > rect";

function directNamedLayerElements(parent: Element): Element[] {
  return [...parent.querySelectorAll<Element>(DIRECT_LAYER_SELECTOR)]
    .filter((element) => isMeaningfulLayerName(resolveImportedLayerName(element)));
}

function selectImportedLayerElements(svg: SVGSVGElement): Element[] {
  const groups = [...svg.querySelectorAll<SVGGElement>("g")];

  const directRootLayers = directNamedLayerElements(svg);
  const rootGroups = [...svg.querySelectorAll<SVGGElement>(":scope > g")];
  if (rootGroups.length === 1) {
    const directChildLayers = directNamedLayerElements(rootGroups[0]);
    const matchedRoleCount = directChildLayers.filter((element) => matchesStarRingRole(resolveImportedLayerName(element))).length;
    if (matchedRoleCount >= 2) return directChildLayers;
  }
  if (directRootLayers.filter((element) => matchesStarRingRole(resolveImportedLayerName(element))).length >= 2) {
    return directRootLayers;
  }

  const semanticRoot = groups.find((group) => {
    const directLayers = directNamedLayerElements(group);
    return directLayers.filter((child) => matchesStarRingRole(resolveImportedLayerName(child))).length >= 2;
  });
  if (semanticRoot) {
    const semanticLayers = directNamedLayerElements(semanticRoot);
    if (semanticLayers.length) return semanticLayers;
  }

  if (rootGroups.length === 1) {
    const namedDescendants = removeDuplicateRoleDescendants([...rootGroups[0].querySelectorAll<SVGGElement>("g")]
      .filter((group) => isMeaningfulLayerName(resolveImportedLayerName(group))));
    if (namedDescendants.length > 1) return namedDescendants;
  }
  const namedGroups = removeDuplicateRoleDescendants(groups.filter((group) => isMeaningfulLayerName(resolveImportedLayerName(group))));
  return namedGroups.length ? namedGroups : rootGroups.length ? rootGroups : groups;
}

function emptyStarRingLayerMapping(): StarRingLayerMapping {
  return STAR_RING_ROLE_ORDER.reduce((result, role) => {
    result[role] = [];
    return result;
  }, {} as StarRingLayerMapping);
}

function createStarRingAssetFromMarkup(markup: string, fileName: string, keyPrefix = "dm-svg-layer"): { asset: StarRingSvgAsset; mapping: StarRingLayerMapping } {
  const svg = sanitizeSvg(markup);
  const shapeCount = svg.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect").length;
  if (!shapeCount) throw new Error("SVG 中没有可用的图形内容");

  const layerElements = selectImportedLayerElements(svg);
  const mode = layerElements.length > 1 ? "layered" : "whole";
  if (mode === "layered") {
    layerElements.forEach((element, index) => element.setAttribute("data-dm-node-key", `${keyPrefix}-${index + 1}`));
  }
  const layers = mode === "layered" ? layerElements.map((element, index) => {
    const key = `${keyPrefix}-${index + 1}`;
    const parentGroup = element.parentElement?.closest("g[data-dm-node-key]");
    const originalName = resolveImportedLayerName(element);
    let depth = 0;
    let parent = parentGroup;
    while (parent) {
      depth += 1;
      parent = parent.parentElement?.closest("g[data-dm-node-key]") ?? null;
    }
    return {
      key,
      id: originalName,
      label: originalName || `unnamed-layer-${index + 1}`,
      tagName: element.tagName.toLowerCase(),
      parentKey: parentGroup?.getAttribute("data-dm-node-key") || null,
      depth
    };
  }) : [];

  if (mode === "whole") svg.setAttribute("data-dm-node-key", "dm-svg-whole");
  const asset: StarRingSvgAsset = {
    fileName,
    markup: new XMLSerializer().serializeToString(svg),
    primaryColor: detectPrimaryColor(svg),
    mode,
    layers,
    rootKeys: layers.filter((layer) => !layer.parentKey).map((layer) => layer.key)
  };
  return { asset, mapping: autoMapStarRingLayers(asset) };
}

export function autoMapStarRingLayers(asset: StarRingSvgAsset): StarRingLayerMapping {
  const mapping = emptyStarRingLayerMapping();
  const used = new Set<string>();

  const matchingOrder: StarRingLayerRole[] = ["background", "rotating-ring", "static-ring", "center", "particles"];
  matchingOrder.forEach((role) => {
    const aliases = ROLE_ALIASES[role].map(normalizeLayerName);
    const matched = asset.layers.find((layer) => {
      if (used.has(layer.key)) return false;
      const name = normalizeLayerName(`${layer.id} ${layer.label}`);
      return aliases.some((alias) => name.includes(alias));
    });
    if (matched) {
      mapping[role] = [matched.key];
      used.add(matched.key);
    }
  });
  return mapping;
}

export async function readStarRingSvgFile(file: File): Promise<{ asset: StarRingSvgAsset; mapping: StarRingLayerMapping }> {
  if (!file.name.toLowerCase().endsWith(".svg") || file.type && file.type !== "image/svg+xml") {
    throw new Error("只允许上传 SVG 文件");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG 文件不能超过 2MB");

  return createStarRingAssetFromMarkup(await file.text(), file.name);
}

export function renameStarRingAssetLayers(asset: StarRingSvgAsset, labels: Record<string, string>): StarRingSvgAsset {
  const next = JSON.parse(JSON.stringify(asset)) as StarRingSvgAsset;
  const svg = new DOMParser().parseFromString(next.markup, "image/svg+xml").querySelector("svg");
  next.layers = next.layers.map((layer, index) => {
    const label = cleanLayerName(labels[layer.key]) || layer.label || `未命名图层 ${index + 1}`;
    const node = svg?.querySelector(`[data-dm-node-key="${layer.key}"]`);
    node?.setAttribute("data-dm-layer-name", label);
    return {
      ...layer,
      id: layer.id || label,
      label
    };
  });
  if (svg) next.markup = new XMLSerializer().serializeToString(svg);
  return next;
}

const RING_SEGMENT_SHAPE_SELECTOR = "path,line,polyline,polygon,circle,ellipse,rect";
const RING_SEGMENT_NAME_PATTERN = /(?:^|[-_\s])(segment|slice|part|section|分段|扇区|亮片)(?:[-_\s]|\d|$)/i;

function prepareRingHighlightSegments(asset: StarRingSvgAsset, mapping: StarRingLayerMapping): StarRingSvgAsset {
  if (asset.mode !== "layered" || !mapping["rotating-ring"].length) return asset;
  const next = JSON.parse(JSON.stringify(asset)) as StarRingSvgAsset;
  const svg = new DOMParser().parseFromString(next.markup, "image/svg+xml").querySelector("svg");
  if (!svg) return next;

  svg.querySelectorAll("[data-dm-ring-segment]").forEach((node) => node.removeAttribute("data-dm-ring-segment"));
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:480px;height:480px;visibility:hidden;pointer-events:none;";
  host.appendChild(svg);
  document.body.appendChild(host);

  try {
    mapping["rotating-ring"].forEach((layerKey) => {
      const root = svg.querySelector<SVGGElement>(`[data-dm-node-key="${layerKey}"]`);
      if (!root) return;
      const directChildren = [...root.children].filter((node): node is SVGGraphicsElement => node instanceof SVGGraphicsElement);
      const namedSegments = [...root.querySelectorAll<SVGGraphicsElement>("g,path,line,polyline,polygon,circle,ellipse,rect")]
        .filter((node) => RING_SEGMENT_NAME_PATTERN.test([node.getAttribute("id"), node.getAttribute("data-name"), node.getAttribute("data-dm-layer-name")].filter(Boolean).join(" ")))
        .filter((node) => node.matches(RING_SEGMENT_SHAPE_SELECTOR) || Boolean(node.querySelector(RING_SEGMENT_SHAPE_SELECTOR)));
      const directGroups = directChildren.filter((node) => node.tagName.toLowerCase() === "g" && Boolean(node.querySelector(RING_SEGMENT_SHAPE_SELECTOR)));
      const directShapes = directChildren.filter((node) => node.matches(RING_SEGMENT_SHAPE_SELECTOR));
      const nestedShapeSet = [...root.querySelectorAll<SVGGElement>("g")]
        .map((group) => [...group.children].filter((node): node is SVGGraphicsElement => node instanceof SVGGraphicsElement && node.matches(RING_SEGMENT_SHAPE_SELECTOR)))
        .filter((shapes) => shapes.length >= 3)
        .sort((left, right) => right.length - left.length)[0] ?? [];
      const rawSegments = namedSegments.length >= 3
        ? namedSegments.filter((node) => !namedSegments.some((candidate) => candidate !== node && candidate.contains(node)))
        : directGroups.length >= 3
          ? directGroups
          : directShapes.length >= 3
            ? directShapes
            : nestedShapeSet;
      const rootBounds = root.getBBox();
      const layer = next.layers.find((candidate) => candidate.key === layerKey);
      if (layer) {
        layer.highlightBounds = {
          x: rootBounds.x,
          y: rootBounds.y,
          width: rootBounds.width,
          height: rootBounds.height
        };
        layer.highlightSegmentCount = rawSegments.length >= 3 ? rawSegments.length : 0;
      }
      if (rawSegments.length < 3) return;

      const centerX = rootBounds.x + rootBounds.width / 2;
      const centerY = rootBounds.y + rootBounds.height / 2;
      const sorted = rawSegments.map((node) => {
        const bounds = node.getBBox();
        const nodeX = bounds.x + bounds.width / 2;
        const nodeY = bounds.y + bounds.height / 2;
        const angle = (Math.atan2(nodeX - centerX, -(nodeY - centerY)) + Math.PI * 2) % (Math.PI * 2);
        return { node, angle };
      }).sort((left, right) => left.angle - right.angle);

      sorted.forEach(({ node }, index) => node.setAttribute("data-dm-ring-segment", String(index)));
      if (layer) layer.highlightSegmentCount = sorted.length;
    });
  } finally {
    host.remove();
  }

  next.markup = new XMLSerializer().serializeToString(svg);
  return next;
}

function applyStarRingAssetConfig(config: StarRingDecorationConfig, asset: StarRingSvgAsset, mapping: StarRingLayerMapping, sourceMode: "preset" | "imported"): void {
  const preparedAsset = prepareRingHighlightSegments(asset, mapping);
  config.sourceMode = sourceMode;
  config.svg = preparedAsset;
  config.layerMapping = {
    ...mapping,
    particles: [...mapping.particles, STAR_RING_SYSTEM_PARTICLES_KEY]
  };
  config.overall.color = preparedAsset.primaryColor;
  config.layerConfigs = {};
  if (preparedAsset.mode === "whole") {
    config.layerConfigs["dm-svg-whole"] = createStarRingLayerConfig("whole", {
      fillColor: preparedAsset.primaryColor,
      strokeColor: preparedAsset.primaryColor
    });
    config.layerConfigs[STAR_RING_SYSTEM_PARTICLES_KEY] = createStarRingLayerConfig("particles");
    return;
  }
  preparedAsset.layers.forEach((layer) => {
    const role = STAR_RING_ROLE_ORDER.find((candidate) => mapping[candidate].includes(layer.key));
    config.layerConfigs[layer.key] = createStarRingLayerConfig(role, {
      visible: true,
      fillColor: preparedAsset.primaryColor,
      strokeColor: preparedAsset.primaryColor
    });
  });
  config.layerConfigs[STAR_RING_SYSTEM_PARTICLES_KEY] = createStarRingLayerConfig("particles");
}

export function applyImportedStarRingConfig(config: StarRingDecorationConfig, asset: StarRingSvgAsset, mapping: StarRingLayerMapping): void {
  applyStarRingAssetConfig(config, asset, mapping, "imported");
}
