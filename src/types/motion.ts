export type MotionCategory = "入场动效" | "循环动效" | "强调动效" | "告警动效";

export type MotionPreviewType = "fade" | "slide" | "scale" | "pulse" | "float" | "blink" | "rotate" | "glow" | "ripple" | "scan";

export interface BasicMotionConfig {
  duration: number;
  delay: number;
  iteration: "1" | "2" | "3" | "infinite";
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  timingFunction: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  color: string;
  startOpacity: number;
  endOpacity: number;
  minOpacity: number;
  maxOpacity: number;
  startScale: number;
  endScale: number;
  minScale: number;
  maxScale: number;
  startBlur: number;
  offsetX: number;
  offsetY: number;
  rotationAngle: number;
  emphasisScale: number;
  reboundScale: number;
  glowBase: number;
  glowPeak: number;
  glowStrength: number;
  borderWidth: number;
  blinkFrequency: number;
  rippleStartRadius: number;
  rippleEndRadius: number;
  rippleCount: number;
  rippleInterval: number;
  flowLength: number;
  flowHeadOpacity: number;
  flowTailOpacity: number;
  flowHeadWidth: number;
  flowTailWidth: number;
  scanSpeed: number;
  scanDirection: "top-to-bottom" | "bottom-to-top" | "left-to-right" | "right-to-left";
  scanLineWidth: number;
  scanLength: number;
  assetScale: number;
  assetOffsetX: number;
  assetOffsetY: number;
}

export type BasicMotionParamKey = keyof BasicMotionConfig;

export interface MotionParamOption {
  label: string;
  value: string | number;
}

export interface MotionParamDefinition {
  key: BasicMotionParamKey;
  label: string;
  type: "number" | "color" | "select";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: MotionParamOption[];
}

export interface MotionParamGroup {
  id: "effect" | "timing";
  title: string;
  params: MotionParamDefinition[];
}

export interface BasicMotionTemplate {
  id: string;
  name: string;
  category: MotionCategory;
  scene: string;
  description: string;
  previewType: MotionPreviewType;
  duration: number;
  timingFunction: string;
  iteration: "1" | "3" | "infinite";
  defaultConfig: Partial<BasicMotionConfig>;
  paramGroups: MotionParamGroup[];
}

export interface SavedMotionArtifact {
  html: string;
  previewImage: string;
  htmlFileName: string;
  imageFileName: string;
  width: number;
  height: number;
}

export interface SavedMotion extends Omit<BasicMotionTemplate, "defaultConfig" | "paramGroups"> {
  defaultConfig?: Partial<BasicMotionConfig>;
  paramGroups?: MotionParamGroup[];
  editableParams?: string[];
  savedAt: string;
  source: "basic-library" | "decoration-library" | "svg-flow";
  decoration?: {
    effectId: string;
    params: Record<string, string | number>;
  };
  svgFlow?: import("@/types/svgFlow").SavedSvgFlowMotion;
  artifact?: SavedMotionArtifact;
}
