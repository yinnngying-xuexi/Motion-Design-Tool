import { defineStore } from "pinia";
import { ref } from "vue";
import type { DecorationEffectTemplate } from "@/types/decoration";
import type { BasicMotionTemplate, SavedMotion, SavedMotionArtifact } from "@/types/motion";
import type { SavedSvgFlowMotion } from "@/types/svgFlow";

const STORAGE_KEY = "visual-motion-my-motions";

export const useMyMotionStore = defineStore("my-motion", () => {
  const savedMotions = ref<SavedMotion[]>([]);

  function loadFromLocal(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as SavedMotion[];
      savedMotions.value = Array.isArray(parsed) ? parsed : [];
    } catch {
      savedMotions.value = [];
    }
  }

  function saveToLocal(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMotions.value));
  }

  function saveMotion(template: BasicMotionTemplate, artifact: SavedMotionArtifact): void {
    const motion: SavedMotion = {
      ...template,
      savedAt: new Date().toISOString(),
      source: "basic-library",
      artifact
    };
    const index = savedMotions.value.findIndex((item) => item.id === template.id);
    if (index >= 0) savedMotions.value.splice(index, 1, motion);
    else savedMotions.value.unshift(motion);
    saveToLocal();
  }

  function saveDecoration(template: DecorationEffectTemplate, params: Record<string, string | number>, artifact: SavedMotionArtifact): void {
    const id = "decoration-" + template.id;
    const motion: SavedMotion = {
      id,
      name: template.name,
      category: "大屏装饰",
      scene: template.scene,
      description: template.description,
      previewType: ["linear-flow", "comet-flow", "svg-flow", "scan"].includes(template.previewType) ? "scan" : "glow",
      duration: Number(params.duration ?? 2.4),
      timingFunction: "linear",
      iteration: "infinite",
      editableParams: template.editableParams.map((param) => param.key),
      savedAt: new Date().toISOString(),
      source: "decoration-library",
      decoration: {
        effectId: template.id,
        params: { ...params }
      },
      artifact
    };
    const index = savedMotions.value.findIndex((item) => item.id === id);
    if (index >= 0) savedMotions.value.splice(index, 1, motion);
    else savedMotions.value.unshift(motion);
    saveToLocal();
  }

  function deleteMotion(id: string): void {
    savedMotions.value = savedMotions.value.filter((motion) => motion.id !== id);
    saveToLocal();
  }

  function saveSvgFlow(svgFlow: SavedSvgFlowMotion, artifact: SavedMotionArtifact): void {
    const id = `svg-flow-${svgFlow.source.fileName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "custom"}`;
    const motion: SavedMotion = {
      id,
      name: "SVG流光工具",
      category: "大屏装饰",
      scene: "自定义 SVG 路径",
      description: `SVG 流光：${svgFlow.source.fileName}`,
      previewType: "scan",
      duration: svgFlow.config.duration,
      timingFunction: "linear",
      iteration: "infinite",
      editableParams: [],
      savedAt: new Date().toISOString(),
      source: "svg-flow",
      svgFlow,
      artifact
    };
    const index = savedMotions.value.findIndex((item) => item.id === id);
    if (index >= 0) savedMotions.value.splice(index, 1, motion);
    else savedMotions.value.unshift(motion);
    saveToLocal();
  }

  return {
    savedMotions,
    loadFromLocal,
    saveMotion,
    saveDecoration,
    saveSvgFlow,
    deleteMotion
  };
});
