import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const args=process.argv.slice(2),production=args.includes('--production');
if(production)args.splice(args.indexOf('--production'),1);
const shot=args.indexOf('--shot');
const screenshot=shot>=0?args.splice(shot,2)[1]:undefined;
const sizeIndex=args.indexOf('--size');
const viewport=sizeIndex>=0?args.splice(sizeIndex,2)[1]:'1480,960';
const urls=args.length?args:['/tests/webgl-lights.html','/tests/svg-copy-reset.html','/tests/motion-scale.html','/tests/light-decorations.html','/tests/procedural-lights.html'];
for(const path of urls){
  const profile=await mkdtemp(join(tmpdir(),'dm-browser-qa-'));
  const browser=process.env.DM_QA_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const software=process.env.DM_QA_SOFTWARE!=='0';
  const graphics=software?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[];
  const child=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check',...graphics,'--remote-debugging-port=0',`--window-size=${viewport}`,`--user-data-dir=${profile}`],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let ws;
  try{
    const endpoint=await Promise.race([new Promise((resolve,reject)=>{child.stderr.on('data',d=>{const m=d.toString().match(/DevTools listening on (ws:\/\/\S+)/);if(m)resolve(m[1])});child.on('error',reject)}),sleep(10000).then(()=>{throw Error('浏览器启动超时')})]);
    ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
    let sequence=0;const pending=new Map();
    ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const handlers=pending.get(data.id);pending.delete(data.id);if(data.error)handlers?.reject(Error(data.error.message));else handlers?.resolve(data.result)}};
    const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,sessionId}))});
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);
    await send('Page.navigate',{url:path.startsWith('http')?path:'http://127.0.0.1:5174'+path},sessionId);
    if(production){
      await sleep(1500);
      const evaluated=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
        const wait=ms=>new Promise(r=>setTimeout(r,ms));
        const check=(x,m)=>{if(!x)throw Error(m)};
        const waitFor=async(predicate,message)=>{
          for(let i=0;i<50;i++){if(predicate())return;await wait(200)}
          throw Error(message);
        };
        const checkAlpha=(item,name,minFaint=20)=>{
          const gl=item.gl;check(gl?.getContextAttributes()?.premultipliedAlpha===true,name+' 画布不是预乘透明度');
          item.setPlayback(false);item.seek(.2);
          const data=new Uint8Array(item.canvas.width*item.canvas.height*4);
          gl.readPixels(0,0,item.canvas.width,item.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);
          let faint=0;
          for(let i=0;i<data.length;i+=4){const alpha=data[i+3];if(alpha<3||alpha>80)continue;faint++;check(Math.max(data[i],data[i+1],data[i+2])<=alpha+2,name+' 半透明像素颜色未预乘')}
          check(faint>minFaint,name+' 缺少半透明光晕');
        };
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.__motionCopied=value}});
        const names=['等离子光环','柔光波带','电弧光束','粒子光带','粒子摆动','流体线框环','粒子辉光环','星芒光点'];
        await waitFor(()=>document.querySelectorAll('.home-motion-card').length>=30,'首页卡片加载超时');
        for(const name of names){
          const card=[...document.querySelectorAll('.home-motion-card')].find(n=>n.textContent.includes(name));
          const thumbnail=card?.querySelector('dm-light-renderer');
          await waitFor(()=>thumbnail?.dataset.ready==='true',name+' 首页缩略图渲染失败');checkAlpha(thumbnail,name+' 首页缩略图',3);
        }
        [...document.querySelectorAll('.top-navigation button')].find(n=>n.textContent==='装饰组件').click();
        await waitFor(()=>document.querySelectorAll('.effect-card').length>=30,'编辑器目录加载超时');
        const snippets=[];
        for(const name of names){
          [...document.querySelectorAll('.effect-card')].find(n=>n.textContent.includes(name)).click();await wait(300);
          const preview=document.querySelector('.generated-preview dm-light-renderer');
          await waitFor(()=>preview?.dataset.ready==='true',name+' 构建预览失败');checkAlpha(preview,name+' 主预览');
          [...document.querySelectorAll('.decoration-workspace-actions button')].find(n=>n.textContent==='复制代码').click();await wait(50);
          check(window.__motionCopied?.includes('<script>')&&!window.__motionCopied?.includes('base64'),'构建交付不是纯代码');snippets.push(window.__motionCopied);
        }
        const frame=document.createElement('iframe');const loaded=new Promise(r=>frame.onload=r);
        frame.srcdoc='<html><head><style>body{background:#000}</style></head><body>'+snippets.join('')+'</body></html>';document.body.append(frame);await loaded;
        const items=[...frame.contentDocument.querySelectorAll('dm-light-renderer')];
        check(items.length===names.length&&items.every(n=>n.dataset.ready==='true'),items.map(n=>n.dataset.error).join(';'));
        items.forEach((n,i)=>{check(n.canvas.width>0,'构建导出空画面');checkAlpha(n,names[i]+' 独立代码')});
        check(!frame.contentDocument.querySelector('img,image'),'构建还在使用图片素材');
        frame.remove();document.title='PASS 生产构建八款程序光效/独立交付';return document.title;
      })().catch(e=>{document.title='FAIL '+e.message;return document.title})`},sessionId);
      console.log(path,evaluated.result.value);if(evaluated.exceptionDetails)console.log(JSON.stringify(evaluated.exceptionDetails));if(!String(evaluated.result.value).startsWith('PASS'))process.exitCode=1;
      await send('Target.closeTarget',{targetId});continue;
    }
    const start=Date.now();let result;
    do{
      await sleep(500);
      const data=await send('Runtime.evaluate',{expression:'({title:document.title,results:[...document.querySelectorAll("#results>li")].map(n=>n.textContent)})',returnByValue:true},sessionId);
      result=data.result.value;
      if(/^(PASS|FAIL)/.test(result.title))break;
      if(screenshot&&Date.now()-start>3000)break;
    }while(Date.now()-start<55000);
    console.log(path,result.title);
    const failures=result.results.filter(x=>/^(FAIL|FATAL)/.test(x));failures.forEach(x=>console.log(x));
    if(!screenshot&&!/^(PASS|FAIL)/.test(result.title)){console.log('TIMEOUT 最后完成：',result.results.slice(-3));process.exitCode=1}
    if(/^FAIL/.test(result.title)||failures.length)process.exitCode=1;
    if(screenshot){const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);await writeFile(resolve(screenshot),Buffer.from(image.data,'base64'));console.log('Screenshot:',resolve(screenshot))}
    await send('Target.closeTarget',{targetId});
  }catch(error){console.error(path,error);process.exitCode=1}
  finally{ws?.close();child.kill()}
}
