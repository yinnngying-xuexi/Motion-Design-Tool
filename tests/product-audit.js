
import { createPinia, setActivePinia } from 'pinia';
import { useMyMotionStore } from '/src/stores/myMotionStore.ts';
import { parseSafeSvg } from '/src/utils/svgSanitize.ts';
import { createMotionArtifact } from '/src/utils/motionArtifact.ts';
import { basicMotions, createBasicMotionConfig } from '/src/data/basicMotions.ts';
import { generateBasicMotionHtmlCss } from '/src/generators/basicMotionGenerator.ts';
const results=document.querySelector('#results');
let failures=0,total=0;
async function test(name,run){total++;const row=document.createElement('li');try{await run();row.textContent='PASS '+name;row.className='pass'}catch(e){failures++;row.textContent='FAIL '+name+': '+e.message;row.className='fail'}results.append(row)}
function assert(ok,msg='断言失败'){if(!ok)throw Error(msg)}
await test('所有基础动效交付代码不再包含旧版数据卡片文案',()=>{for(const t of basicMotions){const code=generateBasicMotionHtmlCss(t,createBasicMotionConfig(t));assert(!code.includes('87.62')&&!code.includes('数据态势'),t.name)}});
await test('基础淡入交付保留当前蓝色示例块尺寸',()=>{const t=basicMotions.find(x=>x.id==='fade-in');const code=generateBasicMotionHtmlCss(t,createBasicMotionConfig(t));assert(code.includes('width:176px')&&code.includes('height:110px')&&code.includes('#777772 14%'))});
const markup='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><style>.shape{fill:#00aa88;stroke:#ffaa00;stroke-width:4} #priority{fill:#4466ff}.shape{opacity:.7}</style><rect id="priority" class="shape" x="10" y="10" width="180" height="80"/></svg>';
await test('SVG class 样式保留，ID 选择器优先级正确',()=>{const svg=parseSafeSvg(markup);const r=svg.querySelector('rect');assert(r.style.fill==='rgb(68, 102, 255)',r.style.cssText);assert(r.style.stroke==='rgb(255, 170, 0)');assert(!svg.querySelector('style'));document.querySelector('#visuals').append(svg)});
await test('SVG 行内样式优先于普通 class',()=>{const svg=parseSafeSvg(markup.replace('class="shape"','class="shape" style="fill:#ff0000"'));assert(svg.querySelector('rect').style.fill==='rgb(255, 0, 0)')});
await test('带引号的内部渐变引用不会被误删',()=>{const svg=parseSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(\'\'#bad\'\')"/><rect fill="url(\'#paint\')"/></svg>');assert(svg.querySelector('rect').getAttribute('fill')==="url('#paint')")});
await test('导入脚本、事件与外链被清理',()=>{const svg=parseSafeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="bad()"><script>bad()</script><image href="https://example.com/a.png"/><rect fill="url(https://example.com/a)"/></svg>');assert(!svg.querySelector('script'));assert(!svg.hasAttribute('onload'));assert(!svg.querySelector('image').hasAttribute('href'));assert(!svg.querySelector('rect').hasAttribute('fill'))});
await test('错误 SVG 给出可读错误',()=>{let threw=false;try{parseSafeSvg('<svg><broken>')}catch{threw=true}assert(threw)});
setActivePinia(createPinia());const store=useMyMotionStore();
const originalStorage=Object.getOwnPropertyDescriptor(window,'localStorage');
let disk=null,deny=false;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(){if(deny)throw Error('blocked');return disk},setItem(k,v){if(deny)throw Error('quota');disk=v}}});
const artifact={html:'<!doctype html><p>sample</p>',previewImage:'data:image/png;base64,',htmlFileName:'test.html',imageFileName:'test.png',width:480,height:270};
try{
await test('保存后可重新加载',()=>{store.saveMotion(basicMotions[0],artifact);store.loadFromLocal();assert(store.savedMotions.length===1)});
await test('同 ID 更新而不是重复插入',()=>{store.saveMotion({...basicMotions[0],duration:4},artifact);assert(store.savedMotions.length===1&&store.savedMotions[0].duration===4)});
await test('存储满时不添加幽灵记录、不覆盖原记录',()=>{const before=JSON.stringify(store.savedMotions);deny=true;let failed=false;try{store.saveMotion(basicMotions[1],artifact)}catch(e){failed=e.message.includes('存储')}deny=false;assert(failed&&before===JSON.stringify(store.savedMotions))});
await test('删除写入失败时保留记录',()=>{deny=true;try{store.deleteMotion(basicMotions[0].id)}catch{}deny=false;assert(store.savedMotions.length===1)});
await test('存储不可用和损坏 JSON 不导致页面崩溃',()=>{deny=true;store.loadFromLocal();deny=false;disk='{bad';store.loadFromLocal();assert(store.savedMotions.length===0)});
await test('跳过无效历史条目，保留有效条目',()=>{disk=JSON.stringify([null,{}, {id:'valid',name:'有效'}]);store.loadFromLocal();assert(store.savedMotions.length===1)});
await test('流光保存配置为快照，不随后续编辑被篡改',()=>{const flow={effectId:'test-flow',name:'测试',source:{fileName:'test.svg'},config:{duration:3}};store.saveSvgFlow(flow,artifact);flow.config.duration=8;assert(store.savedMotions.find(x=>x.id==='decoration-test-flow').svgFlow.config.duration===3)});
}finally{Object.defineProperty(window,'localStorage',originalStorage)}
await test('代码视图无预览节点仍可生成等比缩略图',async()=>{const a=await createMotionArtifact({id:'wide',name:'宽幅测试',htmlCss:'<div class="wide" style="width:1920px;height:96px;background:linear-gradient(to right,#ff5500,#0088ff)"></div>'});assert(a.html.includes('width:1920px'));const im=new Image();im.src=a.previewImage;await im.decode();assert(im.width===480&&im.height===270);document.querySelector('#visuals').append(im);const c=document.createElement('canvas');c.width=480;c.height=270;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const center=ctx.getImageData(240,135,1,1).data;const top=ctx.getImageData(240,20,1,1).data;assert(center[0]+center[2]>20&&top[0]+top[1]+top[2]===0,'缩略图内容丢失/比例错误')});
await test('基础入场动画缩略图不是透明起始帧',async()=>{const t=basicMotions.find(x=>x.id==='fade-in');const a=await createMotionArtifact({id:t.id,name:t.name,htmlCss:generateBasicMotionHtmlCss(t,createBasicMotionConfig(t))});const im=new Image();im.src=a.previewImage;await im.decode();document.querySelector('#visuals').append(im);const c=document.createElement('canvas');c.width=480;c.height=270;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);assert([...ctx.getImageData(240,135,1,1).data].slice(0,3).some(x=>x>10))});
document.title=failures?'FAIL '+failures+'/'+total:'PASS '+total+'/'+total;const summary=document.createElement('h2');summary.textContent=document.title;document.body.append(summary);
