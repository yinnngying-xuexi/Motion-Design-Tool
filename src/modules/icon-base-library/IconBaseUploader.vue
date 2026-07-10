<template>
  <el-upload
    class="icon-base-uploader"
    drag
    :auto-upload="false"
    :show-file-list="false"
    accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
    :on-change="handleChange"
  >
    <div class="upload-core">
      <div class="upload-mark">+</div>
      <strong>上传图标底座</strong>
      <span>PNG / SVG / WebP，单个不超过 2MB</span>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import type { UploadFile } from "element-plus";
import { ElMessage } from "element-plus";
import { useIconBaseStore } from "@/stores/iconBaseStore";

const store = useIconBaseStore();

async function handleChange(file: UploadFile): Promise<void> {
  if (!file.raw) return;

  try {
    await store.uploadAsset(file.raw);
    ElMessage.success("素材上传成功");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "上传失败");
  }
}
</script>

<style scoped>
.icon-base-uploader :deep(.el-upload) {
  width: 100%;
}

.icon-base-uploader :deep(.el-upload-dragger) {
  width: 100%;
  padding: 18px;
  border-color: var(--dm-hairline);
  background: var(--dm-neutral);
  border-radius: var(--dm-radius-lg);
}

.upload-core {
  display: grid;
  place-items: center;
  gap: 7px;
  color: var(--dm-primary);
}

.upload-mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline-strong);
  border-radius: var(--dm-radius-md);
  color: var(--dm-tertiary);
  font-size: 22px;
}

.upload-core span {
  color: var(--dm-secondary);
  font-size: 12px;
}
</style>
