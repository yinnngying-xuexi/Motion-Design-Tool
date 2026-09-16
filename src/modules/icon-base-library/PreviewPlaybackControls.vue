<template>
  <div class="preview-playback-controls" role="group" aria-label="动效重播控制">
    <button type="button" title="从头重播" :disabled="disabled" @click="emit('replay')">
      <el-icon><RefreshRight /></el-icon>
      <span>重播</span>
    </button>
    <span class="preview-duration">{{ formattedDuration }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RefreshRight } from "@element-plus/icons-vue";

const props = withDefaults(defineProps<{
  disabled?: boolean;
  duration?: number;
}>(), {
  disabled: false,
  duration: 0
});

const emit = defineEmits<{
  replay: [];
}>();

const formattedDuration = computed(() => `${Number(props.duration.toFixed(2))}s`);
</script>

<style scoped>
.preview-playback-controls {
  width: fit-content;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  gap: 4px;
  margin: 8px auto 0;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.055);
  border-radius: 6px;
  background: rgba(10, 10, 10, 0.42);
}

.preview-playback-controls button {
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--dm-tertiary);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.preview-playback-controls button:hover {
  border-color: rgba(0, 112, 243, 0.36);
  background: rgba(0, 112, 243, 0.08);
  color: #7ab8ff;
}

.preview-playback-controls button:disabled {
  opacity: 0.36;
  cursor: not-allowed;
}

.preview-playback-controls button:disabled:hover {
  border-color: transparent;
  background: transparent;
  color: var(--dm-tertiary);
}

.preview-playback-controls button:focus-visible {
  outline: 2px solid #0070f3;
  outline-offset: 2px;
}

.preview-duration {
  min-width: 42px;
  padding: 0 7px;
  border-left: 1px solid var(--dm-hairline);
  color: var(--dm-tertiary);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
  text-align: center;
}
</style>
