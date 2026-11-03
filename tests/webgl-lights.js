import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import {createApp,nextTick} from 'vue';
import {createPinia} from 'pinia';
import ElementPlus from 'element-plus';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';
import Home from '/src/modules/motion-library/MotionHome.vue';
import MyMotions from '/src/modules/motion-library/MyMotionLibrary.vue';
import {useMyMotionStore} from '/src/stores/myMotionStore.ts';
import {lightDecorations} from '/src/data/lightDecorations.ts';
import {generateDecorationHtmlCss,generateDecorationMarkup} from '/src/generators/decorationGenerator.ts';
import {createStandaloneMotionHtml,createMotionArtifact} from '/src/utils/motionArtifact.ts';
import {createAnimatedMotionSvg} from '/src/utils/motionSvg.ts';
import {releaseLightDocument} from '/src/utils/lightWebgl.ts';
let total=0,failures=0,app,state,pinia,copied='';const results=document.querySelector('#results');
const wait=(ms=60)=>new Promise(r=>setTimeout(r,ms));
function assert(value,message='断言失败'){if(!value)throw Error(message)}
async function test(name,run){total++;const row=document.createElement('li');try{await run();row.textContent='PASS '+name}catch(e){failures++;row.textContent='FAIL '+name+': '+e.message}results.append(row)}
async function mount(component,props={}){app?.unmount();pinia=createPinia();app=createApp(component,props).use(pinia).use(ElementPlus);state=app.mount('#mount').$.setupState;await nextTick();await wait()}
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{async writeText(value){copied=value}}});
function renderer(){return document.querySelector('.generated-preview dm-light-renderer')}
function pixels(item,time=0){item.setPlayback(false);item.seek(time);const gl=item.canvas.getContext('webgl');const data=new Uint8Array(item.canvas.width*item.canvas.height*4);gl.readPixels(0,0,item.canvas.width,item.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);return data}
function difference(a,b){assert(a.length===b.length,'尺寸变化');return a.reduce((sum,value,i)=>sum+Math.abs(value-b[i]),0)/a.length}
function assertPremultiplied(item,data){
  assert(item.gl.getContextAttributes()?.premultipliedAlpha===true,'WebGL 画布未开启预乘透明度');
  let faint=0;
  for(let i=0;i<data.length;i+=4){const alpha=data[i+3];if(alpha<3||alpha>80)continue;faint++;assert(Math.max(data[i],data[i+1],data[i+2])<=alpha+2,'低透明光晕含高亮 RGB，可能在其他浏览器显示成实心色块')}
  assert(faint>20,'缺少可检查的半透明光效像素');
}
function bendSpan(item,time){const data=pixels(item,time),w=item.canvas.width,h=item.canvas.height;const centers=[.2,.4,.6,.8].map(f=>{const x=Math.floor(w*f);let sum=0,weight=0;for(let y=0;y<h;y++){const a=data[(y*w+x)*4+3]**2;sum+=y*a;weight+=a}return sum/Math.max(1,weight)});return Math.max(...centers)-Math.min(...centers)}
function columnCenter(item,data,fraction){const w=item.canvas.width,h=item.canvas.height,x=Math.floor(w*fraction);let sum=0,weight=0;for(let y=0;y<h;y++){const a=data[(y*w+x)*4+3]**2;sum+=y*a;weight+=a}assert(weight>10,'波带未覆盖目标横向位置');return sum/weight}
async function frame(html,sandbox='allow-scripts allow-same-origin'){const item=document.createElement('iframe');item.setAttribute('sandbox',sandbox);const loaded=new Promise(resolve=>item.onload=resolve);item.srcdoc=html;document.querySelector('#frames').append(item);await loaded;const remove=item.remove.bind(item);item.remove=()=>{releaseLightDocument(item.contentDocument);remove()};return item}
localStorage.clear();
try{
  for(const id of ['light-plasma-ring','light-silk-wave']){
    const effect=lightDecorations.find(e=>e.id===id);
    await mount(Decoration,{initialEffectId:id});
    await test(effect.name+'：主画布与真实缩略图实际编译并渲染',()=>{const item=renderer();assert(item?.dataset.ready==='true',item?.dataset.error);assert(item.querySelectorAll('canvas').length===1);const thumb=document.querySelector('.effect-card.active dm-light-renderer');assert(thumb?.dataset.ready==='true',thumb?.dataset.error);assert(pixels(item).some(v=>v>150),'画面为空');assert(!document.querySelector('.generated-preview svg'),'旧路径版本未移除')});
    await test(effect.name+'：主画布与独立 HTML 的半透明光晕均使用预乘颜色',async()=>{
      const item=renderer();assertPremultiplied(item,pixels(item,.2));
      const exported=await frame(createStandaloneMotionHtml(effect.name,generateDecorationHtmlCss(effect,effect.defaultParams)));
      try{const standalone=exported.contentDocument.querySelector('dm-light-renderer');assert(standalone?.dataset.ready==='true',standalone?.dataset.error);assertPremultiplied(standalone,pixels(standalone,.2))}finally{exported.remove()}
    });
    await test(effect.name+'：透明背景、柔和半透明层次、无黑底贴图',()=>{const item=renderer(),data=pixels(item,.3);assert(data[3]===0,'画布左下角不透明');const alphas=new Set();for(let i=3;i<data.length;i+=4)alphas.add(data[i]);assert(alphas.size>80,'光晕没有连续透明层次');assert(!state.htmlCss.includes('<img')&&!state.htmlCss.includes('ESENSOFT'));if(id==='light-plasma-ring'){const at=(Math.floor(item.canvas.height/2)*item.canvas.width+Math.floor(item.canvas.width/2))*4;assert(data[at+3]<3,'中心没有留空')}});
    await test(effect.name+'：实际纹理变化且首尾无跳变',()=>{const item=renderer();const first=pixels(item,0),later=pixels(item,Number(effect.defaultParams.duration)*.25),loop=pixels(item,Number(effect.defaultParams.duration));assert(difference(first,later)>.3,'光效未运动');assert(difference(first,loop)<.05,'循环接缝不连续')});
    if(id==='light-silk-wave'){
      await test('柔光波带：预览容器不被 canvas 默认最小高度撑开，缩放后仍居中',async()=>{
        const check=()=>{const stage=document.querySelector('.preview-stage').getBoundingClientRect();const preview=document.querySelector('.generated-preview').getBoundingClientRect();const canvas=renderer().canvas.getBoundingClientRect();assert(Math.abs(canvas.y+canvas.height/2-stage.y-stage.height/2)<2,'波带偏离画布中心');assert(Math.abs(canvas.height-preview.height)<2,'canvas 撑高了容器');assert(Math.abs(canvas.x+canvas.width/2-stage.x-stage.width/2)<2,'水平未居中')};
        check();state.params.overallScale=150;await nextTick();check();state.resetCurrentEffect();await nextTick();check();
      });
      await test('多组弧度：起伏数量实际改变纹理结构，并随代码与 HTML 交付',async()=>{
        assert(state.params.waveCount===2&&document.querySelector('.decoration-params').textContent.includes('起伏数量'));
        state.params.waveCount=1;await nextTick();const first=pixels(renderer(),.8);state.params.waveCount=4;await nextTick();const last=pixels(renderer(),.8);assert(difference(first,last)>.5,'起伏数量未改变形态');assert(renderer().dataset.waveCount==='4'&&state.htmlCss.includes('data-wave-count="4"'));
        const f=await frame(createStandaloneMotionHtml('多组弧度',state.htmlCss));try{const item=f.contentDocument.querySelector('dm-light-renderer');assert(item.dataset.ready==='true'&&item.dataset.waveCount==='4');assert(pixels(item,.8).some(v=>v>100))}finally{f.remove()}
        state.resetCurrentEffect();await nextTick();assert(state.params.waveCount===2&&renderer().dataset.waveCount==='2');
      });
      await test('多组弧度：多个时相覆盖完整横向跨度，波峰持续变化',()=>{
        const item=renderer();let previous;for(const ratio of [0,.3,.6]){const data=pixels(item,Number(effect.defaultParams.duration)*ratio);for(const x of [.09,.25,.5,.75,.91])columnCenter(item,data,x);if(previous)assert(difference(previous,data)>.3,'曲线没有流动');previous=data}
      });
      await test('波带弧度：右侧控件、默认更平直、0% 与 100% 实际形态不同',async()=>{
        assert(state.params.curvature===22&&state.params.lightIntensity===77,'截图默认参数错误');assert(document.querySelector('.decoration-params').textContent.includes('波带弧度'),'缺少控件');
        const thumb=document.querySelector('.effect-card.active dm-light-renderer');assert(thumb.dataset.curvature==='0.22'&&thumb.dataset.intensity==='0.77','缩略图默认参数不同步');
        const def=bendSpan(renderer(),1.1);state.params.curvature=100;await nextTick();const curved=bendSpan(renderer(),1.1);state.params.curvature=0;await nextTick();const flat=bendSpan(renderer(),1.1);
        assert(flat<curved*.25,`0% 未平直 ${flat}/${curved}`);assert(def<curved*.7,`默认未减小起伏 ${def}/${curved}`);
        assert(renderer().dataset.curvature==='0'&&state.htmlCss.includes('data-curvature="0"'),'零值被默认值覆盖');
        state.params.curvature=62;await nextTick();assert(renderer().dataset.curvature==='0.62'&&state.htmlCss.includes('data-curvature="0.62"'),'复制/导出弧度不同步');
        const f=await frame(createStandaloneMotionHtml('弧度测试',state.htmlCss));try{const item=f.contentDocument.querySelector('dm-light-renderer');assert(item.dataset.ready==='true'&&item.dataset.curvature==='0.62');assert(bendSpan(item,1.1)>flat)}finally{f.remove()}
        state.resetCurrentEffect();await nextTick();const expected={color:'#35C9DB',lightIntensity:77,curvature:22,waveCount:2,duration:5.05,motionEnabled:'on'};for(const [key,value] of Object.entries(expected))assert(state.params[key]===value,'重置未恢复 '+key);assert(renderer().dataset.curvature==='0.22'&&renderer().dataset.intensity==='0.77','重置后的实际渲染参数不同步');
      });
      await test('波带弧度：切换案例独立记忆，其他光效不显示此参数',async()=>{state.params.curvature=17;state.params.waveCount=3;state.activeEffectId='light-plasma-ring';await nextTick();assert(!document.querySelector('.decoration-params').textContent.includes('波带弧度')&&!document.querySelector('.decoration-params').textContent.includes('起伏数量'));state.activeEffectId=id;await nextTick();assert(state.params.curvature===17&&state.params.waveCount===3);state.resetCurrentEffect();await nextTick()});
    }
    await test(effect.name+'：颜色、周期、强度和缩放均应用于交付参数',async()=>{state.params.color='#FF5500';state.params.duration=4;state.params.lightIntensity=0;state.params.overallScale=150;await nextTick();let item=renderer();assert(item.dataset.color==='#FF5500'&&item.dataset.duration==='4');assert(!item.shouldAnimate(),'强度零仍占用帧循环');assert(getComputedStyle(item.parentElement).opacity==='0');assert(state.htmlCss.includes('data-dm-scale="150"'));assert(state.htmlCss.includes('data-color="#FF5500"'));state.params.lightIntensity=80;await nextTick();const data=pixels(renderer(),.2);let red=0,blue=0;for(let i=0;i<data.length;i+=4){red+=data[i]*data[i+3];blue+=data[i+2]*data[i+3]}assert(red>blue*1.3,'颜色未传给着色器')});
    await test(effect.name+'：静态模式保留光效并停止运行',async()=>{state.params.motionEnabled='off';await nextTick();const item=renderer();assert(item.dataset.motion==='off'&&!item.shouldAnimate());const initial=item.dataset.time;await wait(120);assert(item.dataset.time===initial);assert(pixels(item).some(v=>v>100))});
    await test(effect.name+'：复制代码含最小脚本，SVG 明确禁用',async()=>{await state.copyCode();assert(copied===state.htmlCss);assert(copied.includes('<script>')&&copied.includes('<dm-light-renderer'));assert(!copied.includes('http://127.0.0.1')&&!copied.includes('<script src='));const button=[...document.querySelectorAll('.decoration-workspace-actions button')].find(n=>n.textContent.includes('复制 SVG'));assert(button.disabled);let rejected=false;try{await createAnimatedMotionSvg(copied,effect.name)}catch(e){rejected=e.message.includes('WebGL')}assert(rejected,'SVG 接口未拦截不支持的光效')});
    await test(effect.name+'：独立 HTML 从脚本实际启动，不依赖编辑器注册',async()=>{const html=generateDecorationHtmlCss(effect,effect.defaultParams);const f=await frame(createStandaloneMotionHtml(effect.name,html));try{const item=f.contentDocument.querySelector('dm-light-renderer');assert(item?.dataset.ready==='true',item?.dataset.error);assert(item.canvas.width>0);assert(pixels(item,.4).some(v=>v>150))}finally{f.remove()}});
    await test(effect.name+'：导出 HTML 保留当前缩放和完整运行脚本',async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};state.downloadHtml();const html=await blob.text();assert(html.includes('data-dm-scale="150"')&&html.includes('<script>'));assert(!html.includes('dm-motion-canvas'));const f=await frame(html);try{assert(f.contentDocument.querySelector('dm-light-renderer').dataset.ready==='true')}finally{f.remove()}}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}});
    await test(effect.name+'：重置只恢复当前案例，重播从起点开始',async()=>{state.resetCurrentEffect();await nextTick();assert(state.params.color===effect.defaultParams.color&&state.params.duration===effect.defaultParams.duration&&state.params.overallScale===100);assert(renderer().dataset.motion==='on');const item=renderer();item.seek(3);await state.replayPreview();assert(renderer()!==item&&Number(renderer().dataset.time)<.2);assert(item.gl===null,'旧实例未释放 GPU 资源')});
    await test(effect.name+'：保存预览 PNG 不是空画面',async()=>{const artifact=await createMotionArtifact({id,name:effect.name,htmlCss:state.htmlCss});assert(artifact.html.includes('<script>'));const img=new Image();img.src=artifact.previewImage;await img.decode();const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,480,270).data;let bright=0;for(let i=0;i<data.length;i+=4)if(Math.max(data[i],data[i+1],data[i+2])>30)bright++;assert(bright>150,'保存预览图为空');state.__artifact=artifact});
  }
  await test('两份不同类型独立代码同时粘贴，不产生渲染器注册冲突',async()=>{const html=lightDecorations.filter(e=>['light-plasma-ring','light-silk-wave'].includes(e.id)).map(e=>generateDecorationHtmlCss(e,e.defaultParams)).join('');const f=await frame(createStandaloneMotionHtml('多实例',html));try{const items=[...f.contentDocument.querySelectorAll('dm-light-renderer')];assert(items.length===2&&items.every(n=>n.dataset.ready==='true'),items.map(n=>n.dataset.error).join(';'));assert(items.every(n=>pixels(n,.2).some(v=>v>100)))}finally{f.remove()}});
  await test('实例移动到其他容器后重新启动并释放旧上下文',()=>{const e=lightDecorations.find(e=>e.id==='light-plasma-ring'),host=document.createElement('div');host.innerHTML=generateDecorationHtmlCss(e,e.defaultParams);document.body.append(host);const item=host.querySelector('dm-light-renderer'),old=item.canvas;document.body.append(item);assert(item.canvas!==old&&item.dataset.ready==='true',item.dataset.error);item.remove();assert(item.gl===null&&item.program===null&&item.buffer===null);host.remove()});
  await test('WebGL 不可用时明确提示，不冒充 SVG 成品',()=>{const original=HTMLCanvasElement.prototype.getContext;const host=document.createElement('div');try{HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args)};const e=lightDecorations.find(e=>e.id==='light-silk-wave');host.innerHTML=generateDecorationHtmlCss(e,e.defaultParams);document.body.append(host);const item=host.querySelector('dm-light-renderer');assert(item.dataset.ready==='false'&&item.dataset.error==='webgl-unavailable');assert(getComputedStyle(item.querySelector('.dm-light-error')).display!=='none')}finally{HTMLCanvasElement.prototype.getContext=original;host.remove()}});
  await mount(Decoration,{initialEffectId:'light-plasma-ring'});
  await test('流动方向反转实际改变纹理相位，当前案例会话参数独立记忆',async()=>{const first=pixels(renderer(),.4);state.params.direction='counterclockwise';await nextTick();assert(difference(first,pixels(renderer(),.4))>.3);state.params.duration=6;state.activeEffectId='light-silk-wave';await nextTick();assert(state.params.duration===5.05);state.activeEffectId='light-plasma-ring';await nextTick();assert(state.params.duration===6&&state.params.direction==='counterclockwise')});
  await test('代码视图隐藏画布后停止 GPU 帧循环',async()=>{renderer().setPlayback(true);await wait(80);state.activeWorkspaceView='code';await nextTick();await wait(120);assert(!renderer().shouldAnimate());const value=renderer().dataset.time;await wait(120);assert(renderer().dataset.time===value);state.activeWorkspaceView='preview';await nextTick()});
  await test('保存列表安全预览使用可信渲染器，任意脚本仍被隔离',async()=>{const effect=lightDecorations.find(e=>e.id==='light-silk-wave');const artifact=await createMotionArtifact({id:effect.id,name:effect.name,htmlCss:generateDecorationHtmlCss(effect,effect.defaultParams)});await mount(MyMotions);const store=useMyMotionStore(pinia);store.saveDecoration(effect,effect.defaultParams,artifact);await nextTick();state.openPreview(store.savedMotions[0]);await nextTick();await wait(200);const f=document.querySelector('.dialog-preview iframe');assert(f&&f.getAttribute('sandbox')==='allow-same-origin');const item=f.contentDocument.querySelector('dm-light-renderer');assert(item?.dataset.ready==='true',item?.dataset.error);assert(pixels(item,.3).some(v=>v>100));const button=[...document.querySelectorAll('.card-actions button')].find(n=>n.textContent.includes('复制 SVG'));assert(button.disabled)});
  await test('首页搜索真实光效并单击进入对应编辑器',async()=>{let id;await mount(Home,{onOpenDecoration:value=>id=value});state.keyword='等离子光环';await nextTick();const card=document.querySelector('.home-motion-card');assert(card?.querySelector('dm-light-renderer')?.dataset.ready==='true');card.click();assert(id==='light-plasma-ring')});
}catch(e){failures++;const row=document.createElement('li');row.textContent='FATAL '+e.stack;results.append(row)}
finally{app?.unmount();document.title=failures?'FAIL '+failures+'/'+total:'PASS '+total+'/'+total;const h=document.createElement('h1');h.textContent=document.title;document.body.prepend(h)}
