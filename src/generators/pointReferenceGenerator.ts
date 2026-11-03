import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { pointReferenceSpecs, pointReferenceSize } from "@/data/pointReferenceBases";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import { circularOrbitTrail } from "@/generators/orbitTrail";
import { isolateSvgIds } from "@/utils/svgInstance";

type Params = Record<string, string | number>;
const NS = "http://www.w3.org/2000/svg";
const materialCache = new Map<string, string>();
let instance = 0;
const number = (value: unknown, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
const enabled = (params: Params, key: string) => params[key] !== "off";

/** Figma's color-dodge stars use opaque black as “no light”. Bake that into alpha for portable SVG. */
function normalizeColumnGlow(svg: SVGSVGElement): void {
  const gradients = new Set<Element>();
  svg.querySelectorAll<SVGElement>('[style*="mix-blend-mode:color-dodge"]').forEach(layer => {
    layer.style.removeProperty("mix-blend-mode");
    if (!layer.getAttribute("style")) layer.removeAttribute("style");
    layer.querySelectorAll("[fill]").forEach(shape => {
      const reference = shape.getAttribute("fill")?.match(/^url\(#([^)]*)\)$/)?.[1];
      const gradient = reference ? svg.querySelector(`[id="${reference}"]`) : null;
      if (gradient?.localName === "radialGradient") gradients.add(gradient);
    });
  });
  gradients.forEach(gradient => {
    gradient.setAttribute("data-material", "transparent-star-glow");
    gradient.querySelectorAll("stop").forEach(stop => {
      const color = stop.getAttribute("stop-color") ?? "#000000";
      const rgb = /^#[\da-f]{6}$/i.test(color) ? [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16)) : [0, 0, 0];
      const peak = Math.max(...rgb);
      const opacity = Number(stop.getAttribute("stop-opacity") ?? 1);
      // Unpremultiply color so the same RGB energy survives on black, while black edges become transparent.
      const alpha = peak > 200 ? 1 : peak / 255;
      stop.setAttribute("stop-color", peak ? `rgb(${rgb.map(channel => Math.round(channel * 255 / peak)).join(" ")})` : "#00D5FF");
      stop.setAttribute("stop-opacity", (alpha * opacity).toFixed(4));
    });
  });
}

/** Only the seven inspected, bundled originals enter here; this is NOT the SVG upload sanitizer. */
function material(id: string): SVGSVGElement {
  const cached = materialCache.get(id);
  const doc = new DOMParser().parseFromString(cached ?? pointReferenceSpecs[id].source, "image/svg+xml");
  const svg = doc.documentElement as unknown as SVGSVGElement;
  if (!cached) {
    if (id === "icon-point-5039") normalizeColumnGlow(svg);
    svg.querySelectorAll("foreignObject").forEach(object => {
      const style = object.firstElementChild?.getAttribute("style") ?? "";
      const stops = [...style.matchAll(/rgba\(([^)]+)\)\s*([\d.]+)deg/g)].map(match => ({ color: match[1].split(",").map(Number), angle: Number(match[2]) }));
      if (stops.length < 2) { object.remove(); return; } // Figma backdrop blur paints no artwork.
      const group = doc.createElementNS(NS, "g");
      group.setAttribute("data-material", "vector-angular-gradient");
      const cx = Number(object.getAttribute("x")) + Number(object.getAttribute("width")) / 2;
      const cy = Number(object.getAttribute("y")) + Number(object.getAttribute("height")) / 2;
      const radius = Math.hypot(Number(object.getAttribute("width")), Number(object.getAttribute("height"))) / 2;
      // SVG-only wedges replace Figma's HTML conic gradient. No foreignObject or page CSS in delivery.
      for (let angle = 0; angle < 360; angle += 2) {
        const end = Math.min(360, angle + 2.03), mid = angle + 1;
        const right = stops.findIndex(stop => stop.angle >= mid);
        const a = stops[Math.max(0, right - 1)], b = stops[right < 0 ? stops.length - 1 : right];
        const t = Math.max(0, Math.min(1, (mid - a.angle) / Math.max(.001, b.angle - a.angle)));
        const rgba = a.color.map((channel, index) => channel + (b.color[index] - channel) * t);
        const point = (degrees: number) => `${(cx + radius * Math.cos(degrees * Math.PI / 180)).toFixed(3)} ${(cy + radius * Math.sin(degrees * Math.PI / 180)).toFixed(3)}`;
        const path = doc.createElementNS(NS, "path");
        path.setAttribute("d", `M${cx} ${cy} L${point(angle)} A${radius} ${radius} 0 0 1 ${point(end)} Z`);
        path.setAttribute("fill", `rgb(${rgba.slice(0, 3).map(Math.round).join(" ")})`);
        path.setAttribute("fill-opacity", rgba[3].toFixed(4));
        group.append(path);
      }
      object.replaceWith(group);
    });
    svg.querySelectorAll("script,style,iframe,object,embed").forEach(node => node.remove());
    [svg, ...svg.querySelectorAll("*")].forEach(node => [...node.attributes].forEach(attribute => {
      if (/^on/i.test(attribute.name) || (attribute.localName === "href" && !attribute.value.startsWith("#") && !/^data:image\/png;base64,/i.test(attribute.value))) node.removeAttributeNode(attribute);
    }));
    materialCache.set(id, new XMLSerializer().serializeToString(svg));
  }
  return svg;
}

export function pointReferenceLayers(id: string): { base: string; icon: string; file: string } {
  const root = material(id).querySelector(":scope > g")!;
  return { base: root.children[0].id, icon: root.children[1].id, file: pointReferenceSpecs[id].file };
}

function frames(id: string, overrides: Record<string, string | number> = {}): string {
  const template = basicMotions.find(motion => motion.id === id)!;
  return generateBasicMotionFrames(template, { ...createBasicMotionConfig(template), ...overrides });
}

/** Unproject the original ring artwork, rotate it in its circular plane, then restore its projection. */
function rotateProjectedLayers(base: Element, layers: Element[], projection: DOMMatrix, part: string): void {
  if (!layers.length) return;
  const doc = base.ownerDocument;
  const plane = doc.createElementNS(NS, "g"), rotor = doc.createElementNS(NS, "g"), source = doc.createElementNS(NS, "g");
  plane.setAttribute("data-point-part", part);
  plane.setAttribute("transform", projection.toString());
  rotor.setAttribute("class", "point-orbit");
  source.setAttribute("transform", projection.inverse().toString());
  base.insertBefore(plane, layers[0]);
  source.append(...layers); rotor.append(source); plane.append(rotor);
}

function rotateHaloMaterial(base: Element): void {
  const material = base.querySelector('[data-material="vector-angular-gradient"]');
  const transform = material?.parentElement?.getAttribute("transform");
  if (!transform) return;
  const values = transform.match(/^matrix\(([^)]+)\)$/)?.[1].trim().split(/[\s,]+/).map(Number);
  if (values?.length !== 6 || !values.every(Number.isFinite)) return;
  const projection = new DOMMatrix(values);
  // Group_6 and path_7 belong to the LOWER platform, not the middle ring.
  const stationaryRim = [...base.children].find(layer => layer.id === "6");
  stationaryRim?.setAttribute("data-point-part", "stationary-disc-rim");
  [...base.children].find(layer => layer.id === "7")?.setAttribute("data-point-part", "stationary-disc-ring");
  const ringIds = new Set(["8", "9", "10", "11"]);
  const layers = [...base.children].filter(layer => ringIds.has(layer.id));
  if (!layers.length) return;
  const doc = base.ownerDocument;
  const plane = doc.createElementNS(NS, "g"), rotor = doc.createElementNS(NS, "g"), source = doc.createElementNS(NS, "g");
  plane.setAttribute("data-point-part", "halo-projection");
  plane.setAttribute("transform", projection.toString());
  rotor.setAttribute("class", "point-orbit point-wide-halo");
  source.setAttribute("transform", projection.inverse().toString());
  base.insertBefore(plane, layers[0]);
  layers.forEach(layer => layer.setAttribute("data-halo-layer", layer.id));
  source.append(...layers); rotor.append(source); plane.append(rotor);
}

export function generatePointReferenceCss(cls: string, id: string): string {
  const spec = pointReferenceSpecs[id];
  const size = pointReferenceSize(id);
  return `.${cls}{position:relative;width:${size.width}px;height:${size.height}px;isolation:isolate;color:var(--point-color,#0070F3);}
.${cls}>svg{display:block;width:100%;height:100%;overflow:visible;}
.${cls} .point-icon{animation:${cls}-float calc(var(--point-duration)*1.15) ease-in-out infinite;}
${spec.mode === "column" ? `.${cls} .point-float-detail{animation:${cls}-star-float var(--point-duration) ease-in-out infinite;animation-delay:calc(var(--point-duration)*var(--point-phase,0));}` : ""}
${spec.mode === "column" ? `.${cls} .point-plane-rise{transform:translateY(${Math.round(spec.height * .72)}px);animation:${cls}-plane-rise calc(var(--point-duration)*.5) linear infinite;}
.${cls} .point-plane-fade{opacity:.45;animation:${cls}-plane-fade calc(var(--point-duration)*.5) ease-in-out infinite;animation-delay:calc(var(--point-duration)*-.25);}
.${cls} .point-plane-edge{fill:none;stroke:color-mix(in srgb,currentColor 65%,#85E5FF);stroke-width:.65;}
.${cls} .point-plane-glow{fill:none;stroke:currentColor;stroke-width:1.5;opacity:.28;filter:blur(.7px);}` : ""}
.${cls} .point-beam{animation:${cls}-blink var(--point-duration) ease-in-out infinite;}
${spec.mode === "column" ? `.${cls} .point-stars{animation:${cls}-star-breath var(--point-duration) ease-in-out infinite;}` : ""}
${!["column", "grid", "hexagon"].includes(spec.mode) ? `.${cls} .point-orbit{transform-box:view-box;transform-origin:0 0;animation:${cls}-orbit var(--point-duration) linear infinite;}
.${cls} [data-material="vector-angular-gradient"]{transform-box:view-box;transform-origin:0 0;animation:${cls}-orbit var(--point-duration) linear infinite;}
.${cls} .point-orbit-reverse{animation-direction:reverse;animation-duration:calc(var(--point-duration)*1.4);}` : ""}
${spec.mode === "halo" ? `.${cls} .point-wide-halo [data-material="vector-angular-gradient"]{animation:none;}` : ""}
.${cls} .point-generated{opacity:var(--point-intensity);pointer-events:none;}
.${cls} .point-trail{fill:none;stroke:color-mix(in srgb,currentColor 65%,#C0F4FF);stroke-linecap:round;}
.${cls} .point-halo{fill:none;stroke:currentColor;filter:blur(1.4px);stroke-linecap:round;opacity:.35;}
.${cls} .point-scan{animation:${cls}-rise calc(var(--point-duration)*1.3) ease-in-out infinite;}
.${cls} .point-scan-fade{animation:${cls}-blink calc(var(--point-duration)*1.3) ease-in-out infinite;}
.${cls}[data-motion="off"] *{animation:none;}
@keyframes ${cls}-float{${frames("float", { offsetY: 1 }).replace("translateY(-1px)", "translateY(calc(-1px * var(--point-float)))")}}
${spec.mode === "column" ? `@keyframes ${cls}-star-float{${frames("float", { offsetY: 1 }).replace("translateY(-1px)", "translateY(calc(-1px * var(--point-star-float)))")}}` : ""}
${spec.mode === "column" ? `@keyframes ${cls}-plane-rise{${frames("slide-up", { offsetY: Math.round(spec.height * .72), startOpacity: 1 })}}
@keyframes ${cls}-plane-fade{${frames("soft-blink", { minOpacity: 0 })}}` : ""}
@keyframes ${cls}-blink{${frames("soft-blink", { minOpacity: .32 })}}
${spec.mode === "column" ? `@keyframes ${cls}-star-breath{${frames("soft-blink", { minOpacity: .82 })}}` : ""}
${!["column", "grid", "hexagon"].includes(spec.mode) ? `@keyframes ${cls}-orbit{${frames("slow-rotate")}}` : ""}
@keyframes ${cls}-rise{${frames("float", { offsetY: spec.height * .2 })}}
@media(prefers-reduced-motion:reduce){.${cls} *{animation:none!important;}}`;
}

/** One SVG retains original layers and definitions; generated light is inserted between base and icon. */
export function generatePointReferenceMarkup(cls: string, id: string, params: Params, scope: string, extraMarkup = ""): string {
  const spec = pointReferenceSpecs[id], svg = material(id);
  const root = svg.querySelector(":scope > g")!;
  const base = root.children[0], icon = root.children[1];
  const doc = svg.ownerDocument;
  base.setAttribute("data-source-layer", base.id);
  icon.setAttribute("data-source-layer", icon.id);
  icon.classList.add("point-icon");
  if (spec.mode === "halo") rotateHaloMaterial(base);
  if (spec.mode === "finance") {
    // Rotate only the platform's top material in its circular plane; the extruded side stays still.
    const face = [...base.children].find(layer => layer.id === "Vector");
    if (face) {
      const projection = new DOMMatrix([1, 0, 0, spec.radius[1] / spec.radius[0], ...spec.center]);
      rotateProjectedLayers(base, [face], projection, "finance-platform-projection");
    }
  }
  if (spec.mode === "saucer") {
    const ring = [...base.children].find(layer => layer.id === "11");
    // The original rim is not a circular projection. Replace only its render-time geometry
    // with concentric circles: fixed radial material plus rotating light in the same plane.
    [...base.children].filter(layer => ["13", "14"].includes(layer.id)).forEach(layer => layer.remove());
    if (ring) {
      ring.setAttribute("data-point-part", "saucer-top-ring");
      ring.setAttribute("transform", "matrix(1, 0, 0, 0.2910447761, 50.1, 64.6438)");
      ring.innerHTML = `<defs><radialGradient id="saucer-uniform-fill" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40.2"><stop offset=".77" stop-color="#3762D9"/><stop offset=".88" stop-color="#618AFF"/><stop offset="1" stop-color="#A7BCFF"/></radialGradient></defs><circle data-point-part="saucer-uniform-band" r="36" fill="none" stroke="url(#saucer-uniform-fill)" stroke-width="8.4"/><circle r="40.2" fill="none" stroke="#9ABEFF" stroke-opacity=".7" stroke-width=".45"/><circle r="31.8" fill="none" stroke="#7EAFFF" stroke-opacity=".65" stroke-width=".45"/><g class="point-orbit" fill="none" stroke="#BDDDFF" opacity=".65">${circularOrbitTrail(36, 10, 38)}</g>`;
    }
  }
  if (spec.mode === "sectors") {
    const ring = [...base.children].find(layer => layer.id === "inner-ring");
    if (ring) {
      // The supplied fan sections have unequal radii. Rebuild one uniform annular sector,
      // repeat it at equal angles, rotate in a true circle, then apply the shared perspective.
      const outer = 62.4, inner = 45, angle = 98 * Math.PI / 180;
      const point = (radius: number) => `${(radius * Math.cos(angle)).toFixed(4)} ${(radius * Math.sin(angle)).toFixed(4)}`;
      const path = `M${outer} 0 A${outer} ${outer} 0 0 1 ${point(outer)} L${point(inner)} A${inner} ${inner} 0 0 0 ${inner} 0 Z`;
      ring.setAttribute("data-point-part", "sector-ring-projection");
      ring.setAttribute("transform", "matrix(1, 0, 0, 0.4246794872, 62.7, 104.1)");
      ring.innerHTML = `<defs><radialGradient id="uniform-sector-fill" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${outer}"><stop offset=".68" stop-color="#164CA7"/><stop offset=".86" stop-color="#1865E4"/><stop offset="1" stop-color="#398BFF"/></radialGradient></defs><g class="point-orbit">${[0, 120, 240].map(rotation => `<path data-point-part="uniform-sector" d="${path}" transform="rotate(${rotation})" fill="url(#uniform-sector-fill)" stroke="#49A5FF" stroke-opacity=".65" stroke-width=".45"/>`).join("")}</g>`;
    }
  }
  // Native material details breathe independently; their original transform/filter attributes stay intact.
  const lightLayers = spec.mode === "column" ? [base.children[0], base.children[2]] : [];
  lightLayers.forEach((layer, index) => {
    layer?.classList.add(index === 1 ? "point-stars" : "point-beam");
    layer?.setAttribute("style", `--phase:${-index / Math.max(1, lightLayers.length)}`);
  });
  if (spec.mode === "column") {
    // Both original solid platforms stay still; only a separate thin circular plane travels upward.
    base.children[1].children[0].setAttribute("data-point-part", "lower-disc");
    [...base.children[2].children].forEach((pip, index) => {
      pip.classList.add("point-float-detail");
      // Visible stars from left to right: 0, 2, 3, 4. Neighbours move half a cycle apart.
      pip.setAttribute("style", `--point-phase:${-[0, .25, .5, 0, .5][index]}`);
    });
  }
  const [cx, cy] = spec.center, [rx, ry] = spec.radius;
  const generated = doc.createElementNS(NS, "g");
  generated.classList.add("point-generated");
  const arcs = `<g class="point-halo">${circularOrbitTrail(rx, .9, 25, true)}</g><g class="point-trail">${circularOrbitTrail(rx, .75, 25)}</g>`;
  const ellipse = `<g transform="translate(${cx} ${cy}) scale(1 ${ry / rx})"><g class="point-orbit">${arcs}</g></g>`;
  let light = spec.mode === "grid" || spec.mode === "hexagon" ? ""
    : spec.mode === "column" ? `<g transform="translate(0 -${Math.round(spec.height * .72)})"><g class="point-plane-rise"><g class="point-plane-fade"><ellipse class="point-plane-glow" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><ellipse class="point-plane-edge" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></g></g></g>` : ellipse;
  if (spec.mode === "finance") {
    // Two actual ring elevations: the platform face and the ring around the icon, not a bobbing scan.
    light = `<g data-point-part="finance-platform-ring" transform="translate(${cx} ${cy}) scale(1 ${ry / rx})"><g class="point-orbit">${arcs}</g></g>`;
    light += `<g data-point-part="finance-icon-ring" transform="translate(73.07 68.38) scale(1 ${26.45 / 64.93})"><g class="point-orbit point-orbit-reverse">${arcs}</g></g>`;
  }
  if (spec.mode === "halo") {
    light += `<g class="point-scan"><g class="point-scan-fade"><ellipse cx="${cx}" cy="${cy}" rx="${rx * .72}" ry="${ry * .72}" fill="none" stroke="currentColor" stroke-width=".6" opacity=".6"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * .72}" ry="${ry * .72}" fill="none" stroke="currentColor" stroke-width="2" opacity=".15"/></g></g>`;
  }
  if (spec.mode === "saucer") light += `<g transform="translate(${cx} ${cy + 4}) scale(.78 ${ry / rx * .78})"><g class="point-orbit point-orbit-reverse">${arcs}</g></g>`;
  generated.innerHTML = light;
  if (light) root.insertBefore(generated, icon);
  if (!enabled(params, "showBase")) { base.remove(); generated.remove(); }
  if (!enabled(params, "showIcon")) icon.remove();
  if (params.colorMode === "monochrome") {
    const color = /^#[\da-f]{6}$/i.test(String(params.color)) ? String(params.color) : "#0070F3";
    const rgb = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);
    const defs = svg.querySelector("defs")!;
    const filter = doc.createElementNS(NS, "filter");
    filter.id = "point-material-tint";
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("x", "-30%"); filter.setAttribute("y", "-30%"); filter.setAttribute("width", "160%"); filter.setAttribute("height", "160%");
    filter.innerHTML = `<feColorMatrix type="matrix" values="${rgb.map(channel => `${channel * .2126} ${channel * .7152} ${channel * .0722} 0 0`).join(" ")} 0 0 0 1 0"/>`;
    defs.append(filter);
    // Tint the complete composition, including original gradients, icon, PNG textures and generated glow.
    const tinted = doc.createElementNS(NS, "g");
    tinted.setAttribute("filter", "url(#point-material-tint)");
    root.replaceWith(tinted); tinted.append(root);
  }
  if (spec.topPadding) {
    const visual = svg.querySelector(":scope > g")!;
    const padding = doc.createElementNS(NS, "g");
    padding.setAttribute("transform", `translate(0 ${spec.topPadding})`);
    visual.replaceWith(padding); padding.append(visual);
    const size = pointReferenceSize(id);
    svg.setAttribute("height", String(size.height));
    svg.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
  }
  svg.setAttribute("aria-hidden", "true");
  isolateSvgIds(svg, `${cls}-${scope}-${++instance}`);
  const color = /^#[\da-f]{6}$/i.test(String(params.color)) ? params.color : "#0070F3";
  return `<div class="${cls}" data-point-reference="${id}" data-motion="${enabled(params, "motionEnabled") ? "on" : "off"}" style="--point-color:${color};--point-duration:${number(params.duration, 3.6, 1, 12)}s;--point-float:${number(params.floatDistance, spec.iconFloat ?? 3, 0, spec.iconFloatMax ?? 8)};${spec.mode === "column" ? `--point-star-float:${number(params.starDistance, 18, 0, 28)};` : ""}--point-intensity:${number(params.lightIntensity, 65, 0, 100) / 100}">${new XMLSerializer().serializeToString(svg)}${extraMarkup}</div>`;
}
