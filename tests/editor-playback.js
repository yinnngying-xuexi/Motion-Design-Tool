import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import Basic from '/src/modules/motion-library/BasicMotionLibrary.vue';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';

let total = 0, failures = 0, app;
const results = document.querySelector('#results');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw Error(message); };
async function test(name, run) {
  total++;
  const row = document.createElement('li');
  try { await run(); row.textContent = `PASS ${name}`; }
  catch (error) { failures++; row.textContent = `FAIL ${name}: ${error.message}`; }
  results.append(row);
}
async function mount(component) {
  app?.unmount();
  app = createApp(component).use(createPinia()).use(ElementPlus);
  const state = app.mount('#mount').$.setupState;
  await nextTick();
  await wait(250);
  return state;
}

try {
  const basic = await mount(Basic);
  await test('切换一次性动效后主画布持续自动重播', async () => {
    basic.selectedMotionId = 'slide-up';
    await nextTick();
    await wait(250);
    assert(basic.previewState === 'playing', '切换后没有开始播放');
    await wait((basic.previewTotalTime + .5) * 1000);
    assert(basic.previewState === 'playing', '首轮结束后主画布停止了');
    assert(basic.previewCapture.getAnimations({ subtree: true }).some(animation => animation.playState === 'running'), '画布没有运行中的动画');
  });
  for (const id of ['alert-blink', 'pulse-spread']) {
    await test(`${id} 预览和交付持续循环`, async () => {
      basic.selectedMotionId = id;
      await nextTick();
      await wait(250);
      const stage = document.querySelector('.motion-stage');
      const target = stage.querySelector(id === 'pulse-spread' ? '.preview-rectangle' : '.preview-target');
      assert(target, '主预览目标缺失');
      assert(getComputedStyle(target).animationIterationCount === 'infinite', '预览只播放一次');
      assert(basic.previewState === 'playing', '预览已停止');
      assert(basic.htmlCssCode.includes('infinite'), '导出代码没有循环动画');
      if (id === 'pulse-spread') assert(basic.htmlCssCode.includes('__pulse-core'), '扩散核心缺失');
    });
  }
  const decoration = await mount(Decoration);
  await test('上传背景后查看比例为暗色双态切换', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 360;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    decoration.backgroundBlob = blob;
    decoration.setBackgroundObjectUrl(blob);
    await nextTick();
    const switcher = document.querySelector('.canvas-view-switch');
    assert(switcher?.querySelectorAll('button').length === 2, '未显示暗色比例切换');
    assert(!switcher.querySelector('.el-radio-button'), '仍使用亮色单选按钮');
    assert(getComputedStyle(switcher).backgroundColor !== 'rgb(255, 255, 255)', '比例切换背景仍是亮色');
    switcher.querySelectorAll('button')[1].click();
    await nextTick();
    assert(decoration.backgroundSettings.viewMode === 'actual', '100% 切换失效');
    assert(switcher.querySelectorAll('button')[1].getAttribute('aria-pressed') === 'true', '选中状态缺失');
    switcher.querySelectorAll('button')[0].click();
    await nextTick();
    assert(decoration.backgroundSettings.viewMode === 'fit', '适应画布切换失效');
  });
} catch (error) {
  failures++;
  results.append(Object.assign(document.createElement('li'), { textContent: `FATAL ${error.stack}` }));
} finally {
  document.title = failures ? `FAIL ${failures}/${total}` : `PASS ${total}/${total}`;
}
