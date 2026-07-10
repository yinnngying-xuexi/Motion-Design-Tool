export type IconBaseFileType = "png" | "svg" | "webp";

export type IconBaseAnimationType =
  | "none"
  | "pulse"
  | "rotate"
  | "float"
  | "blink"
  | "glow"
  | "ripple";

export interface IconBaseMotionConfig {
  width: number;
  height: number;
  opacity: number;
  scale: number;
  rotate: number;
  showIcon: boolean;
  iconSize: number;
  iconColor: string;
  animationType: IconBaseAnimationType;
  duration: number;
  delay: number;
  iteration: "1" | "2" | "3" | "infinite";
  timingFunction: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  direction: "normal" | "reverse" | "alternate";
  glowColor: string;
  glowStrength: number;
  shadowBlur: number;
  rippleSize: number;
}

export interface IconBaseAsset {
  id: string;
  name: string;
  fileName: string;
  fileType: IconBaseFileType;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  motionConfig: IconBaseMotionConfig;
}

export type IconBaseBackground = "ink" | "black" | "transparent-grid";

export interface IconBaseExportPayload {
  htmlCss: string;
  vueComponent: string;
  jsonConfig: string;
}
