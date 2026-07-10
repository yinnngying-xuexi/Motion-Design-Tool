<template>
  <section class="my-motion panel">
    <header class="my-head">
      <div>
        <h2>我的动效</h2>
      </div>
      <small>{{ store.savedMotions.length }} 个已保存</small>
    </header>

    <el-empty v-if="!store.savedMotions.length" description="还没有保存的动效">
      <template #description>
        <p>基础动效库是系统内置的。你可以从基础动效库选择模板，再保存到这里。</p>
      </template>
    </el-empty>

    <el-scrollbar v-else class="saved-scroll">
      <div class="saved-grid">
        <article v-for="motion in store.savedMotions" :key="motion.id" class="saved-card">
          <div>
            <span>{{ motion.category }}</span>
            <h3>{{ motion.name }}</h3>
            <p>{{ motion.description }}</p>
          </div>
          <footer>
            <small>保存于 {{ formatTime(motion.savedAt) }}</small>
            <el-button size="small" text type="danger" @click="store.deleteMotion(motion.id)">删除</el-button>
          </footer>
        </article>
      </div>
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useMyMotionStore } from "@/stores/myMotionStore";

const store = useMyMotionStore();

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

.my-head span,
.saved-card span {
  color: var(--dm-secondary);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.my-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 24px;
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
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  padding: 16px;
  background: var(--dm-surface-raised);
}

.saved-card h3 {
  margin: 8px 0;
  color: var(--dm-primary);
}

.saved-card p,
.saved-card small {
  color: var(--dm-secondary);
}

.saved-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
