<template>
  <section class="icon-base-library">
    <aside class="library-sidebar panel">
      <header class="sidebar-head">
        <div>
          <h1>图标底座素材库</h1>
        </div>
        <small>{{ store.assets.length }} 个素材</small>
      </header>
      <IconBaseUploader />
      <IconBaseList />
    </aside>

    <main class="library-main panel">
      <IconBasePreview :asset="store.currentAsset" />
    </main>

    <aside class="library-params panel">
      <IconBaseParamPanel :asset="store.currentAsset" />
    </aside>

    <section class="library-export panel">
      <IconBaseExportPanel :asset="store.currentAsset" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useIconBaseStore } from "@/stores/iconBaseStore";
import IconBaseExportPanel from "./IconBaseExportPanel.vue";
import IconBaseList from "./IconBaseList.vue";
import IconBaseParamPanel from "./IconBaseParamPanel.vue";
import IconBasePreview from "./IconBasePreview.vue";
import IconBaseUploader from "./IconBaseUploader.vue";

const store = useIconBaseStore();

onMounted(() => {
  store.loadFromLocal();
});
</script>

<style scoped>
.icon-base-library {
  min-height: 0;
  display: grid;
  grid-template-columns: 330px minmax(520px, 1fr) 360px;
  grid-template-rows: minmax(500px, 1fr) 330px;
  grid-template-areas:
    "sidebar main params"
    "sidebar export export";
  gap: 16px;
}

.panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: var(--dm-surface);
}

.library-sidebar {
  grid-area: sidebar;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 16px;
  padding: 18px;
}

.library-main {
  grid-area: main;
  padding: 18px;
}

.library-params {
  grid-area: params;
  padding: 18px;
}

.library-export {
  grid-area: export;
  padding: 18px;
}

.sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-head span {
  color: var(--dm-secondary);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.sidebar-head h1 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 22px;
  line-height: 1.2;
}

.sidebar-head small {
  padding: 5px 9px;
  border: 1px solid var(--dm-hairline-strong);
  border-radius: 999px;
  color: var(--dm-secondary);
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .icon-base-library {
    grid-template-columns: 300px minmax(460px, 1fr) 330px;
  }
}
</style>
