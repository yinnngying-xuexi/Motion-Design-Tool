import type {
  StarRingDecorationConfig,
  StarRingLayerConfig,
  StarRingLayerMapping,
  StarRingLayerRole,
  StarRingSvgAsset
} from "@/types/decoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import starRingSvgMarkup from "@/assets/star-ring.svg?raw";
import chartTechRingSvgMarkup from "@/assets/chart-tech-ring-01.svg?raw";
import subtitleSweepSvgMarkup from "@/assets/subtitle-orbit-sweep-01.svg?raw";
import stackedEnergyBaseSvgMarkup from "@/assets/icon-base-stacked-energy.svg?raw";
import rippleFocusBaseSvgMarkup from "@/assets/icon-base-ripple-focus.svg?raw";
import { createDefaultDecorationParticleConfig } from "@/utils/decorationParticles";

export const STAR_RING_ROLE_LABELS: Record<StarRingLayerRole, string> = {
  background: "背景层",
  "static-ring": "外环层",
  "rotating-ring": "内环层",
  center: "中心层",
  particles: "粒子层",
  "outer-ring": "外环",
  "inner-ring": "内环",
  highlight: "高亮装饰",
  glow: "光效",
  "base-back": "底层底板",
  "base-middle": "中层底板",
  "base-front": "前层底板",
  "ripple-outer": "外扩散环",
  "ripple-middle": "中扩散环",
  "ripple-inner": "内扩散环"
};

export const STAR_RING_ROLE_ORDER = Object.keys(STAR_RING_ROLE_LABELS) as StarRingLayerRole[];
export const STAR_RING_ROLE_PROFILES = {
  "star-ring": ["background", "static-ring", "rotating-ring", "center", "particles"],
  "chart-tech-ring": ["outer-ring", "inner-ring", "glow"],
  "stacked-energy-base": ["base-back", "base-middle", "base-front", "center", "glow"],
  "ripple-focus-base": ["background", "ripple-outer", "ripple-middle", "ripple-inner", "center"]
} as const satisfies Record<string, readonly StarRingLayerRole[]>;
export type StarRingRoleProfile = keyof typeof STAR_RING_ROLE_PROFILES;

const ROLE_ALIASES: Record<StarRingLayerRole, string[]> = {
  background: ["background", "bg", "base", "背景", "底座"],
  "static-ring": ["staticring", "outerring", "outring", "ringstatic", "静态环", "外环"],
  "rotating-ring": ["rotatingring", "rotatering", "middlering", "innerring", "旋转环", "中间旋转", "内环"],
  center: ["center", "centericon", "core", "icon", "中心", "中间", "图标"],
  particles: ["particles", "particle", "dots", "spark", "粒子", "光点", "前景"],
  "outer-ring": ["outerring", "outring", "outside", "externalring", "外环", "外围"],
  "inner-ring": ["innerring", "inside", "internalring", "内环", "内圈"],
  highlight: ["highlight", "accent", "flow", "lightpath", "高亮", "流光", "装饰"],
  glow: ["glow", "halo", "aura", "blur", "光效", "光晕", "辉光"],
  "base-back": ["baseback", "backbase", "backplate", "底层底板", "后层底板"],
  "base-middle": ["basemiddle", "middlebase", "middleplate", "中层底板"],
  "base-front": ["basefront", "frontbase", "frontplate", "前层底板"],
  "ripple-outer": ["rippleouter", "outerripple", "外扩散环", "外波纹"],
  "ripple-middle": ["ripplemiddle", "middleripple", "中扩散环", "中波纹"],
  "ripple-inner": ["rippleinner", "innerripple", "内扩散环", "内波纹"]
};

export function createStarRingLayerConfig(role?: StarRingLayerRole | "whole", overrides: Partial<StarRingLayerConfig> = {}): StarRingLayerConfig {
  const breathTemplate = basicMotions.find((motion) => motion.id === "breath");
  const rotateTemplate = basicMotions.find((motion) => motion.id === "slow-rotate");
  const roleDefaults: Partial<StarRingLayerConfig> = role === "outer-ring" || role === "inner-ring"
    ? {
        motion: "basic",
        duration: role === "outer-ring" ? 10 : 7.5,
        direction: role === "outer-ring" ? "clockwise" : "counterclockwise",
        basicMotionId: rotateTemplate?.id,
        basicMotionConfig: rotateTemplate
          ? {
              ...createBasicMotionConfig(rotateTemplate),
              duration: role === "outer-ring" ? 10 : 7.5,
              direction: role === "outer-ring" ? "normal" : "reverse"
            }
          : undefined
      }
    : role === "highlight"
      ? { motion: "ring-highlight", duration: 3.6 }
      : role === "glow"
        ? {
            motion: "basic",
            duration: 2.8,
            minScale: 0.96,
            basicMotionId: breathTemplate?.id,
            basicMotionConfig: breathTemplate
              ? { ...createBasicMotionConfig(breathTemplate), duration: 2.8, minScale: 0.96 }
              : undefined
          }
    : role === "base-back" || role === "base-middle" || role === "base-front"
      ? {
          motion: "stacked-energy",
          duration: 3.2,
          delay: 0,
          minOpacity: role === "base-back" ? 0.2 : role === "base-middle" ? 0.34 : 0.48
        }
      : role === "ripple-outer" || role === "ripple-middle" || role === "ripple-inner"
        ? {
            motion: "pulse",
            duration: 2.6,
            delay: role === "ripple-inner" ? 0 : role === "ripple-middle" ? 0.36 : 0.72,
            minScale: role === "ripple-inner" ? 0.84 : role === "ripple-middle" ? 0.9 : 0.94,
            minOpacity: 0.18
          }
        : role === "rotating-ring"
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
    kind: "star-ring",
    sourceMode: "preset",
    overall: {
      size: 188,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      color: "#0070F3"
    },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {},
    particleEffect: createDefaultDecorationParticleConfig(true, "#0070F3")
  };
  const { asset, mapping } = createStarRingAssetFromMarkup(starRingSvgMarkup, "星环粒子底座.svg", "preset-svg-layer");
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  return config;
}

export function createDefaultChartTechRingConfig(): StarRingDecorationConfig {
  const config: StarRingDecorationConfig = {
    version: 1,
    kind: "chart-tech-ring",
    chartContentSize: 208,
    sourceMode: "preset",
    overall: {
      size: 300,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      color: "#0070F3"
    },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {},
    particleEffect: createDefaultDecorationParticleConfig(false, "#0070F3")
  };
  const { asset, mapping } = createStarRingAssetFromMarkup(
    chartTechRingSvgMarkup,
    "饼图环形.svg",
    "dm-chart-ring-layer",
    STAR_RING_ROLE_PROFILES["chart-tech-ring"]
  );
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  return config;
}

export function createDefaultStackedEnergyBaseConfig(): StarRingDecorationConfig {
  const config: StarRingDecorationConfig = {
    version: 1,
    kind: "stacked-energy-base",
    centerIconSize: 47,
    centerIconX: 50,
    centerIconY: 25,
    stackedEnergy: {
      duration: 3.2,
      layerDelay: 0.24,
      pushDistance: 14,
      spreadScale: 12,
      glowStrength: 62,
      layerGap: 7
    },
    sourceMode: "preset",
    overall: { size: 170, offsetX: 0, offsetY: 0, opacity: 1, color: "#0070F3" },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {},
    particleEffect: createDefaultDecorationParticleConfig(false, "#0070F3")
  };
  const { asset, mapping } = createStarRingAssetFromMarkup(
    stackedEnergyBaseSvgMarkup,
    "层叠能量底座.svg",
    "dm-stacked-energy-layer",
    STAR_RING_ROLE_PROFILES["stacked-energy-base"]
  );
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  return config;
}

export function createDefaultRippleFocusBaseConfig(): StarRingDecorationConfig {
  const config: StarRingDecorationConfig = {
    version: 1,
    kind: "ripple-focus-base",
    centerIconSize: 36,
    centerIconX: 50,
    centerIconY: 20,
    sourceMode: "preset",
    overall: { size: 196, offsetX: 0, offsetY: 0, opacity: 1, color: "#20A6FF" },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {},
    particleEffect: createDefaultDecorationParticleConfig(false, "#20A6FF")
  };
  const { asset, mapping } = createStarRingAssetFromMarkup(
    rippleFocusBaseSvgMarkup,
    "环形扩散底座.svg",
    "dm-ripple-focus-layer",
    STAR_RING_ROLE_PROFILES["ripple-focus-base"]
  );
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  return config;
}

export function createDefaultLayeredDecorationConfig(preset: "star-ring" | "subtitle-sweep" = "star-ring"): StarRingDecorationConfig {
  if (preset === "star-ring") return createDefaultStarRingConfig();
  const config: StarRingDecorationConfig = {
    version: 1,
    kind: "layered-decoration",
    sourceMode: "preset",
    overall: { size: 410, offsetX: 0, offsetY: 0, opacity: 1, color: "#4DC9FF" },
    layerMapping: emptyStarRingLayerMapping(),
    layerConfigs: {},
    particleEffect: createDefaultDecorationParticleConfig(false, "#4DC9FF")
  };
  const source = sanitizeSvg(subtitleSweepSvgMarkup);
  const sourceRoot = source.querySelector<SVGGElement>(":scope > g") ?? source;
  [...sourceRoot.children].find((element) => element.getAttribute("id") === "5")?.remove();
  [...sourceRoot.children].find((element) => element.getAttribute("id") === "7")?.remove();
  const presetNames: Record<string, string> = { "4": "background" };
  [...sourceRoot.children].forEach((element) => {
    const original = cleanLayerName(element.getAttribute("id"));
    const decoded = presetNames[original]
      ?? (element.tagName.toLowerCase() === "g" ? "circle-decoration" : undefined);
    if (decoded) element.setAttribute("data-dm-layer-name", decoded);
  });
  const { asset, mapping } = createStarRingAssetFromMarkup(new XMLSerializer().serializeToString(source), "小标题.svg", "dm-subtitle-layer");
  applyStarRingAssetConfig(config, asset, mapping, "preset");
  Object.values(config.layerConfigs).forEach((layer) => {
    layer.motion = "none";
    layer.basicMotionId = undefined;
    layer.basicMotionConfig = undefined;
  });
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
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function svgDimensions(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number) ?? [];
  const width = Number.parseFloat(svg.getAttribute("width") ?? "") || viewBox[2] || 188;
  const height = Number.parseFloat(svg.getAttribute("height") ?? "") || viewBox[3] || Math.round(width * 0.7);
  return { width: Math.max(1, width), height: Math.max(1, height) };
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
  const source = (value ?? "").trim();
  if (!source) return "";
  const windows1252Bytes: Record<string, number> = {
    "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
    "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91,
    "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98,
    "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f
  };
  const codes = [...source].map((character) => windows1252Bytes[character] ?? character.charCodeAt(0));
  const mayBeFigmaUtf8Bytes = codes.some((code) => code > 127) && codes.every((code) => code <= 255);
  if (!mayBeFigmaUtf8Bytes) return source.replace(/\s+/g, " ");
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(codes));
    return /[\u3400-\u9fff]/.test(decoded) ? decoded.replace(/\s+/g, " ") : source.replace(/\s+/g, " ");
  } catch {
    return source.replace(/\s+/g, " ");
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
    if (directChildLayers.length > 1) return directChildLayers;
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

function createStarRingAssetFromMarkup(
  markup: string,
  fileName: string,
  keyPrefix = "dm-svg-layer",
  roleOrder: readonly StarRingLayerRole[] = STAR_RING_ROLE_PROFILES["star-ring"]
): { asset: StarRingSvgAsset; mapping: StarRingLayerMapping } {
  const svg = sanitizeSvg(markup);
  const dimensions = svgDimensions(svg);
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
    width: dimensions.width,
    height: dimensions.height,
    mode,
    layers,
    rootKeys: layers.filter((layer) => !layer.parentKey).map((layer) => layer.key)
  };
  return { asset, mapping: autoMapStarRingLayers(asset, roleOrder) };
}

export function autoMapStarRingLayers(
  asset: StarRingSvgAsset,
  roleOrder: readonly StarRingLayerRole[] = STAR_RING_ROLE_PROFILES["star-ring"]
): StarRingLayerMapping {
  const mapping = emptyStarRingLayerMapping();
  const used = new Set<string>();

  const matchingOrder = [...roleOrder];
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
  if (roleOrder.includes("outer-ring") && roleOrder.includes("inner-ring") && roleOrder.includes("glow")) {
    completeChartRingMappingByStructure(asset, mapping, used, roleOrder);
  }
  return mapping;
}

type ChartRingLayerMetric = {
  key: string;
  area: number;
  shapeCount: number;
  hasDash: boolean;
  hasFilter: boolean;
  hasGradient: boolean;
  meanRadius: number;
};

function completeChartRingMappingByStructure(
  asset: StarRingSvgAsset,
  mapping: StarRingLayerMapping,
  used: Set<string>,
  roleOrder: readonly StarRingLayerRole[]
): void {
  if (asset.mode !== "layered" || typeof document === "undefined") return;
  const svg = new DOMParser().parseFromString(asset.markup, "image/svg+xml").querySelector("svg");
  if (!svg) return;
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:480px;height:480px;visibility:hidden;pointer-events:none;";
  host.appendChild(svg);
  document.body.appendChild(host);
  const metrics: ChartRingLayerMetric[] = [];
  try {
    asset.layers.forEach((layer) => {
      const node = svg.querySelector<SVGGraphicsElement>(`[data-dm-node-key="${layer.key}"]`);
      if (!node) return;
      let bounds: DOMRect | SVGRect;
      try {
        bounds = node.getBBox();
      } catch {
        return;
      }
      const shapes = [...node.querySelectorAll<SVGGraphicsElement>("path,line,polyline,polygon,circle,ellipse,rect")];
      const allNodes: Element[] = [node, ...node.querySelectorAll("*")];
      const serializedStyle = allNodes.map((candidate) => [
        candidate.getAttribute("style"),
        candidate.getAttribute("fill"),
        candidate.getAttribute("stroke"),
        candidate.getAttribute("filter"),
        candidate.getAttribute("stroke-dasharray")
      ].filter(Boolean).join(" ")).join(" ").toLowerCase();
      metrics.push({
        key: layer.key,
        area: Math.max(0, bounds.width * bounds.height),
        shapeCount: Math.max(1, shapes.length),
        hasDash: /dasharray|stroke-dasharray/.test(serializedStyle),
        hasFilter: /filter|blur/.test(serializedStyle),
        hasGradient: /url\(#/.test(serializedStyle),
        meanRadius: (bounds.width + bounds.height) / 4
      });
    });
  } finally {
    host.remove();
  }

  const available = () => metrics.filter((metric) => !used.has(metric.key));
  const assign = (role: StarRingLayerRole, metric?: ChartRingLayerMetric) => {
    if (!metric || mapping[role].length) return;
    mapping[role] = [metric.key];
    used.add(metric.key);
  };

  if (!mapping.glow.length) {
    const glowCandidate = available()
      .map((metric) => ({ metric, score: (metric.hasFilter ? 8 : 0) + (metric.hasGradient ? 3 : 0) - metric.shapeCount * 0.05 }))
      .sort((left, right) => right.score - left.score)[0];
    if (glowCandidate && glowCandidate.score >= 3) assign("glow", glowCandidate.metric);
  }
  if (roleOrder.includes("highlight") && !mapping.highlight.length) {
    const highlightCandidate = available()
      .map((metric) => ({ metric, score: (metric.hasDash ? 5 : 0) + (metric.shapeCount <= 2 ? 3 : 0) + (metric.hasGradient ? 1 : 0) }))
      .sort((left, right) => right.score - left.score)[0];
    if (highlightCandidate && highlightCandidate.score >= 3) assign("highlight", highlightCandidate.metric);
  }

  const ringCandidates = available().sort((left, right) => right.meanRadius - left.meanRadius || right.area - left.area);
  if (!mapping["outer-ring"].length) assign("outer-ring", ringCandidates.shift());
  if (!mapping["inner-ring"].length) assign("inner-ring", ringCandidates.shift());
  if (roleOrder.includes("highlight") && !mapping.highlight.length) assign("highlight", ringCandidates.shift());
  if (!mapping.glow.length) assign("glow", ringCandidates.shift());
}

export async function readStarRingSvgFile(
  file: File,
  roleOrder: readonly StarRingLayerRole[] = STAR_RING_ROLE_PROFILES["star-ring"]
): Promise<{ asset: StarRingSvgAsset; mapping: StarRingLayerMapping }> {
  if (!file.name.toLowerCase().endsWith(".svg") || file.type && file.type !== "image/svg+xml") {
    throw new Error("只允许上传 SVG 文件");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG 文件不能超过 2MB");

  return createStarRingAssetFromMarkup(await file.text(), file.name, "dm-svg-layer", roleOrder);
}

export async function readLayeredDecorationSvgFile(file: File): Promise<StarRingSvgAsset> {
  if (!file.name.toLowerCase().endsWith(".svg") || file.type && file.type !== "image/svg+xml") throw new Error("只允许上传 SVG 文件");
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG 文件不能超过 2MB");
  return createStarRingAssetFromMarkup(await file.text(), file.name, "dm-decoration-layer").asset;
}

export function applyImportedLayeredDecorationConfig(config: StarRingDecorationConfig, asset: StarRingSvgAsset): void {
  const normalizedSweepNames = new Set(["光", "light", "sweep", "sweeplight", "移动光效"].map(normalizeLayerName));
  const sourceSvg = new DOMParser().parseFromString(asset.markup, "image/svg+xml").querySelector("svg");
  const removableKeys = asset.layers
    .filter((layer) => {
      const node = sourceSvg?.querySelector(`[data-dm-node-key="${layer.key}"]`);
      const names = [layer.id, layer.label, ...(node ? [node, ...node.querySelectorAll("*")].flatMap((element) => [
        element.getAttribute("data-dm-layer-name"),
        element.getAttribute("data-name"),
        element.getAttribute("id")
      ]) : [])]
        .map(cleanLayerName)
        .map(normalizeLayerName);
      return names.some((name) => normalizedSweepNames.has(name));
    })
    .map((layer) => layer.key);
  const sourceAsset = removableKeys.length > 0 && removableKeys.length < asset.layers.length
    ? (() => {
        const next = JSON.parse(JSON.stringify(asset)) as StarRingSvgAsset;
        const svg = new DOMParser().parseFromString(next.markup, "image/svg+xml").querySelector("svg");
        removableKeys.forEach((key) => svg?.querySelector(`[data-dm-node-key="${key}"]`)?.remove());
        next.layers = next.layers.filter((layer) => !removableKeys.includes(layer.key));
        next.rootKeys = next.rootKeys.filter((key) => !removableKeys.includes(key));
        if (svg) next.markup = new XMLSerializer().serializeToString(svg);
        return next;
      })()
    : asset;
  const mapping = emptyStarRingLayerMapping();
  applyStarRingAssetConfig(config, sourceAsset, mapping, "imported");
  config.kind = "layered-decoration";
  Object.values(config.layerConfigs).forEach((layer) => {
    layer.motion = "none";
    layer.basicMotionId = undefined;
    layer.basicMotionConfig = undefined;
  });
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
  const highlightKeys = [
    ...(mapping["rotating-ring"] ?? []),
    ...(mapping.highlight ?? [])
  ];
  if (asset.mode !== "layered" || !highlightKeys.length) return asset;
  const next = JSON.parse(JSON.stringify(asset)) as StarRingSvgAsset;
  const svg = new DOMParser().parseFromString(next.markup, "image/svg+xml").querySelector("svg");
  if (!svg) return next;

  svg.querySelectorAll("[data-dm-ring-segment]").forEach((node) => node.removeAttribute("data-dm-ring-segment"));
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:480px;height:480px;visibility:hidden;pointer-events:none;";
  host.appendChild(svg);
  document.body.appendChild(host);

  try {
    highlightKeys.forEach((layerKey) => {
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
  config.layerMapping = { ...mapping, particles: [...mapping.particles] };
  config.overall.color = preparedAsset.primaryColor;
  if (config.kind === "chart-tech-ring") {
    const shortestSide = Math.min(preparedAsset.width, preparedAsset.height);
    const maximumSize = Math.max(48, Math.floor(shortestSide * 0.8));
    const recommendedSize = Math.max(48, Math.round(shortestSide * 0.58));
    config.chartContentSize = sourceMode === "imported"
      ? Math.min(maximumSize, recommendedSize)
      : Math.min(maximumSize, config.chartContentSize ?? recommendedSize);
  }
  config.layerConfigs = {};
  if (preparedAsset.mode === "whole") {
    config.layerConfigs["dm-svg-whole"] = createStarRingLayerConfig("whole", {
      fillColor: preparedAsset.primaryColor,
      strokeColor: preparedAsset.primaryColor
    });
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
}

export function applyImportedStarRingConfig(config: StarRingDecorationConfig, asset: StarRingSvgAsset, mapping: StarRingLayerMapping): void {
  applyStarRingAssetConfig(config, asset, mapping, "imported");
}
