<template>
  <el-scrollbar class="asset-list-scroll">
    <section class="asset-list">
    <article
      v-for="asset in sortedAssets"
      :key="asset.id"
      class="asset-card"
      :class="{ active: asset.id === store.currentAssetId }"
      @click="store.selectAsset(asset.id)"
    >
      <div class="asset-thumb">
        <img :src="asset.dataUrl" :alt="asset.name" />
      </div>
      <div class="asset-info">
        <div class="asset-title">
          <strong>{{ asset.name }}</strong>
          <button type="button" :class="{ favorite: asset.favorite }" @click.stop="store.toggleFavorite(asset.id)">
            ★
          </button>
        </div>
        <p>{{ asset.fileType.toUpperCase() }} · {{ formatTime(asset.createdAt) }}</p>
        <span>{{ animationLabel(asset.motionConfig.animationType) }}</span>
      </div>
      <div class="asset-actions">
        <button type="button" @click.stop="rename(asset.id, asset.name)">重命名</button>
        <button type="button" @click.stop="remove(asset.id)">删除</button>
      </div>
    </article>

    <div v-if="!store.assets.length" class="empty-list">
      <strong>还没有底座素材</strong>
      <span>上传设计好的 PNG、SVG 或 WebP 后开始绑定动效。</span>
    </div>
    </section>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { computed } from "vue";
import { useIconBaseStore } from "@/stores/iconBaseStore";
import type { IconBaseAnimationType } from "@/types/iconBase";

const store = useIconBaseStore();

const sortedAssets = computed(() =>
  [...store.assets].sort((a, b) => Number(b.favorite) - Number(a.favorite))
);

const labels: Record<IconBaseAnimationType, string> = {
  none: "无动效",
  pulse: "呼吸",
  rotate: "慢速旋转",
  float: "上下浮动",
  blink: "闪烁",
  glow: "发光",
  ripple: "脉冲扩散"
};

function animationLabel(type: IconBaseAnimationType): string {
  return labels[type];
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function rename(id: string, currentName: string): Promise<void> {
  const result = await ElMessageBox.prompt("请输入新的素材名称", "重命名素材", {
    inputValue: currentName,
    confirmButtonText: "保存",
    cancelButtonText: "取消"
  }).catch(() => null);

  if (!result) return;
  store.renameAsset(id, result.value);
  ElMessage.success("素材已重命名");
}

async function remove(id: string): Promise<void> {
  const confirmed = await ElMessageBox.confirm("删除后不可恢复，确认删除该素材吗？", "删除素材", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  }).catch(() => null);

  if (!confirmed) return;
  store.deleteAsset(id);
}
</script>

<style scoped>
.asset-list-scroll {
  min-height: 0;
}

.asset-list {
  display: grid;
  gap: 12px;
  padding-right: 8px;
}

.asset-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.asset-card.active {
  border-color: var(--dm-tertiary);
  background: rgba(0, 112, 243, 0.12);
}

.asset-thumb {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: var(--dm-neutral);
}

.asset-thumb img {
  max-width: 46px;
  max-height: 46px;
  object-fit: contain;
}

.asset-info {
  min-width: 0;
}

.asset-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.asset-title strong {
  overflow: hidden;
  color: var(--dm-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-title button,
.asset-actions button {
  border: 0;
  background: transparent;
  color: var(--dm-secondary);
  cursor: pointer;
}

.asset-title button.favorite {
  color: var(--dm-tertiary);
}

.asset-info p {
  margin: 5px 0 8px;
  color: var(--dm-secondary);
  font-size: 12px;
}

.asset-info span {
  display: inline-flex;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(0, 112, 243, 0.16);
  color: var(--dm-primary);
  font-size: 12px;
}

.asset-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--dm-hairline);
  padding-top: 8px;
}

.empty-list {
  display: grid;
  gap: 6px;
  padding: 24px;
  border: 1px dashed var(--dm-hairline-strong);
  border-radius: var(--dm-radius-lg);
  color: var(--dm-primary);
  text-align: center;
}

.empty-list span {
  color: var(--dm-secondary);
  font-size: 13px;
}
</style>
