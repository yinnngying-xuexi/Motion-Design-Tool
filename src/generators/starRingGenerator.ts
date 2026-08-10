import type {
  StarRingDecorationConfig,
  StarRingLayerConfig
} from "@/types/decoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import type { BasicMotionConfig } from "@/types/motion";
import { STAR_RING_SYSTEM_PARTICLES_KEY } from "@/utils/starRingDecoration";

const CLASS_NAME = "dm-star-ring";

function particleMarkup(): string {
  return [
    { x: 15, y: 53, size: 1, opacity: 0.42, delay: -1.1, duration: 3.8, driftX: -2, rise: 8 },
    { x: 23, y: 38, size: 2, opacity: 0.72, delay: -2.7, duration: 4.6, driftX: 3, rise: 13 },
    { x: 31, y: 29, size: 3, opacity: 0.92, delay: -0.4, duration: 5.2, driftX: -4, rise: 17 },
    { x: 39, y: 46, size: 1, opacity: 0.34, delay: -3.6, duration: 3.4, driftX: 2, rise: 6 },
    { x: 47, y: 25, size: 2, opacity: 0.58, delay: -1.9, duration: 4.1, driftX: 5, rise: 11 },
    { x: 55, y: 42, size: 1, opacity: 0.28, delay: -0.8, duration: 5.6, driftX: -3, rise: 15 },
    { x: 62, y: 20, size: 2, opacity: 0.8, delay: -4.2, duration: 4.8, driftX: 4, rise: 19 },
    { x: 69, y: 36, size: 1, opacity: 0.4, delay: -2.2, duration: 3.7, driftX: -2, rise: 9 },
    { x: 77, y: 30, size: 3, opacity: 0.88, delay: -1.3, duration: 5.4, driftX: 3, rise: 14 },
    { x: 85, y: 49, size: 1, opacity: 0.34, delay: -3.1, duration: 4.3, driftX: -5, rise: 10 },
    { x: 27, y: 56, size: 1, opacity: 0.25, delay: -0.2, duration: 5.8, driftX: 2, rise: 7 },
    { x: 43, y: 53, size: 2, opacity: 0.46, delay: -2.5, duration: 4.9, driftX: -3, rise: 12 },
    { x: 59, y: 55, size: 1, opacity: 0.3, delay: -4.4, duration: 3.9, driftX: 4, rise: 8 },
    { x: 73, y: 54, size: 2, opacity: 0.5, delay: -0.9, duration: 5.1, driftX: -2, rise: 13 }
  ].map((particle) => `<i style="--particle-x:${particle.x}%;--particle-y:${particle.y}%;--particle-size:${particle.size}px;--particle-opacity:${particle.opacity};--particle-delay:${particle.delay}s;--particle-duration:${particle.duration}s;--particle-drift-x:${particle.driftX}px;--particle-rise:${particle.rise}px"></i>`).join("");
}

function animationCss(layerKey: string, layer: StarRingLayerConfig): { declaration: string; keyframes: string } {
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${CLASS_NAME}-${safeKey}-${layer.motion}`;
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

function layerCss(layerKey: string, layer: StarRingLayerConfig, isRotatingRing = false, segmentCount = 0, isParticleLayer = false): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const motionTarget = `:is([data-dm-motion-target="${layerKey}"],[data-dm-node-key="${layerKey}"]:not([data-dm-has-motion-wrapper]))`;
  const usesRingHighlight = isRotatingRing && (layer.motion === "ring-highlight" || layer.motion === "rotate");
  const animation = usesRingHighlight ? { declaration: "animation:none;", keyframes: "" } : animationCss(layerKey, layer);
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
  const content = config.svg
    ? `<div class="${CLASS_NAME}__import">${importedMarkup(config)}</div>
  <div class="${CLASS_NAME}__layer ${CLASS_NAME}__particles" data-dm-role="particles" data-dm-node-key="${STAR_RING_SYSTEM_PARTICLES_KEY}">${particleMarkup()}</div>`
    : "";
  return `<div class="${CLASS_NAME}" data-source="${config.sourceMode}">${content}</div>`;
}

export function generateStarRingCss(config: StarRingDecorationConfig): string {
  const overall = config.overall;
  const importedWidth = config.sourceMode === "imported" ? config.svg?.width : undefined;
  const importedHeight = config.sourceMode === "imported" ? config.svg?.height : undefined;
  const outputWidth = Math.max(1, importedWidth ?? overall.size);
  const outputHeight = Math.max(1, importedHeight ?? Math.round(overall.size * 0.7));
  const roleCss = Object.entries(config.layerConfigs)
    .map(([key, layer]) => {
      const isRotatingRing = config.layerMapping["rotating-ring"].includes(key);
      const isParticleLayer = config.layerMapping.particles.includes(key);
      const segmentCount = config.svg?.layers.find((candidate) => candidate.key === key)?.highlightSegmentCount ?? 0;
      return layerCss(key, layer, isRotatingRing, segmentCount, isParticleLayer);
    })
    .filter(Boolean)
    .join("\n");
  return `.${CLASS_NAME}{--star-ring-color:${overall.color};position:relative;width:${outputWidth}px;aspect-ratio:${outputWidth}/${outputHeight};height:auto;opacity:${overall.opacity};transform:translate(${overall.offsetX}px,${overall.offsetY}px);isolation:isolate;}
.${CLASS_NAME}__import{position:absolute;inset:0;display:grid;place-items:center;}
.${CLASS_NAME}__import svg{display:block;width:100%;height:100%;overflow:visible;}
.${CLASS_NAME}__layer{position:absolute;inset:0;transform-origin:center;}
.${CLASS_NAME}__particles{z-index:4;pointer-events:none;}
.${CLASS_NAME}__particles i{position:absolute;left:var(--particle-x);top:var(--particle-y);width:var(--particle-size);height:var(--particle-size);border-radius:50%;opacity:var(--particle-opacity);background:#8bc4ff;box-shadow:0 0 calc(var(--particle-size) * 3) var(--star-ring-color);filter:brightness(calc(.78 + var(--star-ring-particle-strength,.7) * .45));animation:${CLASS_NAME}-particle-drift var(--particle-duration) ease-in-out var(--particle-delay) infinite alternate;}
@keyframes ${CLASS_NAME}-particle-drift{0%{transform:translate3d(0,4px,0) scale(.65);opacity:calc(var(--particle-opacity) * .55)}45%{opacity:var(--particle-opacity)}100%{transform:translate3d(var(--particle-drift-x),calc(var(--particle-rise) * -1),0) scale(1.18);opacity:calc(var(--particle-opacity) * .32)}}
@media (prefers-reduced-motion:reduce){.${CLASS_NAME} [data-dm-node-key],.${CLASS_NAME} [data-dm-motion-target],.${CLASS_NAME} [data-dm-ring-segment],.${CLASS_NAME}__particles i{animation:none!important;filter:none!important;}}
${roleCss}`;
}

export function generateStarRingHtmlCss(config: StarRingDecorationConfig): string {
  const serialized = JSON.stringify(config).replace(/</g, "\\u003c");
  return `${generateStarRingMarkup(config)}

<style>
${generateStarRingCss(config)}
</style>
<script type="application/json" class="dm-star-ring-config">${serialized}<\/script>`;
}
