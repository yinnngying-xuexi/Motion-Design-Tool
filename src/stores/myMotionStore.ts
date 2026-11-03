import { defineStore } from "pinia";
import { ref } from "vue";
import type { DecorationEffectTemplate, StarRingDecorationConfig } from "@/types/decoration";
import type { BasicMotionTemplate, SavedMotion, SavedMotionArtifact } from "@/types/motion";
import type { SavedSvgFlowMotion } from "@/types/svgFlow";

const STORAGE_KEY = "visual-motion-my-motions";

export const useMyMotionStore = defineStore("my-motion", () => {
  const savedMotions = ref<SavedMotion[]>([]);

  function loadFromLocal(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { savedMotions.value = []; return; }
      const parsed = JSON.parse(raw) as SavedMotion[];
      savedMotions.value = Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string" && typeof item.name === "string") : [];
    } catch {
      savedMotions.value = [];
    }
  }

  function commit(next: SavedMotion[]): void {
    // Persist first: a quota/security failure must not create a phantom saved card.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error("保存失败：浏览器存储空间不足或不可用。请先导出 HTML 备份，再清理不需要的已保存动效。");
    }
    savedMotions.value = next;
  }

  function upsert(motion: SavedMotion): void {
    const next = [...savedMotions.value];
    const index = next.findIndex((item) => item.id === motion.id);
    if (index >= 0) next.splice(index, 1, motion);
    else next.unshift(motion);
    commit(next);
  }

  function saveMotion(template: BasicMotionTemplate, artifact: SavedMotionArtifact): void {
    const motion: SavedMotion = {
      ...template,
      savedAt: new Date().toISOString(),
      source: "basic-library",
      artifact
    };
    upsert(motion);
  }

  function saveDecoration(template: DecorationEffectTemplate, params: Record<string, string | number>, artifact: SavedMotionArtifact, starRing?: StarRingDecorationConfig, duration?: number): void {
    const id = "decoration-" + template.id;
    const motion: SavedMotion = {
      id,
      name: template.name,
      category: "强调动效",
      scene: template.scene,
      description: template.description,
      previewType: ["linear-flow", "comet-flow", "svg-flow", "scan"].includes(template.previewType) ? "scan" : "glow",
      duration: starRing?.kind === "stacked-energy-base"
        ? Number(starRing.stackedEnergy?.duration ?? 3.2)
        : starRing
        ? starRing.kind === "layered-decoration"
          ? Number(params.duration ?? 2.8)
          : Math.max(...Object.values(starRing.layerConfigs).filter((layer) => layer.visible && layer.motion !== "none").map((layer) => layer.motion === "basic" ? Number(layer.basicMotionConfig?.duration ?? layer.duration) : layer.duration), 0)
        : Number(params.duration ?? 2.4),
      timingFunction: "linear",
      iteration: "infinite",
      editableParams: template.editableParams.map((param) => param.key),
      savedAt: new Date().toISOString(),
      source: "decoration-library",
      decoration: {
        effectId: template.id,
        params: { ...params },
        starRing: starRing ? JSON.parse(JSON.stringify(starRing)) as StarRingDecorationConfig : undefined
      },
      artifact
    };
    if (duration !== undefined) motion.duration = duration;
    upsert(motion);
  }

  function deleteMotion(id: string): void {
    commit(savedMotions.value.filter((motion) => motion.id !== id));
  }

  function saveSvgFlow(svgFlow: SavedSvgFlowMotion, artifact: SavedMotionArtifact): void {
    const id = svgFlow.effectId
      ? `decoration-${svgFlow.effectId}`
      : `svg-flow-${svgFlow.source.fileName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "custom"}`;
    const name = svgFlow.name ?? "路径流光";
    const motion: SavedMotion = {
      id,
      name,
      category: "强调动效",
      scene: "自定义 SVG 路径",
      description: `${name}：${svgFlow.source.fileName}`,
      previewType: "scan",
      duration: svgFlow.config.duration,
      timingFunction: "linear",
      iteration: "infinite",
      editableParams: [],
      savedAt: new Date().toISOString(),
      source: "svg-flow",
      svgFlow: JSON.parse(JSON.stringify(svgFlow)) as SavedSvgFlowMotion,
      artifact
    };
    upsert(motion);
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
