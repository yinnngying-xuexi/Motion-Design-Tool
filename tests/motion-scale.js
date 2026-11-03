import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import Basic from '/src/modules/motion-library/BasicMotionLibrary.vue';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';
import { basicMotions } from '/src/data/basicMotions.ts';
import { decorationEffects } from '/src/data/decorationEffects.ts';
import { createAnimatedMotionSvg } from '/src/utils/motionSvg.ts';
import { motionScaleFactor } from '/src/utils/motionScale.ts';
let failures=0,total=0,app,state;
const results=document.querySelector('#results');
function assert(ok,message='断言失败'){if(!ok)throw Error(message)}
function close(a,b){return Math.abs(a-b)<2}
async function test(name,run){total++;const row=document.createElement('li');try{await run();row.textContent='PASS '+name}catch(e){failures++;row.textContent='FAIL '+name+': '+e.message}results.append(row)}
async function mount(component,props={}){app?.unmount();app=createApp(component,props).use(createPinia()).use(ElementPlus);state=app.mount('#mount').$.setupState;await nextTick();await new Promise(r=>setTimeout(r,30))}
async function settle(){await nextTick();state.previewCapture.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=0});await nextTick()}
async function svgSize(code){const result=await createAnimatedMotionSvg(code,'缩放测试');const doc=new DOMParser().parseFromString(result,'image/svg+xml');assert(!doc.querySelector('parsererror'));return {width:Number(doc.documentElement.getAttribute('data-dm-content-width')),height:Number(doc.documentElement.getAttribute('data-dm-content-height'))}}
localStorage.clear();
try {
  await mount(Basic);
  for(const motion of basicMotions) await test('基础：'+motion.name+' 等比缩放/动态 SVG/重置',async()=>{
    state.selectedMotionId=motion.id;await nextTick();state.motionConfig.overallScale=100;await settle();
    const node=document.querySelector('.editor-motion-visual .preview-target');const original=node.getBoundingClientRect();
    const originalSvg=await svgSize(state.htmlCssCode);
    state.motionConfig.overallScale=200;await settle();const scaledNode=document.querySelector('.editor-motion-visual .preview-target');const scaled=scaledNode.getBoundingClientRect();
    assert(close(scaled.width,original.width*2)&&close(scaled.height,original.height*2),`预览比例错误 ${original.width}×${original.height} → ${scaled.width}×${scaled.height}，zoom=${getComputedStyle(scaledNode).zoom}`);
    assert(state.htmlCssCode.includes('data-dm-scale="200"'),'交付未带缩放');
    const scaledSvg=await svgSize(state.htmlCssCode);
    assert(close(scaledSvg.width,originalSvg.width*2)&&close(scaledSvg.height,originalSvg.height*2),`SVG 尺寸错误 ${JSON.stringify(originalSvg)} → ${JSON.stringify(scaledSvg)}`);
    document.querySelector('.motion-info .param-head button').click();await nextTick();assert(state.motionConfig.overallScale===100);
  });
  await test('基础：缩放独立会话记忆',async()=>{state.selectedMotionId='fade-in';await nextTick();state.motionConfig.overallScale=256;await nextTick();state.selectedMotionId='breath';await nextTick();state.resetConfig();await nextTick();state.selectedMotionId='fade-in';await nextTick();assert(state.motionConfig.overallScale===256)});
  await test('基础：导入 SVG 后预览与交付保持等比缩小',async()=>{state.svgAsset={fileName:'wide.svg',markup:'<svg viewBox="0 0 200 50"><rect width="200" height="50" fill="#0070f3"/></svg>',width:200,height:50,primaryColor:'#0070f3'};state.motionConfig.overallScale=100;await settle();const original=document.querySelector('.editor-motion-visual .preview-target').getBoundingClientRect();state.motionConfig.overallScale=50;await settle();const scaled=document.querySelector('.editor-motion-visual .preview-target').getBoundingClientRect();assert(close(scaled.width,original.width*.5)&&close(scaled.height,original.height*.5));const exported=await svgSize(state.htmlCssCode);assert(close(exported.width,100)&&close(exported.height,25))});
  await mount(Decoration,{initialEffectId:'subtitle-light-arc-01'});
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;canvas.getContext('2d').fillRect(0,0,1200,800);
  const background=await new Promise(r=>canvas.toBlob(r,'image/png'));state.backgroundBlob=background;state.setBackgroundObjectUrl(background);Object.assign(state.backgroundSettings,{naturalWidth:1200,naturalHeight:800,logicalWidth:1200,logicalHeight:800});
  for(const effect of decorationEffects) await test('背景上：'+effect.name+' 等比缩放/背景不变/导出一致',async()=>{
    state.activeEffectId=effect.id;await nextTick();state.params.overallScale=100;await settle();
    const node=document.querySelector('.logical-motion-layer .generated-preview');const bg=document.querySelector('.logical-canvas-background');
    const original=node.getBoundingClientRect();const bgBounds=bg.getBoundingClientRect();const originalSvg=state.svgUnsupportedReason?null:await svgSize(state.htmlCss);
    state.params.overallScale=200;await settle();const scaled=node.getBoundingClientRect();const newBg=bg.getBoundingClientRect();
    assert(close(scaled.width,original.width*2)&&close(scaled.height,original.height*2),`预览比例错误 ${original.width}×${original.height} → ${scaled.width}×${scaled.height}`);
    assert(close(newBg.width,bgBounds.width)&&close(newBg.height,bgBounds.height),'背景被缩放');
    if(originalSvg){const scaledSvg=await svgSize(state.htmlCss);assert(close(scaledSvg.width,originalSvg.width*2)&&close(scaledSvg.height,originalSvg.height*2),`SVG 尺寸错误 ${JSON.stringify(originalSvg)} → ${JSON.stringify(scaledSvg)}`)}else assert((state.htmlCss.includes('<dm-light-renderer')||state.htmlCss.includes('<dm-image-light>'))&&state.htmlCss.includes('<script>'),'光效缩放交付丢失');
    assert(state.htmlCss.includes('data-dm-scale="200"'));document.querySelector('.decoration-params .section-head button').click();await nextTick();assert(state.params.overallScale===(effect.defaultParams.overallScale??100));assert(state.backgroundBlob===background,'重置删除了背景');
  });
  await test('装饰：缩放独立会话记忆',async()=>{state.activeEffectId='subtitle-light-arc-01';await nextTick();state.params.overallScale=333;await nextTick();state.activeEffectId='loading-tech-ring';await nextTick();state.resetCurrentEffect();await nextTick();state.activeEffectId='subtitle-light-arc-01';await nextTick();assert(state.params.overallScale===333)});
  await test('装饰：HTML 导出尺寸与缩放后的标题一致',async()=>{state.params.overallScale=50;await nextTick();let blob;const originalURL=URL.createObjectURL;const originalClick=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=(value)=>{blob=value;return originalURL(value)};HTMLAnchorElement.prototype.click=function(){};state.downloadHtml();const html=await blob.text();assert(html.includes('width:221.5px;height:25px'),'导出画板尺寸未缩放');assert(html.includes('data-dm-scale="50"'),'导出动效未缩放');assert(!html.includes('logical-canvas-background'),'导出混入背景')}finally{URL.createObjectURL=originalURL;HTMLAnchorElement.prototype.click=originalClick}});
  await test('缩放范围和旧参数兼容',()=>{assert(motionScaleFactor(undefined)===1);assert(motionScaleFactor(NaN)===1);assert(motionScaleFactor(0)===.01);assert(motionScaleFactor(2000)===10);assert(motionScaleFactor(50)===.5)});
} catch(e){failures++;const row=document.createElement('li');row.textContent='FATAL '+e.stack;results.append(row)}
finally{app?.unmount();document.title=failures?'FAIL '+failures+'/'+total:'PASS '+total+'/'+total;const heading=document.createElement('h2');heading.textContent=document.title;document.body.prepend(heading)}
