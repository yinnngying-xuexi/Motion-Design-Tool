import { referenceLoadingSpecs } from "@/data/referenceLoadings";

type Params = Record<string, string | number>;
const escape = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);

export function generateReferenceLoadingCss(cls: string, id: string): string {
  const spec = referenceLoadingSpecs[id];
  return `.${cls}{position:relative;width:${spec.width}px;height:${spec.height}px;min-width:0;min-height:0;pointer-events:none;isolation:isolate;background:transparent;color:var(--loading-color);}
.${cls}__visual{position:absolute;left:0;top:0;width:100%;height:${spec.visualHeight / spec.height * 100}%;}
.${cls}__visual>dm-light-renderer,.${cls}__visual>dm-light-renderer>canvas{display:block;width:100%;height:100%;min-width:0;min-height:0;background:transparent;}
.${cls}__text{position:absolute;left:50%;top:${spec.textTop}%;transform:translate(-50%,-50%);max-width:95%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:400 ${spec.fontSize}px/1.2 Arial,sans-serif;letter-spacing:1.5px;color:color-mix(in srgb,var(--loading-color) 28%,#fff);}
.${cls} .dm-light-error{display:none;} .${cls} dm-light-renderer[data-ready="false"] .dm-light-error{display:block;position:absolute;inset:0;align-content:center;text-align:center;color:#9aa2ad;font:12px/1.6 Arial,sans-serif;}`;
}

export function generateReferenceLoadingMarkup(id: string, cls: string, params: Params): string {
  const spec = referenceLoadingSpecs[id];
  const color = /^#[\da-f]{6}$/i.test(String(params.color)) ? String(params.color) : "#0070F3";
  const label = params.showText === "off" ? "" : `<span class="${cls}__text">${escape(String(params.centerText ?? "loading"))}</span>`;
  const spread = Number(params.glowSpread ?? 100);
  const glowAttribute = id === "loading-reference-flare-line" ? ` data-glow-spread="${(Number.isFinite(spread) ? Math.min(200, Math.max(0, spread)) : 100) / 100}"` : "";
  return `<div class="${cls} dm-reference-loading" data-loading-id="${id}" style="--loading-color:${color}" role="status" aria-label="加载中">
  <div class="${cls}__visual" aria-hidden="true"><dm-light-renderer data-effect="${id}" data-color="${color}" data-duration="${spec.duration}" data-width="${spec.width}" data-height="${spec.visualHeight}"${glowAttribute}><span class="dm-light-error">此光效需要 WebGL，请开启浏览器硬件加速</span></dm-light-renderer></div>
  ${label}
</div>`;
}
