const $=id=>document.getElementById(id);
const game=new Chess();let sel=null,flip=false,src='masters',req=0,pend=null;
/* ===== Mode lawan bot & strip pemain ===== */
const LV=[
 {n:'Pemula',elo:1320,ms:250,d:'Sering terlewat taktik sederhana. Cocok untuk melatih dasar.'},
 {n:'Klub',elo:1600,ms:400,d:'Setara pemain klub: menjaga bidak, tetapi mudah terpancing jebakan.'},
 {n:'Menengah',elo:1900,ms:600,d:'Solid dan jarang menggantung bidak. Butuh rencana yang jelas untuk menang.'},
 {n:'Mahir',elo:2300,ms:900,d:'Taktik tajam dan endgame rapi, setara kandidat master.'},
 {n:'Master',elo:2700,ms:1200,d:'Sekelas grandmaster: hampir tanpa kesalahan taktis.'},
 {n:'Maksimum',elo:0,ms:1500,d:'Kekuatan penuh Stockfish tanpa pembatasan.'}];
const BOT={on:false,side:'b',lv:2,pref:'auto',thinking:false,pending:false,fen:null,t0:0,mv:false,lim:false,last:'',msg:''};
try{const q=JSON.parse(localStorage.getItem('sibidak-bot')||'null');if(q){if(LV[q.lv])BOT.lv=q.lv;if(['auto','w','b'].includes(q.side))BOT.pref=q.side}}catch(e){}
const botIsTurn=()=>BOT.on&&!game.game_over()&&game.turn()===BOT.side;
const botSave=()=>{try{localStorage.setItem('sibidak-bot',JSON.stringify({lv:BOT.lv,side:BOT.pref}))}catch(e){}};
function botStart(){const h=BOT.pref==='auto'?game.turn():BOT.pref;BOT.side=h==='w'?'b':'w';BOT.on=true;BOT.last='';BOT.msg='';
 if(flip!==(h==='b'))$('flip').click();botSave();sel=null;update()}
function botStop(msg){if(!BOT.on)return;BOT.on=false;BOT.pending=false;BOT.msg=msg||'';if(busy){queued=true;sf.postMessage('stop')}BOT.thinking=false;botUI()}
function botSearch(){const v=LV[BOT.lv];BOT.fen=game.fen();anFen=BOT.fen;bestSan=null;$('ebest').disabled=true;
 if(v.elo){sf.postMessage('setoption name UCI_LimitStrength value true');sf.postMessage('setoption name UCI_Elo value '+v.elo);BOT.lim=true}
 else if(BOT.lim){sf.postMessage('setoption name UCI_LimitStrength value false');BOT.lim=false}
 sf.postMessage('position fen '+BOT.fen);sf.postMessage('go movetime '+v.ms);busy=true;BOT.thinking=true;BOT.t0=performance.now();botUI()}
function botApply(l,fen){const u=l.split(' ')[1];if(!BOT.on||!u||u==='(none)'||game.fen()!==fen)return;
 const t=new Chess(fen),m=t.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});if(!m)return;
 BOT.pending=true;botUI();
 setTimeout(()=>{BOT.pending=false;if(!BOT.on||game.fen()!==fen){botUI();return}BOT.last=m.san;BOT.mv=true;try{play(m.san)}finally{BOT.mv=false}},Math.max(0,600-(performance.now()-BOT.t0)))}
const MVAL={p:1,n:3,b:3,r:5,q:9};
function strips(){const T=$('pTop');if(!T)return;let w=0,b=0;
 game.board().forEach(r=>r.forEach(p=>{if(p&&p.type!=='k'){if(p.color==='w')w+=MVAL[p.type];else b+=MVAL[p.type]}}));
 const mk=c=>{const bot=BOT.on&&c===BOT.side,adv=(c==='w'?w-b:b-w),act=!game.game_over()&&game.turn()===c,th=bot&&(BOT.thinking||BOT.pending),v=LV[BOT.lv];
  return '<span class="pk"><img alt="" src="'+PC[c+'K']+'"></span><b>'+(BOT.on?(bot?'Stockfish · '+v.n:'Anda'):(c==='w'?'Putih':'Hitam'))+'</b>'
   +(bot&&v.elo?'<span class="pel">≈ Elo '+v.elo+'</span>':'')+(adv>0?'<span class="padv">+'+adv+'</span>':'')
   +(th?'<span class="dots"><i></i><i></i><i></i></span>':'')+(act?'<span class="pturn">giliran</span>':'')};
 const bt=flip?'b':'w',tp=flip?'w':'b';
 T.innerHTML=mk(tp);$('pBot').innerHTML=mk(bt);
 T.className='pstrip'+(game.turn()===tp&&!game.game_over()?' on':'');$('pBot').className='pstrip'+(game.turn()===bt&&!game.game_over()?' on':'')}
function botChips(box,cur,items,fn){box.innerHTML='';items.forEach(([k,t])=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-pressed',String(k===cur));b.onclick=()=>fn(k);box.append(b)})}
function botUI(){const sd=$('botsd');if(!sd)return;const v=LV[BOT.lv];
 $('botsetup').hidden=BOT.on;$('botlive').hidden=!BOT.on;
 const lvItems=LV.map((x,i)=>[i,x.n]),setLv=i=>{BOT.lv=i;botSave();botUI()};
 botChips(sd,BOT.pref,[['auto','Giliran sekarang'],['w','Putih'],['b','Hitam']],k=>{BOT.pref=k;botSave();botUI()});
 botChips($('botlv'),BOT.lv,lvItems,setLv);botChips($('botlv2'),BOT.lv,lvItems,setLv);
 $('botdesc').textContent=(v.elo?'≈ Elo '+v.elo:'Tanpa batas')+' — '+v.d+(BOT.msg?' ('+BOT.msg+')':'');
 if(!BOT.on)return;
 const h=BOT.side==='w'?'b':'w';let st,cl='';
 if(game.game_over()){st=game.in_checkmate()?(game.turn()===BOT.side?'Anda menang':'Bot menang'):'Remis';cl='end'}
 else if(botIsTurn()){st='Bot berpikir';cl='th'}else st='Giliran Anda';
 $('botav').innerHTML='<img alt="" src="'+PC.bN+'">';$('botname').textContent='Stockfish · '+v.n;
 $('botelo').textContent=' '+(v.elo?'≈ Elo '+v.elo:'kekuatan penuh')+' · bot memegang '+(BOT.side==='w'?'Putih':'Hitam');
 const s=$('botst');s.textContent=st;s.className='bot-st '+cl;$('botthink').className='think'+(cl==='th'?' on':'');
 $('botlast').textContent=BOT.last?'Langkah terakhir bot: '+BOT.last:'Anda memegang '+(h==='w'?'Putih':'Hitam')+'. Klik bidak untuk melanjutkan permainan.'}
document.addEventListener('DOMContentLoaded',()=>{});

function hs(s,o){let h=o>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')}
function key(g){const f=g.fen().split(' ').slice(0,4).join(' ');return hs(f,0x811c9dc5)+hs(f,0x050c5d1f)}
function draw(){
 const b=$('board');b.innerHTML='';const bd=game.board(),h=game.history({verbose:true}),lm=h[h.length-1];
 const targets=sel?game.moves({square:sel,verbose:true}):[],ept=targets.find(m=>m.flags.includes('e')),epSq=ept?ept.to[0]+ept.from[1]:null;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const rr=flip?7-r:r,cc=flip?7-c:c,p=bd[rr][cc],n='abcdefgh'[cc]+(8-rr),el=document.createElement('div');
  el.className='sq '+((rr+cc)%2?'d':'l');el.dataset.sq=n;el.tabIndex=0;el.setAttribute('role','gridcell');
  el.setAttribute('aria-label',n+(p?' '+p.color+p.type:''));
  if(c===0){const s=document.createElement('span');s.className='co r';s.textContent=8-rr;el.append(s)}
  if(r===7){const s=document.createElement('span');s.className='co f';s.textContent='abcdefgh'[cc];el.append(s)}
  if(p){const i=document.createElement('img');i.alt='';i.src=PC[p.color+p.type.toUpperCase()];el.append(i);
   if(p.type==='k'&&p.color===game.turn()&&game.in_check())el.classList.add('chk')}
  if(lm&&(lm.from===n||lm.to===n))el.classList.add('last');
  if(sel===n)el.classList.add('sel');
  const t=targets.find(m=>m.to===n);if(t)el.classList.add(p||t.flags.includes('e')?'cap':'mv');
  if(t&&!(p||t.flags.includes('e')))el.classList.add('mv');if(n===epSq)el.classList.add('epc');
  b.append(el)}
 $('status').textContent=game.in_checkmate()?'Skakmat. '+(game.turn()==='w'?'Hitam':'Putih')+' menang.':game.game_over()?'Permainan seri.':(game.turn()==='w'?'Giliran putih':'Giliran hitam')+(game.in_check()?' (skak)':'');
 if(MK.fen!==game.fen()){MK.c.clear();MK.a.clear();MK.fen=game.fen()}renderMarks();$('undo').disabled=!h.length;
 const H=$('hist');H.innerHTML='';const sn=game.history();
 sn.forEach((m,i)=>{if(i%2===0){const b2=document.createElement('b');b2.textContent=(i/2+1)+'.';H.append(b2)}
  const s=document.createElement('span');s.textContent=m;if(i===sn.length-1)s.className='cur';s.onclick=()=>{while(game.history().length>i+1)game.undo();sel=null;update()};H.append(s)});
 if(!sn.length)H.innerHTML='<b></b><span style="cursor:default">Belum ada langkah.</span>';
}
function update(){draw();bookView();explain();dbView();loadStats();strips();botUI();analyse()}
function play(m){if(BOT.on&&!BOT.mv&&game.turn()===BOT.side)return;game.move(m);sel=null;pend=null;$('promo').className='';update()}
function click(n){
 if(BOT.on&&game.turn()===BOT.side)return;
 if(sel){const m=game.moves({square:sel,verbose:true}).filter(x=>x.to===n);
  if(m.length&&m[0].promotion){pend={from:sel,to:n};const P=$('promo');P.className='on';P.innerHTML='';
   ['q','r','b','n'].forEach(t=>{const bt=document.createElement('button');bt.setAttribute('aria-label','Promosi '+t);const i=document.createElement('img');i.alt='';i.src=PC[game.turn()+t.toUpperCase()];bt.append(i);bt.onclick=()=>play({from:pend.from,to:pend.to,promotion:t});P.append(bt)});return}
  if(m.length){play({from:sel,to:n});return}}
 const p=game.get(n);sel=p&&p.color===game.turn()?n:null;draw()}
$('board').addEventListener('click',e=>{const s=e.target.closest('.sq');if(s)click(s.dataset.sq)});
$('board').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const s=e.target.closest('.sq');if(s){e.preventDefault();click(s.dataset.sq)}}});
$('undo').onclick=()=>{game.undo();if(BOT.on&&game.turn()===BOT.side&&game.history().length)game.undo();BOT.pending=false;sel=null;update()};
$('reset').onclick=()=>{game.reset();sel=null;update()};
$('flip').onclick=()=>{flip=!flip;draw();strips()};
function bookView(){
 const g=new Chess(),hist=game.history();let best=null,bestPly=0;
 if(P[key(g)]&&P[key(g)][0]>=0){best=P[key(g)][0]}
 hist.forEach((m,i)=>{g.move(m);const e=P[key(g)];if(e&&e[0]>=0){best=e[0];bestPly=i+1}});
 const cur=P[key(game)];
 if(best!==null){const b=BOOK[best];$('eco').style.display='';$('eco').textContent=b[0];$('oname').textContent=b[1];
  $('line').textContent=b[2].split(' ').map((x,j)=>j%2?x:(j/2+1)+'. '+x).join(' ');
  const out=hist.length-bestPly;$('ofb').textContent=out>0?'Posisi sekarang berjarak '+out+' langkah dari posisi terakhir yang tercatat.':(hist.length?'Dikenali berdasarkan posisi, bukan urutan langkah.':'')}
 else{$('eco').style.display='none';$('oname').textContent=hist.length?'Di luar buku pembukaan':'Posisi awal';$('line').textContent='';$('ofb').textContent=hist.length?'Belum ada pembukaan tercatat untuk posisi ini.':'Mainkan langkah pertama untuk mulai.'}
 BEST=best;bookRows(cur);
}
const nf=x=>x.toLocaleString('id-ID');
function loadStats(){}

let sf=null,sfReady=false,busy=false,queued=false,anFen=null,bestSan=null,lastEv=null;
function engMsg(t){$('emsg').textContent=t}
const MODES=['blob','data','main'];let mi=0,mode='',tm=null,uciOk=false;
const rawB=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));
function workerEngine(kind){
 const code='self.__WASMBIN=Uint8Array.from(atob("'+SFWASM+'"),c=>c.charCodeAt(0));\n'+new TextDecoder().decode(rawB(SFJS));
 const url=kind==='blob'?URL.createObjectURL(new Blob([code],{type:'text/javascript'})):'data:text/javascript;charset=utf-8,'+encodeURIComponent(code);
 return new Worker(url);
}
function mainEngine(){
 const js=new TextDecoder().decode(rawB(SFJS)),a={postMessage:null,onmessage:null,onerror:null};
 const fs={__WASMBIN:rawB(SFWASM),location:{hash:'',origin:'',pathname:''}};
 const handler=new Function('self','postMessage','onmessage','window',js+';\nreturn onmessage;')(fs,l=>setTimeout(()=>a.onmessage&&a.onmessage({data:l}),0),null,undefined);
 a.postMessage=m=>setTimeout(()=>handler({data:m}),0);a.terminate=()=>{};return a;
}
function initSF(){
 clearTimeout(tm);if(sf&&sf.terminate)try{sf.terminate()}catch(e){}sf=null;sfReady=false;busy=false;queued=false;
 if(mi>=MODES.length){engMsg('Mesin tidak dapat dimuat di lingkungan ini. Unduh file ini dan buka langsung di Chrome, Edge, atau Firefox.');return}
 mode=MODES[mi++];uciOk=false;
 try{sf=mode==='main'?mainEngine():workerEngine(mode)}catch(e){initSF();return}
 sf.onerror=()=>initSF();
 sf.onmessage=e=>onSF(typeof e.data==='string'?e.data:String(e.data));
 if(mode==='main')$('edp').value='12';
 tm=setTimeout(()=>{if(!uciOk)initSF()},7000);
 sf.postMessage('uci');
}
function onSF(l){
 if(l==='uciok'){uciOk=true;clearTimeout(tm);sf.postMessage('isready')}
 else if(l==='readyok'){sfReady=true;engMsg('Stockfish 19 (lite) siap'+(mode==='main'?' (mode ringan, kedalaman 12 disarankan).':'.'));analyse()}
 else if(l.startsWith('bestmove')){const wb=BOT.thinking,bf=BOT.fen;BOT.thinking=false;busy=false;if(queued){queued=false;analyse();return}if(wb)botApply(l,bf)}
 else if(l.startsWith('info')&&!queued&&anFen){
  const sc=l.match(/ score (cp|mate) (-?\d+)/),pv=l.match(/ pv (.+)$/),d=l.match(/ depth (\d+)/);
  if(!sc||!pv||!d)return;{const mp=l.match(/ multipv (\d+)/);if(mp&&+mp[1]>1)return}
  const w=anFen.split(' ')[1]==='w',v=+sc[2];
  showEval(sc[1],w?v:-v,+d[1],pv[1].split(' '));
 }
}
function setBar(pct,lab,whiteWins){$('eclass').textContent='';
 $('evw').style.height=pct+'%';$('ev').classList.toggle('fl',flip);
 const l=$('evl');l.textContent=lab;
 const top=(whiteWins!==flip)?false:true; // label sits on the winning side
 l.style.top=top?'0':'auto';l.style.bottom=top?'auto':'0';
 l.style.color=whiteWins?'#000':'#fff';
 $('ev').setAttribute('aria-label','Evaluasi Stockfish: '+lab);
}
function showEval(kind,v,depth,pv){
 lastEv=[kind,v,depth,pv];
 let pct,lab,txt;
 if(kind==='mate'){pct=v>0?100:0;lab='M'+Math.abs(v);txt=(v>0?'+':'−')+'M'+Math.abs(v)}
 else{pct=50+50*(2/(1+Math.exp(-0.00368208*v))-1);lab=(v>=0?'+':'−')+(Math.abs(v)/100).toFixed(1);txt=lab}
 setBar(Math.max(2,Math.min(98,pct)),lab,v>=0);
 $('eval').textContent=txt;$('edepth').textContent='kedalaman '+depth;$('eclass').textContent=evClass(kind,v);
 try{const g=new Chess(anFen);const out=[];let n=parseInt(anFen.split(' ')[5])||1,w=g.turn()==='w';bestSan=null;
  pv.slice(0,8).forEach((u,i)=>{const m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});if(!m)return;if(i===0)bestSan=m.san;
   out.push((w?n+'. ':(i===0?n+'… ':''))+m.san);if(!w)n++;w=!w});
  $('pv').textContent=out.join(' ');$('ebest').disabled=!(bestSan&&anFen===game.fen())}catch(e){}
}
function analyse(){
 if(!sf||!sfReady)return;
 if(!$('eon').checked&&!botIsTurn()){$('pv').textContent='';$('eval').textContent='–';$('edepth').textContent='';setBar(50,'–',true);$('ebest').disabled=true;return}
 if(game.game_over()){if(busy){queued=true;sf.postMessage('stop')}
  const mate=game.in_checkmate(),wWins=game.turn()==='b';
  setBar(mate?(wWins?100:0):50,mate?(wWins?'1-0':'0-1'):'½',mate?wWins:true);
  $('eval').textContent=mate?(wWins?'1-0':'0-1'):'½-½';$('edepth').textContent='';$('pv').textContent='';$('ebest').disabled=true;anFen=null;return}
 if(busy){queued=true;sf.postMessage('stop');return}
 if(botIsTurn()){if(!BOT.pending)botSearch();return}
 anFen=game.fen();bestSan=null;$('ebest').disabled=true;
 if(BOT.lim){sf.postMessage('setoption name UCI_LimitStrength value false');BOT.lim=false}
 sf.postMessage('position fen '+anFen);sf.postMessage('go depth '+$('edp').value);busy=true;
}
$('eon').onchange=()=>{if(!$('eon').checked&&busy){sf.postMessage('stop')}analyse()};
$('edp').onchange=analyse;
$('ebest').onclick=()=>{if(bestSan&&anFen===game.fen())play(bestSan)};
const _fl=$('flip').onclick;$('flip').onclick=()=>{_fl();if(lastEv)showEval(...lastEv)};
const GROUPS=[["Bawaan", ["itb", "klasik", "modern", "malam", "neon"]], ["Peradaban kuno", ["roma", "yunani", "mesir", "maya", "tiongkok", "mughal", "viking", "abad"]], ["Nusantara dan Asia Timur", ["nusantara", "batik", "jepang", "samurai"]], ["Alam", ["samudra", "hutan"]]],NAMES={"itb": "ITB", "klasik": "Klasik", "roma": "Roma", "mesir": "Mesir Kuno", "nusantara": "Nusantara", "modern": "Modern", "jepang": "Jepang", "malam": "Malam", "yunani": "Yunani", "viking": "Viking", "abad": "Abad Pertengahan", "tiongkok": "Tiongkok", "mughal": "India Mughal", "maya": "Maya", "samudra": "Samudra", "hutan": "Hutan", "neon": "Neon", "batik": "Batik Sogan", "samurai": "Samurai"};
const tsel=$('themesel');
GROUPS.forEach(([g,ids])=>{const og=document.createElement('optgroup');og.label=g;ids.forEach(id=>{const o=document.createElement('option');o.value=id;o.textContent=NAMES[id];og.append(o)});tsel.append(og)});
function setTheme(id,save){if(!NAMES[id])id='itb';document.documentElement.dataset.theme=id;tsel.value=id;if(save)try{localStorage.setItem('percama-theme',id)}catch(e){}}
tsel.onchange=()=>setTheme(tsel.value,true);
let st=null;try{st=localStorage.getItem('percama-theme')}catch(e){}
setTheme(st||(matchMedia('(prefers-color-scheme: dark)').matches?'malam':'itb'),false);
/* ===== Database PGN ===== */
var DBG=[],DBI=new Map(),DBSEEN=null,DBBUSY=false;const DBMAX=30;
const mv1=(g,x)=>g.move(x)||g.move(x,{sloppy:true});
const rt=i=>Math.max(DBG[i][2],DBG[i][3]);
const pc=(a,b)=>Math.round(a/(b||1)*100)+'%';
const sigOf=(w,b,d,r,m)=>(w+'|'+b+'|'+d+'|'+r+'|'+m.slice(0,40).join(' ')).toLowerCase();
function idbo(){return new Promise((ok,no)=>{const r=indexedDB.open('sibidak',1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function dbPut(k,v){const d=await idbo();return new Promise((ok,no)=>{const t=d.transaction('k','readwrite');t.objectStore('k').put(v,k);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
async function dbGet(k){const d=await idbo();return new Promise((ok,no)=>{const q=d.transaction('k').objectStore('k').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
function parseGame(t){
 const h={};t.replace(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/gm,(a,k,v)=>{h[k]=v;return''});
 let mt=t.replace(/^\[.*\]\s*$/gm,'').replace(/\{[^}]*\}/g,' ').replace(/;.*$/gm,' '),p;
 do{p=mt;mt=mt.replace(/\([^()]*\)/g,' ')}while(p!==mt);
 const mv=mt.replace(/\$\d+/g,' ').replace(/\d+\.(\.\.)?/g,' ').split(/\s+/).map(x=>x.replace(/[!?]+$/,'')).filter(x=>x&&!/^(1-0|0-1|1\/2-1\/2|\*)$/.test(x));
 return{h,mv}}
function addGame(t,minE){
 const{h,mv}=parseGame(t),we=+h.WhiteElo||0,be=+h.BlackElo||0,res=h.Result,r=res==='1-0'?0:res==='1/2-1/2'?1:res==='0-1'?2:-1;
 if(!mv.length||r<0||Math.max(we,be)<minE)return 0;
 const sg=sigOf(h.White||'',h.Black||'',h.Date||'',res,mv);if(DBSEEN.has(sg))return 2;DBSEEN.add(sg);
 const id=DBG.length;DBG.push([h.White||'?',h.Black||'?',we,be,h.Event||'',h.Date||'',res,mv.join(' ')]);
 const g=new Chess();
 for(let i=0;;i++){
  const e0=(()=>{const k=key(g);let e=DBI.get(k);if(!e){e={n:0,r:[0,0,0],m:{},g:[]};DBI.set(k,e)}return e})();
  e0.n++;e0.r[r]++;e0.g.push(id);if(e0.g.length>6){e0.g.sort((a,b)=>rt(b)-rt(a));e0.g.pop()}
  if(i>=mv.length||i>=DBMAX)break;
  const m=mv1(g,mv[i]);if(!m)break;
  const x=e0.m[m.san]||(e0.m[m.san]=[0,0,0,0]);x[0]++;x[r+1]++}
 return 1}
async function dbImport(files){
 if(DBBUSY||!files.length)return;DBBUSY=true;const minE=+$('dbelo').value||0,m=$('dbmsg');let add=0,dup=0,skip=0;
 if(!DBSEEN){DBSEEN=new Set();DBG.forEach(r=>DBSEEN.add(sigOf(r[0],r[1],r[5],r[6],r[7].split(' ',40))))}
 try{for(const f of files){m.textContent='Membaca '+f.name+'…';const parts=(await f.text()).split(/\r?\n(?=\[Event\s)/);
   for(let i=0;i<parts.length;i++){const r=addGame(parts[i],minE);if(r===1)add++;else if(r===2)dup++;else skip++;
    if(i%100===99){m.textContent=f.name+': '+nf(i+1)+' / '+nf(parts.length)+' partai diproses…';await new Promise(z=>setTimeout(z))}}}
  m.textContent='Menyimpan ke browser…';await dbPut('games',DBG);await dbPut('idx',DBI);
  m.textContent='Selesai: +'+nf(add)+' partai baru, '+nf(dup)+' duplikat, '+nf(skip)+' dilewati (Elo < '+minE+' atau tidak valid).'}
 catch(e){m.textContent='Gagal: '+e.message}
 DBBUSY=false;update()}
function loadGame(id,GL){GL=GL||DBG;botStop('Sesi bot dihentikan karena partai lain dimuat.');game.reset();for(const x of GL[id][7].split(' '))if(!mv1(game,x))break;sel=null;update()}
function dbView(){
 const box=$('dbres');box.innerHTML='';
 const nu=DBI.size?Math.max(DBG.length,(DBI.get(key(new Chess()))||{n:0}).n):0,
  nE=DSRC==='my'?nu:(EMBN[DSRC]||0),sz=DSRC==='my'?DBI.size:(EMBS[DSRC]||0);
 $('dbclr').disabled=$('dbexp').disabled=!nu;$('dboff').disabled=!nu&&!EMBREADY;
 $('dbcount').textContent=nE?nf(nE)+' partai · '+nf(sz)+' posisi · '+SRCN[DSRC]+(DSRC==='my'?' (indeks '+DBMAX+' ply pertama)':''):(DSRC==='my'||EMBREADY?'Belum ada data di sumber ini.':'Memuat database tertanam…');
 if(!nE){box.innerHTML=DSRC==='my'?'<p class="cnt">Muat file PGN (mis. <b>gm_games.pgn</b> dari PGN Builder) untuk melihat statistik langkah dan partai master di setiap posisi.</p>':'';return}
 const e=SE(key(game));
 if(!e){box.innerHTML='<p class="cnt">Posisi ini tidak ditemukan di sumber data terpilih.</p>';return}
 const t=e.n||1;
 box.innerHTML='<p class="cnt">'+nf(e.n)+' partai melewati posisi ini</p><div class="wdl"><i style="width:'+e.r[0]/t*100+'%;background:#fff"></i><i style="width:'+e.r[1]/t*100+'%;background:#8a8a8a"></i><i style="width:'+e.r[2]/t*100+'%;background:#000"></i></div>';
 if(DSRC==='cw'||DSRC==='cb'){const c=DSRC==='cw'?'w':'b',p=document.createElement('p');p.className='cnt';
  p.textContent='Carlsen memegang '+(c==='w'?'Putih':'Hitam')+' di semua partai ini. Giliran sekarang: '+(game.turn()==='w'?'Putih':'Hitam')+(game.turn()===c?' — langkah di bawah adalah pilihan Carlsen.':' — langkah di bawah adalah jawaban lawan Carlsen.');box.append(p)}
 const ms=Object.entries(e.m).sort((a,b)=>b[1][0]-a[1][0]).slice(0,12);
 if(ms.length){const tb=document.createElement('table'),bd=document.createElement('tbody');
  tb.innerHTML='<thead><tr><th>Langkah</th><th>Partai</th><th>Putih / Remis / Hitam</th></tr></thead>';
  ms.forEach(([san,x])=>{const tr=document.createElement('tr');tr.className='go';tr.tabIndex=0;
   [san,nf(x[0]),pc(x[1],x[0])+' / '+pc(x[2],x[0])+' / '+pc(x[3],x[0])].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});
   tr.onclick=()=>play(san);tr.onkeydown=ev=>{if(ev.key==='Enter')play(san)};bd.append(tr)});
  tb.append(bd);box.append(tb)}
 if(!e.g.length)return;const GL=e.G||DBG,p=document.createElement('p');p.className='cnt';p.textContent='Partai contoh di posisi ini (klik untuk memuat):';box.append(p);
 const ul=document.createElement('ul');ul.className='gl';
 e.g.forEach(id=>{const r=GL[id];if(!r)return;const li=document.createElement('li');li.tabIndex=0;
  li.textContent=r[0]+(r[2]?' ('+r[2]+')':'')+' – '+r[1]+(r[3]?' ('+r[3]+')':'')+'   '+r[6];
  const sm=document.createElement('small');sm.textContent=[r[4],r[5].slice(0,4)].filter(Boolean).join(' · ');li.append(sm);
  li.onclick=()=>loadGame(id,GL);li.onkeydown=ev=>{if(ev.key==='Enter')loadGame(id,GL)};ul.append(li)});
 box.append(ul)}
$('dbfile').onchange=ev=>{const f=[...ev.target.files];ev.target.value='';const js=f.filter(x=>/\.json$/i.test(x.name)),pg=f.filter(x=>!/\.json$/i.test(x.name));js.forEach(importStats);if(pg.length)dbImport(pg)};
$('dbclr').onclick=async()=>{if(!confirm('Hapus seluruh database PGN dari browser ini?'))return;DBG=[];DBI=new Map();DBSEEN=null;try{await dbPut('games',[]);await dbPut('idx',new Map())}catch(e){}$('dbmsg').textContent='Database dihapus.';update()};
dbGet('games').then(async g=>{const i=await dbGet('idx');if(i&&i.size){DBG=g||[];DBI=i;update()}}).catch(()=>{});

/* ===== Penjelasan & line ===== */
const FAM=[[/Ruy Lopez/,'Putih menekan kuda c6 yang membela bidak e5, sehingga tekanan di pusat bertambah secara bertahap. Hitam biasanya mempertahankan e5, mengembangkan bidak, lalu rokade.'],
[/Sicilian/,'Hitam melawan e4 dengan c5 untuk menciptakan posisi tidak simetris. Putih umumnya menyerang di sisi raja, sementara Hitam menekan di sayap menteri.'],
[/French/,'Hitam menyiapkan d5 dengan rantai bidak e6–d5. Posisinya kokoh, tetapi gajah c8 sering terhambat dan Hitam harus mencari permainan balik di c5 atau f6.'],
[/Caro-Kann/,'Hitam menyiapkan d5 lewat c6 sambil menjaga gajah c8 tetap bebas. Struktur bidaknya sehat dan risikonya kecil.'],
[/Italian|Giuoco|Two Knights/,'Putih mengarahkan gajah ke c4 untuk menekan f7, lalu bersiap membangun pusat dengan c3 dan d4. Permainan terbuka dan penuh taktik.'],
[/Queen's Gambit Declined/,'Hitam menolak bidak c4 dan menjaga pusat dengan e6. Posisi solid, dengan tugas utama membebaskan gajah c8.'],
[/Queen's Gambit Accepted/,'Hitam menerima bidak c4 lalu mengembalikannya demi mengembangkan bidak dan melawan pusat Putih.'],
[/Queen's Gambit/,'Putih menawarkan bidak c4 untuk memenangkan kendali pusat lewat d4 dan c4.'],
[/Slav/,'Hitam menjaga d5 dengan c6 tanpa mengurung gajah c8. Pilihan solid yang sulit ditembus.'],
[/King's Indian/,'Hitam membiarkan Putih membangun pusat besar, lalu menyerangnya dengan ...e5 atau ...c5 dan serangan di sisi raja.'],
[/Nimzo|Queen's Indian|Bogo/,'Hitam mengendalikan e4 lewat gajah dan kuda, serta sering menekan struktur bidak Putih tanpa menempati pusat secara langsung.'],
[/Gr.nfeld/,'Hitam memberi Putih pusat luas lalu menyerangnya dari luar dengan ...c5 dan tekanan gajah g7.'],
[/English/,'Putih mengendalikan d5 dari sayap lewat c4, sering bertransposisi ke pembukaan bidak-menteri atau Sisilia terbalik.'],
[/London/,'Putih mengembangkan gajah ke f4 dan membangun sistem yang fleksibel: d4, e3, Nf3, c3.'],
[/Scandinavian/,'Hitam langsung menantang e4 dengan d5. Menteri keluar dini, jadi Putih mengincar perkembangan yang lebih cepat.'],
[/Pirc|Modern|Alekhine/,'Hitam sengaja menunda pusat dan menyerangnya setelah Putih maju, dengan permainan hipermodern.'],
[/Dutch/,'Hitam mengendalikan e4 dengan f5. Agresif, tetapi melemahkan sisi raja sendiri.'],
[/Catalan/,'Putih menempatkan gajah di g2 untuk menekan sayap menteri lewat diagonal panjang, dengan tekanan posisional yang tenang namun konsisten.'],
[/Scotch/,'Putih membuka pusat lebih cepat dengan d4 sehingga permainan terbuka dan aktif.'],
[/Petrov|Russian/,'Hitam menyeimbangkan permainan dengan menyerang e4 lebih dulu. Sangat solid dan sulit dikalahkan.'],
[/King's Gambit/,'Putih mengorbankan bidak f demi membuka garis f dan menguasai pusat. Tajam dan berisiko.'],
[/Vienna|Four Knights/,'Putih mengembangkan kuda secara alami dan menyimpan pilihan untuk f4 atau d4 kemudian.'],
[/Philidor/,'Hitam mempertahankan e5 dengan d6. Sederhana dan kokoh, tetapi agak pasif.'],
[/Benoni|Benko/,'Hitam menantang pusat Putih lewat c5 dan membuka garis di sayap menteri, dengan imbalan struktur bidak yang tidak seimbang.'],
[/R.ti|Bird/,'Putih tidak segera memegang pusat dengan bidak, melainkan mengendalikannya dari samping dengan kuda dan gajah.']];
const PN={p:'bidak',n:'kuda',b:'gajah',r:'benteng',q:'menteri',k:'raja'};
function explain(){
 const h=game.history({verbose:true}),el=$('note');
 if(!h.length){el.textContent='Posisi awal. Mainkan langkah pertama untuk mulai; e4 dan d4 paling sering dipakai karena menguasai pusat.';return}
 const m=h[h.length-1],side=m.color==='w'?'Putih':'Hitam',ply=h.length;let t;
 if(m.flags.includes('k'))t=side+' rokade pendek: raja berlindung di balik bidak, benteng ikut aktif.';
 else if(m.flags.includes('q'))t=side+' rokade panjang: raja diamankan dan benteng langsung masuk ke tengah.';
 else{t=side+' memainkan '+m.san+': '+PN[m.piece]+(m.captured?' menangkap '+PN[m.captured]+' di ':' ke ')+m.to+'.';
  if(m.piece==='p'&&'de'.includes(m.from[0])&&ply<=8)t+=' Langkah ini merebut atau menantang pusat papan.';
  else if(m.piece==='p')t+=' Struktur bidak berubah dan garis baru terbuka.';
  else if((m.piece==='n'||m.piece==='b')&&ply<=14)t+=' Bidak ringan dikembangkan ke petak aktif, mendekatkan raja ke rokade.';
  else if(m.piece==='q'&&ply<=10)t+=' Menteri keluar dini; waspadai kehilangan tempo karena diserang.';
  else if(m.piece==='r')t+=' Benteng mencari garis terbuka atau terhubung dengan benteng lain.';
  else if(m.piece==='k')t+=' Raja berpindah, biasanya demi keamanan atau di akhir permainan.'}
 if(m.promotion)t+=' Bidak dipromosikan menjadi '+PN[m.promotion]+'.';
 if(/#/.test(m.san))t+=' Skakmat.';else if(/\+/.test(m.san))t+=' Memberi skak.';
 const nm=$('oname').textContent,f=FAM.find(x=>x[0].test(nm));
 if(f&&$('eco').style.display!=='none')t+=' '+f[1];
 el.textContent=t}
const numLine=(a,st)=>a.map((x,j)=>{const q=st+j;return q%2===0?(q/2+1)+'. '+x:(j===0?(Math.floor(q/2)+1)+'… ':'')+x}).join(' ');
function lineView(){
 const box=$('lines');box.innerHTML='';const hs=game.history(),h=hs.join(' ');
 if(!h){box.innerHTML='<p class="cnt">Mainkan langkah pertama untuk melihat line yang bisa dilanjutkan.</p>';return}
 const L=BOOK.filter(b=>b[2]!==h&&b[2].startsWith(h+' ')).sort((a,b)=>a[2].length-b[2].length).slice(0,8);
 if(!L.length){box.innerHTML='<p class="cnt">Tidak ada line bernama yang melanjutkan posisi ini.</p>';return}
 const ul=document.createElement('ul');ul.className='gl';
 L.forEach(b=>{const li=document.createElement('li'),mv=b[2].split(' '),eb=document.createElement('b'),rs=document.createElement('span');
  li.tabIndex=0;eb.className='eb';eb.textContent=b[0];li.append(eb,b[1]);
  rs.className='rest';rs.textContent=numLine(mv.slice(hs.length),hs.length);li.append(rs);
  {const g=new Chess();mv.forEach(x=>mv1(g,x));const e=SE(key(g));
   if(e)li.append(wdlEl(e));else{const d=document.createElement('div');d.className='lw lx';d.textContent='Tidak ada data di sumber ini.';li.append(d)}}
  const go=()=>{botStop();game.reset();for(const x of mv)if(!mv1(game,x))break;sel=null;update()};
  li.onclick=go;li.onkeydown=ev=>{if(ev.key==='Enter')go()};ul.append(li)});
 box.append(ul)}

/* ===== Statistik offline (tersimpan di file) ===== */
function loadStatsObj(o){if(!o||!o.pos)throw new Error('format tidak dikenal');
 for(const k in o.pos){const [n,w,d,b,m]=o.pos[k],mm={};m.forEach(x=>{mm[x[0]]=[x[1],x[2],x[3],x[4]]});DBI.set(k,{n,r:[w,d,b],m:mm,g:[]})}}
async function importStats(f){try{loadStatsObj(JSON.parse(await f.text()));await dbPut('games',DBG);await dbPut('idx',DBI);$('dbmsg').textContent='Statistik dimuat dari '+f.name+'.'}catch(e){$('dbmsg').textContent='Gagal memuat statistik: '+e.message}update()}
function statsObj(){const pos={};DBI.forEach((e,k)=>{if(e.n<3)return;pos[k]=[e.n,e.r[0],e.r[1],e.r[2],Object.entries(e.m).sort((a,b)=>b[1][0]-a[1][0]).slice(0,8).map(([s,x])=>[s].concat(x))]});
 return{v:1,games:Math.max(DBG.length,(DBI.get(key(new Chess()))||{n:0}).n),pos}}
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove()}
$('dbexp').onclick=()=>dl('stats.json',JSON.stringify(statsObj()),'application/json');
$('dboff').onclick=()=>{const c=document.documentElement.cloneNode(true);c.querySelector('#themesel').innerHTML='';
 ['board','book','rows','lines','dev','dbres','hist','promo'].forEach(i=>{const x=c.querySelector('#'+i);if(x)x.innerHTML=''});
 const oe=c.querySelector('#offuser');if(oe)oe.textContent=JSON.stringify(statsObj());c.querySelector('#sibidak-loader')?.remove();c.querySelectorAll('link[rel="stylesheet"][href^="css/"]').forEach(x=>x.remove());c.querySelectorAll('script[src^="js/"]').forEach(x=>{if(!x.matches('[data-sibidak-source="1"]'))x.remove()});dl('index_offline.html','<!DOCTYPE html>\n'+c.outerHTML,'text/html')};
/* ===== Database tertanam (Lichess Broadcast + Carlsen) & pengembangan pembukaan ===== */
var EMB={bc:null,cw:null,cb:null},EMBG=[],EMBN={},EMBS={},EMBREADY=false,DSRC='all',EC=new Map(),BEST=null;
const SRCN={all:'Semua data tertanam',bc:'Broadcast Lichess (Agu–Sep 2026)',cw:'Carlsen — bermain Putih',cb:'Carlsen — bermain Hitam',nk:'Nakamura',fz:'Firouzja',fi:'Fischer',ka:'Karpov',kp:'Kasparov',mo:'Morphy',my:'PGN saya (dimuat)'};
function mkE(a){const m={};a[4].forEach(x=>{m[x[0]]=[x[1],x[2],x[3],x[4]]});return{n:a[0],r:[a[1],a[2],a[3]],m,g:a[5]||[],G:(typeof PLG!=='undefined'&&PLG[DSRC])||EMBG}}
function SE(k){
 if(DSRC==='my')return DBI.size&&DBI.get(k)||null;
 if(!EMBREADY)return null;
 if(DSRC!=='all'){const a=EMB[DSRC]&&EMB[DSRC][k];return a?mkE(a):null}
 let c=EC.get(k);if(c!==undefined)return c;
 const ps=['bc','cw','cb'].map(s=>EMB[s]&&EMB[s][k]).filter(Boolean);
 if(!ps.length)c=null;else if(ps.length===1)c=mkE(ps[0]);
 else{c={n:0,r:[0,0,0],m:{},g:[],G:EMBG};
  ps.forEach(a=>{c.n+=a[0];c.r[0]+=a[1];c.r[1]+=a[2];c.r[2]+=a[3];
   a[4].forEach(x=>{const y=c.m[x[0]]||(c.m[x[0]]=[0,0,0,0]);for(let i=0;i<4;i++)y[i]+=x[i+1]});
   (a[5]||[]).forEach(id=>c.g.push(id))});
  const sc=id=>Math.max(EMBG[id][2],EMBG[id][3]);c.g.sort((p,q)=>sc(q)-sc(p));c.g.length=Math.min(c.g.length,6)}
 EC.set(k,c);return c}
async function loadEmb(){
 const el=$('offstats'),t=(el.textContent||'').trim(),inf=$('dbemb');
 if(!t){EMBREADY=true;inf.textContent='Tidak ada database tertanam di file ini.';setTimeout(update);return}
 try{let txt=t;
  if(el.dataset.enc==='gz64'){
   if(typeof DecompressionStream==='undefined')throw new Error('browser belum mendukung DecompressionStream');
   const bin=Uint8Array.from(atob(t),c=>c.charCodeAt(0));
   txt=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
  const o=JSON.parse(txt);EMBG=o.games||[];
  ['bc','cw','cb'].forEach(s=>{if(o.src&&o.src[s]){EMB[s]=o.src[s].pos;EMBN[s]=o.src[s].games;EMBS[s]=Object.keys(o.src[s].pos).length}});
  EMBN.all=(EMBN.bc||0)+(EMBN.cw||0)+(EMBN.cb||0);EMBS.all=(EMBS.bc||0)+(EMBS.cw||0)+(EMBS.cb||0);
  EMBREADY=true;EC.clear();
  inf.textContent='Tertanam: '+nf(EMBN.bc||0)+' partai Broadcast Lichess (Agu–Sep 2026) · '+nf(EMBN.cw||0)+' partai Carlsen sebagai Putih · '+nf(EMBN.cb||0)+' sebagai Hitam · '+nf(EMBG.length)+' partai contoh yang dapat dimuat.';
 }catch(e){EMBREADY=true;inf.textContent='Database tertanam gagal dimuat: '+e.message}
 update()}
$('dbsrc').onchange=()=>{DSRC=$('dbsrc').value;EC.clear();update()};
function EXT(t,san){
 const g=new Chess(t.fen()),seq=[san];let nameIdx=null,cur=SE(key(g)),end=null;
 {const pe=P[key(g)];if(pe&&pe[0]>=0)nameIdx=pe[0]}
 for(let i=0;i<16&&cur;i++){
  const mv=Object.entries(cur.m).sort((a,b)=>b[1][0]-a[1][0]);if(!mv.length)break;
  const[s,y]=mv[0];if(y[0]<3||y[0]<cur.n*.28)break;
  if(!g.move(s))break;seq.push(s);end={n:y[0],r:[y[1],y[2],y[3]]};cur=SE(key(g));
  const pe=P[key(g)];if(pe&&pe[0]>=0)nameIdx=pe[0]}
 return{seq,end,nameIdx,inBook:!!P[key(g)]}}
try{loadStatsObj(JSON.parse($('offuser').textContent||'null'))}catch(e){}
loadEmb();
function bookRows(cur){
 const box=$('book');box.innerHTML='';const nx=cur?cur[2]:[],ce=SE(key(game)),nz=s=>s.replace(/[+#]/g,''),sn=new Set(nx.map(x=>nz(x[0]))),
  extra=ce?Object.entries(ce.m).filter(([s])=>!sn.has(nz(s))).sort((a,b)=>b[1][0]-a[1][0]).slice(0,8):[];
 if(!nx.length&&!extra.length){box.innerHTML='<p class="cnt">Tidak ada lanjutan di buku pembukaan.</p>';return}
 const max=Math.max(1,...nx.map(x=>x[1])),maxD=Math.max(1,...extra.map(x=>x[1][0])),ply=game.history().length,
  mvn=ply%2===0?(ply/2+1)+'. ':(Math.floor(ply/2)+1)+'… ';
 const mk=(san,cnt,x)=>{
  const t=new Chess(game.fen());if(!t.move(san))return null;
  const e=P[key(t)],idx=e&&e[0]>=0?e[0]:(e?e[1]:null),de=SE(key(t))||(x?{n:x[0],r:[x[1],x[2],x[3]]}:null),row=document.createElement('div');
  let nm=idx!==null&&idx!==undefined?BOOK[idx]:null,inh=false;if(!nm&&x&&BEST!==null&&BOOK[BEST]){nm=BOOK[BEST];inh=true}
  row.className='bk-row';row.tabIndex=0;
  row.innerHTML='<div class="bk-top"><span class="bk-mv">'+mvn+san+'</span><span class="bk-name">'+(nm?'<b class="eb">'+nm[0]+'</b>'+nm[1]+(inh?' <i>· lanjutan dari data</i>':''):'<i>Tanpa nama</i>')+'</span><span class="bk-pc" title="'+(x?nf(cnt)+' partai di database':cnt+' line di buku pembukaan')+'"><b>'+nf(cnt)+'</b> '+(x?'partai':'line')+'</span></div><div class="bk-bar"><i style="width:'+Math.min(100,x?cnt/maxD*100:cnt/max*100)+'%'+(x?';opacity:.55':'')+'"></i></div>'+(de?wdlHTML(de,'Database'):'<div class="lw lx" data-fen="'+t.fen()+'">Memuat statistik…</div>');
  const ex=EXT(t,san);
  if(ex.seq.length>1){const d=document.createElement('div'),rs=document.createElement('span'),bt=document.createElement('button');
   d.className='ext';rs.className='rest';
   const nn=ex.nameIdx!==null&&BOOK[ex.nameIdx]&&ex.nameIdx!==idx?BOOK[ex.nameIdx]:null;
   rs.textContent='Pengembangan: '+numLine(ex.seq,ply)+' ('+ex.seq.length+' ply'+(ex.end?', berakhir di '+nf(ex.end.n)+' partai · '+pc(ex.end.r[0],ex.end.n)+' / '+pc(ex.end.r[1],ex.end.n)+' / '+pc(ex.end.r[2],ex.end.n):'')+')';
   if(nn){const eb=document.createElement('b');eb.className='eb';eb.textContent=nn[0];d.append(eb,nn[1]+' ')}
   const tg=document.createElement('span');tg.className='tg'+(ex.inBook?'':' n');tg.textContent=ex.inBook?'dalam buku':'di luar buku';d.append(tg,rs);
   bt.type='button';bt.textContent='Mainkan line';bt.className='extb';
   bt.onclick=ev=>{ev.stopPropagation();botStop('Sesi bot dihentikan karena line dimainkan.');for(const m of ex.seq)if(!mv1(game,m))break;sel=null;update()};
   bt.onkeydown=ev=>ev.stopPropagation();d.append(bt);row.append(d)}
  row.onclick=()=>play(san);row.onkeydown=ev=>{if(ev.key==='Enter'&&ev.target===row)play(san)};return row};
 const all=[],gmOf=san=>{const tt=new Chess(game.fen());if(!tt.move(san))return 0;const e2=SE(key(tt));return e2?e2.n:0};
 nx.forEach(([san,cnt])=>all.push({san,cnt,gm:gmOf(san),book:true}));
 extra.forEach(([san,x])=>{const g2=Math.max(gmOf(san),x[0]);all.push({san,cnt:g2,gm:g2,x,book:false})});
 all.sort((a,b)=>b.gm-a.gm||b.cnt-a.cnt);
 all.slice(0,14).forEach(o=>{const r=o.book?mk(o.san,o.cnt,null):mk(o.san,o.cnt,o.x);if(r)box.append(r)})}
/* ===== Evaluasi & WDL ===== */
function evClass(k,v){if(k==='mate')return (v>0?'Putih':'Hitam')+' skakmat dalam '+Math.abs(v);const a=Math.abs(v)/100,w=v>0?'Putih':'Hitam';
 return a<.3?'Seimbang':a<1?w+' sedikit unggul':a<2.5?w+' unggul':a<5?w+' sangat unggul':w+' hampir pasti menang'}
function wdlHTML(e,src){const t=e.n||1,r=e.r,N=['Putih menang','Remis','Hitam menang'],C=['w','x','b'],K=['#fff','#8a8a8a','#000'];
 return '<div class="lw"><div class="wdl">'+r.map((v,i)=>'<i title="'+N[i]+' '+pc(v,t)+'" style="width:'+v/t*100+'%;background:'+K[i]+'"></i>').join('')+'</div><div class="lt"><span><b>'+nf(e.n)+'</b> partai</span>'+r.map((v,i)=>'<span title="'+N[i]+'"><u class="'+C[i]+'"></u>'+nf(v)+' ('+pc(v,t)+')</span>').join('')+(src?'<span class="src">'+src+'</span>':'')+'</div></div>'}
function wdlEl(e){const d=document.createElement('div');d.innerHTML=wdlHTML(e,'Database');return d.firstChild}

/* ===== Musik latar (sintesis Web Audio, tanpa berkas audio) ===== */
const MU={ctx:null,on:false,timer:null};
const NF=n=>440*Math.pow(2,(n-69)/12),pick=a=>a[Math.floor(Math.random()*a.length)];
const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
const muVol=()=>Math.pow(+$('muv').value/100,2)*.9;
function muInit(){const c=MU.ctx=new(window.AudioContext||window.webkitAudioContext)();
 MU.master=c.createGain();MU.master.gain.value=0;MU.master.connect(c.destination);
 const n=c.sampleRate*3,b=c.createBuffer(2,n,c.sampleRate);
 for(let k=0;k<2;k++){const d=b.getChannelData(k);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}
 const cv=c.createConvolver(),wet=c.createGain();cv.buffer=b;wet.gain.value=.5;
 MU.bus=c.createGain();MU.bus.connect(MU.master);MU.bus.connect(cv);cv.connect(wet);wet.connect(MU.master)}
function tone(f,t,dur,type,vol,att){const c=MU.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(MU.bus);o.start(t);o.stop(t+dur+.05)}
const MOODS={
 tenang:(t,i)=>{if(t>=MU.pd){CH[MU.pi++%4].forEach(n=>tone(NF(n-12),t,10,'triangle',.05,2.5));MU.pd=t+8}
  tone(NF(pick([69,72,74,76,79,81])),t,3.4,'sine',.1,.01);return .8+Math.random()*.9},
 klasik:(t,i)=>{const ch=CH[Math.floor(i/8)%4];
  if(i%8===0)tone(NF(ch[0]-24),t,2.2,'triangle',.14,.01);
  tone(NF(ch[[0,1,2,1][i%4]]+12),t,1.1,'triangle',.11,.005);
  if(i%4===2&&Math.random()<.4)tone(NF(pick(ch)+24),t,1.5,'sine',.08,.01);return .36},
 fokus:(t,i)=>{if(t>=MU.dr){tone(NF(38),t,16,'sine',.1,3);tone(NF(45),t,16,'sine',.06,3);MU.dr=t+15}
  if(Math.random()<.55)tone(NF(pick([62,65,67,69,72,74])),t,4,'sine',.07,.02);return 1.3+Math.random()*1.6}};
function muTick(){const c=MU.ctx;while(MU.next<c.currentTime+.9)MU.next+=MOODS[$('mum').value](MU.next,MU.i++)}
function muUI(){const b=$('mup');b.setAttribute('aria-pressed',MU.on);b.textContent=MU.on?'❚❚ Musik':'▶ Musik'}
function muSave(){try{localStorage.setItem('sibidak-music',JSON.stringify({m:$('mum').value,v:$('muv').value}))}catch(e){}}
$('mup').onclick=()=>{
 if(MU.on){MU.on=false;clearInterval(MU.timer);MU.master.gain.setTargetAtTime(0,MU.ctx.currentTime,.25);setTimeout(()=>{if(!MU.on)MU.ctx.suspend()},1200);muUI();return}
 if(!MU.ctx)muInit();MU.ctx.resume();MU.on=true;MU.i=0;MU.pd=0;MU.dr=0;MU.pi=0;MU.next=MU.ctx.currentTime+.1;
 MU.master.gain.cancelScheduledValues(0);MU.master.gain.setTargetAtTime(muVol(),MU.ctx.currentTime,.4);
 clearInterval(MU.timer);MU.timer=setInterval(muTick,200);muUI()};
$('muv').oninput=()=>{if(MU.on)MU.master.gain.setTargetAtTime(muVol(),MU.ctx.currentTime,.05);muSave()};
$('mum').onchange=()=>{MU.i=0;MU.pd=0;MU.dr=0;muSave()};
try{const q=JSON.parse(localStorage.getItem('sibidak-music')||'null');if(q){if(MOODS[q.m])$('mum').value=q.m;if(q.v!=null)$('muv').value=q.v}}catch(e){}

/* ===== Tanda petak & panah analisis (klik kanan) ===== */
const MK={c:new Map(),a:new Map(),fen:'',drag:null,pv:null};
const MKC={g:'#15a057',r:'#d64034',b:'#2e6edc',y:'#ebaa14'};
const sqXY=n=>{const c='abcdefgh'.indexOf(n[0]),r=8-n[1];return[(flip?7-c:c)+.5,(flip?7-r:r)+.5]};
function mkArrow(f,t,k,o){const[x1,y1]=sqXY(f),[x2,y2]=sqXY(t),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,
 sx=x1+ux*.22,sy=y1+uy*.22,ex=x2-ux*.1,ey=y2-uy*.1,bx=ex-ux*.44,by=ey-uy*.44,px=-uy*.27,py=ux*.27,c=MKC[k];
 return '<g opacity="'+(o||.82)+'"><line x1="'+sx+'" y1="'+sy+'" x2="'+bx+'" y2="'+by+'" stroke="'+c+'" stroke-width=".17" stroke-linecap="round"/><polygon fill="'+c+'" points="'+ex+','+ey+' '+(bx+px)+','+(by+py)+' '+(bx-px)+','+(by-py)+'"/></g>'}
function renderMarks(){const b=$('board'),old=b.querySelector('svg.mk');if(old)old.remove();
 const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','mk');s.setAttribute('viewBox','0 0 8 8');s.setAttribute('aria-hidden','true');
 let h='';MK.c.forEach((k,n)=>{const[x,y]=sqXY(n);h+='<rect x="'+(x-.5)+'" y="'+(y-.5)+'" width="1" height="1" fill="'+MKC[k]+'" opacity=".48"/>'});
 MK.a.forEach((k,m)=>{h+=mkArrow(m.slice(0,2),m.slice(2),k)});
 if(MK.pv)h+=mkArrow(MK.pv[0],MK.pv[1],MK.pv[2],.55);
 s.innerHTML=h;b.append(s)}
const sqAt=e=>{const el=document.elementFromPoint(e.clientX,e.clientY),q=el&&el.closest&&el.closest('#board .sq');return q?q.dataset.sq:null};
$('board').addEventListener('contextmenu',e=>e.preventDefault());
$('board').addEventListener('mousedown',e=>{if(e.button!==2)return;const f=sqAt(e);if(!f)return;e.preventDefault();
 MK.drag={f,k:e.shiftKey?'r':(e.ctrlKey||e.metaKey)?'b':e.altKey?'y':'g'}});
document.addEventListener('mousemove',e=>{if(!MK.drag)return;const t=sqAt(e),pv=t&&t!==MK.drag.f?[MK.drag.f,t,MK.drag.k]:null,a=MK.pv&&MK.pv.join(),b=pv&&pv.join();
 if(a!==b){MK.pv=pv;renderMarks()}});
document.addEventListener('mouseup',e=>{if(e.button!==2||!MK.drag)return;const{f,k}=MK.drag,t=sqAt(e);MK.drag=null;MK.pv=null;
 if(t){if(t===f){MK.c.get(f)===k?MK.c.delete(f):MK.c.set(f,k)}else{const m=f+t;MK.a.get(m)===k?MK.a.delete(m):MK.a.set(m,k)}}
 renderMarks()});
$('board').addEventListener('click',()=>{if(MK.c.size||MK.a.size){MK.c.clear();MK.a.clear();renderMarks()}},true);
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&!e.target.matches('input,select,textarea')&&!$('undo').disabled){e.preventDefault();$('undo').click()}});

initSF();
$('botgo').onclick=botStart;
$('botend').onclick=()=>botStop('Sesi bot diakhiri.');
$('botnew').onclick=()=>{game.reset();BOT.last='';BOT.pending=false;sel=null;update()};
$('botswap').onclick=()=>{BOT.side=BOT.side==='w'?'b':'w';if(flip!==(BOT.side==='w'))$('flip').click();BOT.pending=false;sel=null;update()};
tab((()=>{try{return localStorage.getItem('sibidak-tab')||'lan'}catch(e){return'lan'}})());
update();

/* ===== Database Kejuaraan Dunia (tertanam) ===== */
/* ===== Penyimpanan Bitboard ===== */
/* Tiap posisi = 12 bitboard 64-bit (P N B R Q K putih, lalu hitam); bit i = petak i, a1=0 … h8=63. */
let WCB=null,WCS=[],WCN=[];
function bbOf(g){const a=Array(12).fill(0n),b=g.board();for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=b[y][x];if(p)a[(p.color==='w'?0:6)+'pnbrqk'.indexOf(p.type)]|=1n<<BigInt((7-y)*8+x)}return a}
function wcMoves(i){const s=WCS[i],n=WCN[i],g=new Chess(),out=[],B=WCB,
 occ=(o,c)=>B[o+c]|B[o+c+1]|B[o+c+2]|B[o+c+3]|B[o+c+4]|B[o+c+5],
 sq=x=>BigInt((x.charCodeAt(1)-49)*8+x.charCodeAt(0)-97);
 for(let k=1;k<=n;k++){const o=(s+k)*12,p=o-12,c=(k-1)%2?6:0,A=occ(p,c),N=occ(o,c);let ok=false;
  for(const m of g.moves({verbose:true})){const f=1n<<sq(m.from),t=1n<<sq(m.to);
   if(!(A&f)||(N&f)||!(N&t))continue;
   g.move(m);const a=bbOf(g);if(a.every((v,j)=>v===B[o+j])){out.push(m.san);ok=true;break}g.undo()}
  if(!ok)break}
 return out.join(' ')}
async function wcLoad(){
 const m=JSON.parse(document.getElementById('wcmeta').textContent),
  bin=Uint8Array.from(atob(document.getElementById('wcbb').textContent),c=>c.charCodeAt(0)),
  ab=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 WCB=new BigUint64Array(ab);WCS=[];WCN=[];
 return m.map((x,i)=>{WCS.push(x[11]);WCN.push(x[12]);
  const r=[x[0],x[1],x[2],x[3],x[4],x[5],x[6],null,x[7],x[8],x[9],x[10]];let c;
  Object.defineProperty(r,7,{get(){return c===undefined?(c=wcMoves(i)):c},enumerable:true});return r})}

(async function(){
const WC=await wcLoad(),EV=[...new Set(WC.map(r=>r[4]))];
let fe='',cur=-1,pos=null;const q=$('wcq'),se=$('wcev'),sr=$('wcres'),tb=$('wcrows');
const nm=s=>s.split(',')[0],yr=r=>r[5].slice(0,4);
se.innerHTML='<option value="">Semua pertandingan</option>'+EV.map(e=>'<option>'+e+'</option>').join('');
function summary(){const box=$('wcsum');box.innerHTML='';
 EV.forEach(e=>{const g=WC.filter(r=>r[4]===e),p={};
  g.forEach(r=>{const[a,b]=r[6]==='1-0'?[1,0]:r[6]==='0-1'?[0,1]:[.5,.5];p[nm(r[0])]=(p[nm(r[0])]||0)+a;p[nm(r[1])]=(p[nm(r[1])]||0)+b});
  const s=Object.entries(p).sort((x,y)=>y[1]-x[1]),bt=document.createElement('button');
  bt.setAttribute('aria-pressed',fe===e);
  bt.innerHTML='<b>'+e+'</b><span>'+s.map(x=>x[0]+' '+x[1]).join(' – ')+' · '+g.length+' partai</span>';
  bt.onclick=()=>{fe=fe===e?'':e;se.value=fe;render()};box.append(bt)})}
function render(){
 const t=q.value.trim().toLowerCase(),res=sr.value;
 const L=WC.map((r,i)=>[r,i]).filter(([r,i])=>(!pos||pos.has(i))&&(!fe||r[4]===fe)&&(!res||r[6]===res)&&(!t||(r[0]+' '+r[1]+' '+r[9]+' '+r[10]).toLowerCase().includes(t)));
 tb.innerHTML='';
 L.forEach(([r,i])=>{const tr=document.createElement('tr');tr.className='go'+(i===cur?' on':'');tr.tabIndex=0;
  tr.title=[r[10],r[11],r[5]].filter(Boolean).join(' · ');
  [yr(r),r[8],nm(r[0]),nm(r[1]),r[6].replace('1/2-1/2','½–½'),r[9]].forEach((v,k)=>{const td=document.createElement('td');td.textContent=v;if(k===4)td.className='r';tr.append(td)});
  const go=()=>{cur=i;loadGame(i,WC);$('wcmsg').textContent='Dimuat: '+r[0]+' – '+r[1]+' ('+r[4]+', ronde '+r[8]+(r[10]?', '+r[10]:'')+'). Gunakan panah kiri untuk mundur.';render()};
  tr.onclick=go;tr.onkeydown=e=>{if(e.key==='Enter')go()};tb.append(tr)});
 $('wccnt').textContent=L.length+' dari '+WC.length+' partai'+(pos?' · cocok dengan posisi papan':'');
 document.querySelectorAll('#wcsum button').forEach((b,k)=>b.setAttribute('aria-pressed',EV[k]===fe));}
q.oninput=render;sr.onchange=render;se.onchange=()=>{fe=se.value;render()};
$('wcidx').onclick=async()=>{
 if(DBBUSY)return;DBBUSY=true;const m=$('wcmsg');
 try{if(!DBSEEN){DBSEEN=new Set();DBG.forEach(r=>DBSEEN.add(sigOf(r[0],r[1],r[5],r[6],r[7].split(' ',40))))}
  let a=0,d=0;for(let i=0;i<WC.length;i++){const r=WC[i];m.textContent='Memproses '+(i+1)+' / '+WC.length+' partai…';await new Promise(z=>setTimeout(z));const x=addGame('[White "'+r[0]+'"]\n[Black "'+r[1]+'"]\n[WhiteElo "'+r[2]+'"]\n[BlackElo "'+r[3]+'"]\n[Event "'+r[4]+'"]\n[Date "'+r[5]+'"]\n[Result "'+r[6]+'"]\n\n'+r[7]+' '+r[6],0);x===1?a++:d++}
  await dbPut('games',DBG);await dbPut('idx',DBI);
  $('dbsrc').value='my';DSRC='my';EC.clear();tab('my');m.textContent='Selesai: +'+a+' partai ditambahkan ke "PGN saya"'+(d?', '+d+' duplikat dilewati':'')+'. Sumber statistik dialihkan ke "PGN saya".'}
 catch(e){m.textContent='Gagal: '+e.message}
 DBBUSY=false;update()};
$('wcpos').onclick=()=>{const t=bbOf(game),w=game.turn()==='w'?0:1;pos=new Map();
 for(let i=0;i<WC.length;i++)for(let k=0;k<=WCN[i];k++){if(k%2!==w)continue;const o=(WCS[i]+k)*12;let ok=true;for(let j=0;j<12;j++)if(WCB[o+j]!==t[j]){ok=false;break}if(ok){pos.set(i,k);break}}
 $('wcmsg').textContent=pos.size?pos.size+' partai pernah mencapai posisi ini (pencarian bitboard, termasuk transposisi).':'Tidak ada partai yang mencapai posisi ini.';render()};
$('wcall').onclick=()=>{pos=null;render()};
summary();render();
})();

/* ===== Database Pemain (bitboard XOR; dimuat saat dipilih) ===== */
var PLG={};
(function(){
const PI=JSON.parse($('plinfo').textContent),RX={nk:/nakamura/i,fz:/firouzja/i,fi:/fischer/i,ka:/karpov/i,kp:/kasparov/i,mo:/morphy, ?p/i},PD={},NM={nk:'Nakamura',fz:'Firouzja',fi:'Fischer',ka:'Karpov',kp:'Kasparov',mo:'Morphy'};
const ST=[[0xFF00,0],[0x42,0],[0x24,0],[0x81,0],[0x08,0],[0x10,0],[0,0xFF0000],[0,0x42000000],[0,0x24000000],[0,0x81000000],[0,0x08000000],[0,0x10000000]];
const gun=async id=>{const b=Uint8Array.from(atob($(id).textContent),c=>c.charCodeAt(0));return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()};
const dec=b=>JSON.parse(new TextDecoder().decode(b)),SQN=s=>'abcdefgh'[s&7]+((s>>3)+1);
const bit=(l,h)=>l?31-Math.clz32(l&-l):63-Math.clz32(h&-h);
let cs='',lim=150,pos=null;
async function load(s){
 if(PD[s])return PD[s];
 const[bb,mt,st]=await Promise.all(['bb','meta','st'].map(x=>gun('pl-'+s+'-'+x)));
 const dv=new DataView(bb),nP=dv.getUint32(0,true),nV=dv.getUint32(4,true),masks=new Uint16Array(bb.slice(8,8+nP*2)),
  p=new Uint8Array(bb,8+nP*2),lo=new Uint32Array(nV),hi=new Uint32Array(nV),voff=new Uint32Array(nP+1);
 for(let i=0;i<nV;i++){lo[i]=(p[i]|p[nV+i]<<8|p[2*nV+i]<<16|p[3*nV+i]<<24)>>>0;hi[i]=(p[4*nV+i]|p[5*nV+i]<<8|p[6*nV+i]<<16|p[7*nV+i]<<24)>>>0}
 let a=0;for(let i=0;i<nP;i++){voff[i]=a;for(let m=masks[i];m;m&=m-1)a++}
 const D=PD[s]={meta:dec(mt),masks,voff,lo,hi,rows:{}};
 EMB[s]=dec(st);EMBN[s]=PI[s].g;EMBS[s]=PI[s].p;
 PLG[s]=new Proxy({},{get:(t,i)=>/^\d+$/.test(i)?row(s,+i):undefined});return D}
function row(s,i){const D=PD[s];if(D.rows[i])return D.rows[i];const m=D.meta[i],r=[m[0],m[1],m[2],m[3],m[4],m[5],m[6],null];let c;
 Object.defineProperty(r,7,{get(){return c===undefined?(c=moves(s,i)):c}});return D.rows[i]=r}
function moves(s,i){const D=PD[s],m=D.meta[i],l=ST.map(x=>x[0]),h=ST.map(x=>x[1]),g=new Chess(),out=[];
 for(let k=0;k<m[9];k++){const q=m[10]+k,c=k&1?6:0,ch=[];let v=D.voff[q];
  for(let j=0;j<12;j++)if(D.masks[q]>>j&1){ch.push([j,D.lo[v],D.hi[v]]);v++}
  const mine=ch.filter(x=>x[0]>=c&&x[0]<c+6),ft=x=>[bit((l[x[0]]&x[1])>>>0,(h[x[0]]&x[2])>>>0),bit((x[1]&~l[x[0]])>>>0,(x[2]&~h[x[0]])>>>0)];
  let f,t,pr;const kg=mine.find(x=>x[0]%6===5);
  if(mine.length===1)[f,t]=ft(mine[0]);else if(kg)[f,t]=ft(kg);
  else{const pw=mine.find(x=>x[0]%6===0),o=mine.find(x=>x[0]%6!==0);f=bit(pw[1],pw[2]);t=bit(o[1],o[2]);pr='nbrq'[o[0]%6-1]}
  ch.forEach(x=>{l[x[0]]=(l[x[0]]^x[1])>>>0;h[x[0]]=(h[x[0]]^x[2])>>>0});
  const r=g.move({from:SQN(f),to:SQN(t),promotion:pr});if(!r)break;out.push(r.san)}
 return out.join(' ')}
function scan(s,t){const D=PD[s],hit=new Map();
 for(let gi=0;gi<D.meta.length;gi++){const m=D.meta[gi],l=ST.map(x=>x[0]),h=ST.map(x=>x[1]);let mis=0;
  for(let j=0;j<12;j++)if(l[j]!==t.lo[j]||h[j]!==t.hi[j])mis++;
  if(!mis&&!t.w){hit.set(gi,0);continue}
  for(let k=0;k<m[9];k++){const q=m[10]+k;let v=D.voff[q];
   for(let j=0;j<12;j++)if(D.masks[q]>>j&1){const w=l[j]===t.lo[j]&&h[j]===t.hi[j];l[j]=(l[j]^D.lo[v])>>>0;h[j]=(h[j]^D.hi[v])>>>0;v++;mis+=w-(l[j]===t.lo[j]&&h[j]===t.hi[j])}
   if(!mis&&((k+1)&1)===t.w){hit.set(gi,k+1);break}}}
 return hit}
const side=(s,m)=>RX[s].test(m[0])?0:RX[s].test(m[1])?1:-1,
 out=(s,m)=>{const c=side(s,m);if(c<0||m[6]==='1/2-1/2')return m[6]==='1/2-1/2'?'1':'';return (m[6]==='1-0')===(c===0)?'2':'0'}; // 2=menang 1=remis 0=kalah
function sum(){const box=$('plsum');box.innerHTML='';
 for(const s in PI){const b=document.createElement('button');b.setAttribute('aria-pressed',s===cs);
  b.innerHTML='<b>'+NM[s]+'</b><span>'+nf(PI[s].g)+' partai</span>';b.onclick=()=>pick(s);box.append(b)}}
async function pick(s){cs=s;pos=null;lim=150;sum();$('plmsg').textContent='Memuat database '+NM[s]+'…';
 try{await load(s)}catch(e){$('plmsg').textContent='Gagal memuat: '+e.message;return}
 $('plmsg').textContent='';render()}
function render(){const tb=$('plrows');tb.innerHTML='';
 if(!cs||!PD[cs]){$('plcnt').textContent='Pilih pemain untuk memuat database.';$('plst').textContent='';return}
 const D=PD[cs],q=$('plq').value.trim().toLowerCase(),col=$('plcol').value,rs=$('plres').value,L=[];
 let w=0,d=0,l=0,y0=9999,y1=0;
 D.meta.forEach((m,i)=>{const c=side(cs,m),o=out(cs,m);
  if(pos&&!pos.has(i))return;if(col!==''&&c!==+col)return;if(rs!==''&&o!==rs)return;
  if(q&&!(m[0]+' '+m[1]+' '+m[4]+' '+m[7]).toLowerCase().includes(q))return;
  L.push(i);o==='2'?w++:o==='1'?d++:o==='0'&&l++;const y=+m[5].slice(0,4);if(y){y0=Math.min(y0,y);y1=Math.max(y1,y)}});
 $('plst').textContent=L.length?nf(L.length)+' partai · '+w+' menang · '+d+' remis · '+l+' kalah (sudut pandang '+NM[cs]+') · '+y0+'–'+y1:'';
 L.slice(0,lim).forEach(i=>{const m=D.meta[i],tr=document.createElement('tr');tr.className='go';tr.tabIndex=0;tr.title=[m[4],m[5]].filter(Boolean).join(' · ');
  [m[5].slice(0,4)||'?',m[0].split(',')[0],m[1].split(',')[0],m[6].replace('1/2-1/2','½–½'),m[7]].forEach((v,k)=>{const td=document.createElement('td');td.textContent=v;if(k===3)td.className='r';tr.append(td)});
  const go=()=>{loadGame(i,PLG[cs]);$('plmsg').textContent='Dimuat: '+m[0]+' – '+m[1]+' ('+(m[4]||'?')+', '+(m[5]||'?')+').'};
  tr.onclick=go;tr.onkeydown=e=>{if(e.key==='Enter')go()};tb.append(tr)});
 $('plcnt').textContent='Menampilkan '+Math.min(lim,L.length)+' dari '+nf(L.length);$('plmore').style.display=L.length>lim?'':'none'}
['plq','plcol','plres'].forEach(i=>$(i).addEventListener(i==='plq'?'input':'change',()=>{lim=150;render()}));
$('plmore').onclick=()=>{lim+=300;render()};
$('plall').onclick=()=>{pos=null;$('plmsg').textContent='';render()};
$('pluse').onclick=async()=>{if(!cs)return;await load(cs);$('dbsrc').value=cs;DSRC=cs;EC.clear();update();$('plmsg').textContent='Eksplorer pembukaan kini memakai database '+NM[cs]+'.'};
$('plpos').onclick=async()=>{if(!cs){$('plmsg').textContent='Pilih pemain dahulu.';return}await load(cs);
 const b=bbOf(game),t={lo:b.map(v=>Number(v&0xFFFFFFFFn)),hi:b.map(v=>Number(v>>32n)),w:game.turn()==='w'?0:1};
 pos=scan(cs,t);lim=150;$('plmsg').textContent=pos.size?nf(pos.size)+' partai '+NM[cs]+' pernah mencapai posisi ini (pencarian bitboard, termasuk transposisi).':'Tidak ada partai yang mencapai posisi ini.';render()};
$('dbsrc').addEventListener('change',async()=>{const s=$('dbsrc').value;if(PI[s]){await load(s);EC.clear();update()}});
for(const s in PI){EMBN[s]=PI[s].g;EMBS[s]=PI[s].p}
sum();render();
})();

/* ===== Tab eksplorer (gabungan) ===== */
function tab(t){['lan','wc','my'].forEach(x=>{$('xp-'+x).hidden=x!==t;$('xt-'+x).setAttribute('aria-selected',x===t)});try{localStorage.setItem('sibidak-tab',t)}catch(e){}}
['lan','wc','my'].forEach(x=>$('xt-'+x).onclick=()=>tab(x));
$('xt-lan').onkeydown=$('xt-wc').onkeydown=$('xt-my').onkeydown=e=>{const o=['lan','wc','my'],i=o.indexOf(e.currentTarget.id.slice(3));if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.stopPropagation();const n=o[(i+(e.key==='ArrowRight'?1:2))%3];tab(n);$('xt-'+n).focus()}};
