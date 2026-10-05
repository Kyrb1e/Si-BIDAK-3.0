(function(){
 const I=document.getElementById('intro');if(!I)return;
 if(matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(pointer:coarse)').matches)return;
 const cv=document.createElement('canvas');cv.id='trail';cv.setAttribute('aria-hidden','true');document.body.append(cv);
 const g=cv.getContext('2d');let W=0,H=0,pts=[],dust=[],run=false;
 const LIFE=720,rn=(a,b)=>a+Math.random()*(b-a);
 function rs(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0)}
 addEventListener('resize',rs);rs();
 function frame(now){
  g.clearRect(0,0,W,H);
  if(I.classList.contains('out')){pts=[];dust=[]}
  pts=pts.filter(p=>now-p.t<LIFE);dust=dust.filter(d=>now-d.t<d.l);
  g.lineCap='round';g.lineJoin='round';
  /* pita emas meruncing: pangkal tipis & pudar, ujung kursor paling terang */
  for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],k=1-(now-b.t)/LIFE;if(k<=0)continue;
   const q=k*k;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);
   g.lineCap='butt';g.strokeStyle='rgba(200,169,107,'+(q*.30).toFixed(3)+')';g.lineWidth=2+q*12;g.stroke();
   g.lineCap='round';g.strokeStyle='rgba(247,236,200,'+(q*.92).toFixed(3)+')';g.lineWidth=.6+q*3.4;g.stroke();
  }
  /* debu emas yang jatuh pelan */
  for(const d of dust){
   const k=1-(now-d.t)/d.l,x=d.x+d.vx*(now-d.t)*.06,y=d.y+d.vy*(now-d.t)*.06;
   g.save();g.translate(x,y);g.rotate(Math.PI/4+d.r);g.globalAlpha=Math.max(0,k)*.9;g.fillStyle=d.c;
   const s=d.s*(.4+k*.6);g.fillRect(-s,-s,s*2,s*2);g.restore();
  }
  g.globalAlpha=1;
  const last=pts[pts.length-1];
  if(last&&now-last.t<140){const k=1-(now-last.t)/140,r=g.createRadialGradient(last.x,last.y,0,last.x,last.y,22);
   r.addColorStop(0,'rgba(247,236,200,'+(.55*k).toFixed(3)+')');r.addColorStop(1,'rgba(200,169,107,0)');g.fillStyle=r;g.beginPath();g.arc(last.x,last.y,22,0,7);g.fill()}
  if(pts.length||dust.length)requestAnimationFrame(frame);else{run=false;g.clearRect(0,0,W,H)}
 }
 addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'||I.classList.contains('out'))return;
  const t=performance.now(),p=pts[pts.length-1];
  if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<2)return;
  pts.push({x:e.clientX,y:e.clientY,t});if(pts.length>70)pts.shift();
  if(Math.random()<.28)dust.push({x:e.clientX+rn(-6,6),y:e.clientY+rn(-6,6),vx:rn(-.6,.6),vy:rn(.2,1),t,l:rn(700,1300),s:rn(1,2.4),r:rn(0,1),c:Math.random()<.5?'#ecdcae':'#c8a96b'});
  if(!run){run=true;requestAnimationFrame(frame)}
 },{passive:true});
})();
