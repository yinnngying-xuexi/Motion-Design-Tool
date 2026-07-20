export type MotionCategory = "入场动效" | "循环动效" | "强调动效" | "告警动效" | "大屏装饰";

export type MotionPreviewType = "fade" | "slide" | "scale" | "pulse" | "float" | "blink" | "rotate" | "glow" | "ripple" | "scan";

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
  editableParams: string[];
}

export interface SavedMotionArtifact {
  html: string;
  previewImage: string;
  htmlFileName: string;
  imageFileName: string;
  width: number;
  height: number;
}

export interface SavedMotion extends BasicMotionTemplate {
  savedAt: string;
  source: "basic-library" | "decoration-library" | "svg-flow";
  decoration?: {
    effectId: string;
    params: Record<string, string | number>;
  };
  svgFlow?: import("@/types/svgFlow").SavedSvgFlowMotion;
  artifact?: SavedMotionArtifact;
}
