window.FX=(function(){const cv=document.createElement('canvas');cv.id='fxc';cv.setAttribute('aria-hidden','true');document.body.append(cv);const g=cv.getContext('2d');let P=[],on=0,W,Hh;
const rs=()=>{W=cv.width=innerWidth;Hh=cv.height=innerHeight};addEventListener('resize',rs);rs();
const GL='♔♕♖♗♘♙♚♛♜♝♞♟',CL=['#7ec8ff','#ffffff','#4c8dff','#ff4d6d','#ffb3c1','#9ecbff'],rn=(a,b)=>a+Math.random()*(b-a),pk=a=>a[Math.random()*a.length|0];
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const add=o=>P.push(Object.assign({x:0,y:0,vx:0,vy:0,g:.25,r:0,vr:0,l:0,m:120,s:3,c:'#ffd166',k:0},o));
function loop(){g.clearRect(0,0,W,Hh);P=P.filter(p=>p.l<p.m);
 for(const p of P){p.l++;p.vy+=p.g;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;g.globalAlpha=Math.max(0,Math.min(1,(p.m-p.l)/28));g.fillStyle=p.c;
  if(p.k){g.save();g.translate(p.x,p.y);g.rotate(p.r);g.font=p.s+'px serif';g.textAlign='center';g.fillText(p.t,0,0);g.restore()}
  else{g.globalCompositeOperation='lighter';g.beginPath();g.arc(p.x,p.y,p.s,0,7);g.fill();g.globalCompositeOperation='source-over'}}
 g.globalAlpha=1;if(P.length)requestAnimationFrame(loop);else{on=0;g.clearRect(0,0,W,Hh)}}
const go=()=>{if(!on&&!RM){on=1;requestAnimationFrame(loop)}};
const glyph=(o)=>add(Object.assign({k:1,t:pk(GL),s:rn(18,36),r:rn(0,6),vr:rn(-.18,.18)},o));
return{
 cannon(x,dir,n){for(let i=0;i<n;i++){const a=-Math.PI/2+dir*rn(.08,.75),v=rn(10,21),o={x,y:Hh,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:.3,m:rn(90,180),c:pk(CL)};i%3?add(Object.assign(o,{s:rn(2,4.5)})):glyph(o)}go()},
 rain(n){for(let i=0;i<n;i++)setTimeout(()=>{const o={x:rn(0,W),y:-30,vx:rn(-1,1),vy:rn(1,4),g:.05,m:rn(120,240),c:pk(CL)};i%2?add(Object.assign(o,{s:rn(2,4)})):glyph(o);go()},i*30)},
 burst(x,y,n){for(let i=0;i<n;i++){const a=rn(0,6.283),v=rn(3,15),o={x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:.16,m:rn(60,130),c:pk(CL)};i%4?add(Object.assign(o,{s:rn(1.5,4)})):glyph(Object.assign(o,{s:rn(16,28)}))}go()},
 embers(n){for(let i=0;i<n;i++)setTimeout(()=>{add({x:rn(0,W),y:Hh+10,vx:rn(-.8,.8),vy:rn(-5,-2),g:-.01,m:rn(120,240),s:rn(1.5,4),c:pk(['#ff6b4a','#ff9a3c','#ffd08a','#d64034'])});go()},i*25)},
 ring(x,y){const r=document.createElement('div');r.className='ring';r.style.setProperty('--x',x+'px');r.style.setProperty('--y',y+'px');document.body.append(r);setTimeout(()=>r.remove(),1200)},
 clear(){P=[]}}})();
