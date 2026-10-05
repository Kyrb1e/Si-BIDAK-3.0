(function () {
  'use strict';

  const ROOT = new URL('../', document.currentScript?.src || document.baseURI);
  const cssFiles = [
    'css/01-base.css','css/02-theme.css','css/03-v2.css','css/04-utility.css','css/05-v4.css',
    'css/06-v5.css','css/07-v6.css','css/08-pro.css','css/09-v3.css','css/10-v7.css','css/11-v8.css'
  ];
  const dataFiles = [
    ['offstats','application/json','data/offstats.gz','gz64'],
    ['offuser','application/json',null,null],
    ['plinfo','application/json','data/meta/plinfo.json',null],
    ['pl-nk-bb',null,'data/books/pl-nk-bb.gz','gz64'],['pl-nk-meta',null,'data/books/pl-nk-meta.gz','gz64'],['pl-nk-st',null,'data/books/pl-nk-st.gz','gz64'],
    ['pl-fz-bb',null,'data/books/pl-fz-bb.gz','gz64'],['pl-fz-meta',null,'data/books/pl-fz-meta.gz','gz64'],['pl-fz-st',null,'data/books/pl-fz-st.gz','gz64'],
    ['pl-fi-bb',null,'data/books/pl-fi-bb.gz','gz64'],['pl-fi-meta',null,'data/books/pl-fi-meta.gz','gz64'],['pl-fi-st',null,'data/books/pl-fi-st.gz','gz64'],
    ['pl-ka-bb',null,'data/books/pl-ka-bb.gz','gz64'],['pl-ka-meta',null,'data/books/pl-ka-meta.gz','gz64'],['pl-ka-st',null,'data/books/pl-ka-st.gz','gz64'],
    ['pl-kp-bb',null,'data/books/pl-kp-bb.gz','gz64'],['pl-kp-meta',null,'data/books/pl-kp-meta.gz','gz64'],['pl-kp-st',null,'data/books/pl-kp-st.gz','gz64'],
    ['pl-mo-bb',null,'data/books/pl-mo-bb.gz','gz64'],['pl-mo-meta',null,'data/books/pl-mo-meta.gz','gz64'],['pl-mo-st',null,'data/books/pl-mo-st.gz','gz64'],
    ['bkinfo','application/json','data/meta/bkinfo.json',null],
    ['bk-cr',null,'data/books/bk-cr.gz','gz64'],['bk-ka',null,'data/books/bk-ka.gz','gz64'],['bk-kp',null,'data/books/bk-kp.gz','gz64'],['bk-mc',null,'data/books/bk-mc.gz','gz64'],
    ['bk-mo',null,'data/books/bk-mo.gz','gz64'],['bk-nk',null,'data/books/bk-nk.gz','gz64'],['bk-fz',null,'data/books/bk-fz.gz','gz64'],['bk-fi',null,'data/books/bk-fi.gz','gz64'],
    ['wcmeta','application/json','data/meta/wcmeta.json',null],['wcbb',null,'data/books/wcbb.gz','gz64']
  ];
  const scripts = [
    ['js/vendor/chess.js', 'text/javascript'],
    ['js/data/openings.js', 'text/javascript'],
    ['js/data/positions.js', 'text/javascript'],
    ['js/data/pieces.js', 'text/javascript'],
    ['js/app-main.js', 'text/javascript'],
    ['js/features/avf.js', 'text/javascript'],
    ['js/features/persona.js', 'text/javascript'],
    ['js/features/fx.js', 'text/javascript'],
    ['js/features/mate.js', 'text/javascript'],
    ['js/features/intro.js', 'text/javascript'],
    ['js/features/board-training.js', 'text/javascript'],
    ['js/features/trail.js', 'text/javascript']
  ];

  function url(rel) { return new URL(rel, ROOT); }
  async function getText(rel) { return fetch(url(rel)).then(r => { if (!r.ok) throw new Error(rel + ' ' + r.status); return r.text(); }); }
  async function getBytes(rel) { return fetch(url(rel)).then(r => { if (!r.ok) throw new Error(rel + ' ' + r.status); return r.arrayBuffer(); }); }
  function addScriptText(text, attrs) {
    const s = document.createElement('script');
    if (attrs) Object.entries(attrs).forEach(([k,v]) => s.setAttribute(k,v));
    s.textContent = text;
    document.body.appendChild(s);
  }
  function bytesToB64(ab) {
    const bytes = new Uint8Array(ab);
    let out = '';
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) out += String.fromCharCode(...bytes.subarray(i, i + step));
    return btoa(out);
  }

  async function boot() {
    // If inline data/app already exist, this is an offline/self-contained copy.
    if (document.querySelector('script[data-sibidak-source="1"]')) return;

    const css = await Promise.all(cssFiles.map(getText));
    css.forEach((txt, i) => {
      const st = document.createElement('style');
      st.dataset.sibidakInlineStyle = '1';
      st.textContent = txt;
      document.head.appendChild(st);
    });

    // Recreate the original data-bearing script elements exactly where the app expects them.
    for (const [id, type, rel, enc] of dataFiles) {
      const content = rel ? (enc === 'gz64' ? bytesToB64(await getBytes(rel)) : await getText(rel)) : '';
      const s = document.createElement('script');
      s.id = id;
      if (type) s.type = type;
      if (enc) s.dataset.enc = enc;
      s.textContent = content;
      document.body.appendChild(s);
    }

    const sfjs = await getText('assets/stockfish/stockfish.js');
    const sfwasm = await getBytes('assets/stockfish/stockfish.wasm');
    addScriptText('const SFJS=' + JSON.stringify(bytesToB64(new TextEncoder().encode(sfjs).buffer)) + ';\\nconst SFWASM=' + JSON.stringify(bytesToB64(sfwasm)) + ';', { 'data-sibidak-source': '1' });

    for (const [rel] of scripts) {
      const txt = await getText(rel);
      addScriptText(txt, { 'data-sibidak-source': '1' });
    }
  }

  boot().catch(err => {
    console.error('[Si BIDAK loader]', err);
    const e = document.getElementById('emsg');
    if (e) e.textContent = 'Gagal memuat komponen aplikasi: ' + err.message;
  });
})();
