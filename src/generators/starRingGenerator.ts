import type {
  StarRingDecorationConfig,
  StarRingLayerConfig
} from "@/types/decoration";

const CLASS_NAME = "dm-star-ring";

function segmentPaths(count = 12): string {
  const centerX = 100;
  const centerY = 100;
  const outerRadius = 88;
  const innerRadius = 62;
  const step = 360 / count;
  const point = (radius: number, angle: number): string => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return `${(centerX + radius * Math.cos(radians)).toFixed(2)} ${(centerY + radius * Math.sin(radians)).toFixed(2)}`;
  };
  return Array.from({ length: count }, (_, index) => {
    const start = index * step + 2.5;
    const end = (index + 1) * step - 2.5;
    return `<path d="M ${point(outerRadius, start)} A ${outerRadius} ${outerRadius} 0 0 1 ${point(outerRadius, end)} L ${point(innerRadius, end)} A ${innerRadius} ${innerRadius} 0 0 0 ${point(innerRadius, start)} Z"></path>`;
  }).join("");
}

function presetMarkup(): string {
  const particles = [
    { x: 15, y: 45, size: 1, opacity: 0.42, delay: -1.1, duration: 3.8, driftX: -2, rise: 8 },
    { x: 23, y: 30, size: 2, opacity: 0.72, delay: -2.7, duration: 4.6, driftX: 3, rise: 13 },
    { x: 31, y: 21, size: 3, opacity: 0.92, delay: -0.4, duration: 5.2, driftX: -4, rise: 17 },
    { x: 39, y: 38, size: 1, opacity: 0.34, delay: -3.6, duration: 3.4, driftX: 2, rise: 6 },
    { x: 47, y: 17, size: 2, opacity: 0.58, delay: -1.9, duration: 4.1, driftX: 5, rise: 11 },
    { x: 55, y: 34, size: 1, opacity: 0.28, delay: -0.8, duration: 5.6, driftX: -3, rise: 15 },
    { x: 62, y: 12, size: 2, opacity: 0.8, delay: -4.2, duration: 4.8, driftX: 4, rise: 19 },
    { x: 69, y: 28, size: 1, opacity: 0.4, delay: -2.2, duration: 3.7, driftX: -2, rise: 9 },
    { x: 77, y: 22, size: 3, opacity: 0.88, delay: -1.3, duration: 5.4, driftX: 3, rise: 14 },
    { x: 85, y: 41, size: 1, opacity: 0.34, delay: -3.1, duration: 4.3, driftX: -5, rise: 10 },
    { x: 27, y: 48, size: 1, opacity: 0.25, delay: -0.2, duration: 5.8, driftX: 2, rise: 7 },
    { x: 43, y: 45, size: 2, opacity: 0.46, delay: -2.5, duration: 4.9, driftX: -3, rise: 12 },
    { x: 59, y: 47, size: 1, opacity: 0.3, delay: -4.4, duration: 3.9, driftX: 4, rise: 8 },
    { x: 73, y: 46, size: 2, opacity: 0.5, delay: -0.9, duration: 5.1, driftX: -2, rise: 13 }
  ].map((particle) => `<i style="--particle-x:${particle.x}%;--particle-y:${particle.y}%;--particle-size:${particle.size}px;--particle-opacity:${particle.opacity};--particle-delay:${particle.delay}s;--particle-duration:${particle.duration}s;--particle-drift-x:${particle.driftX}px;--particle-rise:${particle.rise}px"></i>`).join("");
  return `<div class="${CLASS_NAME}__preset">
  <svg class="${CLASS_NAME}__layer ${CLASS_NAME}__background" data-dm-role="background" data-dm-node-key="preset-background" viewBox="0 0 200 140" fill="none" aria-hidden="true">
    <ellipse class="${CLASS_NAME}__background-glow" cx="100" cy="103" rx="130" ry="39"></ellipse>
    <ellipse class="${CLASS_NAME}__background-orbit" cx="100" cy="103" rx="118" ry="33"></ellipse>
    <ellipse class="${CLASS_NAME}__background-trace" cx="100" cy="106" rx="105" ry="27"></ellipse>
  </svg>
  <svg class="${CLASS_NAME}__layer ${CLASS_NAME}__static-ring" data-dm-role="static-ring" data-dm-node-key="preset-static-ring" viewBox="0 0 200 140" fill="none" aria-hidden="true">
    <ellipse class="${CLASS_NAME}__static-main" cx="100" cy="70" rx="113" ry="36"></ellipse>
    <ellipse class="${CLASS_NAME}__static-inner" cx="100" cy="70" rx="82" ry="27"></ellipse>
    <ellipse class="${CLASS_NAME}__static-lower" cx="100" cy="101" rx="118" ry="38"></ellipse>
  </svg>
  <svg class="${CLASS_NAME}__layer ${CLASS_NAME}__rotating-ring" viewBox="0 0 200 200" aria-hidden="true">
    <g data-dm-role="rotating-ring" data-dm-node-key="preset-rotating-ring">
      <circle cx="100" cy="100" r="92"></circle>
      ${segmentPaths()}
    </g>
  </svg>
  <div class="${CLASS_NAME}__layer ${CLASS_NAME}__center" data-dm-role="center" data-dm-node-key="preset-center"></div>
  <div class="${CLASS_NAME}__layer ${CLASS_NAME}__particles" data-dm-role="particles" data-dm-node-key="preset-particles">${particles}</div>
</div>`;
}

function animationCss(layerKey: string, layer: StarRingLayerConfig): { declaration: string; keyframes: string } {
  const safeKey = layerKey.replace(/[^a-zA-Z0-9-]/g, "-");
  const name = `${CLASS_NAME}-${safeKey}-${layer.motion}`;
  if (layer.motion === "none") return { declaration: "animation:none;", keyframes: "" };
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

function layerCss(layerKey: string, layer: StarRingLayerConfig): string {
  const target = `[data-dm-node-key="${layerKey}"]`;
  const animation = animationCss(layerKey, layer);
  const hidden = layer.visible ? "" : "display:none !important;";
  const colorCss = layer.colorMode === "monochrome"
    ? `${target} :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${layer.fillColor} !important;}
${target} :is(path,rect,circle,ellipse,polygon,polyline,line){stroke:${layer.strokeColor} !important;stroke-width:${layer.strokeWidth}px !important;}
${target} :is([fill="none"],line,polyline){fill:none !important;}`
    : "";
  return `${target}{${hidden}opacity:${layer.opacity};transform-box:fill-box;transform-origin:center;${animation.declaration}}
${colorCss}
${animation.keyframes}`;
}

export function generateStarRingMarkup(config: StarRingDecorationConfig): string {
  const content = config.sourceMode === "imported" && config.svg
    ? `<div class="${CLASS_NAME}__import">${config.svg.markup}</div>`
    : presetMarkup();
  return `<div class="${CLASS_NAME}" data-source="${config.sourceMode}">${content}</div>`;
}

export function generateStarRingCss(config: StarRingDecorationConfig): string {
  const overall = config.overall;
  const roleCss = Object.entries(config.layerConfigs)
    .map(([key, layer]) => layerCss(key, layer))
    .filter(Boolean)
    .join("\n");
  return `.${CLASS_NAME}{--star-ring-color:${overall.color};position:relative;width:${overall.size}px;height:${Math.round(overall.size * 0.7)}px;opacity:${overall.opacity};transform:translate(${overall.offsetX}px,${overall.offsetY}px);isolation:isolate;}
.${CLASS_NAME}__preset,.${CLASS_NAME}__import{position:absolute;inset:0;display:grid;place-items:center;}
.${CLASS_NAME}__import svg{display:block;width:100%;height:100%;overflow:visible;}
.${CLASS_NAME}__layer{position:absolute;inset:0;transform-origin:center;}
.${CLASS_NAME}__background{width:100%;height:100%;overflow:visible;z-index:0;}
.${CLASS_NAME}__background ellipse{transform-box:fill-box;transform-origin:center;}
.${CLASS_NAME}__background-glow{stroke:color-mix(in srgb,var(--star-ring-color) 60%,transparent);stroke-width:2;opacity:.76;filter:drop-shadow(0 0 8px var(--star-ring-color)) drop-shadow(0 0 18px color-mix(in srgb,var(--star-ring-color) 70%,transparent));}
.${CLASS_NAME}__background-orbit{stroke:color-mix(in srgb,var(--star-ring-color) 68%,transparent);stroke-width:1;stroke-dasharray:2 5;opacity:.62;}
.${CLASS_NAME}__background-trace{stroke:color-mix(in srgb,var(--star-ring-color) 30%,transparent);stroke-width:1;opacity:.72;}
.${CLASS_NAME}__static-ring{width:100%;height:100%;overflow:visible;z-index:1;}
.${CLASS_NAME}__static-ring ellipse{stroke:var(--star-ring-color);stroke-width:1;opacity:.58;filter:drop-shadow(0 0 5px color-mix(in srgb,var(--star-ring-color) 72%,transparent));}
.${CLASS_NAME}__static-inner{opacity:.38 !important;}
.${CLASS_NAME}__static-lower{opacity:.26 !important;stroke-dasharray:1 4;}
.${CLASS_NAME}__rotating-ring{inset:auto;left:-9%;top:-33%;width:118%;height:auto;aspect-ratio:1;overflow:visible;transform:scaleY(.3);transform-origin:center;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--star-ring-color) 92%,transparent)) drop-shadow(0 0 12px color-mix(in srgb,var(--star-ring-color) 58%,transparent));z-index:2;}
.${CLASS_NAME}__rotating-ring circle{fill:none;stroke:var(--star-ring-color);stroke-width:1;opacity:.72;}
.${CLASS_NAME}__rotating-ring path{fill:color-mix(in srgb,var(--star-ring-color) 44%,transparent);stroke:var(--star-ring-color);stroke-width:1;stroke-linejoin:round;}
.${CLASS_NAME}__rotating-ring path:nth-of-type(4n+1){fill:color-mix(in srgb,var(--star-ring-color) 94%,transparent);}
.${CLASS_NAME}__rotating-ring path:nth-of-type(4n+2){fill:color-mix(in srgb,var(--star-ring-color) 64%,transparent);}
.${CLASS_NAME}__rotating-ring path:nth-of-type(4n+3){fill:color-mix(in srgb,var(--star-ring-color) 28%,transparent);}
.${CLASS_NAME}__center{inset:29% 9%;z-index:3;border:1px solid color-mix(in srgb,var(--star-ring-color) 66%,transparent);border-radius:50%;background:linear-gradient(135deg,color-mix(in srgb,var(--star-ring-color) 34%,#10283d) 0%,#071827 44%,#02070c 100%);box-shadow:0 0 18px color-mix(in srgb,var(--star-ring-color) 46%,transparent),inset 0 0 18px color-mix(in srgb,var(--star-ring-color) 16%,transparent);}
.${CLASS_NAME}__particles{z-index:4;pointer-events:none;}
.${CLASS_NAME}__particles i{position:absolute;left:var(--particle-x);top:var(--particle-y);width:var(--particle-size);height:var(--particle-size);border-radius:50%;opacity:var(--particle-opacity);background:#8bc4ff;box-shadow:0 0 calc(var(--particle-size) * 3) var(--star-ring-color);animation:${CLASS_NAME}-particle-drift var(--particle-duration) ease-in-out var(--particle-delay) infinite alternate;}
@keyframes ${CLASS_NAME}-particle-drift{0%{transform:translate3d(0,4px,0) scale(.65);opacity:calc(var(--particle-opacity) * .55)}45%{opacity:var(--particle-opacity)}100%{transform:translate3d(var(--particle-drift-x),calc(var(--particle-rise) * -1),0) scale(1.18);opacity:calc(var(--particle-opacity) * .32)}}
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
