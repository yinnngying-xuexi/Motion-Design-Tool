import { defineStore } from "pinia";
import { ref } from "vue";
import type { SavedStarRingComponent, StarRingDecorationConfig } from "@/types/decoration";

const STORAGE_KEY = "visual-motion-custom-decorations";

function cloneConfig(config: StarRingDecorationConfig): StarRingDecorationConfig {
  return JSON.parse(JSON.stringify(config)) as StarRingDecorationConfig;
}

function componentId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "");
  return `custom-star-ring-${slug || Date.now()}`;
}

export const useCustomDecorationStore = defineStore("custom-decoration", () => {
  const components = ref<SavedStarRingComponent[]>([]);

  function load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SavedStarRingComponent[];
      components.value = Array.isArray(parsed) ? parsed : [];
    } catch {
      components.value = [];
    }
  }

  function persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(components.value));
  }

  function save(name: string, config: StarRingDecorationConfig, previewImage: string): SavedStarRingComponent {
    const id = componentId(name);
    const saved: SavedStarRingComponent = {
      id,
      name: name.trim(),
      savedAt: new Date().toISOString(),
      previewImage,
      config: cloneConfig(config)
    };
    const index = components.value.findIndex((item) => item.id === id);
    if (index >= 0) components.value.splice(index, 1, saved);
    else components.value.unshift(saved);
    persist();
    return saved;
  }

  function remove(id: string): void {
    components.value = components.value.filter((item) => item.id !== id);
    persist();
  }

  return { components, load, save, remove };
});
