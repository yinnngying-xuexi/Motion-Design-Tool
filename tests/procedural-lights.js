import 'element-plus/dist/index.css';import 'element-plus/theme-chalk/dark/css-vars.css';import '/src/styles/main.css';
import {createApp,nextTick} from 'vue';import {createPinia} from 'pinia';import ElementPlus from 'element-plus';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';
import Home from '/src/modules/motion-library/MotionHome.vue';
import {decorationEffects} from '/src/data/decorationEffects.ts';
import {referenceLoadingSpecs} from '/src/data/referenceLoadings.ts';
import {createProceduralLightShaders} from '/src/generators/proceduralLightShaders.ts';
import {generateDecorationHtmlCss} from '/src/generators/decorationGenerator.ts';
import {createStandaloneMotionHtml} from '/src/utils/motionArtifact.ts';
import {releaseLightDocument} from '/src/utils/lightWebgl.ts';
import JSZip from 'jszip';
import {useMyMotionStore} from '/src/stores/myMotionStore.ts';
let app,state,count=0,failed=0,copied='';const wait=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,message='断言失败')=>{if(!ok)throw Error(message)};
async function test(name,fn){count++;const row=document.createElement('li');try{await fn();row.textContent='PASS '+name}catch(e){failed++;row.textContent='FAIL '+name+': '+e.message}document.querySelector('#results').append(row)}
async function mount(id){app?.unmount();app=createApp(Decoration,{initialEffectId:id}).use(createPinia()).use(ElementPlus);state=app.mount('#mount').$.setupState;await nextTick();await wait(60)}
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async v=>{copied=v}}});
const renderer=()=>document.querySelector('.generated-preview dm-light-renderer');
function pixels(item,time=0){assert(item?.dataset.ready==='true',item?.dataset.error||'渲染器未就绪');item.setPlayback(false);item.seek(time);const gl=item.gl,data=new Uint8Array(item.canvas.width*item.canvas.height*4);gl.readPixels(0,0,item.canvas.width,item.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);return data}
function diff(a,b){assert(a.length===b.length);return a.reduce((sum,x,i)=>sum+Math.abs(x-b[i]),0)/a.length}
async function frame(html){const f=document.createElement('iframe');f.width=800;f.height=500;const loaded=new Promise(r=>f.onload=r);f.srcdoc=html;document.querySelector('#frames').append(f);await loaded;return f}
const ids=['loading-reference-dot-wave','loading-reference-wire-orb','loading-reference-particle-ring','loading-reference-flare-line','light-electric-beam','light-particle-band'];
const removedLoadings=[['loading-rotating-ring','旋转圆环'],['loading-sequence-dots','点序呼吸'],['loading-linear-flow','横向进度条'],['loading-irregular-ring','不规则旋转环']];
try{
localStorage.removeItem('visual-motion-my-motions');
for(const id of ids){const effect=decorationEffects.find(e=>e.id===id),spec=referenceLoadingSpecs[id];await mount(id);
await test(effect.name+'：四款 loading 使用单个 HTML 导出按钮，其他源码包入口不变',()=>{
 const actions=document.querySelector('.decoration-workspace-actions');
 const button=[...actions.querySelectorAll('button')].find(n=>n.textContent.trim()==='导出 HTML');
 assert(button,'缺少导出 HTML 按钮');
 assert(Boolean(button.closest('.el-dropdown'))===!Boolean(spec),'导出按钮不符合当前案例规则');
 assert(state.supportsSourcePackage===!Boolean(spec));
});
await test(effect.name+'：纯代码生成，主画布与目录真实渲染，无任何图片或外链',()=>{assert(renderer()?.dataset.ready==='true',renderer()?.dataset.error);assert(document.querySelector('.effect-card.active dm-light-renderer')?.dataset.ready==='true');assert(!document.querySelector('.generated-preview img,.generated-preview image'));assert(!/base64|\.webp|<img|<image|<script src=/.test(state.htmlCss));assert(state.htmlCss.length<40000,'交付包含大量无关代码');assert(state.params.overallScale===(effect.defaultParams.overallScale??100));assert(pixels(renderer(),.2).some(v=>v>180));assert(!state.htmlCss.includes('light-silk-wave')&&!state.htmlCss.includes('light-plasma-ring'),'打包了其他效果')});
await test(effect.name+'：透明边缘及连续柔光，多个时相变化，循环首尾一致',()=>{const item=renderer(),a=pixels(item,0),b=pixels(item,Number(effect.defaultParams.duration)*.33),loop=pixels(item,Number(effect.defaultParams.duration));assert(a[3]===0&&a[a.length-1]===0,'边角不透明');const levels=new Set();for(let i=3;i<b.length;i+=4)levels.add(b[i]);assert(levels.size>50,'柔光层次不足 '+levels.size);assert(diff(a,b)>.02,'动画未变化');assert(diff(a,loop)<.02,'循环不连续');if(id.endsWith('wire-orb')||id.endsWith('particle-ring')){const at=(Math.floor(item.canvas.height/2)*item.canvas.width+Math.floor(item.canvas.width/2))*4;assert(b[at+3]<15,'中心过亮')}});
if(id==='loading-reference-particle-ring')await test('粒子辉光环：外侧不再有放射线，保留绕行粒子和亮弧',()=>{
 const shader=createProceduralLightShaders('')[id];
 assert(!shader.includes('a*96.0+r*35.0')&&!shader.includes('r*150.0'),'旧放射线纹理仍存在');
 assert(shader.includes('distanceToPoint')&&shader.includes('particleLight')&&shader.includes('head'),'绕行粒子或错峰亮弧丢失');
});
if(id==='loading-reference-dot-wave')await test('粒子摆动：参考关键帧弧形/交叉双叶轨迹、前后层次与双轮节奏',()=>{
 const item=renderer().cloneNode(false);item.style.cssText='display:block;position:fixed;left:0;top:0;width:672px;height:304px;visibility:hidden';document.body.append(item);
 try{
  const sample=(data,sx,sy,radius=3)=>{const w=item.canvas.width,h=item.canvas.height,cx=(sx-236)/168*w,cy=(348-sy)/76*h,r=Math.ceil(radius*w/168);let value=0;for(let x=Math.round(cx)-r;x<=Math.round(cx)+r;x++)for(let y=Math.round(cy)-r;y<=Math.round(cy)+r;y++)if(x>=0&&x<w&&y>=0&&y<h)value=Math.max(value,data[(y*w+x)*4+3]);return value};
  // Independent observed centers from the supplied GIF, in its original pixel coordinates.
  const keyframes=[
   [0,[[270.1,316.5],[292.7,325.9],[311.1,328.8],[329.9,327.8],[355,320.5]]],
   [5,[[274.2,297.8],[296.5,304.3],[313.6,310.9],[339.8,320.9],[363.1,326.4]]],
   [9,[[277.3,300.8],[303,297.6],[321.8,299],[348.3,305.6],[369.7,314.6]]],
   [14,[[268.5,326.5],[291.9,321.1],[318.2,311.3],[343.1,301.9],[363.9,297.4]]],
   [18,[[276.2,323.8],[301.7,328.7],[320.5,327.4],[346.6,319.6],[366,308.3]]]
  ];
  for(const [frame,points] of keyframes){const data=pixels(item,frame*.04);for(const [x,y] of points)assert(sample(data,x,y)>150,`参考第 ${frame} 帧粒子轨迹偏离 (${x},${y})`)}
  const bowl=pixels(item,0),cap=pixels(item,.36),repeat=pixels(item,.74);
  assert(sample(bowl,316,298,2)<10&&sample(cap,316,329,2)<10,'仍是上下两个独立椭圆');
  assert(sample(bowl,311,329,1)>sample(bowl,309,316,1)+70,'前后粒子大小与亮度没有拉开');
  assert(diff(bowl,repeat)<.02,'1.48秒内没有两轮完整扭转');
 }finally{item.remove()}
});
if(id==='loading-reference-wire-orb')await test('流体线框环：保持连续宽网带，带内材质持续流动且六秒无缝循环',()=>{
 const item=renderer().cloneNode(false);item.style.cssText='display:block;position:fixed;left:0;top:0;width:344px;height:344px;visibility:hidden';document.body.append(item);
 try{
  const first=pixels(item,0),middle=pixels(item,3),outbound=pixels(item,1.2),returning=pixels(item,4.8),w=item.canvas.width,h=item.canvas.height;
  // These times have the same cosine-driven width/pose, but the advected material must differ.
  assert(diff(outbound,returning)>.05,'相同宽度姿态下材质没有持续流动，仍只是往复起伏');assert(diff(first,middle)>.05,'前后姿态没有变化');
  const early=pixels(item,.06),before=pixels(item,5.94);
  assert(diff(first,early)>.03,'宽带转向停顿时细线也停住了');
  assert(diff(first,before)<diff(early,before)*1.2,'循环交界出现明显跳动');
  let interior=0,bright=0;const sectors=new Set();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const px=(x/w-.5)*2,py=(y/h-.5)*2,r=Math.hypot(px,py),alpha=first[(y*w+x)*4+3];
   if(r>.2&&r<.6&&alpha>2&&alpha<70)interior++;
   if(r>.62&&r<.78&&alpha>140){bright++;sectors.add(Math.floor((Math.atan2(py,px)+Math.PI)/(Math.PI/2))%4)}
  }
  assert(interior>200,'内部细纹缺失或变成高亮实面');assert(bright>20&&sectors.size>=3,'缺少局部折叠高亮弧');
  for(const time of [0,1.08,2.16,3.24]){
   const data=pixels(item,time);
   for(const side of [0,180]){
    let wide=0;
    for(const offset of [-45,-20,0,20,45]){
     const angle=(side+offset)*Math.PI/180,occupied=[];
     for(let radius=85;radius<=137;radius+=.5){
      const x=Math.round(w/2+Math.cos(angle)*radius*w/344),y=Math.round(h/2+Math.sin(angle)*radius*h/344);
      let alpha=0;
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)alpha=Math.max(alpha,data[((y+dy)*w+x+dx)*4+3]);
      if(alpha>45)occupied.push(radius);
     }
     if(occupied.length&&occupied.at(-1)-occupied[0]>9)wide++;
    }
    assert(wide>=4,`${time}s ${side===0?'右':'左'}侧网带断开或过窄，只有 ${wide} 处宽带`);
   }
  }
  const center=(Math.floor(h/2)*w+Math.floor(w/2))*4;assert(first[center+3]<15,'中央文字区域过亮');
 }finally{item.remove()}
});
if(id==='loading-reference-flare-line')await test('星芒光点：三颗亮点共用横向推进/下弧回流路径，与参考关键帧位置对应',()=>{
 const item=renderer();
 const sample=(data,sx,sy,hot=true)=>{const x=(sx-395)*.72,y=-sy*.72,w=item.canvas.width,h=item.canvas.height,cx=Math.round((.5+x/736)*w),cy=Math.round((.5+y/145)*h);let value=0;for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){const px=Math.min(w-1,Math.max(0,cx+dx)),py=Math.min(h-1,Math.max(0,cy+dy)),at=(py*w+px)*4;value=Math.max(value,hot?Math.min(data[at],data[at+1],data[at+2])*data[at+3]/255:data[at+3])}return value};
 const observed=[[0,[[343,0],[394,0],[446,0]]],[6,[[353,0],[404,0],[456,0]]],[12,[[364,0],[413,0],[439,36.3]]],[14,[[374.2,61.6]]],[15,[[346,46.8]]],[18,[[332,11.2]]],[24,[[333,0],[384,0],[434,0]]]];
 // Sample above the one-pixel beam for on-line stars; the beam itself is also white.
 for(const [frame,heads] of observed){const data=pixels(item,frame*.03);for(const [x,y] of heads){const atY=y===0?-7:y;assert(sample(data,x,atY)>210,`参考第 ${frame} 帧亮芯轨迹不符 (${x},${y}): ${sample(data,x,atY)}`)}}
 const initial=pixels(item,0),advanced=pixels(item,.36),returning=pixels(item,.42);
 assert(sample(initial,343,-7)>sample(advanced,343,-7)+15,'左侧亮点仍被固定在原地');
 assert(sample(returning,395,-61.6,false)<150,'仍保留了参考中没有的上半圆绕行');
 assert(sample(returning,414,56.2,false)>40,'快速回流没有留下过去路径的弧形拖尾');
 const label=document.querySelector('.generated-preview [class$="__text"]').getBoundingClientRect(),canvas=item.canvas.getBoundingClientRect();
 assert(label.top>canvas.top+canvas.height*(.5+50/145),'文字与回流轨迹重叠');
});
if(id==='loading-reference-flare-line')await test('星芒光点：扩散光芒 0–200% 连续调节，保留亮芯与运动，交付同步且重置恢复',async()=>{
 assert(state.params.glowSpread===100);
 assert([...document.querySelectorAll('.param-control label')].some(n=>n.textContent.includes('扩散光芒')));
 const samples=[];
 for(const value of [0,100,200]){
  state.params.glowSpread=value;await nextTick();const item=renderer(),data=pixels(item,0),w=item.canvas.width,h=item.canvas.height;
  assert(item.dataset.glowSpread===String(value/100));assert(item.gl.getUniform(item.program,item.uniforms.u_glowSpread)===value/100);
  let glow=0,core=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const at=(y*w+x)*4,px=(x/w-.5)*736,py=(y/h-.5)*145;
   if(Math.abs(py)>15&&Math.abs(px)<110)glow+=data[at+3];
   if(Math.abs(py)<5&&Math.abs(px)<45)core=Math.max(core,Math.min(data[at],data[at+1],data[at+2])*data[at+3]/255);
  }
  assert(core>225,'关闭扩散不应隐藏亮芯');assert(data[3]===0&&data[data.length-1]===0,'扩散导致边角不透明');
  samples.push(glow);assert(diff(data,pixels(item,.42))>.02,'扩散参数影响了运动');
 }
 assert(samples[0]<samples[1]&&samples[1]<samples[2],'扩散范围未随参数增大');
 state.params.glowSpread=180;await nextTick();await state.copyCode();assert(copied===state.htmlCss&&copied.includes('data-glow-spread="1.8"'));
 const f=await frame(createStandaloneMotionHtml(effect.name,state.htmlCss));try{const item=f.contentDocument.querySelector('dm-light-renderer');pixels(item,0);assert(item.gl.getUniform(item.program,item.uniforms.u_glowSpread)>1.79)}finally{releaseLightDocument(f.contentDocument);f.remove()}
 state.resetCurrentEffect();await nextTick();assert(state.params.glowSpread===100&&renderer().dataset.glowSpread==='1');
});
await test(effect.name+'：修改颜色影响真实光效像素，不只是文字',async()=>{state.params.color='#FF5500';await nextTick();const item=renderer(),data=pixels(item,.3);let red=0,blue=0;for(let i=0;i<data.length;i+=4){red+=data[i]*data[i+3];blue+=data[i+2]*data[i+3]}assert(red>blue*1.6,'颜色未作用到光效');assert(item.dataset.color==='#FF5500');await state.copyCode();assert(copied===state.htmlCss&&copied.includes('data-color="#FF5500"'));state.toggleSection(effect.section);await nextTick();assert(renderer()===item,'收起目录重建当前光效');assert(diff(data,pixels(item,.3))<.001);state.toggleSection(effect.section);state.resetCurrentEffect();await nextTick()});
if(spec)await test(effect.name+'：文字放大，显隐开关影响预览、复制和下载',async()=>{const label=()=>document.querySelector('.generated-preview [class$="__text"]');assert(label()?.textContent==='loading');assert(getComputedStyle(label()).fontSize===spec.fontSize+'px');document.querySelector('[role="switch"][aria-label="显示文字"]').click();await nextTick();assert(!label());await state.copyCode();assert(!/<span class="[^"]+__text">/.test(copied));state.params.centerText='loading <safe>';await nextTick();state.params.showText='on';await nextTick();assert(label().textContent==='loading <safe>'&&state.htmlCss.includes('loading &lt;safe&gt;'));state.params.showText='off';await nextTick()});
await test(effect.name+'：独立 HTML 无编辑器也能编译与播放，多实例颜色互不影响',async()=>{const f=await frame(createStandaloneMotionHtml(effect.name,state.htmlCss+generateDecorationHtmlCss(effect,{...effect.defaultParams,color:'#FF5500'})));try{const items=[...f.contentDocument.querySelectorAll('dm-light-renderer')];assert(items.length===2);assert(items.every(n=>n.dataset.ready==='true'),items.map(n=>n.dataset.error).join(','));assert(pixels(items[0],.3).some(v=>v>180));assert(diff(pixels(items[1],.1),pixels(items[1],.5))>.01);assert(items[0].dataset.color!==items[1].dataset.color)}finally{releaseLightDocument(f.contentDocument);f.remove()}});
await test(effect.name+'：下载保留当前尺寸、文字隐藏和最小运行器',async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=b=>{if(b.type.startsWith('text/html'))blob=b;return original(b)};HTMLAnchorElement.prototype.click=function(){};await state.downloadHtml()}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}const html=await blob.text();assert(!/base64|\.webp|<img|dm-motion-canvas/.test(html));assert(html.includes('<script>')&&html.length<42000);const f=await frame(html);try{assert(f.contentDocument.querySelector('dm-light-renderer')?.dataset.ready==='true');if(spec){assert(!f.contentDocument.querySelector('[class$="__text"]'));const root=f.contentDocument.querySelector('.dm-reference-loading').getBoundingClientRect();assert(Math.abs(root.width-spec.width*spec.scale/100)<.1)}}finally{releaseLightDocument(f.contentDocument);f.remove()}state.resetCurrentEffect();await nextTick();if(spec)assert(state.params.showText==='on');const button=[...document.querySelectorAll('.decoration-workspace-actions button')].find(n=>n.textContent.includes('复制 SVG'));assert(button.disabled)});
await test(effect.name+'：重播释放旧资源、静态/零强度停止运行',async()=>{const old=renderer();await state.replayPreview();await nextTick();assert(old!==renderer()&&old.dataset.disposed==='true'&&old.gl===null);assert(renderer().dataset.ready==='true');if(id==='light-particle-band'){state.params.motionEnabled='off';await nextTick();assert(!renderer().shouldAnimate());assert(pixels(renderer(),0).some(v=>v>100));state.params.motionEnabled='on';state.params.lightIntensity=0;await nextTick();assert(!renderer().shouldAnimate());assert(getComputedStyle(renderer().parentElement).opacity==='0');state.resetCurrentEffect();await nextTick()}});
if(!spec)await test(effect.name+'：源码 ZIP 分离 HTML/CSS/JS，解压后无需编辑器也能运行',async()=>{
 let blob,filename;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;
 try{URL.createObjectURL=b=>{blob=b;return original(b)};HTMLAnchorElement.prototype.click=function(){filename=this.download};await state.downloadSourceZip()}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}
 assert(filename===effect.name+'-前端源码.zip');const zip=await JSZip.loadAsync(blob);assert(Object.keys(zip.files).sort().join(',')==='README.md,effect.css,effect.js,index.html');
 const html=await zip.file('index.html').async('string'),css=await zip.file('effect.css').async('string'),js=await zip.file('effect.js').async('string');
 assert(html.includes('./effect.css')&&html.includes('./effect.js'));assert(!/base64|\.webp|<img|<image/.test(html+css+js));assert(!css.includes('body{'),'组件样式污染宿主');assert(js.includes(id));
 const cssUrl=URL.createObjectURL(new Blob([css],{type:'text/css'})),jsUrl=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));let f;
 try{f=await frame(html.replace('./effect.css',cssUrl).replace('./effect.js',jsUrl));const item=f.contentDocument.querySelector('dm-light-renderer');assert(item?.dataset.ready==='true',item?.dataset.error);assert(pixels(item,.2).some(v=>v>180))}finally{if(f){releaseLightDocument(f.contentDocument);f.remove()}URL.revokeObjectURL(cssUrl);URL.revokeObjectURL(jsUrl)}
});
await test(effect.name+'：保存为小型离线 HTML，预览 PNG 有真实光效',async()=>{await state.saveFromToolbar();const saved=JSON.parse(localStorage.getItem('visual-motion-my-motions')).find(n=>n.id==='decoration-'+id);assert(saved?.artifact?.html.includes('<dm-light-renderer'));assert(!saved.artifact.html.includes('base64,'),'HTML 不应有位图');const img=new Image();img.src=saved.artifact.previewImage;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let light=0;for(let i=0;i<data.length;i+=4)if(data[i+2]>data[i]+15&&data[i+2]>30)light++;assert(light>25,'保存预览空白')});
}
await test('移除四款 loading：目录与搜索不再显示，数量为五款，历史成果保留',async()=>{
 assert(removedLoadings.every(([id])=>!decorationEffects.some(e=>e.id===id)));
 const loading=decorationEffects.filter(e=>e.section==='loading');assert(loading.length===5&&loading.some(e=>e.id==='loading-tech-ring'));
 await mount('loading-reference-wire-orb');const selected=state.currentEffect.id,node=renderer();
 const heading=[...document.querySelectorAll('.directory-heading')].find(n=>n.querySelector('span').textContent==='loading');assert(heading.querySelector('small').textContent==='5');
 for(const [,name] of removedLoadings){state.keyword=name;await nextTick();assert(!document.querySelector('.effect-card'),'已移除案例仍在目录搜索中');assert(state.currentEffect.id===selected&&renderer()===node,'搜索隐藏改变了当前案例')}
 state.keyword='';await nextTick();
 const previous=localStorage.getItem('visual-motion-my-motions'),historical=removedLoadings.map(([id,name])=>({id:'decoration-'+id,effectId:id,name,kind:'decoration',artifact:{html:'<!doctype html><p>'+name+'</p>'}}));
 try{localStorage.setItem('visual-motion-my-motions',JSON.stringify(historical));const store=useMyMotionStore();store.loadFromLocal();assert(store.savedMotions.length===4&&store.savedMotions.every((item,i)=>item.artifact.html===historical[i].artifact.html),'误删或改写了历史保存成果')}finally{if(previous===null)localStorage.removeItem('visual-motion-my-motions');else localStorage.setItem('visual-motion-my-motions',previous)}
});
await test('保留的 loading：文字隐藏时输入框及关闭开关均为暗色，开启仍为品牌蓝',async()=>{
 for(const effect of decorationEffects.filter(e=>e.editableParams.some(p=>p.key==='showText'))){
  await mount(effect.id);
  const toggle=document.querySelector('.loading-text-toggle'),input=document.querySelector('.loading-text-control input');
  // Check final theme states, not a timing-dependent intermediate CSS transition.
  toggle.querySelector('.el-switch__core').style.transition='none';
  state.params.showText='off';await nextTick();
  assert(input.disabled,effect.name+' 输入框没有禁用');
  const channels=node=>getComputedStyle(node).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);
  assert(channels(input.closest('.el-input__wrapper')).every(v=>v<65),effect.name+' 禁用输入框仍为浅色');
  assert(channels(toggle.querySelector('.el-switch__core')).every(v=>v<65),effect.name+' 关闭开关仍为浅色');
  toggle.click();await nextTick();assert(!input.disabled&&state.params.showText==='on');
  const color=channels(toggle.querySelector('.el-switch__core'));assert(color[2]>150&&color[0]<80,'开启不再使用蓝色');
 }
});
await test('首页搜索六款仍可单击进入，已删除四款不再返回',async()=>{app.unmount();let selected;app=createApp(Home,{onOpenDecoration:v=>selected=v}).use(createPinia()).use(ElementPlus);state=app.mount('#mount').$.setupState;for(const id of ids){const effect=decorationEffects.find(e=>e.id===id);state.keyword=effect.name;await nextTick();const card=document.querySelector('.home-motion-card');assert(card.querySelector('dm-light-renderer')?.dataset.ready==='true');card.click();assert(selected===id)}for(const [,name] of removedLoadings){state.keyword=name;await nextTick();assert(!document.querySelector('.home-motion-card'),'首页仍然显示已删除案例 '+name)}});
}catch(e){failed++;const row=document.createElement('li');row.textContent='FATAL '+e.stack;document.querySelector('#results').append(row)}finally{app?.unmount();document.title=failed?'FAIL '+failed+'/'+count:'PASS '+count+'/'+count}
