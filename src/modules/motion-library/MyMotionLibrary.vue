<template>
  <section class="my-motion panel">
    <header class="my-head">
      <div><h2>我的动效</h2><p>每条记录包含名称、可交付 HTML 和预览图片</p></div>
      <small>{{ store.savedMotions.length }} 个已保存</small>
    </header>

    <el-empty v-if="!store.savedMotions.length" description="还没有保存的动效">
      <template #description><p>在基础动效库或装饰动效库中点击“保存到我的动效”。</p></template>
    </el-empty>

    <el-scrollbar v-else class="saved-scroll">
      <div class="saved-grid">
        <article v-for="motion in store.savedMotions" :key="motion.id" class="saved-card">
          <button class="motion-image" type="button" :disabled="!motion.artifact" @click="openPreview(motion)">
            <img v-if="motion.artifact" :src="motion.artifact.previewImage" :alt="`${motion.name}预览图`" />
            <span v-else>旧记录未包含预览图，请重新保存</span>
          </button>
          <div class="card-copy">
            <div class="card-kicker"><span>{{ motion.category }}</span><small>{{ motion.artifact ? "HTML · PNG" : "旧记录" }}</small></div>
            <h3>{{ motion.name }}</h3>
            <p>{{ motion.description }}</p>
          </div>
          <footer>
            <small>保存于 {{ formatTime(motion.savedAt) }}</small>
            <div class="card-actions">
              <el-button size="small" text :disabled="!motion.artifact" @click="openPreview(motion)">预览</el-button>
              <el-button size="small" text :disabled="!motion.artifact" @click="downloadHtml(motion)">HTML</el-button>
              <el-button size="small" text :disabled="!motion.artifact" @click="downloadImage(motion)">图片</el-button>
              <el-button v-if="motion.source === 'svg-flow'" size="small" text @click="editSvgFlow(motion)">再次编辑</el-button>
              <el-button size="small" text type="danger" @click="store.deleteMotion(motion.id)">删除</el-button>
            </div>
          </footer>
        </article>
      </div>
    </el-scrollbar>

    <el-dialog v-model="previewVisible" width="760px" class="motion-preview-dialog" append-to-body>
      <template #header><div class="dialog-title"><strong>{{ previewMotion?.name }}</strong><span>HTML 实时预览</span></div></template>
      <div class="dialog-preview"><iframe v-if="previewMotion?.artifact" :srcdoc="previewMotion.artifact.html" title="已保存动效预览" sandbox="" /></div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button :disabled="!previewMotion?.artifact" @click="previewMotion && downloadImage(previewMotion)">下载图片</el-button>
        <el-button type="primary" :disabled="!previewMotion?.artifact" @click="previewMotion && downloadHtml(previewMotion)">下载 HTML</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useMyMotionStore } from "@/stores/myMotionStore";
import type { SavedMotion } from "@/types/motion";
import { SVG_FLOW_OPEN_KEY } from "@/utils/svgFlow";

const store = useMyMotionStore();
const emit = defineEmits<{ editSvgFlow: [] }>();
const previewVisible = ref(false);
const previewMotion = ref<SavedMotion>();

onMounted(() => {
  store.loadFromLocal();
});

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function editSvgFlow(motion: SavedMotion): void {
  if (!motion.svgFlow) return;
  localStorage.setItem(SVG_FLOW_OPEN_KEY, JSON.stringify(motion.svgFlow));
  emit("editSvgFlow");
}

function openPreview(motion: SavedMotion): void {
  if (!motion.artifact) return;
  previewMotion.value = motion;
  previewVisible.value = true;
}

function downloadHtml(motion: SavedMotion): void {
  if (!motion.artifact) return;
  const blob = new Blob([motion.artifact.html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, motion.artifact.htmlFileName);
}

function downloadImage(motion: SavedMotion): void {
  if (!motion.artifact) return;
  const anchor = document.createElement("a");
  anchor.href = motion.artifact.previewImage;
  anchor.download = motion.artifact.imageFileName;
  anchor.click();
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<style scoped>
.my-motion {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 18px;
  padding: 22px;
  overflow: hidden;
}

.my-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
}

.my-head p {
  margin: 5px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
}

.card-kicker span {
  color: var(--dm-secondary);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.my-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 18px;
  line-height: 1.3;
}

.my-head small {
  color: var(--dm-secondary);
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-right: 8px;
}

.saved-scroll {
  min-height: 0;
}

.saved-card {
  min-height: 330px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: var(--dm-surface-raised);
}

.motion-image {
  width: 100%;
  aspect-ratio: 16 / 8;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--dm-hairline);
  background: #000;
  color: var(--dm-secondary);
  cursor: pointer;
}

.motion-image:disabled {
  cursor: default;
}

.motion-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.motion-image span {
  padding: 20px;
  font-size: 12px;
}

.card-copy {
  flex: 1;
  padding: 14px 16px 8px;
}

.card-kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-kicker small {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10px;
}

.saved-card h3 {
  margin: 8px 0;
  color: var(--dm-primary);
}

.saved-card p,
.saved-card small {
  color: var(--dm-secondary);
}

.saved-card p {
  margin: 0;
  line-height: 1.55;
}

.saved-card footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 12px 16px;
  border-top: 1px solid var(--dm-hairline);
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
}

.dialog-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.dialog-title span {
  color: var(--dm-secondary);
  font-size: 12px;
}

.dialog-preview {
  height: 420px;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: #000;
}

.dialog-preview iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}

:global(.motion-preview-dialog) {
  --el-dialog-bg-color: #0b1016;
  --el-text-color-primary: var(--dm-primary);
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
}

@media (max-width: 1400px) {
  .saved-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
