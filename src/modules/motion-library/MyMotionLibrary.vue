<template>
  <section class="my-motion panel">
    <header class="my-head">
      <div><h2>我的动效</h2><p>仅保存在当前浏览器；重要动效请下载 HTML 备份。</p></div>
      <small>{{ store.savedMotions.length }} 个已保存</small>
    </header>

    <el-empty v-if="!store.savedMotions.length" description="还没有保存的动效">
      <template #description><p>在基础动效库或装饰组件中点击“保存到我的动效”。</p></template>
    </el-empty>

    <el-scrollbar v-else class="saved-scroll">
      <div class="saved-grid">
        <article v-for="motion in store.savedMotions" :key="motion.id" class="saved-card">
          <button class="motion-image dm-motion-canvas" type="button" :disabled="!motion.artifact" @click="openPreview(motion)">
            <img v-if="motion.artifact" :src="motion.artifact.previewImage" :alt="`${motion.name}预览图`" />
            <span v-else>旧记录未包含预览图，请重新保存</span>
          </button>
          <div class="card-copy">
            <div class="card-kicker"><span>{{ motion.source === "basic-library" ? motion.category : "装饰组件" }}</span><small>{{ motion.artifact ? "HTML · PNG" : "旧记录" }}</small></div>
            <h3>{{ motion.name }}</h3>
            <p>{{ motion.description }}</p>
          </div>
          <footer>
            <small>保存于 {{ formatTime(motion.savedAt) }}</small>
            <div class="card-actions">
              <el-button size="small" text :disabled="!motion.artifact" @click="openPreview(motion)">预览</el-button>
              <el-button size="small" text :disabled="!motion.artifact" @click="downloadHtml(motion)">HTML</el-button>
              <el-button size="small" text :disabled="!motion.artifact || copyingSvgId === motion.id || Boolean(motionSvgUnsupportedReason(motion.artifact.html))" :title="motionSvgUnsupportedReason(motion.artifact?.html) || MOTION_SVG_COPY_HINT" @click="copySvg(motion)">复制 SVG</el-button>
              <el-button size="small" text :disabled="!motion.artifact" @click="downloadImage(motion)">图片</el-button>
              <el-button v-if="motion.source === 'svg-flow'" size="small" text @click="editSvgFlow(motion)">再次编辑</el-button>
              <el-button size="small" text type="danger" @click="confirmDelete(motion)">删除</el-button>
            </div>
          </footer>
        </article>
      </div>
    </el-scrollbar>

    <el-dialog v-model="previewVisible" width="760px" class="motion-preview-dialog" append-to-body>
      <template #header><div class="dialog-title"><strong>{{ previewMotion?.name }}</strong><span>HTML 实时预览</span></div></template>
      <div class="dialog-preview-surface">
        <div class="dialog-preview">
          <iframe
            v-if="previewMotion?.artifact"
            ref="previewFrame"
            :key="previewFrameKey"
            :srcdoc="previewMotion.artifact.html"
            title="已保存动效预览"
            sandbox="allow-same-origin"
            @load="applyFramePlaybackState"
          />
        </div>
        <PreviewPlaybackControls
          :duration="previewMotion?.duration ?? 0"
          @replay="replayPreview"
        />
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button :disabled="!previewMotion?.artifact" @click="previewMotion && downloadImage(previewMotion)">下载图片</el-button>
        <el-button type="primary" :disabled="!previewMotion?.artifact" @click="previewMotion && downloadHtml(previewMotion)">下载 HTML</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useMyMotionStore } from "@/stores/myMotionStore";
import type { SavedMotion } from "@/types/motion";
import { SVG_FLOW_OPEN_KEY } from "@/utils/svgFlow";
import { fitMotionPreviewDocument } from "@/utils/motionArtifact";
import { initializeLightDocument, releaseLightDocument, type LightRendererElement } from "@/utils/lightWebgl";
import { createAnimatedMotionSvg, MOTION_SVG_COPY_HINT, motionSvgUnsupportedReason } from "@/utils/motionSvg";
import { copyMotionCode } from "@/utils/clipboard";
import PreviewPlaybackControls from "@/modules/icon-base-library/PreviewPlaybackControls.vue";

const store = useMyMotionStore();
const copyingSvgId = ref("");
const emit = defineEmits<{ editSvgFlow: [] }>();
const previewVisible = ref(false);
const previewMotion = ref<SavedMotion>();
const previewFrame = ref<HTMLIFrameElement>();
const previewFrameKey = ref(0);
const previewPlaying = ref(true);
const previewSpeed = ref(1);
let frameResizeObserver: ResizeObserver | undefined;
let currentPreviewDocument: Document | undefined;
onBeforeUnmount(() => { frameResizeObserver?.disconnect(); releaseLightDocument(currentPreviewDocument); });
watch(previewVisible, (visible) => {
  currentPreviewDocument?.querySelectorAll<LightRendererElement>("dm-light-renderer").forEach((item) => item.setPlayback(visible && previewPlaying.value, previewSpeed.value));
});

onMounted(() => {
  store.loadFromLocal();
});

function formatTime(value: string): string {
  if (!Number.isFinite(new Date(value).getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function editSvgFlow(motion: SavedMotion): void {
  if (!motion.svgFlow) return;
  try {
    localStorage.setItem(SVG_FLOW_OPEN_KEY, JSON.stringify(motion.svgFlow));
    emit("editSvgFlow");
  } catch { ElMessage.error("浏览器存储不可用，无法打开编辑。请先下载 HTML 备份。"); }
}

async function confirmDelete(motion: SavedMotion): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除“${motion.name}”后无法恢复，请确认已下载所需 HTML。`, "删除动效", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" });
  } catch { return; }
  try { store.deleteMotion(motion.id); ElMessage.success("已删除动效"); }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : "删除失败，原记录已保留"); }
}

function openPreview(motion: SavedMotion): void {
  if (!motion.artifact) return;
  previewMotion.value = motion;
  previewPlaying.value = true;
  previewSpeed.value = 1;
  previewFrameKey.value += 1;
  previewVisible.value = true;
}

async function copySvg(motion: SavedMotion): Promise<void> {
  if (!motion.artifact || copyingSvgId.value) return;
  copyingSvgId.value = motion.id;
  try {
    await copyMotionCode(await createAnimatedMotionSvg(motion.artifact.html, motion.name));
    ElMessage.success("动态 SVG 源码已复制（浏览器兼容格式）");
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : "SVG 复制失败"); }
  finally { copyingSvgId.value = ""; }
}

function togglePreview(): void {
  previewPlaying.value = !previewPlaying.value;
  applyFramePlaybackState();
}

function setPreviewSpeed(speed: number): void {
  previewSpeed.value = speed;
  applyFramePlaybackState();
}

function replayPreview(): void {
  previewPlaying.value = true;
  previewFrameKey.value += 1;
}

function applyFramePlaybackState(): void {
  const document = previewFrame.value?.contentDocument;
  if (!document) return;
  if (currentPreviewDocument !== document) releaseLightDocument(currentPreviewDocument);
  currentPreviewDocument = document;
  const fit = () => {
    const frame = previewFrame.value;
    if (frame) fitMotionPreviewDocument(document, frame.clientWidth, frame.clientHeight);
  };
  fit();
  initializeLightDocument(document);
  document.querySelectorAll<LightRendererElement>("dm-light-renderer").forEach((item) => item.setPlayback(previewVisible.value && previewPlaying.value, previewSpeed.value));
  frameResizeObserver?.disconnect();
  frameResizeObserver = new ResizeObserver(fit);
  if (previewFrame.value) frameResizeObserver.observe(previewFrame.value);
  document.getAnimations().forEach((animation) => {
    animation.playbackRate = previewSpeed.value;
    if (previewPlaying.value) animation.play();
    else animation.pause();
  });
  document.querySelectorAll("svg").forEach((svg) => {
    const animatedSvg = svg as SVGSVGElement & {
      pauseAnimations?: () => void;
      unpauseAnimations?: () => void;
    };
    if (previewPlaying.value) animatedSvg.unpauseAnimations?.();
    else animatedSvg.pauseAnimations?.();
  });
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
  padding: 20px 22px;
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
  color: var(--dm-tertiary);
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
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
  background: #111214;
  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.saved-card:hover {
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: none;
  transform: none;
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
  background-color: var(--dm-motion-canvas-background);
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

.saved-card:hover h3 { color: var(--dm-tertiary); }

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

.dialog-preview-surface {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

.dialog-preview {
  height: 390px;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md) var(--dm-radius-md) 0 0;
  background: #000;
}

.dialog-preview iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}

:global(.motion-preview-dialog) {
  --el-dialog-bg-color: #0c0d0d;
  --el-text-color-primary: var(--dm-primary);
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
}

@media (max-width: 1400px) {
  .saved-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
