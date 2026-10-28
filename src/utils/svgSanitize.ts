// Flatten SVG presentation CSS so imported selectors never leak into the editor.
const PRESENTATION = /^(?:fill(?:-opacity|-rule)?|stroke(?:-width|-opacity|-linecap|-linejoin|-miterlimit|-dasharray|-dashoffset)?|opacity|color|stop-color|stop-opacity|flood-color|flood-opacity|clip-path|clip-rule|mask|filter|display|visibility|paint-order|vector-effect|font-family|font-size|font-weight|font-style|text-anchor|dominant-baseline|letter-spacing)$/;

function safeValue(value: string): boolean {
  if (/javascript:|expression\s*\(|@import|\\/i.test(value)) return false;
  return [...value.matchAll(/url\s*\(([^)]*)\)/gi)].every((match) => /^#[\w:.-]+$/.test(match[1].trim().replace(/^['"]|['"]$/g, "")));
}

export function parseSafeSvg(text: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror")) throw new Error("无法读取这个 SVG 文件");
  svg.querySelectorAll("script,link,foreignObject,iframe,object,embed,animate,animateTransform,animateMotion,set").forEach((node) => node.remove());
  [svg, ...svg.querySelectorAll("*")].forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on") || ((name === "href" || name === "xlink:href") && !value.startsWith("#")) || !safeValue(value)) element.removeAttribute(attribute.name);
    });
  });
  const styleNodes = [...svg.querySelectorAll("style")];
  if (styleNodes.length) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styleNodes.map((node) => node.textContent ?? "").join("\n"));
    styleNodes.forEach((node) => node.remove());
    const affected = new Map<SVGElement, Set<string>>();
    const rules: string[] = [];
    for (const rule of [...sheet.cssRules]) {
      if (!(rule instanceof CSSStyleRule)) continue;
      const declarations = [...rule.style].filter((property) => PRESENTATION.test(property) && safeValue(rule.style.getPropertyValue(property)));
      if (!declarations.length) continue;
      try {
        [svg, ...svg.querySelectorAll<SVGElement>("*")].filter((node) => node.matches(rule.selectorText)).forEach((node) => {
          const properties = affected.get(node) ?? new Set<string>();
          declarations.forEach((property) => properties.add(property));
          affected.set(node, properties);
        });
        rules.push(`${rule.selectorText}{${declarations.map((property) => `${property}:${rule.style.getPropertyValue(property)}${rule.style.getPropertyPriority(property) ? " !important" : ""}`).join(";")}}`);
      } catch { /* Ignore unsupported selectors. */ }
    }
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none";
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = rules.join("\n");
    shadow.append(style, svg);
    document.body.append(host);
    try {
      const resolved = [...affected].map(([node, properties]) => {
        const computed = getComputedStyle(node);
        return { node, values: [...properties].map((property) => [property, computed.getPropertyValue(property)] as const) };
      });
      resolved.forEach(({ node, values }) => values.forEach(([property, value]) => {
        const localValue = value.replace(/url\(["']?[^)"']*#([\w:.-]+)["']?\)/g, "url(#$1)");
        if (safeValue(localValue)) {
          node.style.setProperty(property, localValue);
          if (property === "fill" || property === "stroke") node.setAttribute(property, localValue);
        }
      }));
    } finally { svg.remove(); host.remove(); }
  }
  svg.setAttribute("aria-hidden", "true");
  return svg;
}
