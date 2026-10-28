import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';
import Home from '/src/modules/motion-library/MotionHome.vue';
import { lightDecorations } from '/src/data/lightDecorations.ts';
import { decorationEffects } from '/src/data/decorationEffects.ts';
import { generateDecorationMarkup } from '/src/generators/decorationGenerator.ts';
import { lightDecorationSize } from '/src/generators/lightDecorationGenerator.ts';
let failures=0,total=0,app,state,copied='';
const results=document.querySelector('#results');
function assert(ok,message='断言失败'){if(!ok)throw Error(message)}
async function test(name,run){total++;const row=document.createElement('li');try{await run();row.textContent='PASS '+name}catch(e){failures++;row.textContent='FAIL '+name+': '+e.message}results.append(row)}
async function mount(component,props={}){app?.unmount();app=createApp(component,props).use(createPinia()).use(ElementPlus);state=app.mount('#mount').$.setupState;await nextTick();await new Promise(r=>setTimeout(r,30))}
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{async writeText(value){copied=value}}});
localStorage.clear();
try{
  await mount(Decoration,{initialEffectId:'light-particle-band'});
  await test('粒子光带：首次打开、导出和重置使用用户确认的 60% 默认大小',async()=>{
    assert(state.params.overallScale===60,'打开未使用 60%');assert(document.querySelector('.decoration-params').textContent.includes('252 × 36'),'实际尺寸未同步');
    assert(state.htmlCss.includes('data-dm-scale=\"60\"'));assert(document.querySelector('.generated-preview dm-light-renderer')?.dataset.ready==='true');assert(state.svgUnsupportedReason.includes('WebGL'));
    let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};state.downloadHtml();assert((await blob.text()).includes('width:252px;height:36px'),'默认 HTML 尺寸不一致')}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}
    state.activeEffectId='light-comet-ring';await nextTick();assert(state.params.overallScale===100,'影响了其他案例默认');state.params.overallScale=125;await nextTick();state.activeEffectId='light-particle-band';await nextTick();state.params.overallScale=85;await nextTick();state.resetCurrentEffect();await nextTick();assert(state.params.overallScale===60,'重置未恢复 60%');state.activeEffectId='light-comet-ring';await nextTick();assert(state.params.overallScale===125,'重置影响其他案例');state.resetCurrentEffect();await nextTick();state.activeEffectId='light-particle-band';await nextTick();
    const thumb=document.querySelector('.effect-card.active .real-effect-thumbnail');assert(Math.abs(thumb.getBoundingClientRect().width-32.4)<1,'目录缩略图未使用同一默认缩放');
  });
  await test('目录：七份参考合并为六个案例，归入已有分类',()=>{assert(lightDecorations.length===6);assert(new Set(lightDecorations.map(e=>e.id)).size===6);assert(lightDecorations.filter(e=>e.section==='通用装饰').length===5);assert(lightDecorations.filter(e=>e.section==='图表装饰').length===1)});
  // The two WebGL samples have their own pixel/HTML/lifecycle test suite.
  for(const effect of lightDecorations.filter(e=>!['light-plasma-ring','light-silk-wave','light-electric-beam','light-particle-band'].includes(e.id))){
    await test(effect.name+'：真实预览、精简参数、独立 SVG 定义',async()=>{state.activeEffectId=effect.id;await nextTick();const root=document.querySelector('.generated-preview .dm-light-decoration');assert(root,'缺少真实光效');assert(root.querySelector('svg'));assert(getComputedStyle(root).backgroundColor==='rgba(0, 0, 0, 0)','黑底未透明');assert(effect.editableParams.length<=(effect.id==='light-comet-ring'?6:5),'参数过多');for(const param of effect.editableParams)assert(document.querySelector('.decoration-params').textContent.includes(param.label),'缺少参数 '+param.label);const ids=[...document.querySelectorAll('.dm-light-decoration svg [id]')].map(n=>n.id);assert(new Set(ids).size===ids.length,'SVG ID 冲突');assert(!state.htmlCss.includes('<img')&&!state.htmlCss.includes('<script')&&!state.htmlCss.includes('ESENSOFT'));const thumb=document.querySelector('.effect-card.active .real-effect-thumbnail svg');assert(thumb&&thumb.getBoundingClientRect().width>0,'缩略图未显示')});
    await test(effect.name+'：颜色、强度、周期实时生效',async()=>{state.params.color='#FF5500';state.params.lightIntensity=0;state.params.duration=2.5;await nextTick();let root=document.querySelector('.generated-preview .dm-light-decoration');assert(getComputedStyle(root).color==='rgb(255, 85, 0)');assert(getComputedStyle(root).opacity==='0');assert(root.style.getPropertyValue('--light-duration')==='2.5s');assert(state.htmlCss.includes('--light-color:#FF5500')&&state.htmlCss.includes('--light-intensity:0')&&state.htmlCss.includes('--light-duration:2.5s'));state.params.lightIntensity=80;await nextTick();root=document.querySelector('.generated-preview .dm-light-decoration');assert(getComputedStyle(root).opacity==='0.8')});
    await test(effect.name+'：静态模式保留造型并停止所有运动',async()=>{state.params.motionEnabled='off';await nextTick();const root=document.querySelector('.generated-preview .dm-light-decoration');assert(root.querySelectorAll('path,circle,ellipse,rect').length>0);assert(!root.querySelector('animate,animateTransform,animateMotion'));assert(root.getAnimations({subtree:true}).length===0,'CSS 动效未停止');assert(!state.htmlCss.includes('<animate'));state.params.motionEnabled='on';await nextTick()});
    await test(effect.name+'：复制代码和动态 SVG 保留原生动效',async()=>{await state.copyCode();assert(copied===state.htmlCss);await state.copySvg();const doc=new DOMParser().parseFromString(copied,'image/svg+xml');assert(!doc.querySelector('parsererror'));assert(doc.querySelector('.dm-light-decoration'));assert(copied.includes('@keyframes')||doc.querySelector('animate'));assert(!copied.includes('http://127.0.0.1'));if(['light-electric-beam','light-plasma-ring','light-silk-wave'].includes(effect.id))assert(doc.querySelector('animate'),'路径形变丢失')});
    await test(effect.name+'：形变实际运行，旋转方向可反转',async()=>{const root=document.querySelector('.generated-preview .dm-light-decoration');const svg=root.querySelector('svg');const animated=svg.querySelector('path:has(animate)');if(animated){svg.pauseAnimations();svg.setCurrentTime(0);const first=animated.getTotalLength();svg.setCurrentTime(.35);const second=animated.getTotalLength();assert(Math.abs(first-second)>.001,'路径没有变化');svg.unpauseAnimations()}if(effect.defaultParams.direction){state.params.direction='counterclockwise';await nextTick();const turn=document.querySelector('.generated-preview .dm-light__rotate');assert(getComputedStyle(turn).animationDirection==='reverse')}});
    await test(effect.name+'：HTML 独立交付与重置',async()=>{state.params.overallScale=50;await nextTick();let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};state.downloadHtml();const html=await blob.text();const size=lightDecorationSize(effect.id);assert(html.includes(`width:${size.width*.5}px;height:${size.height*.5}px`),'导出尺寸错误');assert(html.includes('data-dm-scale="50"'));assert(!html.includes('dm-motion-canvas'));}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}document.querySelector('.decoration-params .section-head button').click();await nextTick();assert(state.params.color===effect.defaultParams.color);assert(state.params.overallScale===(effect.defaultParams.overallScale??100));assert(state.params.motionEnabled==='on');assert(state.params.duration===effect.defaultParams.duration)});
  }
  await test('辉光旋转环：线条粗细实时应用、渐细拖尾、复制导出及会话重置',async()=>{
    state.activeEffectId='light-comet-ring';await nextTick();assert(state.params.lineWidth===3.3);assert(document.querySelector('.decoration-params').textContent.includes('线条粗细'));
    const widths=()=>[...document.querySelectorAll('.generated-preview .dm-light__rotate>circle[stroke]')].map(n=>Number(n.getAttribute('stroke-width')));
    const unchanged=[state.params.color,state.params.lightIntensity,state.params.duration,state.params.direction].join('|');
    state.params.lineWidth=.5;await nextTick();const thin=widths();state.params.lineWidth=12;await nextTick();const thick=widths();assert(thick[0]>thin[0]*20,'线宽未实际改变');assert(thick.every((value,i)=>!i||value<=thick[i-1]),'拖尾未逐渐变细');assert(document.querySelector('.generated-preview svg').getAttribute('viewBox')==='0 0 280 280');
    assert([state.params.color,state.params.lightIntensity,state.params.duration,state.params.direction].join('|')===unchanged,'改动了其他参数');
    state.params.lineWidth=6.6;await nextTick();const expected=widths()[0];await state.copyCode();assert(copied===state.htmlCss&&copied.includes('stroke-width="'+expected.toFixed(2)+'"'));await state.copySvg();const xml=new DOMParser().parseFromString(copied,'image/svg+xml');assert(!xml.querySelector('parsererror'));assert(Number(xml.querySelector('.dm-light__rotate>circle[stroke]').getAttribute('stroke-width'))===expected,'复制 SVG 线宽不一致');
    let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;try{URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};state.downloadHtml();assert((await blob.text()).includes('stroke-width="'+expected.toFixed(2)+'"'))}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click}
    state.activeEffectId='light-particle-band';await nextTick();assert(!document.querySelector('.decoration-params').textContent.includes('线条粗细'));state.activeEffectId='light-comet-ring';await nextTick();assert(state.params.lineWidth===6.6,'切换未保留线宽');state.resetCurrentEffect();await nextTick();assert(state.params.lineWidth===3.3&&widths()[0]===3.28,'重置未恢复默认线宽');
  });
  await test('两份同类型光效可共存且定义不互相引用',()=>{const effect=lightDecorations.find(e=>e.id==='light-plasma-ring');const first=generateDecorationMarkup(effect,effect.defaultParams,undefined,undefined,'first');const second=generateDecorationMarkup(effect,{...effect.defaultParams,color:'#FF5500'},undefined,undefined,'second');const host=document.createElement('div');host.innerHTML=first+second;const ids=[...host.querySelectorAll('[id]')].map(n=>n.id);assert(ids.length===new Set(ids).size);for(const node of host.querySelectorAll('[filter],[stroke],[fill]')){const value=node.getAttribute('filter')??node.getAttribute('stroke')??node.getAttribute('fill');const ref=/url\(#([^)]*)\)/.exec(value);if(ref)assert(host.querySelector(`[id="${ref[1]}"]`),'定义丢失')}});
  await test('首页全局搜索可找到新光效并单击进入对应编辑器',async()=>{let selected='';await mount(Home,{onOpenDecoration:id=>{selected=id}});state.keyword='电弧光束';await nextTick();const card=document.querySelector('.home-motion-card');assert(card?.textContent.includes('电弧光束'));card.click();await nextTick();assert(selected==='light-electric-beam')});
  await test('首页展示七款真实图标底座并可单击进入编辑器',async()=>{
    let selected='';await mount(Home,{onOpenDecoration:id=>{selected=id}});
    for(const effect of decorationEffects.filter(item=>item.generator==='point-reference')){
      const card=[...document.querySelectorAll('.home-motion-card')].find(node=>node.querySelector('h2')?.textContent.includes(effect.name));
      assert(card,`首页缺少 ${effect.name}`);
      assert(card.querySelector(`[data-point-reference="${effect.id}"] .point-icon`),`${effect.name} 未使用真实预览`);
      card.click();await nextTick();assert(selected===effect.id,`${effect.name} 未进入对应编辑器`);
    }
  });
  await test('首页五列展示全部装饰组件，按类别排序且原首排四款置底',async()=>{
    await mount(Home);
    const cards=[...document.querySelectorAll('.home-motion-card')];
    const names=cards.map(node=>node.querySelector('h2')?.childNodes[0]?.textContent.trim());
    assert(cards.length===decorationEffects.length&&cards.length===30,'首页未展示全部装饰组件');
    assert(names.slice(0,7).join('|')==='环轨光柱底座|悬浮光环底座|晶格悬浮底座|金融全息底座|飞碟环绕底座|扇环能量底座|六棱流光底座','图标底座未置前');
    assert(names.slice(-4).join('|')==='星环粒子底座|层叠能量底座|环形扩散底座|双边流光','原首排四款未置底');
    const order=['图标/点位','loading','标题装饰','通用装饰','图表装饰'];
    const middle=names.slice(7,-4).map(name=>order.indexOf(decorationEffects.find(effect=>effect.name===name)?.section));
    assert(middle.every((rank,index)=>rank>=0&&(!index||rank>=middle[index-1])),'装饰组件类别顺序不正确');
    assert(getComputedStyle(document.querySelector('.motion-home-grid')).gridTemplateColumns.split(' ').length===5,'桌面端不是五列');
    state.keyword='慢速旋转';await nextTick();assert(!document.querySelector('.home-motion-card'),'首页仍搜索到基础动效');
  });
  await test('首页多张卡片无需悬停便同时循环播放',async()=>{
    await mount(Home);
    const cards=[...document.querySelectorAll('.home-motion-card')].slice(0,2);
    const animations=cards.map(card=>card.querySelector('.point-icon')?.getAnimations()[0]);
    assert(animations.every(animation=>animation?.playState==='running'),'首页图标仍等待悬停才播放');
    const before=animations.map(animation=>animation.currentTime);
    await new Promise(resolve=>setTimeout(resolve,100));
    assert(animations.every((animation,index)=>animation.playState==='running'&&animation.currentTime>before[index]),'首页动效未持续播放');
    cards[0].dispatchEvent(new MouseEvent('mouseleave'));
    assert(animations[0].playState==='running','移开鼠标后动效停止');
  });
  await test('首页全部装饰组件卡片均保留可播放动效',async()=>{
    const staticCards=[...document.querySelectorAll('.home-motion-card')].filter(card=>{
      const preview=card.querySelector('.decoration-home-preview');
      return !preview.getAnimations({subtree:true}).some(animation=>animation.playState==='running')
        && !preview.querySelector('animate,animateTransform,animateMotion,dm-light-renderer,img[src*="webp"]');
    });
    assert(!staticCards.length,`静态卡片：${staticCards.map(card=>card.querySelector('h2')?.textContent).join('、')}`);
  });
  await test('角标聚焦已从目录、首页及搜索移除，不删除本地保存记录',async()=>{
    assert(!decorationEffects.some(e=>e.id==='corner-focus-01'||e.name==='角标聚焦'));assert(decorationEffects.filter(e=>e.section==='通用装饰'&&e.subsection==='动态标记').length===2);
    const record=JSON.stringify([{id:'decoration-corner-focus-01',name:'角标聚焦',artifact:{html:'<!doctype html><p>历史保存成果</p>'}}]);localStorage.setItem('visual-motion-my-motions',record);
    await mount(Decoration,{initialEffectId:'light-silk-wave'});assert(![...document.querySelectorAll('.effect-card')].some(n=>n.textContent.includes('角标聚焦')));state.keyword='角标聚焦';await nextTick();assert(!document.querySelector('.effect-card'),'目录搜索仍有结果');
    await mount(Home);assert(document.querySelectorAll('.home-motion-card').length===30,'首页案例数量不一致');assert(![...document.querySelectorAll('.home-motion-card')].some(n=>n.textContent.includes('角标聚焦')));state.keyword='角标聚焦';await nextTick();assert(!document.querySelector('.home-motion-card'),'首页搜索仍有结果');assert(localStorage.getItem('visual-motion-my-motions')===record,'历史保存数据被删除');
  });
}catch(e){failures++;const row=document.createElement('li');row.textContent='FATAL '+e.stack;results.append(row)}
finally{app?.unmount();document.title=failures?'FAIL '+failures+'/'+total:'PASS '+total+'/'+total;const heading=document.createElement('h2');heading.textContent=document.title;document.body.prepend(heading)}
