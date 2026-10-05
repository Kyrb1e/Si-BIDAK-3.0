(function(){
const PR={
 mc:{i:'MC',n:'Magnus Carlsen',s:'Norwegia · Juara Dunia 2013–2023',elo:2850,ms:1500,agg:.5,trade:.6,tol:30,v:.2,c:['#0e5a8a','#5ec4ff'],st:'universal & sabar',d:'Universal dan sabar: menekan sedikit demi sedikit, sangat kuat di endgame.'},
 nk:{i:'HN',n:'Hikaru Nakamura',s:'AS · Grandmaster & streamer',elo:2800,ms:700,agg:.72,trade:.35,tol:60,v:.45,c:['#7a1fa2','#ff7ab6'],st:'cepat & praktis',d:'Cepat dan praktis: suka posisi tajam, inisiatif, dan taktik.'},
 cr:{i:'FC',n:'Fabiano Caruana',s:'AS · Penantang Dunia 2018',elo:2800,ms:1500,agg:.5,trade:.5,tol:25,v:.15,c:['#8a1c1c','#ff8a65'],st:'teori & akurasi',d:'Persiapan teori mendalam dan akurasi tinggi. Buku dari partai Kejuaraan Dunia (data terbatas).'},
 fz:{i:'AF',n:'Alireza Firouzja',s:'Prancis · Talenta tajam',elo:2780,ms:800,agg:.8,trade:.3,tol:70,v:.5,c:['#0b6b4f','#6ee7b7'],st:'agresif',d:'Agresif dan berani mengambil risiko demi inisiatif dan serangan.'},
 fi:{i:'RF',n:'Bobby Fischer',s:'AS · Juara Dunia 1972',elo:2785,ms:1300,agg:.6,trade:.45,tol:35,v:.15,c:['#8a5a00','#ffd166'],st:'langsung & presisi',d:'Langsung dan presisi, setia pada repertoar andalannya.'},
 kp:{i:'GK',n:'Garry Kasparov',s:'Rusia · Juara Dunia 1985–2000',elo:2851,ms:1500,agg:.85,trade:.3,tol:50,v:.3,c:['#5b1a18','#ef5350'],st:'dinamis & menyerang',d:'Dinamis dan penuh energi: inisiatif, persiapan mendalam, serangan.'},
 ka:{i:'AK',n:'Anatoly Karpov',s:'Rusia · Juara Dunia 1975–1985',elo:2780,ms:1500,agg:.25,trade:.75,tol:30,v:.15,c:['#33415c','#9db4d6'],st:'posisional & profilaktik',d:'Posisional dan profilaktik: mempersempit ruang lawan, menukar bidak, menang lewat penguasaan.'},
 mo:{i:'PM',n:'Paul Morphy',s:'AS · Era Romantik 1850-an',elo:2250,ms:600,agg:.95,trade:.2,tol:100,v:.8,c:['#3d2b1f','#d7b98e'],st:'romantik & sacrifice',d:'Pengembangan cepat, posisi terbuka, pengorbanan demi serangan. Level disetel ke gaya klasik.'}};
Object.keys(PR).forEach(k=>PR[k].id=k);window.PRS=PR;
const BKI=JSON.parse($('bkinfo').textContent),BK={},M64=(1n<<64n)-1n;
BOT.p='';try{const q=localStorage.getItem('sibidak-bot2');if(q&&PR[q])BOT.p=q}catch(e){}
const sv=()=>{try{localStorage.setItem('sibidak-bot2',BOT.p)}catch(e){}};
const av=(P,s)=>AVF(P,s);
// kunci posisi = hash 64-bit dari 12 bitboard + giliran (sama dengan pembangun data)
function hashBB(w,t){let h=0xcbf29ce484222325n;for(const v of [...w,BigInt(t==='w'?0:1)]){h=((h^v)*0x100000001b3n)&M64;h^=h>>29n}return h}
const U=u=>{const p=u>>12;return 'abcdefgh'[u&7]+((u>>3&7)+1)+'abcdefgh'[u>>6&7]+((u>>9&7)+1)+(p?'nbrq'[p-1]:'')};
async function loadBook(id){
 if(BK[id]!==undefined)return BK[id];const el=$('bk-'+id);if(!el)return BK[id]=null;
 try{const b=Uint8Array.from(atob(el.textContent),c=>c.charCodeAt(0)),ab=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),n=new DataView(ab).getUint32(0,true);
  BK[id]={n,lo:new Uint32Array(ab,4,n),hi:new Uint32Array(ab,4+4*n,n),mv:new Uint16Array(ab,4+8*n,n),cn:new Uint16Array(ab,4+10*n,n),sc:new Uint8Array(ab,4+12*n,n)};
  habit(id);botUI()}catch(e){BK[id]=null}
 return BK[id]}
function ents(id,g){const B=BK[id];if(!B)return[];const h=hashBB(bbOf(g),g.turn()),lo=Number(h&0xFFFFFFFFn),hi=Number(h>>32n);
 let a=0,b=B.n;while(a<b){const m=a+b>>1;(B.hi[m]<hi||B.hi[m]===hi&&B.lo[m]<lo)?a=m+1:b=m}
 const r=[];for(;a<B.n&&B.hi[a]===hi&&B.lo[a]===lo;a++)r.push({u:U(B.mv[a]),n:B.cn[a],s:B.sc[a]});return r}
function legal(g,E){return E.map(e=>{const m=g.move({from:e.u.slice(0,2),to:e.u.slice(2,4),promotion:e.u[4]});if(m)g.undo();return m&&{u:e.u,san:m.san,n:e.n,s:e.s}}).filter(Boolean)}
function habit(id){const P=PR[id],t=[],w=(mv,lab)=>{const g=new Chess();mv.forEach(m=>g.move(m));const L=legal(g,ents(id,g)),T=L.reduce((a,x)=>a+x.n,0);
  if(T)t.push(lab+L.sort((a,b)=>b.n-a.n).slice(0,3).map(x=>x.san+' '+Math.round(100*x.n/T)+'%').join(', '))};
 w([],'Putih 1.');w(['e4'],'Hitam vs 1.e4: ');w(['d4'],'vs 1.d4: ');P.hab=t.join(' · ')}
function bookMove(P){const g=new Chess(game.fen()),L=legal(g,ents(P.id,game));if(!L.length)return null;
 const w=L.map(x=>Math.pow(x.n,1.2)*(.6+x.s/100));let r=Math.random()*w.reduce((a,b)=>a+b),i=0;while((r-=w[i])>0&&i<L.length-1)i++;
 const x=L[i];return{uci:x.u,info:'buku '+P.n.split(' ')[1]+': '+x.san+' dimainkan '+x.n+'× · skor '+x.s+'%'}}
// pemilihan langkah mesin bergaya: pilih dari kandidat MultiPV yang selisihnya kecil
function styled(l){const P=PR[BOT.p],best=l.split(' ')[1],C=Object.values(BOT.cands||{});
 if(C.length<2)return best;const dd=Math.max(...C.map(c=>c.d)),L=C.filter(c=>c.d>=dd-1).sort((a,b)=>b.cp-a.cp),top=L[0].cp,g=new Chess(BOT.fen);let bu=best,bs=-1e9;
 for(const c of L){if(top-c.cp>P.tol)continue;const m=g.move({from:c.u.slice(0,2),to:c.u.slice(2,4),promotion:c.u[4]});if(!m)continue;g.undo();
  const cap=/[ce]/.test(m.flags),chk=/[+#]/.test(m.san),s=c.cp/100+(cap||chk?(P.agg-.5)*.9:(.5-P.agg)*.3)+(cap&&m.piece!=='p'?(P.trade-.5)*.5:0)+(Math.random()-.5)*P.v;
  if(s>bs){bs=s;bu=c.u}}
 BOT.how='mesin · gaya '+P.st+(bu!==best?' (memilih langkah khas)':'');return bu}
const _bs=botSearch;
botSearch=function(){const P=PR[BOT.p];if(!P)return _bs();
 if(BK[P.id]===undefined){loadBook(P.id).then(()=>{if(BOT.on&&botIsTurn())analyse()});return}
 const fen=game.fen();BOT.fen=fen;anFen=fen;bestSan=null;$('ebest').disabled=true;
 const bm=BK[P.id]&&bookMove(P);
 if(bm){BOT.t0=performance.now()+250+Math.random()*900;BOT.thinking=false;BOT.how=bm.info;botApply('bestmove '+bm.uci,fen);return}
 const lim=P.elo<2850;sf.postMessage('setoption name UCI_LimitStrength value '+lim);if(lim)sf.postMessage('setoption name UCI_Elo value '+P.elo);BOT.lim=lim;
 sf.postMessage('setoption name MultiPV value 4');BOT.cands={};BOT.how='mesin · gaya '+P.st;
 sf.postMessage('position fen '+fen);sf.postMessage('go movetime '+P.ms);busy=true;BOT.thinking=true;BOT.t0=performance.now();botUI()};
const _os=onSF;
onSF=function(l){
 if(BOT.thinking&&BOT.cands&&PR[BOT.p]){
  if(l.startsWith('info')){const m=l.match(/ multipv (\d+).* score (cp|mate) (-?\d+).* pv (\S+)/),d=l.match(/ depth (\d+)/);
   if(m&&d)BOT.cands[m[1]]={d:+d[1],cp:m[2]==='mate'?(+m[3]>0?1e4:-1e4):+m[3],u:m[4]}}
  else if(l.startsWith('bestmove')&&l.split(' ')[1]!=='(none)'){sf.postMessage('setoption name MultiPV value 1');l='bestmove '+styled(l)}}
 _os(l)};
const _bu=botUI;
botUI=function(){_bu();const P=PR[BOT.p],g=$('pgrid');
 if(g){g.innerHTML='';[['',null]].concat(Object.entries(PR)).forEach(([k,Q])=>{const b=document.createElement('button');b.type='button';b.className='pc';b.setAttribute('aria-pressed',String(BOT.p===k));
  b.innerHTML=(Q?av(Q,52):'<span class="sfav">SF</span>')+'<b>'+(Q?Q.n:'Stockfish')+'</b><small>'+(Q?Q.s:'Level bebas · Elo 1320–maks')+'</small>'+(Q?'<i class="bar" title="Gaya: posisional ← → agresif"><u style="width:'+Q.agg*100+'%"></u></i>':'');
  b.onclick=()=>{BOT.p=k;sv();if(Q)loadBook(k);botUI()};g.append(b)})}
 $('botlv').parentElement.hidden=$('botlv2').parentElement.hidden=!!P;
 if(!P){$('bothab').textContent='';return}
 const bi=BKI[P.id]||{};$('botdesc').textContent='≈ Elo '+P.elo+' — '+P.d+' Buku pembukaan: '+(bi.e?bi.e.toLocaleString('id-ID')+' langkah dari '+(bi.g||0).toLocaleString('id-ID')+' partai.':'tidak tersedia.');
 $('bothab').textContent=P.hab?'Kebiasaan di database: '+P.hab:(BK[P.id]===undefined?'Memuat buku pembukaan…':'');
 if(!BOT.on)return;
 $('botav').innerHTML=av(P,36);$('botav').classList.toggle('th',!!(BOT.thinking||BOT.pending));$('botname').textContent=P.n;
 $('botelo').textContent=' ≈ Elo '+P.elo+' · memegang '+(BOT.side==='w'?'Putih':'Hitam');
 if(BOT.last&&BOT.how)$('botlast').textContent='Langkah terakhir bot: '+BOT.last+' — '+BOT.how};
const _st=strips;
strips=function(){_st();const P=PR[BOT.p];if(!P||!BOT.on)return;
 ['pTop','pBot'].forEach(i=>{const e=$(i);e.innerHTML=e.innerHTML.replace(/Stockfish · [^<]+<\/b>(<span class="pel">[^<]*<\/span>)?/,P.n+'</b><span class="pel">≈ Elo '+P.elo+'</span>').replace(/<span class="pk"><img alt="" src="[^"]*"><\/span>(<b>[^<]*<\/b><span class="pel">≈ Elo \d+<\/span>)/,(m,x)=>m.includes(P.n)?'<span class="pk">'+av(P,24)+'</span>'+x:m)})};
botUI();
})();
