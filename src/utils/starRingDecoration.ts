import type {
  StarRingDecorationConfig,
  StarRingLayerConfig,
  StarRingLayerMapping,
  StarRingLayerRole,
  StarRingSvgAsset
} from "@/types/decoration";

export const STAR_RING_ROLE_LABELS: Record<StarRingLayerRole, string> = {
  background: "背景层",
  "static-ring": "静态环层",
  "rotating-ring": "旋转环层",
  center: "中心层",
  particles: "粒子层"
};

export const STAR_RING_ROLE_ORDER = Object.keys(STAR_RING_ROLE_LABELS) as StarRingLayerRole[];

const ROLE_ALIASES: Record<StarRingLayerRole, string[]> = {
  background: ["background", "bg", "base", "背景", "底座"],
  "static-ring": ["staticring", "outerring", "ringstatic", "静态环", "外环"],
  "rotating-ring": ["rotatingring", "rotatering", "middlering", "innerring", "旋转环", "中间旋转"],
  center: ["center", "centericon", "core", "icon", "中心", "中间", "图标"],
  particles: ["particles", "particle", "dots", "spark", "粒子", "光点", "前景"]
};

export function createStarRingLayerConfig(role?: StarRingLayerRole | "whole", overrides: Partial<StarRingLayerConfig> = {}): StarRingLayerConfig {
  const roleDefaults: Partial<StarRingLayerConfig> = role === "rotating-ring"
    ? { motion: "rotate", duration: 4.2 }
    : role === "center"
      ? { motion: "pulse", duration: 2.4, minScale: 0.96 }
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
    ...roleDefaults,
    ...overrides
  };
}

export function createDefaultStarRingConfig(): StarRingDecorationConfig {
  return {
    version: 1,
    sourceMode: "preset",
    overall: {
      size: 188,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      color: "#0070F3"
    },
    layerMapping: {
      background: ["preset-background"],
      "static-ring": ["preset-static-ring"],
      "rotating-ring": ["preset-rotating-ring"],
      center: ["preset-center"],
      particles: ["preset-particles"]
    },
    layerConfigs: {
      "preset-background": createStarRingLayerConfig("background", { opacity: 0.72 }),
      "preset-static-ring": createStarRingLayerConfig("static-ring", { opacity: 0.78 }),
      "preset-rotating-ring": createStarRingLayerConfig("rotating-ring"),
      "preset-center": createStarRingLayerConfig("center", { opacity: 0.7 }),
      "preset-particles": createStarRingLayerConfig("particles")
    }
  };
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

export function autoMapStarRingLayers(asset: StarRingSvgAsset): StarRingLayerMapping {
  const mapping = STAR_RING_ROLE_ORDER.reduce((result, role) => {
    result[role] = [];
    return result;
  }, {} as StarRingLayerMapping);
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

  const svg = sanitizeSvg(await file.text());
  const shapeCount = svg.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect").length;
  if (!shapeCount) throw new Error("SVG 中没有可用的图形内容");

  const groups = [...svg.querySelectorAll("g")];
  const mode = groups.length > 1 ? "layered" : "whole";
  const layers = mode === "layered" ? groups.map((element, index) => {
    const key = `dm-svg-layer-${index + 1}`;
    element.setAttribute("data-dm-node-key", key);
    const parentGroup = element.parentElement?.closest("g[data-dm-node-key]");
    const id = element.getAttribute("data-dm-role") || element.getAttribute("id") || "";
    let depth = 0;
    let parent = element.parentElement?.closest("g");
    while (parent) {
      depth += 1;
      parent = parent.parentElement?.closest("g") ?? null;
    }
    return {
      key,
      id,
      label: id || `分组 ${index + 1}`,
      tagName: "g",
      parentKey: parentGroup?.getAttribute("data-dm-node-key") || null,
      depth
    };
  }) : [];

  if (mode === "whole") svg.setAttribute("data-dm-node-key", "dm-svg-whole");
  const asset: StarRingSvgAsset = {
    fileName: file.name,
    markup: new XMLSerializer().serializeToString(svg),
    primaryColor: detectPrimaryColor(svg),
    mode,
    layers,
    rootKeys: layers.filter((layer) => !layer.parentKey).map((layer) => layer.key)
  };
  return { asset, mapping: autoMapStarRingLayers(asset) };
}

export function applyImportedStarRingConfig(config: StarRingDecorationConfig, asset: StarRingSvgAsset, mapping: StarRingLayerMapping): void {
  config.sourceMode = "imported";
  config.svg = asset;
  config.layerMapping = { ...mapping };
  config.overall.color = asset.primaryColor;
  config.layerConfigs = {};
  if (asset.mode === "whole") {
    config.layerConfigs["dm-svg-whole"] = createStarRingLayerConfig("whole", {
      fillColor: asset.primaryColor,
      strokeColor: asset.primaryColor
    });
    return;
  }
  const mappedKeys = new Set(Object.values(mapping).flat());
  const structuralKeys = new Set<string>();
  asset.layers.forEach((layer) => {
    if (!mappedKeys.has(layer.key)) return;
    let parentKey = layer.parentKey;
    while (parentKey) {
      structuralKeys.add(parentKey);
      parentKey = asset.layers.find((candidate) => candidate.key === parentKey)?.parentKey ?? null;
    }
  });
  asset.layers.forEach((layer) => {
    let parentKey = layer.parentKey;
    while (parentKey) {
      if (mappedKeys.has(parentKey)) {
        structuralKeys.add(layer.key);
        break;
      }
      parentKey = asset.layers.find((candidate) => candidate.key === parentKey)?.parentKey ?? null;
    }
  });
  asset.layers.forEach((layer) => {
    const role = STAR_RING_ROLE_ORDER.find((candidate) => mapping[candidate].includes(layer.key));
    config.layerConfigs[layer.key] = createStarRingLayerConfig(role, {
      visible: Boolean(role) || structuralKeys.has(layer.key),
      fillColor: asset.primaryColor,
      strokeColor: asset.primaryColor
    });
  });
}
