/** Render-only IDs: keep imported layer metadata/names intact while isolating SVG references. */
export function isolateSvgIds(svg: Element, scope: string): void {
  const prefix = scope.replace(/[^a-zA-Z0-9_-]/g, "-");
  const nodes = [svg, ...svg.querySelectorAll("*")];
  const ids = new Map<string, string>();
  nodes.forEach((node) => {
    const id = node.getAttribute("id");
    if (id && !ids.has(id)) ids.set(id, `${prefix}-${ids.size}`);
  });
  const rewriteUrls = (value: string): string => value.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g,
    (match, _quote, id: string) => ids.has(id) ? `url(#${ids.get(id)})` : match);
  nodes.forEach((node) => {
    const id = node.getAttribute("id");
    if (id && ids.has(id)) node.setAttribute("id", ids.get(id)!);
    [...node.attributes].forEach((attribute) => {
      if (attribute.name === "id") return;
      let value = rewriteUrls(attribute.value);
      if (attribute.localName === "href" && value.startsWith("#") && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
      if (["aria-labelledby", "aria-describedby"].includes(attribute.name)) value = value.split(/\s+/).map((key) => ids.get(key) ?? key).join(" ");
      if (["begin", "end"].includes(attribute.name)) {
        ids.forEach((next, previous) => {
          const escaped = previous.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          value = value.replace(new RegExp(`(^|[;\\s])${escaped}(?=\\.)`, "g"), `$1${next}`);
        });
      }
      if (value !== attribute.value) node.setAttributeNS(attribute.namespaceURI, attribute.name, value);
    });
    if (node.localName === "style" && node.textContent) node.textContent = rewriteUrls(node.textContent);
  });
}

export function instanceSvgMarkup(markup: string, scope: string): string {
  if (!markup) return "";
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror")) return markup;
  isolateSvgIds(svg, scope);
  return new XMLSerializer().serializeToString(svg);
}
