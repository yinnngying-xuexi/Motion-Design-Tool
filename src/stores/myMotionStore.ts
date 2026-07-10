import { defineStore } from "pinia";
import { ref } from "vue";
import type { BasicMotionTemplate, SavedMotion } from "@/types/motion";

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

  function saveMotion(template: BasicMotionTemplate): void {
    const exists = savedMotions.value.some((motion) => motion.id === template.id);
    if (exists) return;

    savedMotions.value.unshift({
      ...template,
      savedAt: new Date().toISOString(),
      source: "basic-library"
    });
    saveToLocal();
  }

  function deleteMotion(id: string): void {
    savedMotions.value = savedMotions.value.filter((motion) => motion.id !== id);
    saveToLocal();
  }

  return {
    savedMotions,
    loadFromLocal,
    saveMotion,
    deleteMotion
  };
});
