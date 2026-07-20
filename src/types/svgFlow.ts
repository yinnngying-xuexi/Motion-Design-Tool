export type SvgFlowDirection = "ltr" | "rtl" | "ttb" | "btt";

export interface SvgFlowSource {
  fileName: string;
  viewBox: string;
  shape: string;
}

export interface SvgPreviewAsset {
  fileName: string;
  markup: string;
}

export interface SvgFlowConfig {
  direction: SvgFlowDirection;
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
  source: SvgFlowSource;
  config: SvgFlowConfig;
}
