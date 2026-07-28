<template>
  <div class="preview-playback-controls" role="group" aria-label="预览播放控制">
    <button type="button" title="从头重播" :disabled="disabled" @click="emit('replay')">
      <el-icon><RefreshRight /></el-icon>
      <span>重播</span>
    </button>
    <button
      type="button"
      class="play-toggle"
      :disabled="disabled"
      :aria-pressed="!playing"
      :title="playing ? '暂停预览' : '继续播放'"
      @click="emit('toggle')"
    >
      <el-icon>
        <VideoPause v-if="playing" />
        <VideoPlay v-else />
      </el-icon>
      <span>{{ playing ? "暂停" : "播放" }}</span>
    </button>
    <div class="speed-options" aria-label="播放速度">
      <button
        v-for="option in speedOptions"
        :key="option"
        type="button"
        :disabled="disabled"
        :class="{ active: speed === option }"
        :aria-pressed="speed === option"
        @click="emit('change-speed', option)"
      >
        {{ option }}x
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshRight, VideoPause, VideoPlay } from "@element-plus/icons-vue";

withDefaults(defineProps<{
  playing: boolean;
  speed?: number;
  disabled?: boolean;
}>(), {
  speed: 1,
  disabled: false
});

const emit = defineEmits<{
  replay: [];
  toggle: [];
  "change-speed": [speed: number];
}>();

const speedOptions = [0.5, 1, 2] as const;
</script>

<style scoped>
.preview-playback-controls {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid var(--dm-hairline);
  border-radius: 0 0 var(--dm-radius-lg) var(--dm-radius-lg);
  background: #0a0a0a;
}

.preview-playback-controls > button,
.speed-options button {
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--dm-secondary);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.preview-playback-controls > button:hover,
.speed-options button:hover {
  background: rgba(255, 255, 255, 0.055);
  color: var(--dm-primary);
}

.preview-playback-controls button:disabled {
  opacity: 0.36;
  cursor: not-allowed;
}

.preview-playback-controls button:disabled:hover {
  background: transparent;
  color: var(--dm-secondary);
}

.preview-playback-controls > .play-toggle {
  border-color: rgba(0, 112, 243, 0.52);
  color: #7ab8ff;
}

.speed-options {
  display: flex;
  align-items: center;
  margin-left: 4px;
  padding-left: 10px;
  border-left: 1px solid var(--dm-hairline);
}

.speed-options button {
  min-width: 42px;
  padding: 0 8px;
  font-family: "Geist Mono", ui-monospace, monospace;
}

.speed-options button.active {
  border-color: rgba(0, 112, 243, 0.46);
  background: rgba(0, 112, 243, 0.14);
  color: #8bc2ff;
}

button:focus-visible {
  outline: 2px solid #0070f3;
  outline-offset: 2px;
}
</style>
