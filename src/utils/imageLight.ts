/** Each mounted image gets its own decode timeline, so editor replay starts at frame zero.
 * Self-contained: this exact installer is included in standalone deliverables. */
export function installImageLight(scope: Window & typeof globalThis = window): void {
  if (scope.customElements.get("dm-image-light")) return;
  const urls = new WeakMap<HTMLElement, string>();
  class ImageLight extends scope.HTMLElement {
    connectedCallback(): void {
      const image = this.querySelector("img");
      const source = image?.getAttribute("src") ?? "";
      if (!image || !source.startsWith("data:image/webp;base64,")) return;
      const bytes = scope.atob(source.slice(source.indexOf(",") + 1));
      const data = new Uint8Array(bytes.length);
      for (let index = 0; index < bytes.length; index++) data[index] = bytes.charCodeAt(index);
      const url = scope.URL.createObjectURL(new scope.Blob([data], { type: "image/webp" }));
      urls.set(this, url);
      // Keep the portable source on disconnect/reconnect; never export a temporary blob URL.
      image.dataset.source = source;
      image.src = url;
      this.dataset.ready = "true";
    }
    disconnectedCallback(): void {
      const url = urls.get(this);
      if (url) scope.URL.revokeObjectURL(url);
      urls.delete(this);
      const image = this.querySelector("img");
      if (image?.dataset.source) { image.src = image.dataset.source; delete image.dataset.source; }
    }
    dispose(): void { this.disconnectedCallback(); }
  }
  scope.customElements.define("dm-image-light", ImageLight);
}

if (typeof window !== "undefined") installImageLight();
