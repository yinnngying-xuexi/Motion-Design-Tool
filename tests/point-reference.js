import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '/src/styles/main.css';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import Decoration from '/src/modules/decoration-library/DecorationMotionLibrary.vue';
import { pointReferenceEffects, pointReferenceSpecs, pointReferenceSize } from '/src/data/pointReferenceBases.ts';
import { generateDecorationHtmlCss, generateDecorationMarkup } from '/src/generators/decorationGenerator.ts';
import { createAnimatedMotionSvg } from '/src/utils/motionSvg.ts';
let total=0, failures=0, app;
const assert=(x,message='断言失败')=>{if(!x)throw Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function test(name,fn){total++;const li=document.createElement('li');try{await fn();li.textContent='PASS '+name}catch(error){failures++;li.textContent='FAIL '+name+': '+error.message}document.querySelector('#results').append(li)}
const scratch=document.querySelector('#scratch');
const parse=code=>new DOMParser().parseFromString(code,'text/html');
try{
  const editor=new URLSearchParams(location.search).get('editor');
  if(new URLSearchParams(location.search).has('halo-phases')){
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5040');
    for(const phase of [0,.25,.5,.75]){
      const section=document.createElement('section');section.className='case';
      section.innerHTML=`<div class="stage"><div style="transform:scale(1.8)">${generateDecorationHtmlCss(effect,effect.defaultParams)}</div></div><p class="label">宽环绕中心旋转 · ${phase*360}°</p>`;
      document.querySelector('.gallery').append(section);
      section.querySelector('[data-point-reference]').getAnimations({subtree:true}).forEach(animation=>{animation.pause();animation.currentTime=phase*3600});
    }
  }else if(editor){
    app=createApp(Decoration,{initialEffectId:editor});app.use(createPinia());app.use(ElementPlus);app.mount('#mount');await nextTick();
  }else{
  await test('六棱底座：移除顶面追光，只在图标周围使用一套可关闭粒子',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5038');
    const code=generateDecorationHtmlCss(effect,effect.defaultParams);
    const host=document.createElement('div');host.innerHTML=code;
    const root=host.querySelector('[data-point-reference]');
    const particles=root.querySelector('.dm-decoration-particles');
    assert(!root.querySelector('.point-generated,.point-outline,.point-orbit'),'旧顶面追光或旋转仍存在');
    assert(!code.includes('-edge{')&&!code.includes('-orbit{'),'旧流光关键帧仍在导出代码中');
    assert(root.querySelectorAll('.dm-decoration-particles').length===1&&particles.querySelectorAll('i').length===22,'默认粒子数量错误或叠加两套');
    assert(particles.style.getPropertyValue('--p-offset-y')==='-20%'&&particles.style.getPropertyValue('--p-area-height')==='46%','粒子未集中在图标周围');
    assert(root.querySelectorAll('[data-source-layer]').length===2,'原始底座或图标被替换');
    const disabled=generateDecorationHtmlCss(effect,effect.defaultParams,undefined,undefined,undefined,{enabled:false});
    assert(!disabled.includes('dm-decoration-particles')&&!disabled.includes('@keyframes dm-particle'),'关闭粒子后仍输出粒子节点或 CSS');
  });
  await test('扇环底座：原扇片与遮罩同心旋转，图标10px悬浮',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5037');
    assert(effect.defaultParams.floatDistance===10,'默认悬浮幅度未增大');
    scratch.innerHTML=generateDecorationHtmlCss(effect,effect.defaultParams);
    const root=scratch.querySelector('[data-point-reference]'),plane=root.querySelector('[data-point-part="sector-ring-projection"]');
    assert(plane&&plane.querySelector('.point-orbit').getAnimations().length===1,'扇片没有一起旋转');
    const sectors=[...plane.querySelectorAll('[data-point-part="uniform-sector"]')];
    assert(sectors.length===3&&new Set(sectors.map(path=>path.getAttribute('d'))).size===1,'三段扇环不是同半径同宽度');
    assert(sectors.map(path=>path.getAttribute('transform')).join('|')==='rotate(0)|rotate(120)|rotate(240)','扇片间距不一致');
    assert(!plane.querySelector('[id$="outer-ring"]')&&!plane.querySelector('[id$="center"]'),'静态底盘或光柱被旋转');
    const p=new DOMMatrix(plane.getAttribute('transform'));
    assert(Math.abs(p.e-62.7)<.001&&Math.abs(p.f-104.1)<.001,'旋转中心不正确');
    const icon=root.querySelector('.point-icon'),animation=icon.getAnimations()[0];animation.pause();animation.currentTime=0;
    const start=new DOMMatrix(getComputedStyle(icon).transform).m42;animation.currentTime=2070;
    assert(Math.abs(new DOMMatrix(getComputedStyle(icon).transform).m42-start+10)<.1,'图标浮动不到10px');
  });
  await test('飞碟底座：上层圆环原位投影旋转，图标10px悬浮，侧壁静止',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5036');
    assert(effect.defaultParams.floatDistance===10,'默认悬浮幅度未增大');
    scratch.innerHTML=generateDecorationHtmlCss(effect,effect.defaultParams);
    const root=scratch.querySelector('[data-point-reference]');
    const plane=root.querySelector('[data-point-part="saucer-top-ring"]');
    assert(plane&&plane.querySelector('.point-orbit').getAnimations().length===1,'上层圆环未旋转');
    const band=plane.querySelector('[data-point-part="saucer-uniform-band"]');
    assert(band&&band.getAttribute('r')==='36'&&band.getAttribute('stroke-width')==='8.4','未重建为同心等宽圆环');
    const rotation=plane.querySelector('.point-orbit').getAnimations()[0];rotation.pause();
    const dimensions=[];
    for(const time of [0,900,1800,2700]){rotation.currentTime=time;const box=plane.getBoundingClientRect();dimensions.push([box.width,box.height]);}
    assert(dimensions.every(([w,h])=>Math.abs(w-dimensions[0][0])<.1&&Math.abs(h-dimensions[0][1])<.1),'旋转过程中环面尺寸发生拉伸');
    const projection=new DOMMatrix(plane.getAttribute('transform'));
    assert(Math.abs(projection.e-50.1)<.001&&Math.abs(projection.f-64.6438)<.001,'旋转中心偏移');
    assert(!plane.querySelector('[id$="-7"]'),'侧壁被加入旋转');
    const icon=root.querySelector('.point-icon'),animation=icon.getAnimations()[0];
    animation.pause();animation.currentTime=0;const start=new DOMMatrix(getComputedStyle(icon).transform).m42;
    animation.currentTime=2070;
    assert(Math.abs(new DOMMatrix(getComputedStyle(icon).transform).m42-start+10)<.1,'图标浮动不到10px');
  });
  await test('金融底座：图标10px悬浮，双环同心旋转，侧壁不旋转且静态可停',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-4627');
    assert(effect.defaultParams.floatDistance===10,'金融图标默认幅度未增大');
    scratch.innerHTML=generateDecorationHtmlCss(effect,effect.defaultParams);
    const root=scratch.querySelector('[data-point-reference]');
    const icon=root.querySelector('.point-icon'),a=icon.getAnimations()[0];a.pause();a.currentTime=0;
    const start=new DOMMatrix(getComputedStyle(icon).transform).m42;a.currentTime=2070;
    assert(Math.abs(new DOMMatrix(getComputedStyle(icon).transform).m42-start+10)<.1,'图标实际浮动不到10px');
    for(const part of ['finance-platform-ring','finance-icon-ring','finance-platform-projection']){
      const rotor=root.querySelector(`[data-point-part="${part}"] .point-orbit`);
      assert(rotor&&rotor.getAnimations().length===1,'环面未旋转：'+part);
      assert(getComputedStyle(rotor).transformOrigin==='0px 0px','环面未绕局部中心旋转');
    }
    assert(!root.querySelector('.point-scan'),'仍保留上下扫描代替旋转');
    assert(!root.querySelector('[data-point-part="finance-platform-projection"] [id*="Vector_3"]'),'侧壁被加入旋转');
    scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,motionEnabled:'off'});
    assert(scratch.querySelector('[data-point-reference]').getAnimations({subtree:true}).length===0,'静态模式仍有动画');
  });
  await test('晶格底座：取消线框动画，仅复用一套图标周围上浮粒子，可关闭与改色',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5041');
    const code=generateDecorationHtmlCss(effect,effect.defaultParams);
    assert(!code.includes('-orbit{')&&!code.includes('point-outline')&&!code.includes('point-ripple'),'仍然输出线框运动');
    scratch.innerHTML=code;const root=scratch.querySelector('[data-point-reference]'),particles=root.querySelector('.dm-decoration-particles');
    assert(root.querySelectorAll('.dm-decoration-particles').length===1&&particles.children.length===18,'默认粒子缺失或叠加两套');
    assert(particles.classList.contains('dm-decoration-particles--float'),'粒子不是流动样式');
    assert(!root.querySelector('.point-generated'),'仍有生成的线框节点');
    const particle=particles.querySelector('i'),animation=particle.getAnimations()[0];animation.pause();animation.currentTime=0;
    const start=new DOMMatrix(getComputedStyle(particle).transform).m42;animation.currentTime=4000;
    assert(new DOMMatrix(getComputedStyle(particle).transform).m42<start-10,'粒子没有明显向上流动');
    const disabled=generateDecorationHtmlCss(effect,effect.defaultParams,undefined,undefined,undefined,{enabled:false});
    assert(!disabled.includes('dm-decoration-particles')&&!disabled.includes('@keyframes dm-particle'),'关闭粒子后仍输出粒子节点或 CSS');
    const custom=generateDecorationHtmlCss(effect,effect.defaultParams,undefined,undefined,undefined,{...effect.defaultParticleEffect,count:24,colorMode:'custom',color:'#FF00AA'});
    scratch.innerHTML=custom;
    assert(scratch.querySelectorAll('.dm-decoration-particles i').length===24,'粒子数量未同步');
    assert(scratch.querySelector('.dm-decoration-particles').style.getPropertyValue('--p-color')==='#FF00AA','粒子自定义颜色未同步');
    assert(pointReferenceEffects.filter(item=>!['icon-point-5041','icon-point-5038'].includes(item.id)).every(item=>!item.defaultParticleEffect?.enabled),'无关案例被默认开启粒子');
  });
  await test('环轨光柱：星芒 18px 半周期交错，图标 8px 独立悬浮，整套底座不一起移动',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5039');
    assert(effect.defaultParams.floatDistance===8&&effect.defaultParams.starDistance===18,'默认悬浮幅度未增大');
    assert(pointReferenceEffects.filter(item=>!['column','halo','finance','saucer','sectors'].includes(pointReferenceSpecs[item.id].mode)).every(item=>item.defaultParams.floatDistance===3&&!('starDistance' in item.defaultParams)),'影响了其他案例');
    scratch.innerHTML=generateDecorationHtmlCss(effect,effect.defaultParams);
    const root=scratch.querySelector('[data-point-reference]'),pips=[...root.querySelectorAll('.point-float-detail')];
    root.getAnimations({subtree:true}).forEach(animation=>animation.pause());
    const y=node=>new DOMMatrix(getComputedStyle(node).transform).m42;
    const sample=time=>{pips.forEach(pip=>pip.getAnimations()[0].currentTime=time);return pips.map(y)};
    const start=sample(0),top=sample(1800);
    assert(Math.abs(top[0]-start[0]+18)<.1,'星芒实际运动不到 18px');
    const before=sample(720),after=sample(1080);
    assert(after[0]<before[0]&&after[2]>before[2],'左侧星芒没有交错反向移动');
    assert(after[3]<before[3]&&after[4]>before[4],'右侧星芒没有交错反向移动');
    const icon=root.querySelector('.point-icon'),animation=icon.getAnimations()[0];animation.currentTime=0;const initial=y(icon);animation.currentTime=2070;
    assert(Math.abs(y(icon)-initial+8)<.1,'中间图标没有明显上下移动');
    assert(getComputedStyle(root.querySelector('[data-source-layer]')).transform==='none','整套底座跟着浮动');
    scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,starDistance:24,duration:6});
    const adjusted=[...scratch.querySelectorAll('.point-float-detail')];
    adjusted.forEach(node=>{const animation=node.getAnimations()[0];animation.pause();animation.currentTime=3000});
    assert(Math.abs(y(adjusted[0])+24)<.1,'幅度参数没有同步到实际动画');
    assert(adjusted[2].getAnimations()[0].effect.getTiming().delay===-3000,'改变时长后交错相位失效');
  });
  await test('悬浮光环：宽环与缺口在圆平面旋转，图标悬浮 10px，底盘不动且导出不裁顶',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5040');
    assert(effect.defaultParams.floatDistance===10,'未加大图标默认幅度');
    assert(effect.editableParams.find(item=>item.key==='floatDistance').max===12,'幅度上限未同步');
    scratch.innerHTML=generateDecorationHtmlCss(effect,effect.defaultParams);
    const root=scratch.querySelector('[data-point-reference]'),rotor=root.querySelector('.point-wide-halo'),icon=root.querySelector('.point-icon');
    assert(rotor&&rotor.firstElementChild.children.length===4,'宽光环及端点没有整体绑定');
    const rim=root.querySelector('[data-point-part="stationary-disc-rim"]');
    assert(rim&&!rotor.contains(rim)&&rim.getAnimations().length===0,'底盘高亮弧被错误并入旋转组');
    const discRing=root.querySelector('[data-point-part="stationary-disc-ring"]');
    assert(discRing&&!rotor.contains(discRing)&&discRing.getAnimations().length===0,'底盘内侧暗环被错误并入旋转组');
    assert(root.querySelectorAll('[data-point-part="halo-projection"]').length===1,'没有透视投影层');
    assert([...rotor.querySelectorAll('[data-material="vector-angular-gradient"]')].every(node=>node.getAnimations().length===0),'仅旋转渐变或发生双重旋转');
    root.getAnimations({subtree:true}).forEach(animation=>animation.pause());
    const animation=rotor.getAnimations()[0];animation.currentTime=0;const start=rotor.getCTM();animation.currentTime=900;const quarter=rotor.getCTM();
    const center=new DOMPoint(0,0).matrixTransform(start),nextCenter=new DOMPoint(0,0).matrixTransform(quarter);
    assert(Math.abs(center.x-nextCenter.x)<.01&&Math.abs(center.y-nextCenter.y)<.01,'旋转中心漂移');
    const p0=new DOMPoint(1000,0).matrixTransform(start),p1=new DOMPoint(1000,0).matrixTransform(quarter);
    assert(Math.abs(p0.x-center.x)<.01&&Math.abs(p0.y-center.y-14.1968)<.02,'原始圆平面投影未保持');
    assert(Math.abs(p1.x-center.x+42.2934)<.02&&Math.abs(p1.y-center.y)<.02,'宽环绕屏幕翻转，没有在透视平面内旋转');
    const outline=rotor.querySelector('[data-halo-layer="8"]');
    for(const time of [0,450,900,1350,1800,2700,3599]){
      animation.currentTime=time;
      for(let step=0;step<=40;step++){
        const point=outline.getPointAtLength(outline.getTotalLength()*step/40);
        const actual=new DOMPoint(point.x,point.y).matrixTransform(outline.getCTM());
        const radius=Math.hypot((actual.x-center.x)/42.2934,(actual.y-center.y)/14.1968);
        assert(radius<1.08,`宽光环偏离中心轨道 t=${time} r=${radius.toFixed(3)} source=${point.x.toFixed(2)},${point.y.toFixed(2)} actual=${actual.x.toFixed(2)},${actual.y.toFixed(2)} center=${center.x.toFixed(2)},${center.y.toFixed(2)}`);
      }
    }
    assert(getComputedStyle(root.querySelector('[data-source-layer]')).transform==='none','底盘跟着旋转');
    const floating=icon.getAnimations()[0];floating.currentTime=0;const first=new DOMMatrix(getComputedStyle(icon).transform).m42;floating.currentTime=2070;
    assert(Math.abs(new DOMMatrix(getComputedStyle(icon).transform).m42-first+10)<.1,'图标实际悬浮不足 10px');
    assert(root.querySelector('svg').getAttribute('viewBox')==='0 0 124 115'&&pointReferenceSize(effect.id).height===115,'交付缺少顶部悬浮余量');
    scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,floatDistance:12,motionEnabled:'off'});
    assert(scratch.getAnimations({subtree:true}).length===0,'静态模式仍在旋转');
    assert(scratch.querySelector('.point-wide-halo'),'静态模式缺失完整光环');
  });
  await test('环轨光柱：薄圆环持续向上掠过并淡出，原始厚圆盘保持不动',()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5039');
    const code=generateDecorationHtmlCss(effect,effect.defaultParams);
    assert(!code.includes('rotate(')&&!code.includes('class="point-orbit"'),'仍然输出旋转光效');
    scratch.innerHTML=code;const root=scratch.querySelector('[data-point-reference]'),disc=root.querySelector('[data-point-part="lower-disc"]');
    assert(disc&&root.querySelectorAll('[data-point-part="lower-disc"]').length===1,'未保留原始下层圆盘');
    assert(disc.children.length===4,'原始下层圆盘结构不完整');
    assert(disc.getBBox().width>150&&disc.getBBox().y>110,'错误选择了上层圆柱');
    assert(disc.getAnimations().length===0&&getComputedStyle(disc).transform==='none','仍然是厚圆盘整体浮动');
    const plane=root.querySelector('.point-plane-rise'),fade=root.querySelector('.point-plane-fade');
    assert(plane&&plane.querySelectorAll('ellipse').length===2,'未生成薄圆形轮廓');
    assert(plane.querySelector('ellipse').getAttribute('rx')==='75.89','没有保留当前圆盘的透视轮廓');
    const animation=plane.getAnimations()[0],fading=fade.getAnimations()[0];animation.pause();fading.pause();
    assert(animation.effect.getTiming().duration===1800,'每个整体周期不是两次上升');
    const positions=[0,450,900,1350,1799].map(time=>{animation.currentTime=time;return new DOMMatrix(getComputedStyle(plane).transform).m42});
    assert(positions.every((y,index)=>index===0||y<positions[index-1]),'光环在周期内往返而不是持续向上');
    assert(positions[0]-positions.at(-1)>118,'光环未从底部升到图标区域');
    const opacity=[0,900,1799].map(time=>{fading.currentTime=time;return Number(getComputedStyle(fade).opacity)});
    assert(opacity[0]<.01&&opacity[1]>.99&&opacity[2]<.01,'光环没有淡入 / 淡出，循环会跳变');
    assert(disc.parentElement.getAnimations().length===0,'上层圆柱跟随光环移动');
    scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,motionEnabled:'off'});
    assert(scratch.getAnimations({subtree:true}).length===0&&getComputedStyle(scratch.querySelector('[data-point-part="lower-disc"]')).transform==='none','静态模式未恢复完整原始底座');
    assert(new DOMMatrix(getComputedStyle(scratch.querySelector('.point-plane-rise')).transform).m42===119,'静态薄圆环没有停留在底部');
    for(const other of pointReferenceEffects.filter(item=>['halo','finance','saucer','sectors'].includes(pointReferenceSpecs[item.id].mode)))assert(generateDecorationHtmlCss(other,other.defaultParams).includes('class="point-orbit"'),'其他底座环绕光效被移除');
  });
  await test('环轨光柱：Figma 颜色减淡转换为透明星芒，深色 / 灰色底无黑边黑尾',async()=>{
    const effect=pointReferenceEffects.find(item=>item.id==='icon-point-5039');
    const doc=parse(generateDecorationHtmlCss(effect,{...effect.defaultParams,motionEnabled:'off'}));
    const svg=doc.querySelector('svg');
    const gradients=[...svg.querySelectorAll('[data-material="transparent-star-glow"]')];
    assert(gradients.length===15,'星芒渐变转换不完整');
    assert(!svg.querySelector('[style*="color-dodge"]'),'星芒仍依赖外部混合背景');
    assert(svg.querySelector('.point-stars')&&!svg.querySelector('.point-stars.point-beam'),'星芒仍跟随低透明光柱呼吸');
    for(const gradient of gradients){assert(Number(gradient.lastElementChild.getAttribute('stop-opacity'))===0,'黑色末端仍不透明');assert(Number(gradient.firstElementChild.getAttribute('stop-opacity'))===1,'星芒亮芯变弱')}
    const pips=[...svg.querySelectorAll('.point-float-detail')];
    const onlyLight=document.createElementNS('http://www.w3.org/2000/svg','g');pips.forEach(pip=>onlyLight.append(pip.cloneNode(true)));
    svg.querySelector(':scope > g').replaceWith(onlyLight);
    const image=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    try{
      image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=372;canvas.height=330;const ctx=canvas.getContext('2d');
      for(const gray of [17,67]){
        ctx.fillStyle=`rgb(${gray} ${gray} ${gray})`;ctx.fillRect(0,0,372,330);ctx.drawImage(image,0,0,372,330);
        const pixels=ctx.getImageData(0,0,372,330).data;let bright=0;
        for(let i=0;i<pixels.length;i+=4){const luminance=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];assert(luminance>=gray-1.5,`背景 ${gray} 上出现黑色轮廓`);if(luminance>gray+35)bright++}
        assert(bright>40,'星芒亮芯 / 光晕未渲染');
      }
    }finally{URL.revokeObjectURL(url)}
  });
  for(const effect of pointReferenceEffects){
    const section=document.createElement('section');section.className='case';
    const {width,height}=pointReferenceSize(effect.id),scale=Math.min(250/width,210/height);
    section.innerHTML=`<div class="stage"><div style="transform:scale(${scale})">${generateDecorationHtmlCss(effect,effect.defaultParams)}</div></div><p class="label">${effect.name} · ${pointReferenceSpecs[effect.id].file}</p>`;
    document.querySelector('.gallery').append(section);
    await test(effect.name+'：保留真实底座 / 图标，独立悬浮与连续流光',async()=>{
      const node=section.querySelector('[data-point-reference]');
      assert(node.querySelectorAll('[data-source-layer]').length===2,'原始图层丢失');
      assert(node.querySelector('.point-icon').getBBox().width>0,'图标未渲染');
      if(effect.id==='icon-point-5041'||effect.id==='icon-point-5038')assert(node.querySelectorAll('.dm-decoration-particles i').length===(effect.id==='icon-point-5041'?18:22),'默认粒子未渲染');
      else assert(node.querySelector('.point-generated').getBBox().width>0,'底座光效未渲染');
      await wait(20);assert(getComputedStyle(node.querySelector('.point-icon')).animationName.includes('-float'),'图标无悬浮动画');
      assert(node.getAnimations({subtree:true}).length>=2,'动效未启动');
      const anim=node.querySelector('.point-icon').getAnimations()[0];anim.pause();anim.currentTime=0;
      const first=getComputedStyle(node.querySelector('.point-icon')).transform;anim.currentTime=2070;
      assert(getComputedStyle(node.querySelector('.point-icon')).transform!==first,'图标没有实际移动');anim.play();
    });
    await test(effect.name+'：独立 HTML / 无 GIF / 图层显隐 / 静态 / 改色',async()=>{
      const code=generateDecorationHtmlCss(effect,{...effect.defaultParams,color:'#FF6633',colorMode:'monochrome',motionEnabled:'off'});
      const doc=parse(code);assert(!doc.querySelector('foreignObject,script,iframe,object,embed'),'交付含不需要的运行层');
      assert(!/data:image\/(gif|webp)|\.gif|\/src\//i.test(code),'依赖原始动图或工程路径');
      assert(doc.querySelector('feColorMatrix'),'颜色未作用于完整素材');
      assert(doc.querySelector('[data-point-reference]').style.getPropertyValue('--point-color')==='#FF6633');
      scratch.innerHTML=code;assert(scratch.getAnimations({subtree:true}).length===0,'静态模式仍有动画');
      assert(scratch.querySelector('.point-icon').getBBox().width>0,'静态模式缺少图标');
      scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,showIcon:'off'});assert(!scratch.querySelector('.point-icon'),'图标未隐藏');
      scratch.innerHTML=generateDecorationHtmlCss(effect,{...effect.defaultParams,showBase:'off'});assert(!scratch.querySelector('.point-generated')&&scratch.querySelectorAll('[data-source-layer]').length===1,'底座未完整隐藏');
      const svg=await createAnimatedMotionSvg(generateDecorationHtmlCss(effect,effect.defaultParams),effect.name);
      assert(!new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror'),'SVG 复制无效');
      const frame=document.createElement('iframe');scratch.replaceChildren(frame);
      await new Promise(resolve=>{frame.onload=resolve;frame.srcdoc=`<!doctype html><html><body style="margin:0;background:#000">${code}</body></html>`});
      assert(frame.contentDocument.querySelector('.point-icon').getBBox().width>0,'离线 HTML 图标消失');
      assert(frame.contentDocument.getAnimations().length===0,'独立 HTML 未保留静态参数');
    });
  }
  await test('七份主预览 / 缩略图实例的渐变、遮罩、滤镜无重名',()=>{
    scratch.innerHTML=pointReferenceEffects.flatMap(e=>[generateDecorationMarkup(e,e.defaultParams),generateDecorationMarkup(e,e.defaultParams)]).join('');
    const ids=[...scratch.querySelectorAll('[id]')].map(n=>n.id);assert(new Set(ids).size===ids.length,'SVG ID 重名');
    for(const node of scratch.querySelectorAll('*'))for(const attr of node.attributes){for(const match of attr.value.matchAll(/url\(#([^)]*)\)/g))assert(scratch.querySelector(`[id="${match[1]}"]`),'悬空 SVG 引用 '+match[1])}
    assert(scratch.querySelectorAll('[data-material="vector-angular-gradient"]').length===4,'特殊渐变未保留');
  });
  await test('编辑器：七款入目录 / 尺寸与重置 / 折叠目录不影响当前图标 / 真实 HTML 下载',async()=>{
    app=createApp(Decoration,{initialEffectId:pointReferenceEffects[0].id});app.use(createPinia());app.use(ElementPlus);const vm=app.mount('#mount');const state=vm.$.setupState;
    for(const effect of pointReferenceEffects){state.activeEffectId=effect.id;await nextTick();
      assert(state.currentEffect.id===effect.id,'目录未选中');
      assert(state.previewIntrinsicSize.width===pointReferenceSpecs[effect.id].width,'预览尺寸错误');
      state.params.showIcon='off';state.params.colorMode='monochrome';state.params.color='#ff0000';state.resetParams();await nextTick();
      assert(state.params.showIcon==='on'&&state.params.colorMode==='original','重置未恢复原始图标');
      if(effect.id==='icon-point-5039')assert(state.params.floatDistance===8&&state.params.starDistance===18,'重置未恢复加大的悬浮幅度');
      if(effect.id==='icon-point-5040')assert(state.params.floatDistance===10&&state.previewIntrinsicSize.height===115,'重置未恢复悬浮光环的幅度或安全尺寸');
      if(effect.id==='icon-point-5041'||effect.id==='icon-point-5038'){
        assert(state.particleEffect.enabled&&state.particleEffect.count===(effect.id==='icon-point-5041'?18:22),'重置未恢复默认粒子');
        assert(document.querySelectorAll('#mount .generated-preview .dm-decoration-particles').length===1,'主画布粒子叠加');
        assert(state.effectThumbnailMarkup(effect).includes('@keyframes dm-particle-float'),'缩略图缺少粒子动画');
        state.particleEffect.enabled=false;await nextTick();assert(!state.htmlCss.includes('dm-decoration-particles'),'实际关闭未同步到导出');
        state.resetParams();await nextTick();assert(state.particleEffect.enabled,'重置没有重新开启粒子');
      }
      const icon=document.querySelector('#mount .generated-preview .point-icon');assert(icon?.getBBox().width>0,'主预览缺少图标');
      const categories=[...document.querySelectorAll('#mount .category-header')];categories.forEach(node=>node.click());await nextTick();
      assert(document.querySelector('#mount .generated-preview .point-icon')?.getBBox().width>0,'目录折叠影响图标');
      assert(state.htmlCss.includes('point-icon')&&!state.htmlCss.includes('<script>'),'编辑器与 HTML 不一致');
      let blob, filename;const create=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;
      URL.createObjectURL=value=>{blob=value;return 'blob:point-test'};HTMLAnchorElement.prototype.click=function(){filename=this.download};
      try{await state.downloadHtml();const html=await blob.text();assert(filename===effect.name+'.html','下载文件名错误');assert(html.includes(`width:${pointReferenceSize(effect.id).width}px;height:${pointReferenceSize(effect.id).height}px;background:#000`),'交付尺寸或黑色预览背景错误');assert(html.includes('point-icon')&&!html.includes('dm-motion-canvas'),'交付丢失图标或携带像素格');}finally{URL.createObjectURL=create;HTMLAnchorElement.prototype.click=click}
    }
  });
  await test('保存到我的动效：特殊渐变与内嵌纹理均生成有效 PNG / 自包含 HTML',async()=>{
    const state=app._instance.setupState;
    for(const id of ['icon-point-5040','icon-point-5041']){
      state.activeEffectId=id;await nextTick();await state.saveFromToolbar();
      const record=JSON.parse(localStorage.getItem('visual-motion-my-motions')||'[]').find(item=>item.id==='decoration-'+id);
      assert(record?.artifact?.html.includes(`data-point-reference="${id}"`),'没有保存当前案例 HTML');
      assert(record.artifact.previewImage.startsWith('data:image/png;base64,'),'预览 PNG 无效');
      const image=new Image();image.src=record.artifact.previewImage;await image.decode();
      assert(image.naturalWidth===480&&image.naturalHeight===270,'预览 PNG 尺寸异常');
    }
  });
  }
}catch(error){failures++;const li=document.createElement('li');li.textContent='FATAL '+error.stack;document.querySelector('#results').append(li)}
finally{
  const editor=new URLSearchParams(location.search).get('editor');
  if(editor&&app){
    document.querySelector('h1').style.display='none';document.querySelector('.gallery').style.display='none';document.querySelector('#results').style.display='none';
    document.querySelector('#mount').style.cssText='position:fixed;inset:0;width:100vw;height:100vh';
    app._instance.setupState.activeEffectId=editor;await nextTick();
  }else app?.unmount();
  scratch.replaceChildren();document.title=failures?`FAIL ${failures}/${total}`:`PASS ${total}/${total}`;
}
