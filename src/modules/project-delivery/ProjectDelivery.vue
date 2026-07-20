<template>
  <section class="project-delivery">
    <header class="delivery-toolbar">
      <div class="toolbar-group">
        <el-button @click="createProject"><el-icon><CirclePlus /></el-icon>新建项目</el-button>
        <el-button @click="openProjectFolder"><el-icon><FolderOpened /></el-icon>打开项目文件夹</el-button>
        <el-button @click="importInput?.click()"><el-icon><Upload /></el-icon>导入 HTML/ZIP</el-button>
      </div>
      <el-button type="primary" :loading="exporting" :disabled="!projectFiles.length" @click="downloadProject">
        <el-icon><Download /></el-icon>下载整个项目包
      </el-button>
      <input ref="importInput" class="hidden-input" type="file" accept=".html,.htm,.zip" @change="importFile" />
      <input ref="folderInput" class="hidden-input" type="file" webkitdirectory multiple @change="folderFallback" />
    </header>

    <div class="delivery-grid">
      <aside class="delivery-panel local-panel">
        <header class="panel-head">
          <h2>本地项目文件</h2>
          <p><el-icon><InfoFilled /></el-icon>仅显示你在 Edge 中授权的项目文件夹</p>
        </header>
        <div class="permission-card" :class="{ authorized }">
          <span><el-icon><CircleCheckFilled /></el-icon>{{ authorized ? "已授权此项目文件夹" : "示例项目 · 等待本地授权" }}</span>
          <small :title="projectPath">{{ projectPath }}</small>
        </div>
        <el-scrollbar class="tree-scroll">
          <el-tree :data="tree" node-key="path" :props="treeProps" :default-expanded-keys="expanded" :expand-on-click-node="false">
            <template #default="{ data }">
              <span class="tree-node">
                <el-icon v-if="data.kind === 'directory'"><Folder /></el-icon>
                <el-icon v-else-if="isImage(data.label)"><Picture /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span>{{ data.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
        <section class="project-structure">
          <h3>项目结构</h3>
          <button v-for="section in sections" :key="section.key" type="button" :class="{ active: activeSection === section.key }" @click="activeSection = section.key">
            <span><el-icon><Folder /></el-icon>{{ section.label }}</span><small>{{ sectionCount(section.key) }}</small>
          </button>
        </section>
      </aside>

      <main class="delivery-panel list-panel">
        <header class="panel-head list-head">
          <div><h2>{{ activeSectionLabel }} · 动效列表</h2><p>共 {{ visibleMotions.length }} 个动效</p></div>
          <el-select v-if="selectedMotion" v-model="selectedMotion.section" size="small" class="section-select" @change="saveMeta">
            <el-option v-for="section in sections" :key="section.key" :label="`移动到 ${section.label}`" :value="section.key" />
          </el-select>
        </header>
        <div class="motion-table">
          <div class="motion-row table-head">
            <span><input type="checkbox" :checked="allSelected" @change="toggleAll" /></span><span>名称</span><span>来源</span><span>入口文件</span><span>预览</span><span>时长</span><span>状态</span>
          </div>
          <el-scrollbar class="table-scroll">
            <button v-for="motion in visibleMotions" :key="motion.id" type="button" class="motion-row motion-item" :class="{ active: selectedId === motion.id }" @click="selectMotion(motion.id)">
              <span @click.stop><input v-model="motion.selected" type="checkbox" /></span>
              <strong :title="motion.name">{{ motion.name }}</strong><span>{{ motion.source }}</span><span>{{ baseName(motion.entry) }}</span>
              <span class="row-preview">
                <img v-if="motion.previewKind === 'image'" src="/demo/figma-motion-dev/assets/light.svg" alt="动效缩略图" />
                <b v-else-if="motion.previewKind === 'number'">12,345</b>
                <img v-else-if="motion.previewKind === 'icon'" src="/demo/figma-motion-dev/assets/icon-center.svg" alt="图标缩略图" />
                <b v-else>HTML</b>
              </span>
              <span>{{ motion.duration }}</span><span class="ready"><i></i>{{ motion.status }}</span>
            </button>
            <div v-if="!visibleMotions.length" class="empty-state"><el-icon><FolderOpened /></el-icon><strong>这个板块还没有动效</strong><p>打开项目文件夹，或导入 HTML / ZIP 资源包。</p></div>
          </el-scrollbar>
          <footer>{{ visibleMotions.length }} 项</footer>
        </div>
      </main>

      <aside class="delivery-panel inspector-panel">
        <header class="panel-head"><h2>动效与资源</h2></header>
        <el-scrollbar v-if="selectedMotion" class="inspector-scroll">
          <section class="summary-block">
            <h3>{{ selectedMotion.name }}</h3>
            <dl>
              <div><dt>入口文件</dt><dd>{{ baseName(selectedMotion.entry) }}</dd></div>
              <div><dt>组件尺寸</dt><dd>{{ selectedMotion.size }}</dd></div>
              <div><dt>动效时长</dt><dd>{{ selectedMotion.duration }}</dd></div>
              <div><dt>相关资源路径</dt><dd>{{ selectedMotion.assetPath }}</dd></div>
              <div><dt>所属板块</dt><dd>{{ labelFor(selectedMotion.section) }}</dd></div>
            </dl>
            <label class="note-field"><span>实现说明</span><el-input v-model="selectedMotion.note" type="textarea" :rows="2" resize="none" @blur="saveMeta" /></label>
          </section>
          <section class="integrity-block">
            <h3>资源完整性</h3>
            <div class="integrity-grid">
              <div><strong>{{ integrity.imageReady }}/{{ integrity.imageTotal }}</strong><span>图片完整</span></div>
              <div><strong>{{ integrity.external }}</strong><span>外部链接</span></div>
              <div :class="{ ok: integrity.valid }"><el-icon><CircleCheck v-if="integrity.valid" /><Warning v-else /></el-icon><span>{{ integrity.valid ? "相对路径有效" : "存在缺失资源" }}</span></div>
            </div>
          </section>
          <section class="preview-block">
            <h3>实时预览</h3>
            <div class="live-preview"><iframe v-if="selectedMotion.previewUrl" :key="selectedMotion.previewUrl" :src="selectedMotion.previewUrl" title="动效实时预览" sandbox="allow-scripts" /><span v-else>正在生成预览…</span></div>
            <p><el-icon><InfoFilled /></el-icon>下载包包含入口文件、说明文档与全部资源，并保留原相对路径。</p>
          </section>
        </el-scrollbar>
        <div v-else class="empty-state"><el-icon><Document /></el-icon><strong>请选择一个动效</strong><p>这里会显示入口文件、资源检查和实时预览。</p></div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import JSZip from "jszip";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CircleCheckFilled, CirclePlus, Document, Download, Folder, FolderOpened, InfoFilled, Picture, Upload, Warning } from "@element-plus/icons-vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

type SectionKey = "indicator" | "left-board" | "center-visual" | "right-board";
type PreviewKind = "image" | "number" | "icon" | "html";
interface ProjectFile { path: string; blob: Blob; size: number; type: string }
interface TreeNode { label: string; path: string; kind: "file" | "directory"; children?: TreeNode[] }
interface Integrity { imageReady: number; imageTotal: number; external: number; valid: boolean }
interface Motion { id: string; name: string; section: SectionKey; source: string; entry: string; duration: string; size: string; assetPath: string; note: string; status: string; previewKind: PreviewKind; previewUrl: string; selected: boolean; files: ProjectFile[]; integrity: Integrity }
interface FileHandleLike { kind: "file"; name: string; getFile(): Promise<File> }
interface DirectoryHandleLike { kind: "directory"; name: string; values(): AsyncIterableIterator<FileHandleLike | DirectoryHandleLike> }

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "indicator", label: "指标区" }, { key: "left-board", label: "左侧数据看板" },
  { key: "center-visual", label: "中央主视觉区" }, { key: "right-board", label: "右侧数据看板" }
];
const demoPaths = ["index.html", "README.md", "assets/background.png", "assets/group-mask.png", "assets/icon-17.png", "assets/icon-base.png", "assets/icon-center.png", "assets/icon-fill.png", "assets/icon-inner.png", "assets/icon-mask.png", "assets/light.png", "assets/line.png"];
const demoRows: Array<[string, string, PreviewKind]> = [
  ["指标装饰流光", "2s", "image"], ["数字计数入场", "0.8s", "number"], ["图标点亮入场", "0.6s", "icon"], ["线条延展动效", "0.6s", "image"],
  ["光晕脉冲", "1.2s", "image"], ["数字跳动", "1s", "number"], ["背景流光", "2.4s", "image"], ["渐隐出场", "0.5s", "image"]
];
const STORE = "datamotion-project-delivery-meta-v1";
const importInput = ref<HTMLInputElement | null>(null), folderInput = ref<HTMLInputElement | null>(null);
const projectName = ref("figma-motion-dev"), projectPath = ref("D:\\Projects\\figma-motion-dev"), authorized = ref(false), exporting = ref(false);
const activeSection = ref<SectionKey>("indicator"), selectedId = ref("demo-0"), projectFiles = ref<ProjectFile[]>([]);
const tree = ref<TreeNode[]>(demoTree()), expanded = ref(["figma-motion-dev", "figma-motion-dev/assets"]), motions = ref<Motion[]>(demoMotions());
const treeProps = { label: "label", children: "children" }, objectUrls = new Set<string>();
const visibleMotions = computed(() => motions.value.filter((motion) => motion.section === activeSection.value));
const selectedMotion = computed(() => motions.value.find((motion) => motion.id === selectedId.value) ?? null);
const activeSectionLabel = computed(() => labelFor(activeSection.value));
const integrity = computed(() => selectedMotion.value?.integrity ?? { imageReady: 0, imageTotal: 0, external: 0, valid: false });
const allSelected = computed(() => !!visibleMotions.value.length && visibleMotions.value.every((motion) => motion.selected));

onMounted(async () => { restoreMeta(); await loadDemoFiles(); });
onBeforeUnmount(() => objectUrls.forEach((url) => URL.revokeObjectURL(url)));

function demoMotions(): Motion[] {
  return demoRows.map(([name, duration, previewKind], index) => ({ id: `demo-${index}`, name, section: "indicator", source: "HTML 文件夹", entry: "index.html", duration, size: "410 × 40（宽 × 高）", assetPath: "assets/", note: index ? "外部 HTML 动效，可随项目整包交付。" : "中心图标发光，左右流光线条向外扩散并渐隐，循环播放。", status: "就绪", previewKind, previewUrl: "/demo/figma-motion-dev/index.html", selected: index === 0, files: [], integrity: { imageReady: 10, imageTotal: 10, external: 0, valid: true } }));
}
function demoTree(): TreeNode[] {
  return [{ label: "figma-motion-dev/", path: "figma-motion-dev", kind: "directory", children: [
    { label: "index.html", path: "figma-motion-dev/index.html", kind: "file" }, { label: "README.md", path: "figma-motion-dev/README.md", kind: "file" },
    { label: "assets/", path: "figma-motion-dev/assets", kind: "directory", children: demoPaths.filter((path) => path.startsWith("assets/")).map((path) => ({ label: baseName(path), path: `figma-motion-dev/${path}`, kind: "file" })) }
  ] }];
}
async function loadDemoFiles() {
  try {
    const files = await Promise.all(demoPaths.map(async (path) => { const response = await fetch(`/demo/figma-motion-dev/${path}`); if (!response.ok) throw new Error(path); const source = await response.blob(); const type = await detectedType(source, path); const blob = type === source.type ? source : new Blob([await source.arrayBuffer()], { type }); return { path, blob, size: blob.size, type } as ProjectFile; }));
    projectFiles.value = files;
    for (const motion of motions.value) { motion.files = files; motion.previewUrl = await previewUrl(motion); }
  } catch { ElMessage.warning("示例资源未能完整加载，但仍可打开本地项目文件夹。"); }
}
async function createProject() {
  try {
    const result = await ElMessageBox.prompt("为这个大屏动效交付项目命名", "新建项目", { confirmButtonText: "创建", cancelButtonText: "取消", inputValue: "未命名大屏项目", inputPattern: /\S+/, inputErrorMessage: "请输入项目名称" });
    projectName.value = result.value.trim(); projectPath.value = `${projectName.value}（尚未选择本地文件夹）`; authorized.value = false; projectFiles.value = []; tree.value = []; motions.value = []; selectedId.value = ""; saveMeta();
    ElMessage.success("项目已创建，可以开始导入动效资源包。");
  } catch { /* 用户取消 */ }
}
async function openProjectFolder() {
  const picker = (window as typeof window & { showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandleLike> }).showDirectoryPicker;
  if (!picker) { folderInput.value?.click(); ElMessage.info("请从文件选择器中选择项目文件夹。"); return; }
  try { const handle = await picker({ mode: "read" }); await applyProject(handle.name, await readDirectory(handle), true); }
  catch (error) { if ((error as DOMException).name !== "AbortError") ElMessage.error("无法读取这个文件夹，请重新选择并允许读取。"); }
}
async function readDirectory(handle: DirectoryHandleLike, prefix = ""): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  for await (const entry of handle.values()) { const path = prefix ? `${prefix}/${entry.name}` : entry.name; if (entry.kind === "directory") files.push(...await readDirectory(entry, path)); else { const file = await entry.getFile(); files.push({ path, blob: file, size: file.size, type: file.type }); } }
  return files.sort((a, b) => a.path.localeCompare(b.path, "zh-CN"));
}
async function folderFallback(event: Event) {
  const input = event.target as HTMLInputElement, files = Array.from(input.files ?? []); if (!files.length) return;
  const root = files[0].webkitRelativePath.split("/")[0] || "本地项目";
  await applyProject(root, files.map((file) => ({ path: file.webkitRelativePath.split("/").slice(1).join("/") || file.name, blob: file, size: file.size, type: file.type })), true); input.value = "";
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file) return;
  try {
    if (/\.zip$/i.test(file.name)) {
      const zip = await JSZip.loadAsync(file), entries = Object.values(zip.files).filter((entry) => !entry.dir), root = commonRoot(entries.map((entry) => entry.name));
      const files = await Promise.all(entries.map(async (entry) => { const blob = await entry.async("blob"), path = root ? entry.name.slice(root.length + 1) : entry.name; return { path, blob, size: blob.size, type: mime(path) } as ProjectFile; }));
      await applyProject(root || file.name.replace(/\.zip$/i, ""), files, false); ElMessage.success("ZIP 资源包已导入，并保留原文件层级。");
    } else { await applyProject(file.name.replace(/\.html?$/i, ""), [{ path: file.name, blob: file, size: file.size, type: file.type || "text/html" }], false); ElMessage.success("HTML 已导入；有图片或脚本时建议使用完整文件夹或 ZIP。"); }
  } catch { ElMessage.error("资源包读取失败，请确认文件没有损坏。"); } finally { input.value = ""; }
}
async function applyProject(name: string, files: ProjectFile[], isAuthorized: boolean) {
  revokeMotionUrls(); const normalizedFiles = await normalizeTypes(files); projectName.value = name || "本地项目"; projectPath.value = `${name}（${isAuthorized ? "Edge 本地授权" : "已导入当前浏览器"}）`; authorized.value = isAuthorized; projectFiles.value = normalizedFiles;
  tree.value = buildTree(normalizedFiles, projectName.value); expanded.value = directoryPaths(tree.value).slice(0, 12); motions.value = await discover(normalizedFiles, projectName.value); selectedId.value = motions.value[0]?.id ?? ""; activeSection.value = motions.value[0]?.section ?? "indicator"; saveMeta();
  ElMessage.success(`已读取 ${normalizedFiles.length} 个文件，发现 ${motions.value.length} 个 HTML 动效。`);
}
async function discover(files: ProjectFile[], root: string): Promise<Motion[]> {
  const indexEntries = files.filter((file) => /(^|\/)index\.html?$/i.test(file.path)), entries = indexEntries.length ? indexEntries : files.filter((file) => /\.html?$/i.test(file.path));
  return Promise.all(entries.map(async (entry, index) => {
    const dir = dirName(entry.path), packageFiles = dir ? files.filter((file) => file.path === entry.path || file.path.startsWith(`${dir}/`)) : files, html = await entry.blob.text();
    const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1].replace(/<[^>]+>/g, "").trim();
    const motion: Motion = { id: `local-${Date.now()}-${index}`, name: title || baseName(dir) || root || `HTML 动效 ${index + 1}`, section: "indicator", source: "HTML 文件夹", entry: entry.path, duration: extractDuration(html), size: extractSize(html), assetPath: packageFiles.some((file) => /(^|\/)assets\//i.test(file.path)) ? `${dir ? `${dir}/` : ""}assets/` : "—", note: "外部导入的 HTML 动效，下载时会保留资源相对路径。", status: "就绪", previewKind: "html", previewUrl: "", selected: index === 0, files: packageFiles, integrity: inspect(entry.path, html, packageFiles) };
    motion.previewUrl = await previewUrl(motion, html); return motion;
  }));
}
function inspect(entry: string, html: string, files: ProjectFile[]): Integrity {
  const refs = references(html), external = refs.filter(isExternal).length, relative = refs.filter((ref) => !isExternal(ref) && !ref.startsWith("#")), paths = new Set(files.map((file) => normalize(file.path))), dir = dirName(entry);
  const resolved = relative.map((ref) => normalize(join(dir, cleanRef(ref)))), images = resolved.filter(isImage);
  return { imageReady: images.filter((path) => paths.has(path)).length, imageTotal: images.length, external, valid: resolved.every((path) => paths.has(path)) };
}
async function previewUrl(motion: Motion, source?: string): Promise<string> {
  const entry = motion.files.find((file) => normalize(file.path) === normalize(motion.entry)); if (!entry) return ""; let html = source ?? await entry.blob.text(), dir = dirName(motion.entry);
  for (const ref of Array.from(new Set(references(html).filter((item) => !isExternal(item))))) { const asset = motion.files.find((file) => normalize(file.path) === normalize(join(dir, cleanRef(ref)))); if (!asset || /\.html?$/i.test(asset.path)) continue; html = html.split(ref).join(await dataUrl(asset.blob, asset.type || mime(asset.path))); }
  html = html.replace("</head>", "<style>html,body{width:100%;height:100%;background:#000!important}body{display:grid;place-items:center;overflow:hidden}</style></head>");
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" })); objectUrls.add(url); return url;
}
function references(html: string): string[] { const refs = new Set<string>(); for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.add(match[1]); for (const match of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.add(match[1]); return [...refs].filter((ref) => ref && !/^(?:data|blob):/i.test(ref)); }
function buildTree(files: ProjectFile[], rootName: string): TreeNode[] {
  const root: TreeNode = { label: `${rootName}/`, path: rootName, kind: "directory", children: [] };
  for (const file of files) { let children = root.children!, path = rootName; normalize(file.path).split("/").filter(Boolean).forEach((part, index, parts) => { path += `/${part}`; const leaf = index === parts.length - 1; let node = children.find((item) => item.label.replace(/\/$/, "") === part); if (!node) { node = { label: leaf ? part : `${part}/`, path, kind: leaf ? "file" : "directory", children: leaf ? undefined : [] }; children.push(node); } if (!leaf) children = node.children!; }); }
  sortTree(root.children!); return [root];
}
function sortTree(nodes: TreeNode[]) { nodes.sort((a, b) => a.kind === b.kind ? a.label.localeCompare(b.label, "zh-CN") : a.kind === "directory" ? -1 : 1); nodes.forEach((node) => node.children && sortTree(node.children)); }
async function downloadProject() {
  if (!projectFiles.value.length) return; exporting.value = true;
  try { const zip = new JSZip(), root = safeName(projectName.value) || "datamotion-project"; projectFiles.value.forEach((file) => zip.file(`${root}/${normalize(file.path)}`, file.blob)); zip.file(`${root}/datamotion-project.json`, JSON.stringify({ projectName: projectName.value, exportedAt: new Date().toISOString(), sections: motions.value.map(({ name, section, entry, duration, note }) => ({ name, section, entry, duration, note })) }, null, 2)); download(await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }), `${root}.zip`); ElMessage.success("整个项目包已下载，文件层级和相对路径保持不变。"); }
  catch { ElMessage.error("项目打包失败，请检查文件是否仍可读取。"); } finally { exporting.value = false; }
}
function selectMotion(id: string) { selectedId.value = id; }
function toggleAll(event: Event) { const checked = (event.target as HTMLInputElement).checked; visibleMotions.value.forEach((motion) => { motion.selected = checked; }); }
function sectionCount(key: SectionKey) { return motions.value.filter((motion) => motion.section === key).length; }
function labelFor(key: SectionKey) { return sections.find((section) => section.key === key)?.label ?? "未分类"; }
function saveMeta() { localStorage.setItem(STORE, JSON.stringify({ activeSection: activeSection.value, motions: motions.value.map(({ id, section, note }) => ({ id, section, note })) })); }
function restoreMeta() { try { const saved = JSON.parse(localStorage.getItem(STORE) || "null") as { activeSection?: SectionKey; motions?: Array<{ id: string; section: SectionKey; note: string }> } | null; if (!saved) return; if (saved.activeSection && sections.some((section) => section.key === saved.activeSection)) activeSection.value = saved.activeSection; saved.motions?.forEach((item) => { const motion = motions.value.find((candidate) => candidate.id === item.id); if (motion) { motion.section = item.section; motion.note = item.note; } }); } catch { localStorage.removeItem(STORE); } }
function extractDuration(html: string) { return html.match(/animation-duration\s*:\s*([\d.]+m?s)/i)?.[1] ?? html.match(/animation(?:-[\w-]+)?\s*:[^;}]*?([\d.]+m?s)(?:\s|;|$)/i)?.[1] ?? "—"; }
function extractSize(html: string) { const width = html.match(/width\s*:\s*(\d+)px/i)?.[1], height = html.match(/height\s*:\s*(\d+)px/i)?.[1]; return width && height ? `${width} × ${height}（宽 × 高）` : "自适应"; }
function commonRoot(paths: string[]) { if (!paths.length) return ""; const first = normalize(paths[0]).split("/")[0]; return paths.every((path) => normalize(path).startsWith(`${first}/`)) ? first : ""; }
function join(base: string, relative: string) { const stack = base.split("/").filter(Boolean); relative.split("/").forEach((part) => { if (!part || part === ".") return; part === ".." ? stack.pop() : stack.push(part); }); return stack.join("/"); }
function cleanRef(ref: string) { return decodeURIComponent(ref.split(/[?#]/)[0]).replace(/^\.\//, ""); }
function normalize(path: string) { return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/"); }
function dirName(path: string) { const value = normalize(path), index = value.lastIndexOf("/"); return index >= 0 ? value.slice(0, index) : ""; }
function baseName(path: string) { return normalize(path).split("/").filter(Boolean).pop() ?? path; }
function isImage(path: string) { return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path); }
function isExternal(ref: string) { return /^(?:https?:)?\/\//i.test(ref); }
function directoryPaths(nodes: TreeNode[]): string[] { return nodes.flatMap((node) => node.kind === "directory" ? [node.path, ...directoryPaths(node.children ?? [])] : []); }
function mime(path: string) { const map: Record<string, string> = { html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript", json: "application/json", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", md: "text/markdown" }; return map[baseName(path).split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream"; }
async function detectedType(blob: Blob, path: string) { const head = await blob.slice(0, 128).text(); return head.trimStart().startsWith("<svg") ? "image/svg+xml" : blob.type || mime(path); }
async function normalizeTypes(files: ProjectFile[]) { return Promise.all(files.map(async (file) => { const type = await detectedType(file.blob, file.path); const blob = type === file.blob.type ? file.blob : new Blob([await file.blob.arrayBuffer()], { type }); return { ...file, blob, type, size: blob.size }; })); }
function dataUrl(blob: Blob, type: string): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob.type ? blob : new Blob([blob], { type })); }); }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function safeName(name: string) { return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, "-"); }
function revokeMotionUrls() { motions.value.forEach((motion) => { if (motion.previewUrl.startsWith("blob:")) { URL.revokeObjectURL(motion.previewUrl); objectUrls.delete(motion.previewUrl); } }); }
</script>

<style scoped>
.project-delivery{height:100%;min-height:0;display:grid;grid-template-rows:48px minmax(0,1fr);gap:10px;padding:10px;border:1px solid var(--dm-hairline);border-radius:var(--dm-radius-lg);background:var(--dm-surface-soft)}
.delivery-toolbar,.toolbar-group{display:flex;align-items:center;gap:10px}.delivery-toolbar{justify-content:space-between;padding:0 2px 10px;border-bottom:1px solid var(--dm-hairline)}.delivery-toolbar .el-button{min-width:126px}.delivery-toolbar>.el-button{min-width:170px}.hidden-input{position:fixed;width:1px;height:1px;opacity:0;pointer-events:none}
.delivery-grid{min-width:0;min-height:0;display:grid;grid-template-columns:340px minmax(500px,1fr) 500px;gap:10px}.delivery-panel{min-width:0;min-height:0;overflow:hidden;border:1px solid var(--dm-hairline);border-radius:var(--dm-radius-md);background:#091018}.panel-head{padding:16px 16px 12px}.panel-head h2,.project-structure h3,.summary-block h3,.integrity-block h3,.preview-block h3{margin:0;color:var(--dm-primary);font-size:16px;line-height:1.35}.panel-head p{display:flex;align-items:center;gap:5px;margin:6px 0 0;color:var(--dm-secondary);font-size:12px}
.local-panel{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto}.permission-card{display:grid;gap:6px;margin:0 12px 8px;padding:10px 12px;border:1px solid var(--dm-hairline);border-radius:var(--dm-radius-sm);background:#0c131a}.permission-card.authorized{border-color:rgba(50,215,121,.3)}.permission-card>span{display:flex;align-items:center;gap:7px;color:#40d77a;font-size:12px}.permission-card small{overflow:hidden;color:var(--dm-secondary);font-family:"Geist Mono",monospace;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.tree-scroll,.table-scroll,.inspector-scroll{min-height:0}.tree-scroll{background:#091018}.tree-scroll :deep(.el-tree),.tree-scroll :deep(.el-scrollbar__view){background:#091018!important}.tree-scroll :deep(.el-tree){padding:2px 10px 10px;color:var(--dm-primary);--el-tree-node-hover-bg-color:rgba(255,255,255,.04);--el-tree-text-color:var(--dm-primary);--el-fill-color-blank:#091018}.tree-node{min-width:0;display:flex;align-items:center;gap:6px;color:var(--dm-primary);font-family:"Geist Mono",monospace;font-size:11px}.tree-node>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tree-node .el-icon{flex:none;color:#8fa4ba}
.project-structure{display:grid;gap:5px;margin:0 12px 12px;padding-top:10px;border-top:1px solid var(--dm-hairline)}.project-structure h3{margin-bottom:3px;font-size:14px}.project-structure button{min-width:0;min-height:30px;display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border:1px solid transparent;border-radius:var(--dm-radius-sm);background:transparent;color:var(--dm-secondary);cursor:pointer}.project-structure button:hover,.project-structure button.active{border-color:var(--dm-tertiary);background:rgba(0,112,243,.13);color:var(--dm-primary)}.project-structure button span{display:flex;align-items:center;gap:8px}.project-structure small{font-family:"Geist Mono",monospace;color:var(--dm-secondary)}
.list-panel{display:grid;grid-template-rows:auto minmax(0,1fr)}.list-head{display:flex;justify-content:space-between;gap:12px}.section-select{width:164px}.motion-table{min-height:0;display:grid;grid-template-rows:38px minmax(0,1fr) 42px}.motion-row{min-width:0;display:grid;grid-template-columns:28px minmax(110px,1.35fr) 84px 92px minmax(130px,1fr) 54px 60px;align-items:center;gap:8px;padding:0 12px}.table-head{border-block:1px solid var(--dm-hairline);color:var(--dm-primary);font-size:12px;font-weight:600}.motion-item{width:100%;height:60px;border:0;border-bottom:1px solid var(--dm-hairline);background:transparent;color:var(--dm-secondary);text-align:left;cursor:pointer}.motion-item:hover{background:rgba(255,255,255,.025)}.motion-item.active{padding-left:10px;border-left:2px solid var(--dm-tertiary);background:rgba(0,112,243,.07)}.motion-item strong,.motion-item>span{min-width:0;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.motion-item strong{color:var(--dm-primary)}input[type=checkbox]{width:14px;height:14px;margin:0;accent-color:var(--dm-tertiary)}.row-preview{height:42px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(143,143,143,.22);border-radius:4px;background:#000;color:#1484ff;font-family:"Geist Mono",monospace;font-size:19px!important}.row-preview img{display:block;max-width:90%;max-height:74%;object-fit:contain}.row-preview b{font-weight:600}.ready i{width:6px;height:6px;display:inline-block;margin-right:6px;border-radius:50%;background:#40d77a}.motion-table footer{display:flex;align-items:center;padding:0 16px;color:var(--dm-secondary);font-size:12px}
.empty-state{height:100%;display:grid;place-items:center;align-content:center;gap:7px;padding:24px;color:var(--dm-secondary);text-align:center}.empty-state .el-icon{color:#54708a;font-size:28px}.empty-state strong{color:var(--dm-primary);font-size:14px}.empty-state p{margin:0;font-size:12px}.inspector-panel{display:grid;grid-template-rows:auto minmax(0,1fr)}.summary-block,.integrity-block,.preview-block{margin:0 16px;padding:14px 0;border-bottom:1px solid var(--dm-hairline)}.summary-block{padding-top:3px}.summary-block h3{margin-bottom:14px}.summary-block dl{display:grid;gap:10px;margin:0}.summary-block dl div{display:grid;grid-template-columns:106px minmax(0,1fr);gap:12px}.summary-block dt,.summary-block dd,.note-field>span,.preview-block p{margin:0;color:var(--dm-secondary);font-size:12px}.summary-block dd{overflow:hidden;color:var(--dm-primary);text-overflow:ellipsis;white-space:nowrap}.note-field{display:grid;gap:7px;margin-top:12px}.integrity-block h3,.preview-block h3{margin-bottom:10px;font-size:14px}.integrity-grid{display:grid;grid-template-columns:1fr 1fr 1.05fr;border:1px solid var(--dm-hairline);border-radius:var(--dm-radius-sm);overflow:hidden;background:#0b1118}.integrity-grid>div{min-width:0;min-height:68px;display:grid;place-items:center;align-content:center;gap:2px;border-right:1px solid var(--dm-hairline);color:var(--dm-secondary);text-align:center}.integrity-grid>div:last-child{border:0}.integrity-grid strong{color:var(--dm-primary);font-family:"Geist Mono",monospace;font-size:20px}.integrity-grid span{font-size:11px}.integrity-grid .el-icon{font-size:22px}.integrity-grid .ok .el-icon{color:#22d77a}.preview-block{border-bottom:0}.live-preview{height:112px;display:grid;place-items:center;overflow:hidden;border:1px solid var(--dm-hairline);border-radius:var(--dm-radius-sm);background:#000}.live-preview iframe{width:100%;height:100%;border:0;background:#000}.live-preview>span{color:var(--dm-secondary);font-size:12px}.preview-block p{display:flex;align-items:flex-start;gap:6px;margin:10px 0 2px;line-height:1.55}
@media(max-width:1500px){.delivery-grid{grid-template-columns:300px minmax(470px,1fr) 420px}.motion-row{grid-template-columns:26px minmax(100px,1.2fr) 74px 82px minmax(105px,1fr) 48px 54px;gap:6px;padding-inline:9px}}
</style>
