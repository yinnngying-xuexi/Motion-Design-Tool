import { lightShaders } from "@/generators/lightShaders";
import { installImageLight } from "@/utils/imageLight";

export const isWebglLight = (id: string): boolean => Object.prototype.hasOwnProperty.call(lightShaders, id);

export interface LightRendererElement extends HTMLElement {
  seek(seconds: number): void;
  setPlayback(playing: boolean, speed?: number): void;
  dispose(): void;
}

/** Self-contained by design: the exact same function is embedded in the HTML deliverable. */
export function installLightRenderer(shaders: Record<string, string>, scope: Window & typeof globalThis = window): void {
  const registered = scope.customElements.get("dm-light-renderer") as (CustomElementConstructor & { lightShaders: Record<string, string> }) | undefined;
  if (registered) {
    Object.assign(registered.lightShaders, shaders);
    // A later HTML snippet can be parsed before its own initialization script.
    scope.document.querySelectorAll<HTMLElement & { initialize(): void }>('dm-light-renderer[data-ready="pending"]').forEach((item) => item.initialize());
    return;
  }
  const active = new Set<LightElement>();
  const reduced = scope.matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;
  function schedule(): void {
    if (!raf && [...active].some((item) => item.shouldAnimate())) raf = scope.requestAnimationFrame(tick);
  }
  function tick(now: number): void {
    raf = 0;
    active.forEach((item) => {
      if (item.shouldAnimate()) {
        item.elapsed += Math.min(0.08, Math.max(0, (now - item.lastTime) / 1000)) * item.rate;
        item.draw();
      }
      item.lastTime = now;
    });
    schedule();
  }
  const intersection = new scope.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = entry.target as LightElement;
      item.visible = entry.isIntersecting;
      item.lastTime = scope.performance.now();
    });
    schedule();
  });
  scope.document.addEventListener("visibilitychange", () => {
    active.forEach((item) => { item.lastTime = scope.performance.now(); });
    schedule();
  });
  reduced.addEventListener("change", schedule);
  scope.addEventListener("pagehide", () => [...active].forEach((item) => item.dispose()));
  scope.addEventListener("pageshow", () => {
    scope.document.querySelectorAll<LightElement>('dm-light-renderer[data-disposed="true"]').forEach((item) => item.connectedCallback());
  });

  class LightElement extends scope.HTMLElement {
    declare canvas: HTMLCanvasElement;
    declare gl: WebGLRenderingContext | null;
    declare program: WebGLProgram | null;
    declare buffer: WebGLBuffer | null;
    declare uniforms: Record<string, WebGLUniformLocation | null>;
    declare resize: ResizeObserver | null;
    declare elapsed: number;
    declare lastTime: number;
    declare visible: boolean;
    declare playing: boolean;
    declare rate: number;

    constructor() {
      super();
      this.gl = null; this.program = null; this.buffer = null; this.resize = null;
      this.uniforms = {}; this.elapsed = 0; this.lastTime = 0;
      this.visible = false; this.playing = true; this.rate = 1;
      this.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        this.dataset.ready = "false";
        this.dataset.error = "context-lost";
      }, true);
      this.addEventListener("webglcontextrestored", () => { if (this.isConnected) this.initialize(); }, true);
    }

    connectedCallback(): void {
      delete this.dataset.disposed;
      const previous = this.querySelector("canvas");
      this.canvas = scope.document.createElement("canvas");
      if (previous) previous.replaceWith(this.canvas); else this.append(this.canvas);
      this.initialize();
      this.resize = new scope.ResizeObserver(() => this.draw());
      this.resize.observe(this);
      intersection.observe(this);
      active.add(this);
      this.lastTime = scope.performance.now();
      schedule();
    }

    disconnectedCallback(): void {
      active.delete(this); intersection.unobserve(this); this.resize?.disconnect();
      this.dataset.disposed = "true";
      this.dataset.ready = "false";
      this.release();
      if (!active.size && raf) { scope.cancelAnimationFrame(raf); raf = 0; }
    }

    initialize(): void {
      if (!shaders[this.dataset.effect ?? ""]) { this.dataset.ready = "pending"; return; }
      try {
        const gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true, depth: false, stencil: false });
        if (!gl) throw new Error("webgl-unavailable");
        this.gl = gl;
        gl.getExtension("OES_standard_derivatives");
        const compile = (type: number, text: string): WebGLShader => {
          const shader = gl.createShader(type);
          if (!shader) throw new Error("shader-unavailable");
          gl.shaderSource(shader, text); gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader);
            throw new Error(message ?? "shader-compile-failed");
          }
          return shader;
        };
        const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}");
        let fragment: WebGLShader;
        try { fragment = compile(gl.FRAGMENT_SHADER, shaders[this.dataset.effect ?? ""]); }
        catch (error) { gl.deleteShader(vertex); throw error; }
        const program = gl.createProgram();
        if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); throw new Error("program-unavailable"); }
        this.program = program;
        gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        gl.deleteShader(vertex); gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "program-link-failed");
        gl.useProgram(program);
        this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        this.uniforms = Object.fromEntries(["u_resolution", "u_phase", "u_color", "u_curvature", "u_waveCount", "u_glowSpread"].map((key) => [key, gl.getUniformLocation(program, key)]));
        this.dataset.ready = "true"; delete this.dataset.error;
        this.draw(); schedule();
      } catch (error) {
        this.dataset.ready = "false";
        this.dataset.error = error instanceof Error ? error.message : "webgl-unavailable";
        this.release();
      }
    }

    shouldAnimate(): boolean {
      return Boolean(this.gl && this.dataset.ready === "true" && this.visible && this.playing && this.dataset.motion !== "off" && this.dataset.intensity !== "0" && !scope.document.hidden && !reduced.matches && this.getClientRects().length);
    }

    draw(): void {
      const gl = this.gl;
      if (!gl || !this.program || gl.isContextLost()) return;
      const rect = this.getBoundingClientRect();
      const ratio = Math.min(scope.devicePixelRatio || 1, 2);
      const width = Math.max(32, Math.min(1536, Math.round((rect.width || Number(this.dataset.width)) * ratio)));
      const height = Math.max(32, Math.min(1536, Math.round((rect.height || Number(this.dataset.height)) * ratio)));
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      gl.viewport(0, 0, width, height); gl.useProgram(this.program);
      let hex = (this.dataset.color ?? "#0070F3").slice(1);
      if (hex.length < 5) hex = [...hex].map((digit) => digit + digit).join("");
      const color = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
      const duration = Math.max(0.5, Number(this.dataset.duration) || 3);
      const phase = this.elapsed / duration * Math.PI * 2 * (this.dataset.direction === "counterclockwise" ? -1 : 1);
      gl.uniform2f(this.uniforms.u_resolution, width, height);
      gl.uniform1f(this.uniforms.u_phase, phase % (Math.PI * 2));
      gl.uniform3f(this.uniforms.u_color, color[0], color[1], color[2]);
      const curvature = Number(this.dataset.curvature ?? 0.22);
      gl.uniform1f(this.uniforms.u_curvature, Number.isFinite(curvature) ? Math.min(1, Math.max(0, curvature)) : 0.22);
      const waveCount = Number(this.dataset.waveCount ?? 2);
      gl.uniform1f(this.uniforms.u_waveCount, Number.isFinite(waveCount) ? Math.round(Math.min(4, Math.max(1, waveCount))) : 2);
      const glowSpread = Number(this.dataset.glowSpread ?? 1);
      gl.uniform1f(this.uniforms.u_glowSpread, Number.isFinite(glowSpread) ? Math.min(2, Math.max(0, glowSpread)) : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.dataset.time = this.elapsed.toFixed(3);
    }

    seek(seconds: number): void { this.elapsed = Math.max(0, seconds); this.lastTime = scope.performance.now(); this.draw(); }
    dispose(): void { this.disconnectedCallback(); }
    setPlayback(playing: boolean, speed = 1): void {
      this.playing = playing; this.rate = Math.max(0.1, Math.min(4, speed));
      this.lastTime = scope.performance.now(); schedule();
    }
    release(): void {
      if (this.gl) {
        this.gl.deleteBuffer(this.buffer); this.gl.deleteProgram(this.program);
        this.gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      this.gl = null; this.program = null; this.buffer = null;
    }
  }
  Object.assign(LightElement, { lightShaders: shaders });
  scope.customElements.define("dm-light-renderer", LightElement);
}

export function initializeLightDocument(doc: Document): void {
  if (doc.querySelector("dm-image-light") && doc.defaultView) installImageLight(doc.defaultView as Window & typeof globalThis);
  if (doc.querySelector("dm-light-renderer") && doc.defaultView) installLightRenderer(lightShaders, doc.defaultView as Window & typeof globalThis);
}

export function releaseLightDocument(doc?: Document | null): void {
  doc?.querySelectorAll<HTMLElement & { dispose?(): void }>("dm-image-light").forEach((item) => item.dispose?.());
  doc?.querySelectorAll<LightRendererElement>("dm-light-renderer").forEach((item) => item.dispose?.());
}

export function lightRuntimeScript(id: string): string {
  // Image support remains only for previously saved artifacts; current effects are procedural.
  return isWebglLight(id) ? `<!-- WebGL 光效：保留并执行初始化脚本。Vue/React 请在挂载后初始化，不可只用 v-html/innerHTML 插入。无需外链依赖。 -->\n<script>(${installLightRenderer.toString()})(${JSON.stringify({ [id]: lightShaders[id] })});</script>` : "";
}

if (typeof window !== "undefined") installLightRenderer(lightShaders);
