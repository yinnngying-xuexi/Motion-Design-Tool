import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';

let failures = 0;
let total = 0;
const results = document.querySelector('#results');
const assert = (ok, message) => { if (!ok) throw Error(message); };
async function test(name, run) {
  total += 1;
  const row = document.createElement('li');
  try { await run(); row.textContent = `PASS ${name}`; }
  catch (error) { failures += 1; row.textContent = `FAIL ${name}: ${error.message}`; }
  results.append(row);
}
async function exportedHtml(state) {
  let blob;
  const createObjectURL = URL.createObjectURL;
  const click = HTMLAnchorElement.prototype.click;
  try {
    URL.createObjectURL = value => { blob = value; return createObjectURL(value); };
    HTMLAnchorElement.prototype.click = function () {};
    await state.downloadHtml();
    return await blob.text();
  } finally {
    URL.createObjectURL = createObjectURL;
    HTMLAnchorElement.prototype.click = click;
  }
}

localStorage.clear();
const app = createApp(Decoration, { initialEffectId: 'light-flare-base' }).use(createPinia()).use(ElementPlus);
const state = app.mount('#mount').$.setupState;
await nextTick();
try {
  await test('光晕扩散底座默认参数与 HTML 尺寸', async () => {
    assert(state.params.overallScale === 39, '默认缩放不是 39%');
    assert(state.params.color.toLowerCase() === '#0095ff', '默认颜色错误');
    assert(state.params.lightIntensity === 76 && state.params.duration === 4.05 && state.params.motionEnabled === 'on', '强度、时长或运动状态错误');
    assert(document.querySelector('.decoration-params').textContent.includes('140.4 × 74.1'), '实际尺寸显示错误');
    assert(state.htmlCss.includes('data-dm-scale="39"'), '复制代码未使用默认大小');
    const html = await exportedHtml(state);
    assert(html.includes('width:140.4px;height:74.1px'), '导出尺寸错误');
    state.params.overallScale = 80;
    state.params.color = '#FF0000';
    state.resetCurrentEffect();
    await nextTick();
    assert(state.params.overallScale === 39 && state.params.color === '#0095ff', '重置未恢复默认值');
  });
  await test('标题尺寸单独控制预览与 HTML，不显示整体缩放', async () => {
    state.activeEffectId = 'svg-flow-tool';
    await nextTick();
    assert(document.querySelector('.decoration-params').textContent.includes('标题尺寸'), '标题尺寸控件丢失');
    assert(!document.querySelector('.decoration-params .motion-scale-control'), '标题仍显示整体缩放');
    state.params.titleWidth = 960;
    await nextTick();
    assert(state.previewIntrinsicSize.width === 960 && state.params.overallScale === 100, '预览尺寸未由标题宽度控制');
    assert(state.htmlCss.includes('960'), '复制代码未体现标题尺寸');
    const html = await exportedHtml(state);
    assert(html.includes('width:960px'), 'HTML 画板未使用标题尺寸');
  });
  await test('旧标题缩放折算到标题尺寸，会话切换后不突变', async () => {
    state.params.titleWidth = 800;
    state.params.overallScale = 50;
    await nextTick();
    state.activeEffectId = 'light-flare-base';
    await nextTick();
    state.activeEffectId = 'svg-flow-tool';
    await nextTick();
    assert(state.params.titleWidth === 400 && state.params.overallScale === 100, '旧缩放没有折算为标题宽度');
    assert(state.previewIntrinsicSize.width === 400, '折算后预览尺寸错误');
    assert(!document.querySelector('.decoration-params .motion-scale-control'), '折算后恢复了缩放控件');
  });
} finally {
  app.unmount();
  document.title = `${failures ? 'FAIL' : 'PASS'} ${total - failures}/${total}`;
}
