<template>
  <el-dialog
    v-model="visible"
    class="star-ring-import-guide"
    :title="`${guide.title} · SVG 导入说明`"
    width="680px"
    align-center
  >
    <div class="guide-intro">
      <strong>在 Figma 中建议这样命名顶层编组</strong>
      <p>{{ guide.intro }}</p>
    </div>

    <section class="guide-section">
      <div class="guide-section-head">
        <h3>推荐图层结构</h3>
        <span>英文名称不区分大小写</span>
      </div>
      <div class="layer-tree" :aria-label="`${guide.title} SVG 推荐图层结构`">
        <div v-for="layer in guide.layers" :key="layer.name">
          <em>{{ layer.label }}</em><span>•</span><b>{{ layer.name }}</b><small v-if="'optional' in layer && layer.optional">可选</small>
        </div>
      </div>
    </section>

    <section class="guide-section guide-rules">
      <h3>导出前检查</h3>
      <ul>
        <li>这些图层放在素材根分组下，并保持同级。</li>
        <li>{{ guide.note }}</li>
        <li>Figma 导出 SVG 时勾选 <code>Include “id” attribute</code>。</li>
      </ul>
    </section>

    <template #footer>
      <div class="guide-footer">
        <a class="guide-download" :href="guide.href" :download="guide.downloadName">
          下载示例 SVG
        </a>
        <el-button size="small" @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

type GuideType = "star-ring" | "stacked-energy-base" | "ripple-focus-base";
const props = withDefaults(defineProps<{ modelValue: boolean; guideType?: GuideType }>(), { guideType: "star-ring" });
const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value)
});
const guides = {
  "star-ring": {
    title: "星环粒子底座",
    intro: "根分组名称可以自定义；编辑器会按以下英文名称识别素材结构。",
    layers: [
      { label: "背景层", name: "background" },
      { label: "外环层", name: "outer-ring" },
      { label: "内环层", name: "inner-ring" },
      { label: "中心层", name: "center" },
      { label: "粒子层", name: "particles", optional: true }
    ],
    note: "没有粒子素材时可不建立 particles，不影响其余图层导入。",
    href: "/examples/star-ring-layer-template.svg",
    downloadName: "星环粒子底座-分层示例.svg"
  },
  "stacked-energy-base": {
    title: "层叠能量底座",
    intro: "底座主体使用三层同级编组；顶部定位推荐命名为 marker，也可以在右侧作为独立 SVG 上传。",
    layers: [
      { label: "底层底板", name: "base-back" },
      { label: "中层底板", name: "base-middle" },
      { label: "前层底板", name: "base-front" },
      { label: "顶部定位", name: "marker", optional: true },
      { label: "底部光效", name: "glow", optional: true }
    ],
    note: "单独上传顶部定位时不要求内部命名；整套导入时兼容旧名称 center，三层底板会自动套用错峰推进动效。",
    href: "/examples/icon-base-stacked-energy-layer-template.svg",
    downloadName: "层叠能量底座-分层示例.svg"
  },
  "ripple-focus-base": {
    title: "环形扩散底座",
    intro: "案例将原始 SVG 整理为背景、三层透视扩散环和中心图标；整套替换时建议保留以下顶层名称。",
    layers: [
      { label: "底座背景", name: "background" },
      { label: "外扩散环", name: "ripple-outer" },
      { label: "中扩散环", name: "ripple-middle" },
      { label: "内扩散环", name: "ripple-inner" },
      { label: "中心图标", name: "center" }
    ],
    note: "只替换中心图标时无需遵守命名；整套结构替换后，三层扩散环会按由内到外的顺序自动错峰播放。",
    href: "/examples/icon-base-ripple-focus-layer-template.svg",
    downloadName: "环形扩散底座-分层示例.svg"
  }
} as const;
const guide = computed(() => guides[props.guideType]);
</script>

<style scoped>
:global(.star-ring-import-guide.el-dialog) {
  --el-dialog-bg-color: #111111;
  --el-text-color-primary: #f3f3f3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: #111111;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

:global(.star-ring-import-guide .el-dialog__header) {
  margin: 0;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:global(.star-ring-import-guide .el-dialog__title) {
  color: #f3f3f3;
  font-size: 18px;
  font-weight: 600;
}

:global(.star-ring-import-guide .el-dialog__headerbtn .el-dialog__close) {
  color: #8d8d8d;
}

:global(.star-ring-import-guide .el-dialog__body) {
  padding: 22px 24px 8px;
  color: #d6d6d6;
}

:global(.star-ring-import-guide .el-dialog__footer) {
  padding: 16px 24px 22px;
}

.guide-intro strong {
  color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
}

.guide-intro p {
  margin: 7px 0 0;
  color: #858585;
  font-size: 12px;
  line-height: 1.7;
}

.guide-section {
  margin-top: 20px;
}

.guide-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.guide-section h3 {
  margin: 0;
  color: #ededed;
  font-size: 13px;
  font-weight: 600;
}

.guide-section-head span {
  color: #666666;
  font-size: 11px;
}

.layer-tree {
  padding: 14px 16px;
  border-radius: 7px;
  background: #0a0a0a;
  color: #6f6f6f;
  font: 12px/1.9 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.layer-tree div {
  display: grid;
  grid-template-columns: 88px 18px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 30px;
}

.layer-tree b {
  color: #b9d9ff;
  font-weight: 500;
}

.layer-tree em {
  color: #d0d0d0;
  font-family: inherit;
  font-style: normal;
}

.layer-tree span {
  color: #777777;
}

.layer-tree small {
  color: #696969;
  font-size: 10px;
}

.guide-rules {
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.guide-rules ul {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #929292;
  font-size: 12px;
  line-height: 1.9;
}

.guide-rules code {
  color: #b9d9ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.guide-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.guide-download {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 13px;
  border-radius: 4px;
  background: #0070f3;
  color: #ffffff;
  font-size: 12px;
  text-decoration: none;
  transition: background-color 0.18s ease;
}

.guide-download:hover {
  background: #1681ff;
}
</style>
