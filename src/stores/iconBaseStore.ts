import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { createDefaultIconBaseConfig } from "@/generators/iconBaseGenerator";
import type { IconBaseAsset, IconBaseMotionConfig } from "@/types/iconBase";
import { fileToDataUrl, stripFileExtension, validateIconBaseFile } from "@/utils/file";

const STORAGE_KEY = "visual-motion-icon-base-assets";

function createId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `icon-base-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useIconBaseStore = defineStore("icon-base", () => {
  const assets = ref<IconBaseAsset[]>([]);
  const currentAssetId = ref<string>("");

  const currentAsset = computed(() => assets.value.find((asset) => asset.id === currentAssetId.value) ?? null);

  async function uploadAsset(file: File): Promise<void> {
    const fileType = validateIconBaseFile(file);
    const dataUrl = await fileToDataUrl(file);
    const now = new Date().toISOString();
    const asset: IconBaseAsset = {
      id: createId(),
      name: stripFileExtension(file.name) || "未命名底座",
      fileName: file.name,
      fileType,
      dataUrl,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      motionConfig: createDefaultIconBaseConfig()
    };

    assets.value.unshift(asset);
    currentAssetId.value = asset.id;
    saveToLocal();
  }

  function selectAsset(id: string): void {
    currentAssetId.value = id;
  }

  function updateCurrentAssetConfig(config: Partial<IconBaseMotionConfig>): void {
    if (!currentAsset.value) return;
    currentAsset.value.motionConfig = {
      ...currentAsset.value.motionConfig,
      ...config
    };
    currentAsset.value.updatedAt = new Date().toISOString();
    saveToLocal();
  }

  function renameAsset(id: string, name: string): void {
    const target = assets.value.find((asset) => asset.id === id);
    if (!target) return;
    target.name = name.trim() || target.name;
    target.updatedAt = new Date().toISOString();
    saveToLocal();
  }

  function deleteAsset(id: string): void {
    const index = assets.value.findIndex((asset) => asset.id === id);
    if (index < 0) return;

    assets.value.splice(index, 1);
    if (currentAssetId.value === id) {
      currentAssetId.value = assets.value[0]?.id ?? "";
    }
    saveToLocal();
  }

  function toggleFavorite(id: string): void {
    const target = assets.value.find((asset) => asset.id === id);
    if (!target) return;
    target.favorite = !target.favorite;
    target.updatedAt = new Date().toISOString();
    saveToLocal();
  }

  function saveToLocal(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.value));
  }

  function loadFromLocal(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as IconBaseAsset[];
      assets.value = Array.isArray(parsed) ? parsed : [];
      currentAssetId.value = assets.value[0]?.id ?? "";
    } catch {
      assets.value = [];
      currentAssetId.value = "";
    }
  }

  return {
    assets,
    currentAssetId,
    currentAsset,
    uploadAsset,
    selectAsset,
    updateCurrentAssetConfig,
    renameAsset,
    deleteAsset,
    toggleFavorite,
    saveToLocal,
    loadFromLocal
  };
});
