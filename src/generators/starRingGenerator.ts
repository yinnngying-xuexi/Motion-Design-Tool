import type {
  DecorationParticleConfig,
  StarRingDecorationConfig,
  StarRingLayerConfig
} from "@/types/decoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import type { BasicMotionConfig } from "@/types/motion";
import { generateDecorationParticleCss, generateDecorationParticleMarkup } from "@/generators/decorationParticleGenerator";
import { normalizeDecorationParticleConfig } from "@/utils/decorationParticles";

const CLASS_NAME = "dm-star-ring";

function classNameFor(config: StarRingDecorationConfig): string {
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

function animationCss(layerKey: string, layer: StarRingLayerConfig, className = CLASS_NAME): { declaration: string; keyframes: string } {
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${className}-${safeKey}-${layer.motion}`;
  if (layer.motion === "none") return { declaration: "animation:none;", keyframes: "" };
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
      declaration: `animation:${name} ${layer.duration}s ease-in-out ${layer.delay}s infinite alternate;`,
      keyframes: `@keyframes ${name}{from{transform:scale(${layer.minScale})}to{transform:scale(1)}}`
    };
  }
  return {
    declaration: `animation:${name} ${layer.duration}s ease-in-out ${layer.delay}s infinite;`,
    keyframes: `@keyframes ${name}{0%,100%{transform:translateY(${Math.round(layer.distance * 0.35)}px);opacity:${layer.minOpacity}}50%{transform:translateY(-${layer.distance}px);opacity:1}}`
  };
}

function ringHighlightCss(layerKey: string, layer: StarRingLayerConfig, segmentCount: number): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${CLASS_NAME}-${safeKey}-ring-highlight`;
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

function layerCss(layerKey: string, layer: StarRingLayerConfig, isRotatingRing = false, segmentCount = 0, isParticleLayer = false, className = CLASS_NAME): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const motionTarget = `:is([data-dm-motion-target="${layerKey}"],[data-dm-node-key="${layerKey}"]:not([data-dm-has-motion-wrapper]))`;
  const usesRingHighlight = isRotatingRing && (layer.motion === "ring-highlight" || layer.motion === "rotate");
  const animation = usesRingHighlight ? { declaration: "animation:none;", keyframes: "" } : animationCss(layerKey, layer, className);
  const hidden = layer.visible ? "" : "display:none !important;";
  const particleStrength = Math.min(100, Math.max(0, layer.particleIntensity ?? 70)) / 100;
  const effectiveOpacity = isParticleLayer ? Number((layer.opacity * particleStrength).toFixed(3)) : layer.opacity;
  const colorCss = layer.colorMode === "monochrome"
    ? `${target} :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${layer.fillColor} !important;}
${target} :is(path,rect,circle,ellipse,polygon,polyline,line){stroke:${layer.strokeColor} !important;stroke-width:${layer.strokeWidth}px !important;}
${target} :is([fill="none"],line,polyline){fill:none !important;}`
    : "";
  const ringHighlight = usesRingHighlight ? ringHighlightCss(layerKey, layer, segmentCount) : "";
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
  direction: StarRingLayerConfig["direction"]
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
    const isRotatingHighlight = config.layerMapping["rotating-ring"].includes(key)
      && (layer.motion === "ring-highlight" || layer.motion === "rotate");
    if (isRotatingHighlight) {
      const assetLayer = config.svg?.layers.find((candidate) => candidate.key === key);
      if ((assetLayer?.highlightSegmentCount ?? 0) < 3 && assetLayer?.highlightBounds) {
        const node = svg.querySelector(`[data-dm-node-key="${key}"]`);
        if (node) appendRingSweepOverlay(svg, node, key, assetLayer.highlightBounds, layer.direction);
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
  const content = config.svg
    ? `<div class="${className}__import">${importedMarkup(config)}</div>
  ${generateDecorationParticleMarkup(particleEffect, config.overall.color)}`
    : "";
  return `<div class="${className}" data-source="${config.sourceMode}">${content}</div>`;
}

export function generateStarRingCss(config: StarRingDecorationConfig): string {
  const className = classNameFor(config);
  const overall = config.overall;
  const particleEffect = resolvedParticleEffect(config);
  const usesSourceSize = config.sourceMode === "imported" || config.kind === "layered-decoration";
  const importedWidth = usesSourceSize ? config.svg?.width : undefined;
  const importedHeight = usesSourceSize ? config.svg?.height : undefined;
  const outputWidth = Math.max(1, importedWidth ?? overall.size);
  const outputHeight = Math.max(1, importedHeight ?? Math.round(overall.size * 0.7));
  const roleCss = Object.entries(config.layerConfigs)
    .filter(([key]) => key !== "system-particles")
    .map(([key, layer]) => {
      const isRotatingRing = config.layerMapping["rotating-ring"].includes(key);
      const isParticleLayer = config.layerMapping.particles.includes(key);
      const segmentCount = config.svg?.layers.find((candidate) => candidate.key === key)?.highlightSegmentCount ?? 0;
      return layerCss(key, layer, isRotatingRing, segmentCount, isParticleLayer, className);
    })
    .filter(Boolean)
    .join("\n");
  return `.${className}{--star-ring-color:${overall.color};position:relative;width:${outputWidth}px;aspect-ratio:${outputWidth}/${outputHeight};height:auto;opacity:${overall.opacity};transform:translate(${overall.offsetX}px,${overall.offsetY}px);isolation:isolate;}
.${className}__import{position:absolute;z-index:1;inset:0;display:grid;place-items:center;}
.${className}__import svg{display:block;width:100%;height:100%;overflow:visible;}
.${className}__layer{position:absolute;inset:0;transform-origin:center;}
@media (prefers-reduced-motion:reduce){.${className} [data-dm-node-key],.${className} [data-dm-motion-target],.${className} [data-dm-ring-segment]{animation:none!important;filter:none!important;}}
${particleEffect.enabled ? generateDecorationParticleCss() : ""}
${roleCss}`;
}

export function generateStarRingHtmlCss(config: StarRingDecorationConfig): string {
  return `${generateStarRingMarkup(config)}

<style>
${generateStarRingCss(config)}
</style>`;
}
