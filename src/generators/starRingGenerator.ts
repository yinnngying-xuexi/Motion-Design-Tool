import type {
  DecorationParticleConfig,
  StackedEnergyMotionConfig,
  StarRingDecorationConfig,
  StarRingLayerConfig,
  StarRingLayerRole
} from "@/types/decoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import type { BasicMotionConfig } from "@/types/motion";
import { generateDecorationParticleCss, generateDecorationParticleMarkup } from "@/generators/decorationParticleGenerator";
import { normalizeDecorationParticleConfig } from "@/utils/decorationParticles";

const CLASS_NAME = "dm-star-ring";

function classNameFor(config: StarRingDecorationConfig): string {
  if (config.kind === "chart-tech-ring") return "dm-chart-tech-ring";
  if (config.kind === "stacked-energy-base") return "dm-stacked-energy-base";
  if (config.kind === "ripple-focus-base") return "dm-ripple-focus-base";
  return config.kind === "layered-decoration"
    ? "dm-layered-decoration"
    : CLASS_NAME;
}

function resolvedParticleEffect(config: StarRingDecorationConfig): DecorationParticleConfig {
  const legacy = config.layerConfigs["system-particles"];
  const result = normalizeDecorationParticleConfig(config.particleEffect, legacy?.visible ?? true, config.overall.color);
  if (!config.particleEffect && legacy) result.intensity = legacy.particleIntensity ?? 70;
  return result;
}

const DEFAULT_STACKED_ENERGY: StackedEnergyMotionConfig = {
  duration: 3.2,
  layerDelay: 0.24,
  pushDistance: 14,
  spreadScale: 12,
  glowStrength: 62,
  layerGap: 7
};

function normalizeStackedEnergy(value?: StackedEnergyMotionConfig): StackedEnergyMotionConfig {
  const config = { ...DEFAULT_STACKED_ENERGY, ...value };
  return {
    duration: Math.min(6, Math.max(1.6, config.duration)),
    layerDelay: Math.min(0.8, Math.max(0, config.layerDelay)),
    pushDistance: Math.min(36, Math.max(0, config.pushDistance)),
    spreadScale: Math.min(24, Math.max(0, config.spreadScale)),
    glowStrength: Math.min(100, Math.max(0, config.glowStrength)),
    layerGap: Math.min(24, Math.max(0, config.layerGap))
  };
}

function stackedEnergyFrames(role: StarRingLayerRole | undefined, config: StackedEnergyMotionConfig): string {
  const glowRatio = config.glowStrength / 100;
  const glow = Number((2 + glowRatio * 12).toFixed(2));
  const bright = Number((1.04 + glowRatio * 0.9).toFixed(2));
  const spread = Number((1 + config.spreadScale / 100).toFixed(3));
  if (role === "base-back") {
    return `0%,100%{transform:translateY(${config.layerGap}px) scale(.96);opacity:.18;filter:brightness(.72) drop-shadow(0 0 0 transparent)}48%{transform:translateY(${Number((config.layerGap - config.pushDistance * .35).toFixed(2))}px) scale(${spread});opacity:.64;filter:brightness(${Number((1 + glowRatio * .48).toFixed(2))}) drop-shadow(0 0 ${Number((glow * .7).toFixed(2))}px color-mix(in srgb,var(--star-ring-color) ${Math.round(38 + glowRatio * 34)}%,transparent))}`;
  }
  if (role === "base-middle") {
    return `0%,100%{transform:translateY(${Number((config.pushDistance * .45).toFixed(2))}px) scale(.97);opacity:.28;filter:brightness(.82) drop-shadow(0 0 0 transparent)}50%{transform:translateY(-${Number((config.pushDistance * .28).toFixed(2))}px) scale(1.025);opacity:.86;filter:brightness(${Number((1.08 + glowRatio * .54).toFixed(2))}) drop-shadow(0 0 ${Number((glow * .82).toFixed(2))}px color-mix(in srgb,var(--star-ring-color) ${Math.round(45 + glowRatio * 38)}%,transparent))}`;
  }
  return `0%,100%{transform:translateY(-${config.layerGap}px) scale(.985);opacity:.46;filter:brightness(.9) drop-shadow(0 0 ${Number((glow * .2).toFixed(2))}px color-mix(in srgb,var(--star-ring-color) 26%,transparent))}44%,58%{transform:translateY(-${Number((config.layerGap + config.pushDistance * .22).toFixed(2))}px) scale(1.02);opacity:1;filter:brightness(${bright}) drop-shadow(0 0 ${glow}px color-mix(in srgb,var(--star-ring-color) ${Math.round(58 + glowRatio * 34)}%,transparent))}`;
}

function animationCss(layerKey: string, layer: StarRingLayerConfig, className = CLASS_NAME, role?: StarRingLayerRole, stackedEnergy?: StackedEnergyMotionConfig): { declaration: string; keyframes: string } {
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${className}-${safeKey}-${layer.motion}`;
  if (layer.motion === "none") return { declaration: "animation:none;", keyframes: "" };
  if (layer.motion === "stacked-energy") {
    const config = normalizeStackedEnergy(stackedEnergy);
    const roleIndex = role === "base-middle" ? 1 : role === "base-front" ? 2 : 0;
    const delay = Number((roleIndex * config.layerDelay).toFixed(3));
    return {
      declaration: `animation:${name} ${config.duration}s ease-in-out ${delay}s infinite both;will-change:transform,opacity,filter;`,
      keyframes: `@keyframes ${name}{${stackedEnergyFrames(role, config)}}`
    };
  }
  if (layer.motion === "basic" && layer.basicMotionId) {
    const template = basicMotions.find((motion) => motion.id === layer.basicMotionId);
    if (!template) return { declaration: "animation:none;", keyframes: "" };
    const config: BasicMotionConfig = {
      ...createBasicMotionConfig(template, layer.fillColor),
      ...layer.basicMotionConfig
    };
    const configuredLoop = ["breath", "float", "soft-blink", "glow-pulse", "slow-rotate"].includes(template.id);
    const duration = template.id === "alert-blink" ? 1 / Math.max(config.blinkFrequency, 0.1) : config.duration;
    const iteration = configuredLoop ? "infinite" : config.iteration;
    const timing = template.id === "slow-rotate" ? "linear" : config.timingFunction;
    const direction = template.id === "slow-rotate" ? "normal" : config.direction;
    return {
      declaration: `animation:${name} ${duration}s ${timing} ${config.delay}s ${iteration} ${direction} both;`,
      keyframes: `@keyframes ${name}{${generateBasicMotionFrames(template, config)}}`
    };
  }
  if (layer.motion === "rotate") {
    const angle = layer.direction === "counterclockwise" ? -360 : 360;
    return {
      declaration: `animation:${name} ${layer.duration}s linear ${layer.delay}s infinite;`,
      keyframes: `@keyframes ${name}{from{transform:rotate(0deg)}to{transform:rotate(${angle}deg)}}`
    };
  }
  if (layer.motion === "pulse") {
    return {
      declaration: `animation:${name} ${layer.duration}s ease-out ${layer.delay}s infinite both;`,
      keyframes: `@keyframes ${name}{0%{transform:scale(${layer.minScale});opacity:${layer.minOpacity}}58%{transform:scale(1);opacity:1}100%{transform:scale(1.08);opacity:0}}`
    };
  }
  return {
    declaration: `animation:${name} ${layer.duration}s ease-in-out ${layer.delay}s infinite;`,
    keyframes: `@keyframes ${name}{0%,100%{transform:translateY(${Math.round(layer.distance * 0.35)}px);opacity:${layer.minOpacity}}50%{transform:translateY(-${layer.distance}px);opacity:1}}`
  };
}

function ringHighlightCss(layerKey: string, layer: StarRingLayerConfig, segmentCount: number, className = CLASS_NAME): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${className}-${safeKey}-ring-highlight`;
  const duration = Math.max(0.5, layer.duration);
  if (segmentCount < 3) {
    const overlay = `[data-dm-ring-sweep-overlay="${layerKey}"]`;
    const mask = `[data-dm-ring-sweep-mask="${layerKey}"]`;
    const angle = layer.direction === "counterclockwise" ? -360 : 360;
    return `${overlay}{${layer.visible ? "" : "display:none!important;"}opacity:${layer.opacity};filter:brightness(1.72) saturate(1.24) drop-shadow(0 0 3px var(--star-ring-color)) drop-shadow(0 0 9px color-mix(in srgb,var(--star-ring-color) 72%,transparent));pointer-events:none;}
${mask}{animation:${name} ${duration}s linear ${layer.delay}s infinite;will-change:transform;}
@keyframes ${name}{from{transform:rotate(0deg)}to{transform:rotate(${angle}deg)}}`;
  }
  const step = duration / segmentCount;
  const directionRules = Array.from({ length: segmentCount }, (_, index) => {
    const order = layer.direction === "counterclockwise" ? segmentCount - index - 1 : index;
    return `${target} [data-dm-ring-segment="${index}"]{animation-delay:${Number((layer.delay + order * step).toFixed(4))}s}`;
  }).join("\n");
  return `${target} [data-dm-ring-segment]{animation-name:${name};animation-duration:${duration}s;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-fill-mode:both;will-change:filter;}
${directionRules}
@keyframes ${name}{0%,100%{filter:brightness(.68) saturate(.82) drop-shadow(0 0 0 transparent)}10%{filter:brightness(.9) saturate(.96) drop-shadow(0 0 2px color-mix(in srgb,var(--star-ring-color) 45%,transparent))}18%{filter:brightness(1.72) saturate(1.28) drop-shadow(0 0 3px var(--star-ring-color)) drop-shadow(0 0 10px color-mix(in srgb,var(--star-ring-color) 82%,transparent))}30%{filter:brightness(1.08) saturate(1.04) drop-shadow(0 0 4px color-mix(in srgb,var(--star-ring-color) 42%,transparent))}48%{filter:brightness(.76) saturate(.88) drop-shadow(0 0 0 transparent)}}`;
}

function layerCss(layerKey: string, layer: StarRingLayerConfig, isRotatingRing = false, segmentCount = 0, isParticleLayer = false, className = CLASS_NAME, role?: StarRingLayerRole, stackedEnergy?: StackedEnergyMotionConfig): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const motionTarget = `:is([data-dm-motion-target="${layerKey}"],[data-dm-node-key="${layerKey}"]:not([data-dm-has-motion-wrapper]))`;
  const usesRingHighlight = isRotatingRing && (layer.motion === "ring-highlight" || layer.motion === "rotate");
  const animation = usesRingHighlight ? { declaration: "animation:none;", keyframes: "" } : animationCss(layerKey, layer, className, role, stackedEnergy);
  const hidden = layer.visible ? "" : "display:none !important;";
  const particleStrength = Math.min(100, Math.max(0, layer.particleIntensity ?? 70)) / 100;
  const effectiveOpacity = isParticleLayer ? Number((layer.opacity * particleStrength).toFixed(3)) : layer.opacity;
  const colorCss = layer.colorMode === "monochrome"
    ? `${target} :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${layer.fillColor} !important;}
${target} :is(path,rect,circle,ellipse,polygon,polyline,line){stroke:${layer.strokeColor} !important;stroke-width:${layer.strokeWidth}px !important;}
${target} :is([fill="none"],line,polyline){fill:none !important;}`
    : "";
  const ringHighlight = usesRingHighlight ? ringHighlightCss(layerKey, layer, segmentCount, className) : "";
  return `${target}{${hidden}opacity:${effectiveOpacity};${isParticleLayer ? `--star-ring-particle-strength:${particleStrength};` : ""}}
${motionTarget}{transform-box:fill-box;transform-origin:center;${animation.declaration}}
${colorCss}
${animation.keyframes}
${ringHighlight}`;
}

function createSvgNode(document: Document, tagName: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function appendRingSweepOverlay(
  svg: SVGSVGElement,
  node: Element,
  layerKey: string,
  bounds: { x: number; y: number; width: number; height: number },
  direction: StarRingLayerConfig["direction"],
  hideSource = false
): void {
  const document = svg.ownerDocument;
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const maskId = `${CLASS_NAME}-${safeKey}-sweep-mask`;
  let defs = svg.querySelector<SVGDefsElement>(":scope > defs");
  if (!defs) {
    defs = createSvgNode(document, "defs") as SVGDefsElement;
    svg.insertBefore(defs, svg.firstChild);
  }

  const mask = createSvgNode(document, "mask");
  mask.setAttribute("id", maskId);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  mask.setAttribute("x", String(bounds.x - bounds.width));
  mask.setAttribute("y", String(bounds.y - bounds.height));
  mask.setAttribute("width", String(bounds.width * 3));
  mask.setAttribute("height", String(bounds.height * 3));
  mask.setAttribute("style", "mask-type:alpha");

  const sweep = createSvgNode(document, "g");
  sweep.setAttribute("data-dm-ring-sweep-mask", layerKey);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const radius = Math.hypot(bounds.width, bounds.height) * 0.72;
  const trailDirection = direction === "counterclockwise" ? 1 : -1;
  const opacities = [1, 0.78, 0.56, 0.38, 0.24, 0.13, 0.06];
  const wedgeSize = 13;
  const pointAt = (angle: number) => {
    const radians = angle * Math.PI / 180;
    return `${centerX + Math.cos(radians) * radius} ${centerY + Math.sin(radians) * radius}`;
  };
  opacities.forEach((opacity, index) => {
    const startAngle = -90 + trailDirection * index * wedgeSize;
    const endAngle = -90 + trailDirection * (index + 1) * wedgeSize;
    const wedge = createSvgNode(document, "path");
    wedge.setAttribute("d", `M ${centerX} ${centerY} L ${pointAt(startAngle)} L ${pointAt(endAngle)} Z`);
    wedge.setAttribute("fill", "white");
    wedge.setAttribute("opacity", String(opacity));
    sweep.appendChild(wedge);
  });
  sweep.setAttribute("style", `transform-origin:${centerX}px ${centerY}px`);
  mask.appendChild(sweep);
  defs.appendChild(mask);

  const overlay = createSvgNode(document, "g");
  overlay.setAttribute("data-dm-ring-sweep-overlay", layerKey);
  overlay.setAttribute("mask", `url(#${maskId})`);
  if (hideSource) node.setAttribute("data-dm-ring-sweep-source", "true");
  const clone = node.cloneNode(true) as Element;
  clone.querySelectorAll("defs,mask,clipPath").forEach((definition) => definition.remove());
  [clone, ...clone.querySelectorAll("*")].forEach((element) => {
    element.removeAttribute("id");
    [...element.attributes]
      .filter((attribute) => attribute.name.startsWith("data-dm-"))
      .forEach((attribute) => element.removeAttribute(attribute.name));
  });
  overlay.appendChild(clone);
  node.parentNode?.insertBefore(overlay, node.nextSibling);
}

function importedMarkup(config: StarRingDecorationConfig): string {
  if (!config.svg) return "";
  const svg = new DOMParser().parseFromString(config.svg.markup, "image/svg+xml").querySelector("svg");
  if (!svg) return config.svg.markup;
  Object.entries(config.layerConfigs).forEach(([key, layer]) => {
    const isRotatingHighlight = [
      ...(config.layerMapping["rotating-ring"] ?? []),
      ...(config.layerMapping.highlight ?? [])
    ].includes(key)
      && (layer.motion === "ring-highlight" || layer.motion === "rotate");
    if (isRotatingHighlight) {
      const assetLayer = config.svg?.layers.find((candidate) => candidate.key === key);
      if ((assetLayer?.highlightSegmentCount ?? 0) < 3 && assetLayer?.highlightBounds) {
        const node = svg.querySelector(`[data-dm-node-key="${key}"]`);
        if (node) appendRingSweepOverlay(
          svg,
          node,
          key,
          assetLayer.highlightBounds,
          layer.direction,
          config.kind === "chart-tech-ring"
        );
      }
      return;
    }
    if (!layer.visible || layer.motion === "none") return;
    const node = svg.querySelector(`[data-dm-node-key="${key}"]`);
    if (!node || node === svg || node.parentElement?.getAttribute("data-dm-motion-target") === key) return;
    const wrapper = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
    wrapper.setAttribute("data-dm-motion-target", key);
    node.setAttribute("data-dm-has-motion-wrapper", "true");
    node.parentNode?.insertBefore(wrapper, node);
    wrapper.appendChild(node);
  });
  return new XMLSerializer().serializeToString(svg);
}

export function generateStarRingMarkup(config: StarRingDecorationConfig): string {
  const className = classNameFor(config);
  const particleEffect = resolvedParticleEffect(config);
  const chartContentMarkup = config.kind === "chart-tech-ring" ? config.chartContentSvg?.markup ?? "" : "";
  const centerIconMarkup = config.centerIconSvg?.markup ?? "";
  const content = config.svg
    ? `<div class="${className}__import">${importedMarkup(config)}</div>
  ${config.kind === "chart-tech-ring" ? `<div class="${className}__content" data-chart-content>${chartContentMarkup}</div>` : ""}
  ${centerIconMarkup ? `<div class="${className}__center-icon" data-center-icon>${centerIconMarkup}</div>` : ""}
  ${generateDecorationParticleMarkup(particleEffect, config.overall.color)}`
    : "";
  return `<div class="${className}" data-source="${config.sourceMode}">${content}</div>`;
}

export function generateStarRingCss(config: StarRingDecorationConfig): string {
  const className = classNameFor(config);
  const overall = config.overall;
  const particleEffect = resolvedParticleEffect(config);
  const usesSourceSize = config.sourceMode === "imported"
    || config.kind === "layered-decoration"
    || config.kind === "chart-tech-ring"
    || config.kind === "ripple-focus-base";
  const importedWidth = usesSourceSize ? config.svg?.width : undefined;
  const importedHeight = usesSourceSize ? config.svg?.height : undefined;
  const outputWidth = Math.max(1, importedWidth ?? overall.size);
  const sourceRatio = config.svg?.width && config.svg?.height ? config.svg.height / config.svg.width : 0.7;
  const outputHeight = Math.max(1, importedHeight ?? Math.round(outputWidth * sourceRatio));
  const roleCss = Object.entries(config.layerConfigs)
    .filter(([key]) => key !== "system-particles")
    .map(([key, layer]) => {
      const isRotatingRing = [
        ...(config.layerMapping["rotating-ring"] ?? []),
        ...(config.layerMapping.highlight ?? [])
      ].includes(key);
      const isParticleLayer = config.layerMapping.particles.includes(key);
      const role = (Object.keys(config.layerMapping) as StarRingLayerRole[]).find((candidate) => config.layerMapping[candidate].includes(key));
      const segmentCount = config.svg?.layers.find((candidate) => candidate.key === key)?.highlightSegmentCount ?? 0;
      return layerCss(key, layer, isRotatingRing, segmentCount, isParticleLayer, className, role, config.stackedEnergy);
    })
    .filter(Boolean)
    .join("\n");
  const centerSourceCss = config.centerIconSvg
    ? (config.layerMapping.center ?? []).map((key) => `.${className} [data-dm-node-key="${key}"]{display:none!important;}`).join("\n")
    : "";
  return `.${className}{--star-ring-color:${overall.color};--chart-content-size:${Math.max(1, config.chartContentSize ?? 208)}px;position:relative;width:${outputWidth}px;aspect-ratio:${outputWidth}/${outputHeight};height:auto;opacity:${overall.opacity};transform:translate(${overall.offsetX}px,${overall.offsetY}px);isolation:isolate;}
.${className}__import{position:absolute;z-index:1;inset:0;display:grid;place-items:center;}
.${className}__import svg{display:block;width:100%;height:100%;overflow:visible;}
${centerIconMarkupCss(className, config)}
${config.kind === "chart-tech-ring" ? `.${className}__content{position:absolute;z-index:2;left:50%;top:50%;display:grid;place-items:center;width:var(--chart-content-size);height:var(--chart-content-size);transform:translate(-50%,-50%);border-radius:50%;}
.${className}__content>svg{display:block;width:100%;height:100%;overflow:visible;}` : ""}
.${className}[data-source] :is([data-dm-motion-target],[data-dm-node-key]){${config.kind === "chart-tech-ring" ? "transform-box:view-box;transform-origin:50% 50%;" : ""}}
${config.kind === "chart-tech-ring" ? `.${className} [data-dm-ring-sweep-source]{opacity:0!important;}` : ""}
.${className}__layer{position:absolute;inset:0;transform-origin:center;}
@media (prefers-reduced-motion:reduce){.${className} [data-dm-node-key],.${className} [data-dm-motion-target],.${className} [data-dm-ring-segment]{animation:none!important;filter:none!important;}}
${particleEffect.enabled ? generateDecorationParticleCss() : ""}
${centerSourceCss}
${roleCss}`;
}

function centerIconMarkupCss(className: string, config: StarRingDecorationConfig): string {
  if (!config.centerIconSvg) return "";
  const size = Math.max(8, config.centerIconSize ?? 40);
  const x = Math.min(100, Math.max(0, config.centerIconX ?? 50));
  const y = Math.min(100, Math.max(0, config.centerIconY ?? 30));
  return `.${className}__center-icon{position:absolute;z-index:4;left:${x}%;top:${y}%;display:grid;place-items:center;width:${size}px;height:${size}px;transform:translate(-50%,-50%);pointer-events:none;}
.${className}__center-icon>svg{display:block;width:100%;height:100%;overflow:visible;}`;
}

export function generateStarRingHtmlCss(config: StarRingDecorationConfig): string {
  return `${generateStarRingMarkup(config)}

<style>
${generateStarRingCss(config)}
</style>`;
}
