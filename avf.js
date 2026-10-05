(function(){const C={
mc:{s:'#f2cba8',h:'#7a5632',st:'short',su:'#24456e',sh:'#fff',t:'#b83a3a',sm:1},
nk:{s:'#e7bc97',h:'#241913',st:'short',su:'#3d2f55',sh:'#1d1d22',bd:'#2a1f19',g:1,sm:1},
cr:{s:'#f0c6a3',h:'#2b1f18',st:'side',su:'#27415a',sh:'#fff',t:'#3a78b5',sm:1},
fz:{s:'#e8bd98',h:'#1d1411',st:'curly',su:'#1f3b33',sh:'#f4f4f4',sm:1},
fi:{s:'#f1caa8',h:'#80532b',st:'side',su:'#6a5040',sh:'#fff',t:'#8d2f2f'},
kp:{s:'#e5b78f',h:'#1a1411',st:'rec',su:'#52252a',sh:'#fff',t:'#d9a93c',br:1},
ka:{s:'#f0cdac',h:'#9c8366',st:'thin',su:'#4b5668',sh:'#fff',t:'#7f93b5',g:1},
mo:{s:'#edc6a2',h:'#1b1410',st:'part',su:'#1f1a19',sh:'#f6f1e6',bow:1,mu:1}};
const HR={short:'<path d="M32 43Q28 18 50 17Q72 18 68 43Q65 31 50 29Q35 31 32 43Z"/>',
side:'<path d="M32 44Q27 17 52 17Q73 19 68 42Q66 30 58 27Q46 33 37 29Q33 34 32 44Z"/>',
part:'<path d="M32 44Q27 18 50 17Q73 18 68 44Q67 30 56 27Q50 31 44 27Q34 30 32 44Z"/><path d="M44 27Q40 22 34 24" stroke="#000" stroke-opacity=".25" fill="none"/>',
thin:'<path d="M33 40Q31 22 50 21Q69 22 67 40Q64 31 50 29Q36 31 33 40Z"/>',
rec:'<path d="M32 46Q28 30 37 26Q35 36 35 46Z"/><path d="M68 46Q72 30 63 26Q65 36 65 46Z"/><path d="M37 26Q50 19 63 26Q50 23 37 26Z"/>',
curly:[34,40,46,52,58,64].map((x,i)=>'<circle cx="'+x+'" cy="'+(i%2?22:25)+'" r="7.5"/>').join('')+'<path d="M32 44Q29 28 50 28Q71 28 68 44Q64 33 50 33Q36 33 32 44Z"/>'};
window.AVF=(P,z)=>{const c=C[P.id]||C.mc,k=P.c[0],ink='#2a1d17',
 g=c.g?'<g fill="none" stroke="#1d1d1d" stroke-width="1.6"><rect x="36.5" y="38.5" width="11" height="8.5" rx="3"/><rect x="52.5" y="38.5" width="11" height="8.5" rx="3"/><path d="M47.5 42.5H52.5"/></g>':'',
 mouth=c.sm?'<path d="M43 54Q50 61 57 54Q50 56.5 43 54Z" fill="#fff" stroke="#8a4a3a" stroke-width="1.2" stroke-linejoin="round"/>':'<path d="M44 55Q50 58.5 56 55" stroke="#8a4a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
 return '<svg class="av" viewBox="0 0 100 100" width="'+z+'" height="'+z+'" aria-hidden="true"><rect width="100" height="100" fill="#2c4636"/><rect width="100" height="100" fill="'+k+'" opacity=".3"/><circle cx="50" cy="40" r="38" fill="#fff" opacity=".07"/>'
 +'<path d="M8 100Q10 72 50 70Q90 72 92 100Z" fill="'+c.su+'"/><path d="M39 70L50 90L61 70Z" fill="'+c.sh+'"/><path d="M39 70L48 100H28Q30 80 39 70ZM61 70L52 100H72Q70 80 61 70Z" fill="#000" opacity=".16"/>'
 +(c.t?'<path d="M47.5 76h5l2.5 16-5 4-5-4z" fill="'+c.t+'"/>':'')+(c.bow?'<path d="M50 76L40 71V81ZM50 76L60 71V81Z" fill="#111"/><circle cx="50" cy="76" r="2.4" fill="#222"/>':'')
 +'<rect x="43" y="55" width="14" height="19" rx="5" fill="'+c.s+'"/><path d="M43 63Q50 70 57 63V58H43Z" fill="#000" opacity=".13"/>'
 +'<circle cx="32.5" cy="45" r="3.8" fill="'+c.s+'"/><circle cx="67.5" cy="45" r="3.8" fill="'+c.s+'"/><ellipse cx="50" cy="43" rx="17.5" ry="20" fill="'+c.s+'"/>'
 +'<g fill="'+c.h+'">'+HR[c.st]+'</g>'
 +(c.bd?'<path d="M33 47Q33 67 50 68Q67 67 67 47Q63 58 50 58Q37 58 33 47Z" fill="'+c.bd+'"/>':'')+(c.mu?'<path d="M40 52Q46 48 50 52Q54 48 60 52Q54 56 50 53Q46 56 40 52Z" fill="'+c.h+'"/>':'')
 +'<circle cx="38" cy="51" r="3.5" fill="#e0665a" opacity=".2"/><circle cx="62" cy="51" r="3.5" fill="#e0665a" opacity=".2"/>'
 +'<path d="M38 38Q43 35.5 47.5 37.5M52.5 37.5Q57 35.5 62 38" stroke="'+c.h+'" stroke-width="'+(c.br?3:1.9)+'" fill="none" stroke-linecap="round"/>'
 +'<g class="eye"><ellipse cx="42.5" cy="43" rx="2.1" ry="2.5" fill="'+ink+'"/><ellipse cx="57.5" cy="43" rx="2.1" ry="2.5" fill="'+ink+'"/><circle cx="43.2" cy="42.2" r=".7" fill="#fff"/><circle cx="58.2" cy="42.2" r=".7" fill="#fff"/></g>'+g
 +'<path d="M50 44Q53 50 49.5 50.5" stroke="#000" stroke-opacity=".28" stroke-width="1.4" fill="none" stroke-linecap="round"/>'+mouth+'</svg>'}})();
