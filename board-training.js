(function(){
const $=id=>document.getElementById(id),B=document.body;
const IC={
 rep:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8h24a6 6 0 016 6v26H15a6 6 0 01-6-6z"/><path d="M15 40a6 6 0 010-12h24M19 15h12M19 21h8"/></svg>',
 bot:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="15" width="30" height="22" rx="6"/><path d="M24 15V8M20 8h8"/><circle cx="18" cy="26" r="3"/><circle cx="30" cy="26" r="3"/><path d="M19 33h10M4 24v6M44 24v6"/></svg>',
 tb:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="12" rx="14" ry="5"/><path d="M10 12v12c0 2.8 6.3 5 14 5s14-2.2 14-5V12"/><path d="M10 24v12c0 2.8 6.3 5 14 5s14-2.2 14-5V24"/></svg>',
 bl:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 24s7-12 21-12 21 12 21 12-7 12-21 12S3 24 3 24z"/><circle cx="24" cy="24" r="6"/><path d="M8 40L40 8"/></svg>'};
const MODES=[
 {id:'repertoire',t:'Chess Repertoire',s:'Repertoire',c:'',ic:IC.rep,d:'Jelajahi pembukaan dari database partai master, statistik posisi, dan riwayat partai para juara dunia.'},
 {id:'bot',t:'Lawan Bot',s:'Lawan Bot',c:'r',ic:IC.bot,d:'Mainkan partai penuh melawan Stockfish (Elo 1320 hingga maksimum) atau bot bergaya Kasparov, Fischer, Nakamura, dan lainnya.'},
 {id:'tb',t:'Endgame Tablebase',s:'Tablebase',c:'',ic:IC.tb,d:'Atur posisi sendiri atau pilih posisi klasik: lihat hasil sempurna (menang/seri/kalah) dan latih ujung permainan melawan tablebase.'},
 {id:'blind',t:'Blindfold Training',s:'Blindfold',c:'r',ic:IC.bl,d:'Main tanpa melihat bidak, ketik atau klik langkah, dengarkan lawan, dan asah koordinat lewat berbagai latihan.'}];
const SIDE={w:'Putih',b:'Hitam'};
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
const nPieces=()=>game.fen().split(' ')[0].replace(/[^a-zA-Z]/g,'').length;
const sqIdx=n=>(8-(+n[1]))*8+'abcdefgh'.indexOf(n[0]),idxSq=i=>'abcdefgh'[i%8]+(8-(i>>3));

/* ---------- Bilah mode ---------- */
const nav=document.createElement('nav');nav.id='mbar';nav.setAttribute('aria-label','Mode aplikasi');
nav.innerHTML='<button type="button" class="mh" id="mhome" title="Kembali ke beranda">◂ Beranda</button><div role="tablist" aria-label="Pilih mode" style="display:contents">'+MODES.map(m=>'<button type="button" class="mt" role="tab" data-m="'+m.id+'" aria-selected="false">'+m.ic+m.s+'</button>').join('')+'</div><span class="sp"></span><label><input type="checkbox" id="evtog"> Evaluasi</label>';
document.querySelector('main').before(nav);
const colR=document.querySelector('.col-r');
$('eco').parentElement.id='ecocard';$('hist').parentElement.id='histcard';
colR.prepend($('botcard'));

/* ---------- Kartu ---------- */
const mk=(cls,id,html)=>{const d=document.createElement('div');d.className='card '+cls;d.id=id;d.innerHTML=html;return d};
const tbc=mk('tbcard','tbcard','<h2>Endgame Tablebase</h2>'
 +'<p class="cnt" style="margin-top:-2px">Tablebase Syzygy via Lichess: hasil <b>sempurna</b> untuk posisi dengan 7 bidak atau kurang. Mainkan langkah di papan atau klik langkah di tabel. Butuh internet; bila tidak terjangkau, ditampilkan perkiraan Stockfish.</p>'
 +'<div class="mrow"><span class="mlab">Posisi</span><select id="tbpre" aria-label="Posisi latihan"></select><button id="tbload" type="button" class="gbtn">Muat</button><button id="tbedit" type="button" class="gbtn">✎ Atur posisi</button></div>'
 +'<p class="cnt" id="tbdesc"></p>'
 +'<div id="tbres" aria-live="polite"></div>'
 +'<div class="mrow"><span class="mlab">Latih</span><select id="tbside" aria-label="Sisi Anda"><option value="auto">Anda: pihak yang jalan</option><option value="w">Anda: Putih</option><option value="b">Anda: Hitam</option></select><button id="tbplay" type="button" class="pbtn">Lawan tablebase</button></div>'
 +'<div class="mrow"><button id="tbfull" type="button" class="gbtn">Lawan Stockfish penuh (tanpa internet)</button><button id="tbstop" type="button" class="gbtn" hidden>Hentikan latihan</button></div>'
 +'<p class="note2" id="tbmsg">Tablebase selalu memilih langkah optimal. Pihak yang menang mencari cara terpendek; pihak yang kalah memperpanjang perlawanan.</p>');
const PCS=['P','B','N','R','Q','K'],PNAME={P:'Pion',B:'Gajah',N:'Kuda',R:'Benteng',Q:'Ratu',K:'Raja'};
const edc=mk('tbcard edcard','edcard','<h2><button id="edback" type="button" class="gbtn edb" aria-label="Kembali">←</button>Atur posisi</h2>'
 +'<div class="edpal" id="edpal" role="group" aria-label="Palet bidak"></div>'
 +'<div class="mrow edtool"><select id="edturn" aria-label="Giliran"><option value="w">Putih melangkah</option><option value="b">Hitam melangkah</option></select>'
 +'<button id="edx" type="button" class="gbtn" title="Penghapus: klik petak untuk menghapus bidak" aria-pressed="false">✕ Hapus</button>'
 +'<button id="edflip" type="button" class="gbtn" title="Putar papan">⇅</button><button id="edstart" type="button" class="gbtn" title="Posisi awal">↺</button><button id="edclear" type="button" class="gbtn" title="Kosongkan papan">🗑</button></div>'
 +'<div class="edcs"><div><span class="mlab">Putih</span><label><input type="checkbox" id="ecK"> (O-O)</label><label><input type="checkbox" id="ecQ"> (O-O-O)</label></div>'
 +'<div><span class="mlab">Hitam</span><label><input type="checkbox" id="eck"> (O-O)</label><label><input type="checkbox" id="ecq"> (O-O-O)</label></div></div>'
 +'<input id="edfen" class="edfen" type="text" spellcheck="false" autocomplete="off" aria-label="FEN">'
 +'<p class="note2" id="edmsg">Pilih bidak dari palet lalu klik petak, atau seret bidak ke papan. Seret bidak keluar papan untuk menghapus. Klik kanan juga menghapus.</p>'
 +'<button id="edapply" type="button" class="pbtn botgo" style="width:100%">Muat posisi ini</button>');
const blc=mk('blcard','blcard','<h2>Blindfold Training</h2>'
 +'<div id="blsetup"><p class="cnt" style="margin-top:-2px">Bidak disembunyikan. Masukkan langkah dengan <b>mengetik</b> (e4, Nf3, O-O, e2e4) atau <b>mengklik</b> petak asal lalu petak tujuan. Lawan menjawab lewat teks dan suara.</p>'
 +'<div class="mrow"><span class="mlab">Lawan</span><select id="blopp" aria-label="Pilih lawan"></select></div>'
 +'<div class="mrow"><span class="mlab">Sisi</span><select id="blside" aria-label="Pilih sisi"><option value="w">Putih</option><option value="b">Hitam</option><option value="r">Acak</option></select>'
 +'<span class="mlab">Tingkat</span><select id="bllvl" aria-label="Tingkat kesulitan"><option value="1">Ringan: bidak samar</option><option value="2" selected>Sedang: bidak tersembunyi</option><option value="3">Berat: papan buta total</option></select></div>'
 +'<div class="mrow"><label class="cnt" style="margin:0"><input type="checkbox" id="blvoice" checked> Ucapkan langkah lawan</label><label class="cnt" style="margin:0"><input type="checkbox" id="blnc"> Sembunyikan label koordinat</label></div>'
 +'<button id="blgo" type="button" class="pbtn botgo" style="width:100%">Mulai latihan buta</button></div>'
 +'<div id="bllive" hidden><div class="blopp" id="bloppt" aria-live="assertive">Menunggu langkah…</div>'
 +'<form class="blin" id="blform" autocomplete="off"><input id="blin" type="text" inputmode="text" autocapitalize="off" spellcheck="false" placeholder="Ketik langkah, mis. e4 / Nf3 / O-O" aria-label="Langkah Anda"><button type="submit" class="pbtn">Main</button></form>'
 +'<p class="cnt" id="blfb" aria-live="polite"></p>'
 +'<div class="btns"><button id="blpeek" type="button" class="gbtn">Intip papan (3 dtk)</button><button id="blread" type="button" class="gbtn">Baca posisi</button><button id="bllegal" type="button" class="gbtn">Langkah legal</button><button id="blquiz" type="button" class="gbtn">Uji ingatan</button><button id="blundo" type="button" class="gbtn">Batalkan langkah</button><button id="blrep" type="button" class="gbtn">Ulangi suara</button><button id="blend" type="button" class="gbtn">Akhiri</button></div>'
 +'<div class="blq" id="blqbox" hidden><span id="blqt"></span><form id="blqf" class="blin" autocomplete="off"><input id="blqi" type="text" spellcheck="false" autocapitalize="off" placeholder="mis. e4" aria-label="Jawaban"><button type="submit" class="pbtn">Cek</button></form></div>'
 +'<p class="blpos" id="blpos" hidden></p><p class="cnt" id="blstat"></p>'
 +'<button id="blagain" type="button" class="pbtn botgo" style="width:100%" hidden>Main lagi</button></div>');
const drc=mk('blcard','drcard','<h2>Latihan koordinat</h2>'
 +'<p class="cnt" style="margin-top:-2px">Papan kosong tanpa bidak untuk menghafal petak, warna, dan jalur bidak: dasar visualisasi blindfold.</p>'
 +'<div class="mrow"><select id="drtype" aria-label="Jenis latihan"><option value="find">Cari petak: klik koordinat yang disebut</option><option value="name">Nama petak: sebutkan petak yang disorot</option><option value="color">Warna petak: terang atau gelap</option><option value="piece">Jalur bidak: klik semua petak tujuan</option><option value="diag">Diagonal: apakah dua petak sejalur?</option></select></div>'
 +'<div class="mrow"><label class="cnt" style="margin:0"><input type="checkbox" id="drnc"> Sembunyikan label koordinat</label><button id="drgo" type="button" class="pbtn">Mulai</button><button id="drstop" type="button" class="gbtn" hidden>Selesai</button></div>'
 +'<div class="drq" id="drq" hidden><div class="dsq" id="drp"></div><div id="dra"></div><p class="dsc" id="drfb" aria-live="polite"></p></div>'
 +'<p class="dsc" id="drs"></p>');
const xc=$('xcard');xc.before(tbc);xc.before(edc);xc.before(blc);xc.before(drc);

/* ---------- State ---------- */
const TB={on:false,side:'b',mv:false,cache:new Map(),seq:0,off:false};
const ED={on:false,b:new Array(64).fill(null),tool:null,lift:false,turn:'w',cas:{K:true,Q:true,k:true,q:true},src:null};
const BL={on:false,lvl:2,n:0,peeks:0,opp:null,from:null,quiz:null,qok:0,qall:0};
const DR={on:false,type:'find',ok:0,all:0,st:0,best:0,tsum:0,t0:0,q:null,marks:new Set(),flash:[],lock:false};
let cur='repertoire';

function loadFen(fen){if(BOT.on)botStop('');TB.on=false;if(!game.load(fen))return false;sel=null;$('promo').className='';update();return true}

/* ---------- Mode ---------- */
function stopAll(){
 if(BOT.on)botStop('');
 TB.on=false;BL.on=false;ED.on=false;DR.on=false;BL.from=null;
 B.classList.remove('bf1','bf2','bf3','peek','ed','drill','nocoord')}
function setMode(m){
 stopAll();cur=m;B.dataset.mode=m;
 nav.querySelectorAll('.mt').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.m===m)));
 const ev=m==='repertoire'||m==='tb';$('evtog').checked=ev;B.classList.toggle('noeval',!ev);
 if(m==='tb'&&nPieces()>7){loadFen(TBP[0].f);$('tbpre').value='0';if(flip)$('flip').click()}
 if(m==='blind'){$('blopp').value=BOT.p?('pl:'+BOT.p):('sf:'+Math.min(BOT.lv,LV.length-1))}
 tbUI();blUI();drUI();window.scrollTo(0,0);update()}
nav.addEventListener('click',e=>{const b=e.target.closest('.mt');if(b)setMode(b.dataset.m)});
$('mhome').onclick=()=>{const r=$('mhome').getBoundingClientRect();goHome(r.left+r.width/2,r.top+r.height/2)};
$('evtog').onchange=()=>B.classList.toggle('noeval',!$('evtog').checked);

/* ---------- Beranda ---------- */
const inm=$('inm'),og=inm.querySelector('button');inm.innerHTML='';
MODES.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='mode '+x.c;b.innerHTML=x.ic+'<b>'+x.t+'</b><span>'+x.d+'</span><i>Mulai ▸</i>';b.onclick=()=>{og.click();setMode(x.id)};inm.append(b)});
B.dataset.mode='repertoire';nav.querySelector('.mt').setAttribute('aria-selected','true');

/* ====================== TABLEBASE ====================== */
const TBP=[
 {n:'Raja + Benteng vs Raja (KRK)',f:'8/8/8/4k3/8/8/8/R3K3 w - - 0 1',d:'Teknik skakmat dasar dengan benteng: kurung raja lawan ke tepi papan.'},
 {n:'Raja + Ratu vs Raja (KQK)',f:'8/8/8/4k3/8/8/8/3QK3 w - - 0 1',d:'Skakmat dengan ratu. Awas pat (stalemate)!'},
 {n:'Gajah + Kuda vs Raja (KBNK)',f:'8/8/8/8/3k4/8/8/1NB1K3 w - - 0 1',d:'Skakmat tersulit di antara akhir dasar: butuh hingga 33 langkah.'},
 {n:'Raja + Pion vs Raja (KPK)',f:'8/8/8/8/4k3/8/4P3/4K3 w - - 0 1',d:'Oposisi dan petak kunci menentukan apakah pion bisa dipromosikan.'},
 {n:'Lucena (benteng + pion)',f:'1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',d:'Posisi menang klasik: bangun "jembatan" agar pion bisa promosi.'},
 {n:'Philidor (pertahanan benteng)',f:'4k3/8/r7/3PK3/8/8/8/4R3 b - - 0 1',d:'Pertahanan rank ke-6 yang menahan seri melawan benteng + pion.'},
 {n:'Benteng vs Gajah (KRKB)',f:'8/8/8/4k3/8/8/2b5/R3K3 w - - 0 1',d:'Umumnya seri bila pihak lemah bertahan benar.'},
 {n:'Ratu vs Benteng (KQKR)',f:'8/8/8/4k3/8/8/r7/3QK3 w - - 0 1',d:'Menang secara teori tetapi panjang; uji teknik Anda.'}];
const sel1=$('tbpre');TBP.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.n;sel1.append(o)});
const showDesc=()=>{$('tbdesc').textContent=TBP[+sel1.value].d};sel1.onchange=showDesc;showDesc();
$('tbload').onclick=()=>{const p=TBP[+sel1.value];loadFen(p.f);const t=p.f.split(' ')[1];if(flip!==(t==='b'))$('flip').click();tbUI()};
async function tbFetch(fen){
 if(TB.cache.has(fen))return TB.cache.get(fen);
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),9000);
 try{const r=await fetch('https://tablebase.lichess.ovh/standard?fen='+encodeURIComponent(fen),{signal:ctl.signal});
  if(!r.ok)throw new Error('server membalas HTTP '+r.status);
  const j=await r.json();TB.cache.set(fen,j);TB.off=false;return j}
 finally{clearTimeout(to)}}
const inv={win:'loss',loss:'win','cursed-win':'blessed-loss','blessed-loss':'cursed-win',draw:'draw'};
function verdict(cat,turn){
 const me=SIDE[turn],op=SIDE[turn==='w'?'b':'w'];
 switch(cat){
  case'win':return{k:'dec',t:me+' menang',s:'dengan permainan terbaik'};
  case'loss':return{k:'dec',t:op+' menang',s:'dengan permainan terbaik'};
  case'draw':return{k:'drw',t:'Seri',s:'dengan permainan terbaik kedua pihak'};
  case'cursed-win':return{k:'cur',t:me+' unggul, tetapi seri',s:'kemenangan terhalang aturan 50 langkah'};
  case'blessed-loss':return{k:'cur',t:op+' unggul, tetapi seri',s:'kemenangan terhalang aturan 50 langkah'};
  default:return{k:'',t:'Hasil tidak diketahui',s:''}}}
const BADGE={win:['win','Menang'],draw:['draw','Seri'],loss:['loss','Kalah'],'cursed-win':['cw','Menang (seri 50)'],'blessed-loss':['bl','Kalah (seri 50)']};
const dtmN=d=>d?Math.ceil((Math.abs(d)+1)/2):0;
let tbTimer=0;
function tbProbe(){if(cur!=='tb'||ED.on)return;clearTimeout(tbTimer);tbTimer=setTimeout(tbRun,120)}
function tbBox(cls,t,s,extra){return '<div class="tbv '+cls+'"><div><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+'</div>'+(extra||'')+'</div>'}
async function tbRun(){
 const fen=game.fen(),n=nPieces(),seq=++TB.seq,box=$('tbres');
 if(n>7){TB.off=false;box.innerHTML=tbBox('','Terlalu banyak bidak ('+n+')','Tablebase hanya mencakup 7 bidak atau kurang. Pilih posisi latihan atau gunakan "Atur posisi".');return}
 if(game.in_checkmate()){TB.off=false;box.innerHTML=tbBox('dec','Skakmat · '+SIDE[game.turn()==='w'?'b':'w']+' menang');return}
 if(game.game_over()){TB.off=false;box.innerHTML=tbBox('drw','Permainan seri');return}
 box.innerHTML='<p class="cnt">Menanyakan tablebase…</p>';
 let j;
 try{j=await tbFetch(fen)}catch(e){if(seq!==TB.seq)return;tbOffline(e);return}
 if(seq!==TB.seq)return;
 try{tbRender(j)}catch(e){console.error(e);box.innerHTML=tbBox('','Gagal menampilkan hasil',esc(e&&e.message||e))}}
function tbOffline(e){
 TB.off=true;
 const why=e&&e.name==='AbortError'?'waktu tunggu habis (9 detik)':esc(e&&e.message||'koneksi gagal'),
  hint=/Failed to fetch|NetworkError|Load failed/i.test(String(e&&e.message))?'Biasanya karena tidak ada internet, atau halaman dibuka di lingkungan yang memblokir koneksi keluar (pratinjau/iframe ber-CSP). Buka file langsung di browser.':'';
 $('tbres').innerHTML=tbBox('','Tablebase online tidak terjangkau',why+'. '+hint+' Di bawah ini perkiraan dari Stockfish, bukan hasil tablebase sempurna.','<button id="tbretry" type="button" class="gbtn">Coba lagi</button>')+'<div id="tbsf"></div>';
 $('tbretry').onclick=()=>{TB.cache.clear();tbRun()};
 tbSfRender()}
function tbSfRender(){
 const el=$('tbsf');if(!el||!TB.off||cur!=='tb')return;
 if(typeof lastEv==='undefined'||!lastEv||anFen!==game.fen()){el.innerHTML='<p class="cnt">Stockfish sedang menghitung…</p>';return}
 const k=lastEv[0],v=lastEv[1],d=lastEv[2],a=Math.abs(v),w=v>0?'Putih':'Hitam';let t,s,c='dec';
 if(k==='mate'){t=w+' menang';s='skakmat dalam '+a+' langkah'}
 else if(a<40){t='Kemungkinan seri';s='evaluasi '+(v/100).toFixed(2);c='drw'}
 else if(a<250){t=w+' lebih baik';s='evaluasi '+(v/100).toFixed(2)}
 else{t=w+' kemungkinan menang';s='evaluasi '+(v/100).toFixed(2)}
 el.innerHTML=tbBox(c,'Perkiraan Stockfish: '+t,s+' · kedalaman '+d+(bestSan?' · terbaik: '+esc(bestSan):''),bestSan?'<button id="tbbest" type="button" class="gbtn">Mainkan</button>':'');
 const b=$('tbbest');if(b)b.onclick=()=>play(bestSan)}
const _se=showEval;showEval=function(){_se.apply(this,arguments);tbSfRender()};
function tbRender(j){
 const turn=game.turn(),v=verdict(j.category,turn),box=$('tbres');
 const dd=[];if(j.dtm)dd.push('skakmat ≈ '+Math.ceil(Math.abs(j.dtm)/2)+' langkah (DTM '+Math.abs(j.dtm)+')');if(j.dtz!=null&&j.category!=='draw')dd.push('DTZ '+Math.abs(j.dtz));
 let h=tbBox(v.k,esc(v.t),esc(v.s)+(dd.length?' · '+esc(dd.join(' · ')):''));
 const mv=j.moves||[];
 if(mv.length){const f=mv[0];
  h+='<div class="tbt-w"><table class="tbt"><thead><tr><th>Langkah</th><th>Hasil</th><th>Jarak</th></tr></thead><tbody>'+mv.map(m=>{
   const bd=BADGE[inv[m.category]]||['draw','?'],best=m.category===f.category&&(f.dtm==null||m.dtm===f.dtm);
   const dist=m.checkmate?'Skakmat':m.stalemate?'Pat':(m.dtm?'mat '+dtmN(m.dtm)+' lgk':(m.dtz?'DTZ '+Math.abs(m.dtz):'—'));
   return '<tr class="go'+(best?' best':'')+'" data-san="'+esc(m.san)+'" tabindex="0"><td>'+esc(m.san)+(best?'<span class="star" title="Langkah terbaik">★</span>':'')+'</td><td><span class="bd '+bd[0]+'">'+bd[1]+'</span></td><td>'+dist+'</td></tr>'}).join('')+'</tbody></table></div>'}
 box.innerHTML=h;
 box.querySelectorAll('tr.go').forEach(r=>{const f=()=>{play(r.dataset.san)};r.onclick=f;r.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();f()}}})}
function tbUI(){
 const active=TB.on||(BOT.on&&cur==='tb');
 $('tbstop').hidden=!active;$('tbplay').disabled=TB.on;
 if(TB.on){$('tbmsg').textContent=game.game_over()?'Latihan selesai. '+(game.in_checkmate()?(game.turn()===TB.side?'Anda skakmat — coba lagi dengan teknik yang lebih baik.':'Skakmat! Anda berhasil menyelesaikannya.'):'Permainan seri.'):'Anda memegang '+SIDE[TB.side==='w'?'b':'w']+'. Tablebase memegang '+SIDE[TB.side]+' dan selalu bermain sempurna.'}
 else if(BOT.on&&cur==='tb')$('tbmsg').textContent='Melawan Stockfish kekuatan penuh. Klik "Hentikan latihan" untuk kembali.'}
$('tbplay').onclick=()=>{
 if(nPieces()>7){$('tbmsg').textContent='Muat posisi (maksimal 7 bidak) dulu.';return}
 if(BOT.on)botStop('');
 const sd=$('tbside').value,h=sd==='auto'?game.turn():sd;TB.side=h==='w'?'b':'w';TB.on=true;
 if(flip!==(h==='b'))$('flip').click();
 tbUI();tbReply();update()};
$('tbstop').onclick=()=>{TB.on=false;clearTimeout(rt);if(BOT.on)botStop('');$('tbmsg').textContent='Latihan dihentikan. Anda bebas menggerakkan kedua pihak.';tbUI();update()};
function tbToSF(msg){TB.on=false;clearTimeout(rt);const h=TB.side==='w'?'b':'w';BOT.p='';BOT.lv=LV.length-1;BOT.pref=h;botStart();$('tbmsg').textContent=msg;tbUI()}
$('tbfull').onclick=()=>{
 if(nPieces()>7&&!confirm('Posisi ini bukan ujung permainan. Lanjutkan melawan Stockfish dari posisi sekarang?'))return;
 const sd=$('tbside').value;TB.side=(sd==='auto'?game.turn():sd)==='w'?'b':'w';
 tbToSF('Melawan Stockfish kekuatan penuh. Klik "Hentikan latihan" untuk kembali.')};
let rt=0;
function tbReply(){
 clearTimeout(rt);if(!TB.on||game.game_over()||game.turn()!==TB.side)return;
 const fen=game.fen();
 rt=setTimeout(async()=>{
  if(!TB.on||game.fen()!==fen)return;
  let j;try{j=await tbFetch(fen)}catch(e){if(TB.on&&game.fen()===fen)tbToSF('Tablebase online tidak terjangkau ('+(e&&e.message||'gagal')+'). Dilanjutkan melawan Stockfish kekuatan penuh.');return}
  if(!TB.on||game.fen()!==fen)return;
  const m=(j.moves||[])[0];if(!m)return;
  TB.mv=true;try{play({from:m.uci.slice(0,2),to:m.uci.slice(2,4),promotion:m.uci[4]})}finally{TB.mv=false}},550)}
const _pl=play;
play=function(){if(TB.on&&!TB.mv&&game.turn()===TB.side)return;return _pl.apply(this,arguments)};
const _uo=$('undo').onclick;
$('undo').onclick=function(){_uo.apply(this,arguments);if(TB.on&&game.turn()===TB.side&&game.history().length){game.undo();update()}};

/* ====================== EDITOR POSISI ====================== */
const pal=$('edpal');
['b','w'].forEach(c=>PCS.forEach(t=>{const code=c+t,b=document.createElement('button');b.type='button';b.className='pcell';b.dataset.p=code;b.setAttribute('aria-label',PNAME[t]+' '+(c==='w'?'putih':'hitam'));b.setAttribute('aria-pressed','false');
 b.innerHTML='<img alt="" draggable="true" src="'+PC[code]+'">';pal.append(b)}));
pal.addEventListener('click',e=>{const b=e.target.closest('.pcell');if(!b)return;ED.tool=ED.tool===b.dataset.p?null:b.dataset.p;ED.lift=false;edSync()});
pal.addEventListener('dragstart',e=>{const b=e.target.closest('.pcell');if(!b)return;e.dataTransfer.setData('text/plain','p:'+b.dataset.p);e.dataTransfer.effectAllowed='copy';ED.src=null});
$('edx').onclick=()=>{ED.tool=ED.tool==='x'?null:'x';ED.lift=false;edSync()};
function edFromGame(){
 game.board().forEach((r,ri)=>r.forEach((p,ci)=>{ED.b[ri*8+ci]=p?p.color+p.type.toUpperCase():null}));
 ED.turn=game.turn();const cs=game.fen().split(' ')[2]||'-';
 ED.cas={K:cs.includes('K'),Q:cs.includes('Q'),k:cs.includes('k'),q:cs.includes('q')}}
function edCastle(){const b=ED.b;return{
 K:b[60]==='wK'&&b[63]==='wR',Q:b[60]==='wK'&&b[56]==='wR',k:b[4]==='bK'&&b[7]==='bR',q:b[4]==='bK'&&b[0]==='bR'}}
function edFen(turn){
 const rows=[];for(let r=0;r<8;r++){let s='',n=0;for(let c=0;c<8;c++){const p=ED.b[r*8+c];if(!p)n++;else{if(n){s+=n;n=0}s+=p[0]==='w'?p[1]:p[1].toLowerCase()}}if(n)s+=n;rows.push(s)}
 const pos=edCastle();let cs='';['K','Q','k','q'].forEach(k=>{if(ED.cas[k]&&pos[k])cs+=k});
 return rows.join('/')+' '+(turn||ED.turn)+' '+(cs||'-')+' - 0 1'}
function edMsg(t,bad){const m=$('edmsg');m.textContent=t;m.classList.toggle('bad',!!bad)}
function edSync(keepMsg){
 const pos=edCastle();['K','Q','k','q'].forEach(k=>{const cb=$('ec'+k);cb.disabled=!pos[k];cb.checked=ED.cas[k]&&pos[k]});
 $('edturn').value=ED.turn;$('edfen').value=edFen();
 pal.querySelectorAll('.pcell').forEach(b=>b.setAttribute('aria-pressed',String(ED.tool===b.dataset.p)));
 $('edx').setAttribute('aria-pressed',String(ED.tool==='x'));
 B.classList.toggle('edx',ED.tool==='x');
 if(!keepMsg)edMsg(ED.lift?'Memindahkan bidak — klik petak tujuan.':ED.tool==='x'?'Penghapus aktif: klik bidak untuk menghapus.':ED.tool?'Klik petak untuk menaruh '+PNAME[ED.tool[1]]+' '+(ED.tool[0]==='w'?'putih':'hitam')+'.':'Pilih bidak dari palet lalu klik petak, atau seret bidak ke papan. Seret bidak keluar papan atau klik kanan untuk menghapus.');
 edDraw()}
['K','Q','k','q'].forEach(k=>{$('ec'+k).onchange=()=>{ED.cas[k]=$('ec'+k).checked;edSync()}});
$('edturn').onchange=()=>{ED.turn=$('edturn').value;edSync()};
$('edflip').onclick=()=>{$('flip').click()};
$('edstart').onclick=()=>{const t=new Chess();ED.b.fill(null);t.board().forEach((r,ri)=>r.forEach((p,ci)=>{ED.b[ri*8+ci]=p?p.color+p.type.toUpperCase():null}));ED.turn='w';ED.cas={K:true,Q:true,k:true,q:true};edSync()};
$('edclear').onclick=()=>{ED.b.fill(null);ED.cas={K:true,Q:true,k:true,q:true};edSync()};
function edOpen(){
 if(BOT.on)botStop('');TB.on=false;clearTimeout(rt);
 edFromGame();ED.tool=null;ED.lift=false;ED.on=true;B.classList.add('ed');
 tbUI();edSync();window.scrollTo({top:0})}
function edClose(){ED.on=false;B.classList.remove('ed','edx');draw();update()}
$('tbedit').onclick=edOpen;$('edback').onclick=edClose;
function edPlace(i,code){
 if(code[1]==='P'&&(i<8||i>=56)){edMsg('Pion tidak boleh berada di baris 1 atau 8.',1);return false}
 if(code[1]==='K'){const j=ED.b.indexOf(code);if(j>=0)ED.b[j]=null}
 ED.b[i]=code;return true}
function edClick(n){
 const i=sqIdx(n);
 if(ED.tool==='x')ED.b[i]=null;
 else if(ED.tool){if(edPlace(i,ED.tool)&&ED.lift){ED.tool=null;ED.lift=false}}
 else if(ED.b[i]){ED.tool=ED.b[i];ED.b[i]=null;ED.lift=true}
 edSync()}
function edDraw(){
 const b=$('board');b.innerHTML='';
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const rr=flip?7-r:r,cc=flip?7-c:c,p=ED.b[rr*8+cc],n='abcdefgh'[cc]+(8-rr),el=document.createElement('div');
  el.className='sq '+((rr+cc)%2?'d':'l');el.dataset.sq=n;el.tabIndex=0;el.setAttribute('role','gridcell');el.setAttribute('aria-label',n+(p?' '+p:''));
  if(c===0){const s=document.createElement('span');s.className='co r';s.textContent=8-rr;el.append(s)}
  if(r===7){const s=document.createElement('span');s.className='co f';s.textContent='abcdefgh'[cc];el.append(s)}
  if(p){const i=document.createElement('img');i.alt='';i.src=PC[p];el.append(i);el.draggable=true}
  b.append(el)}
 $('status').textContent='Mode atur posisi'}
function edValidate(){
 const k={wK:0,bK:0};ED.b.forEach(p=>{if(p==='wK'||p==='bK')k[p]++});
 if(k.wK!==1||k.bK!==1)return 'Posisi harus punya tepat satu Raja putih dan satu Raja hitam.';
 const t=new Chess();if(!t.load(edFen()))return 'Posisi tidak valid.';
 const o=ED.turn==='w'?'b':'w',t2=new Chess();
 if(!t2.load(edFen(o))||t2.in_check())return 'Posisi ilegal: Raja '+SIDE[o].toLowerCase()+' sedang diserang padahal bukan gilirannya (atau kedua raja bersebelahan).';
 return ''}
$('edapply').onclick=()=>{
 const err=edValidate();if(err){edMsg(err,1);return}
 const fen=edFen();ED.on=false;B.classList.remove('ed','edx');
 if(!game.load(fen)){ED.on=true;B.classList.add('ed');edMsg('Posisi ditolak oleh mesin catur.',1);return}
 sel=null;$('promo').className='';
 if(flip!==(ED.turn==='b'))$('flip').click();
 TB.cache.size>200&&TB.cache.clear();update()};
$('edfen').addEventListener('change',()=>{
 const t=new Chess();if(!t.load($('edfen').value.trim())){edMsg('FEN tidak valid.',1);$('edfen').value=edFen();return}
 t.board().forEach((r,ri)=>r.forEach((p,ci)=>{ED.b[ri*8+ci]=p?p.color+p.type.toUpperCase():null}));
 ED.turn=t.turn();const cs=t.fen().split(' ')[2];ED.cas={K:cs.includes('K'),Q:cs.includes('Q'),k:cs.includes('k'),q:cs.includes('q')};edSync()});
const bd=$('board');
['mousedown','mouseup','pointerdown','pointerup'].forEach(ev=>bd.addEventListener(ev,e=>{if(ED.on||DR.on||BL.on)e.stopPropagation()},true));
bd.addEventListener('contextmenu',e=>{if(ED.on){e.preventDefault();e.stopPropagation();const s=e.target.closest('.sq');if(s){ED.b[sqIdx(s.dataset.sq)]=null;ED.lift=false;edSync()}}else if(DR.on||BL.on){e.preventDefault();e.stopPropagation()}},true);
bd.addEventListener('click',e=>{
 const s=e.target.closest('.sq');
 if(ED.on){e.stopPropagation();e.preventDefault();if(s)edClick(s.dataset.sq);return}
 if(DR.on){e.stopPropagation();e.preventDefault();if(s)drClick(s.dataset.sq);return}
 if(BL.on){e.stopPropagation();e.preventDefault();if(s)blClick(s.dataset.sq)}},true);
bd.addEventListener('keydown',e=>{
 if(!(ED.on||DR.on||BL.on)||(e.key!=='Enter'&&e.key!==' '))return;
 e.stopPropagation();e.preventDefault();const s=e.target.closest('.sq');if(!s)return;
 if(ED.on)edClick(s.dataset.sq);else if(DR.on)drClick(s.dataset.sq);else blClick(s.dataset.sq)},true);
bd.addEventListener('dragstart',e=>{
 if(!ED.on)return;const s=e.target.closest('.sq');if(!s||!ED.b[sqIdx(s.dataset.sq)]){e.preventDefault();return}
 ED.src=s.dataset.sq;e.dataTransfer.setData('text/plain','m:'+s.dataset.sq);e.dataTransfer.effectAllowed='move';
 const im=s.querySelector('img');if(im)e.dataTransfer.setDragImage(im,im.width/2,im.height/2)});
bd.addEventListener('dragover',e=>{if(ED.on){e.preventDefault();e.dataTransfer.dropEffect=ED.src?'move':'copy'}});
bd.addEventListener('drop',e=>{
 if(!ED.on)return;e.preventDefault();const s=e.target.closest('.sq');if(!s)return;
 const d=(e.dataTransfer.getData('text/plain')||'').split(':'),i=sqIdx(s.dataset.sq);
 if(d[0]==='p')edPlace(i,d[1]);
 else if(d[0]==='m'){const j=sqIdx(d[1]);if(j!==i){const code=ED.b[j];ED.b[j]=null;if(!edPlace(i,code))ED.b[j]=code}}
 ED.src=null;ED.dropped=true;edSync(1)});
addEventListener('dragend',e=>{
 if(!ED.on)return;
 if(ED.src&&!ED.dropped&&e.dataTransfer&&e.dataTransfer.dropEffect==='none'){ED.b[sqIdx(ED.src)]=null;edSync()}
 ED.src=null;ED.dropped=false});

/* ====================== BLINDFOLD ====================== */
const bo=$('blopp');
bo.innerHTML='<optgroup label="Stockfish">'+LV.map((x,i)=>'<option value="sf:'+i+'">'+x.n+(x.elo?' (≈ '+x.elo+')':' (maks)')+'</option>').join('')+'</optgroup><optgroup label="Bot bergaya pemain">'+Object.values(window.PRS||{}).map(p=>'<option value="pl:'+p.id+'">'+esc(p.n)+' (≈ '+p.elo+')</option>').join('')+'</optgroup>';
bo.value='sf:'+Math.min(BOT.lv,LV.length-1);
const PN={p:'Pion',n:'Kuda',b:'Gajah',r:'Benteng',q:'Ratu',k:'Raja'},sp=s=>s[0]+' '+s[1];
function say(m){
 let t;if(m.flags.includes('k'))t='Rokade pendek';else if(m.flags.includes('q'))t='Rokade panjang';
 else t=PN[m.piece]+' dari '+sp(m.from)+(m.captured?' makan di ':' ke ')+sp(m.to)+(m.promotion?', promosi jadi '+PN[m.promotion]:'');
 return t+(m.san.includes('#')?', skakmat':m.san.includes('+')?', skak':'')}
function speak(t){
 if(!$('blvoice').checked||!('speechSynthesis' in window))return;
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='id-ID';
  const v=(speechSynthesis.getVoices()||[]).find(x=>/^id/i.test(x.lang));if(v)u.voice=v;u.rate=.95;speechSynthesis.speak(u)}catch(e){}}
function blFb(t,bad){const f=$('blfb');f.textContent=t;f.style.color=bad?'#dc2626':''}
function blUI(){
 $('blsetup').hidden=BL.on;$('bllive').hidden=!BL.on;
 if(!BL.on)return;
 const over=game.game_over();
 $('blstat').textContent='Bantuan dipakai: '+BL.peeks+'x · Langkah: '+Math.ceil(game.history().length/2)+(BL.qall?' · Uji ingatan: '+BL.qok+'/'+BL.qall:'')+(over?' · '+(game.in_checkmate()?(game.turn()===BOT.side?'Anda menang!':'Lawan menang.'):'Seri.'):'');
 $('blin').disabled=over;$('blagain').hidden=!over;$('bllegal').disabled=over;$('blquiz').disabled=false}
function blStart(){
 const v=$('blopp').value.split(':');
 stopDrill();$('reset').click();
 if(v[0]==='sf'){BOT.p='';BOT.lv=+v[1]}else BOT.p=v[1];
 let s=$('blside').value;if(s==='r')s=Math.random()<.5?'w':'b';
 BOT.pref=s;BL.lvl=+$('bllvl').value;BL.n=0;BL.peeks=0;BL.opp=null;BL.from=null;BL.quiz=null;BL.qok=BL.qall=0;
 B.classList.remove('bf1','bf2','bf3','peek');B.classList.add('bf'+BL.lvl);B.classList.toggle('nocoord',$('blnc').checked);
 $('blqbox').hidden=true;$('blpos').hidden=true;
 BL.on=true;botStart();
 $('bloppt').innerHTML=s==='w'?'Anda memegang Putih.<small>Ketik atau klik langkah pertama Anda.</small>':'Anda memegang Hitam.<small>Menunggu langkah Putih…</small>';
 blFb('');blUI();blAfter();if(!$('blin').disabled)$('blin').focus()}
function blEnd(){BL.on=false;BL.from=null;if(BOT.on)botStop('');B.classList.remove('bf1','bf2','bf3','peek','nocoord');try{speechSynthesis.cancel()}catch(e){}blUI();update()}
$('blgo').onclick=blStart;$('blend').onclick=blEnd;$('blagain').onclick=()=>{BL.on=false;if(BOT.on)botStop('');B.classList.remove('peek');blStart()};
function parseMove(raw){
 const t=raw.trim();if(!t)return null;
 const s=t.replace(/0/g,'O').replace(/^o-o-o$/i,'O-O-O').replace(/^o-o$/i,'O-O'),g=new Chess(game.fen());
 for(const c of [s,s[0].toUpperCase()+s.slice(1)]){const m=g.move(c,{sloppy:true});if(m)return m}
 const u=t.toLowerCase().replace(/[-\s]/g,'');
 if(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u))return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
 return null}
function blDoMove(m){
 if(!BL.on||game.game_over())return;
 if(game.turn()===BOT.side){blFb('Tunggu giliran Anda — lawan sedang berpikir.',1);return}
 $('blform').classList.remove('bad');blFb('Langkah Anda: '+m.san);BL.from=null;play(m.san);markApply()}
$('blform').onsubmit=e=>{
 e.preventDefault();const fm=$('blform');
 if(!BL.on||game.game_over())return;
 const m=parseMove($('blin').value);
 if(!m){fm.classList.remove('bad');void fm.offsetWidth;fm.classList.add('bad');blFb('Langkah tidak sah di posisi ini. Contoh: e4, Nf3, O-O, e2e4. Tekan "Langkah legal" bila perlu.',1);return}
 $('blin').value='';blDoMove(m)};
function blClick(n){
 if(!BL.on||game.game_over())return;
 if(game.turn()===BOT.side){blFb('Tunggu giliran Anda — lawan sedang berpikir.',1);return}
 if(!BL.from||BL.from===n){BL.from=BL.from===n?null:n;blFb(BL.from?'Dari '+n+' — klik petak tujuan.':'');markApply();return}
 const g=new Chess(game.fen()),c=g.moves({verbose:true}).filter(m=>m.from===BL.from&&m.to===n);
 if(!c.length){const f=BL.from;BL.from=null;markApply();blFb('Langkah '+f+'→'+n+' tidak sah.',1);const fm=$('blform');fm.classList.remove('bad');void fm.offsetWidth;fm.classList.add('bad');return}
 const m=c.find(x=>x.promotion==='q')||c[0];blDoMove(m)}
function blAfter(){
 if(!BL.on)return;
 const h=game.history({verbose:true});
 if(h.length<BL.n){BL.n=h.length;blUI();return}
 if(h.length>BL.n){BL.n=h.length;const m=h[h.length-1];
  if(BOT.on&&m.color===BOT.side){BL.opp=m;const t=say(m);$('bloppt').innerHTML=esc(m.san)+'<small>'+esc(t)+'</small>';speak(t);if(!$('blin').disabled)setTimeout(()=>$('blin').focus({preventScroll:true}),50)}}
 if(game.game_over()){B.classList.add('peek');$('bloppt').insertAdjacentHTML('beforeend','<small>Permainan selesai — papan ditampilkan.</small>')}
 blUI()}
$('blpeek').onclick=()=>{BL.peeks++;B.classList.add('peek');setTimeout(()=>{if(!game.game_over())B.classList.remove('peek')},3000);blUI()};
$('blrep').onclick=()=>{if(BL.opp)speak(say(BL.opp))};
$('blundo').onclick=()=>{if(!BL.on)return;BL.from=null;$('undo').click();BL.peeks++;blFb('Langkah dibatalkan (dihitung sebagai bantuan).');blUI()};
$('blread').onclick=()=>{
 const el=$('blpos');if(!el.hidden){el.hidden=true;return}
 BL.peeks++;const ord={k:0,q:1,r:2,b:3,n:4,p:5},L={w:[],b:[]};
 game.board().forEach((r,ri)=>r.forEach((p,ci)=>{if(p)L[p.color].push([p.type,(p.type==='p'?'':p.type.toUpperCase())+'abcdefgh'[ci]+(8-ri)])}));
 el.innerHTML=['w','b'].map(c=>'<b>'+SIDE[c]+':</b> '+L[c].sort((a,b)=>ord[a[0]]-ord[b[0]]).map(x=>x[1]).join(', ')).join('<br>');
 el.hidden=false;blUI()};
$('bllegal').onclick=()=>{
 const el=$('blpos');if(!el.hidden){el.hidden=true;return}
 BL.peeks++;el.innerHTML='<b>Langkah legal:</b> '+game.moves().join(', ');el.hidden=false;blUI()};
/* uji ingatan posisi */
function blQuiz(){
 const L=[];game.board().forEach((r,ri)=>r.forEach((p,ci)=>{if(p)L.push({c:p.color,t:p.type,sq:'abcdefgh'[ci]+(8-ri)})}));
 const pick=L[Math.random()*L.length|0],all=L.filter(x=>x.c===pick.c&&x.t===pick.t).map(x=>x.sq);
 BL.quiz={c:pick.c,t:pick.t,all};
 $('blqt').textContent='Di petak mana '+PN[pick.t]+' '+(pick.c==='w'?'putih':'hitam')+'?'+(all.length>1?' (sebutkan salah satu dari '+all.length+')':'');
 $('blqbox').hidden=false;$('blqi').value='';$('blqi').focus()}
$('blquiz').onclick=blQuiz;
$('blqf').onsubmit=e=>{
 e.preventDefault();if(!BL.quiz)return;const a=$('blqi').value.trim().toLowerCase(),q=BL.quiz;BL.qall++;
 if(q.all.includes(a)){BL.qok++;$('blqt').textContent='Benar! '+PN[q.t]+' ada di '+a+'.'}else $('blqt').textContent='Belum tepat. '+PN[q.t]+' '+(q.c==='w'?'putih':'hitam')+' ada di '+q.all.join(' / ')+'.';
 BL.quiz=null;$('blqi').value='';blUI()};
/* sorotan klik */
function markApply(){
 document.querySelectorAll('#board .sq').forEach(el=>{el.classList.toggle('bsel',BL.on&&BL.from===el.dataset.sq)})}

/* ====================== LATIHAN KOORDINAT ====================== */
const rnd=n=>Math.random()*n|0,rsq=()=>'abcdefgh'[rnd(8)]+(1+rnd(8));
const GL={n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'},PN2={n:'Kuda',b:'Gajah',r:'Benteng',q:'Ratu',k:'Raja'};
function targets(p,sq){
 const f=sq.charCodeAt(0)-97,r=+sq[1]-1,out=[];
 const D={n:[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],k:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  b:[[1,1],[1,-1],[-1,1],[-1,-1]],r:[[1,0],[-1,0],[0,1],[0,-1]]};D.q=D.b.concat(D.r);
 const slide=p==='b'||p==='r'||p==='q';
 D[p].forEach(([a,b])=>{let x=f+a,y=r+b;while(x>=0&&x<8&&y>=0&&y<8){out.push('abcdefgh'[x]+(y+1));if(!slide)break;x+=a;y+=b}});
 return out}
function drUI(){
 $('drgo').hidden=DR.on;$('drstop').hidden=!DR.on;$('drq').hidden=!DR.on;$('drtype').disabled=DR.on;
 $('drs').textContent=DR.all?'Skor '+DR.ok+'/'+DR.all+' · beruntun '+DR.st+' (terbaik '+DR.best+') · rata-rata '+(DR.tsum/DR.all/1000).toFixed(1)+' dtk':''}
function stopDrill(){DR.on=false;B.classList.remove('drill','nocoord');DR.marks.clear();DR.flash=[];drUI();drApply()}
function drStart(){
 if(BL.on){$('drs').textContent='Akhiri sesi blindfold dulu untuk memakai latihan koordinat.';return}
 DR.type=$('drtype').value;DR.ok=DR.all=DR.st=DR.best=DR.tsum=0;DR.on=true;
 B.classList.add('drill');B.classList.toggle('nocoord',$('drnc').checked);
 drNext()}
function drNext(){
 DR.marks.clear();DR.flash=[];DR.lock=false;DR.t0=performance.now();const t=DR.type,a=$('dra');a.innerHTML='';$('drfb').textContent='';
 if(t==='find'){DR.q={sq:rsq()};$('drp').innerHTML='Klik petak <b>'+DR.q.sq+'</b>'}
 else if(t==='name'){DR.q={sq:rsq()};$('drp').textContent='Petak yang disorot?';
  a.innerHTML='<form class="blin" id="drf" autocomplete="off"><input id="dri" type="text" maxlength="2" spellcheck="false" autocapitalize="off" placeholder="mis. e4" aria-label="Nama petak"><button class="pbtn" type="submit">Jawab</button></form>';
  $('drf').onsubmit=e=>{e.preventDefault();drJudge($('dri').value.trim().toLowerCase()===DR.q.sq,DR.q.sq)};setTimeout(()=>$('dri')&&$('dri').focus({preventScroll:true}),30)}
 else if(t==='color'){const s=rsq();DR.q={sq:s,dark:((s.charCodeAt(0)-97)+(+s[1]))%2===1};$('drp').innerHTML='<b>'+s+'</b> terang atau gelap?';
  a.innerHTML='<div class="dbtn"><button type="button" class="lt" id="drl">Terang</button><button type="button" class="dk" id="drd">Gelap</button></div>';
  $('drl').onclick=()=>drJudge(!DR.q.dark,DR.q.dark?'gelap':'terang');$('drd').onclick=()=>drJudge(DR.q.dark,DR.q.dark?'gelap':'terang')}
 else if(t==='piece'){const p='nbrqk'[rnd(5)],s=rsq();DR.q={sq:s,p,t:targets(p,s)};
  $('drp').innerHTML=GL[p]+' '+PN2[p]+' di <b>'+s+'</b>';
  a.innerHTML='<p class="cnt" style="margin:0 0 8px">Klik semua petak yang bisa dituju (papan kosong), lalu periksa.</p><div class="btns"><button type="button" class="pbtn" id="drck">Periksa</button><button type="button" class="gbtn" id="drsk">Lewati</button></div>';
  $('drck').onclick=drCheck;$('drsk').onclick=()=>drJudge(false,DR.q.t.length+' petak')}
 else if(t==='diag'){let a1=rsq(),b1=rsq();while(b1===a1)b1=rsq();
  const same=Math.abs(a1.charCodeAt(0)-b1.charCodeAt(0))===Math.abs(+a1[1]-+b1[1]);DR.q={a:a1,b:b1,same,sq:a1};
  $('drp').innerHTML='<b>'+a1+'</b> &amp; <b>'+b1+'</b> satu diagonal?';
  a.innerHTML='<div class="dbtn"><button type="button" class="pbtn" id="dry">Ya</button><button type="button" class="gbtn" id="drn">Tidak</button></div>';
  $('dry').onclick=()=>drJudge(DR.q.same,DR.q.same?'ya':'tidak');$('drn').onclick=()=>drJudge(!DR.q.same,DR.q.same?'ya':'tidak')}
 drUI();drApply()}
function drJudge(ok,ans,extra){
 if(DR.lock)return;DR.lock=true;
 DR.all++;DR.tsum+=performance.now()-DR.t0;if(ok){DR.ok++;DR.st++;DR.best=Math.max(DR.best,DR.st)}else DR.st=0;
 $('drfb').textContent=(ok?'Benar! ':'Salah — jawaban: '+ans+'. ')+(extra||'');$('drfb').style.color=ok?'#16a34a':'#dc2626';
 if(DR.type==='find'||DR.type==='name')DR.flash=[{sq:DR.q.sq,c:ok?'dok':'dtg'}];else if(DR.type==='piece')DR.flash=DR.q.t.map(s=>({sq:s,c:'dtg'}));
 drUI();drApply();setTimeout(()=>{if(DR.on)drNext()},ok?600:1700)}
function drCheck(){
 if(DR.lock)return;const need=new Set(DR.q.t),got=DR.marks;
 const miss=[...need].filter(s=>!got.has(s)),extra=[...got].filter(s=>!need.has(s));
 drJudge(!miss.length&&!extra.length,DR.q.t.length+' petak: '+DR.q.t.join(', '),(miss.length?'Kurang: '+miss.join(', ')+'. ':'')+(extra.length?'Salah: '+extra.join(', ')+'.':''))}
function drClick(n){
 if(!DR.on||DR.lock)return;
 if(DR.type==='find'){
  if(n===DR.q.sq)drJudge(true,n);
  else{DR.flash=[{sq:n,c:'dno'}];drJudge(false,DR.q.sq);DR.flash=[{sq:n,c:'dno'},{sq:DR.q.sq,c:'dtg'}];drApply()}}
 else if(DR.type==='piece'){if(n===DR.q.sq)return;DR.marks.has(n)?DR.marks.delete(n):DR.marks.add(n);drApply()}}
function drApply(){
 document.querySelectorAll('#board .sq').forEach(el=>{
  const n=el.dataset.sq;['dq','dm','dsrc','dok','dno','dtg'].forEach(c=>el.classList.remove(c));el.removeAttribute('data-g');
  if(!DR.on)return;
  if(DR.type==='name'&&DR.q&&DR.q.sq===n)el.classList.add('dq');
  if(DR.type==='piece'&&DR.q&&DR.q.sq===n){el.classList.add('dsrc');el.dataset.g=GL[DR.q.p]}
  if(DR.marks.has(n))el.classList.add('dm');
  DR.flash.forEach(f=>{if(f.sq===n)el.classList.add(f.c)})})}
$('drnc').onchange=()=>{if(DR.on)B.classList.toggle('nocoord',$('drnc').checked)};
$('drgo').onclick=drStart;$('drstop').onclick=()=>{const s=$('drs').textContent;stopDrill();$('drfb').textContent='';$('drs').textContent=s};

/* ---------- Hook ---------- */
const _d=draw;
draw=function(){if(ED.on){edDraw();return}_d.apply(this,arguments);drApply();markApply()};
const _u=update;
update=function(){if(ED.on){edDraw();return}_u.apply(this,arguments);tbProbe();if(TB.on)tbReply();tbUI();blAfter()};
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||'')))return;
 if(e.key==='f'||e.key==='F'){e.preventDefault();$('flip').click()}});
drUI();
window.__si={DR,BL,ED,TB};
})();
