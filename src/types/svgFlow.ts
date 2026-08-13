export type SvgFlowDirection = "ltr" | "rtl" | "ttb" | "btt";
export type SvgFlowEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface SvgFlowTarget {
  id: string;
  label: string;
  enabled: boolean;
  direction: SvgFlowDirection;
  delay: number;
}

export interface SvgFlowSource {
  fileName: string;
  viewBox: string;
  width: number;
  height: number;
  shape: string;
  content?: string;
  targets?: SvgFlowTarget[];
  roles?: {
    lightIds: string[];
    edgeIds: string[];
  };
}

export interface SvgPreviewAsset {
  fileName: string;
  markup: string;
  primaryColor: string;
  width: number;
  height: number;
}

export type SvgColorMode = "original" | "monochrome";

export interface SvgStyleConfig {
  colorMode: SvgColorMode;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface SvgFlowConfig {
  direction: SvgFlowDirection;
  easing: SvgFlowEasing;
  duration: number;
  pause: number;
  tail: number;
  borderWidth: number;
  glow: number;
  headColor: string;
  tailColor: string;
  endColor: string;
}

export interface SavedSvgFlowMotion {
  effectId?: string;
  name?: string;
  source: SvgFlowSource;
  config: SvgFlowConfig;
  particleEffect?: import("@/types/decoration").DecorationParticleConfig;
}
