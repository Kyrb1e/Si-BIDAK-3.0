(function(){const I=document.getElementById('intro'),H=document.getElementById('homebtn'),
 MODES=[{t:'Chess Repertoire',d:'Jelajahi pembukaan dari database partai master, lalu lawan bot dengan gaya dan kebiasaan para juara dunia.',
  ic:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8h24a6 6 0 016 6v26H15a6 6 0 01-6-6z"/><path d="M15 40a6 6 0 010-12h24M19 15h12M19 21h8"/></svg>',go:()=>show(false)}];
 function show(on){if(!on)I.classList.remove('rA','rB');I.classList.toggle('out',!on);document.body.style.overflow=on?'hidden':'';H.hidden=on;if(!on)window.scrollTo(0,0)}
 const m=document.getElementById('inm');
 MODES.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='mode';b.innerHTML=x.ic+'<b>'+x.t+'</b><span>'+x.d+'</span><i>Mulai ▸</i>';b.onclick=x.go;m.append(b)});
 const r=document.getElementById('inr');Object.values(window.PRS||{}).forEach((P,i)=>{const d=document.createElement('div');d.style.animationDelay=(i*.35)+'s';d.title=P.n;d.innerHTML=AVF(P,72)+'<small>'+P.n.split(' ').pop()+'</small>';r.append(d)});
 let fl=0;
 window.goHome=(cx,cy)=>{if(!I.classList.contains('out'))return;mateHide();fl^=1;I.style.setProperty('--cx',cx+'px');I.style.setProperty('--cy',cy+'px');
  I.className='';void I.offsetWidth;I.classList.add(fl?'rA':'rB');document.body.style.overflow='hidden';H.hidden=true;window.scrollTo(0,0);
  FX.ring(cx,cy);FX.burst(cx,cy,90);setTimeout(()=>{FX.burst(innerWidth/2,innerHeight*.35,70);FX.rain(30)},700);
  setTimeout(()=>{const b=m.querySelector('button');b&&b.focus({preventScroll:true})},1100)};
 const hd=document.querySelector('header');[hd.querySelector('svg.logo'),hd.querySelector('div')].forEach(el=>{if(!el)return;el.setAttribute('role','button');el.tabIndex=0;el.title='Kembali ke beranda';
  const f=()=>{const r=el.getBoundingClientRect();goHome(r.left+r.width/2,r.top+r.height/2)};el.onclick=f;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}}});
 H.onclick=()=>{const r=H.getBoundingClientRect();goHome(r.left+r.width/2,r.top+r.height/2)};show(true);setTimeout(()=>{const b=m.querySelector('button');b&&b.focus({preventScroll:true})},300)})();
