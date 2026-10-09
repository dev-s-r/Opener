/* Opener - PDF editor: annotate (text, draw, highlight, whiteout, box, image), page tools, merge, extract, forms, export. */
(function () {
  'use strict';
  var O = window.__opener;
  if (!O) return;
  var $ = O.$;

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#pdfView{position:relative}',
    '.pe-bar{position:sticky;top:-12px;z-index:6;margin:-12px -12px 12px;padding:8px 10px;display:flex;gap:6px;align-items:center;background:var(--surface-low);border-bottom:1px solid var(--outline-v)}',
    '.pe-b{flex:none;height:40px;min-width:40px;padding:0 14px;border-radius:20px;background:var(--surface-high);color:var(--on-surface);font-size:14px;font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:4px}',
    '.pe-b.on{background:var(--primary-c);color:var(--on-primary-c)}',
    '.pe-b.prim{background:var(--primary);color:var(--on-primary)}',
    '.pe-b.danger{color:#d93025}',
    '.pe-b:disabled{opacity:.4}',
    '.pe-sp{flex:1}',
    '.pe-zl{font-size:13px;min-width:40px;text-align:center;color:var(--on-surface-v)}',
    '.pe-dock{position:sticky;bottom:-12px;z-index:6;margin:12px -12px -12px;background:var(--surface-low);border-top:1px solid var(--outline-v);padding-bottom:env(safe-area-inset-bottom,0px)}',
    '.pe-ctx{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px 2px}',
    '.pe-hint{flex:1 1 100%;font-size:13px;color:var(--on-surface-v);line-height:18px}',
    '.pe-sw{width:30px;height:30px;border-radius:50%;border:2px solid var(--outline-v);flex:none;padding:0}',
    '.pe-sw.on{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary)}',
    '.pe-ctx input[type=color]{flex:none;width:30px;height:30px;padding:0;border:2px solid var(--outline-v);border-radius:50%;background:none;-webkit-appearance:none;appearance:none;overflow:hidden}',
    '.pe-ctx input[type=color]::-webkit-color-swatch-wrapper{padding:0}.pe-ctx input[type=color]::-webkit-color-swatch{border:0;border-radius:50%}',
    '.pe-step{display:inline-flex;align-items:center;gap:2px;margin-left:auto}',
    '.pe-step button{width:36px;height:36px;border-radius:50%;background:var(--surface-high);color:var(--on-surface);font-size:20px;line-height:1}',
    '.pe-step span{min-width:40px;text-align:center;font-size:14px;font-weight:500}',
    '.pe-tools{display:flex;padding:4px 6px 6px}',
    '.pe-t{flex:1 1 0;min-width:0;height:56px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--on-surface-v);font-size:11px;font-weight:500}',
    '.pe-t svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.pe-t.on{background:var(--primary-c);color:var(--on-primary-c)}',
    '.pe-pg{margin:0 auto 14px;max-width:100%}',
    '.pe-pgh{display:flex;align-items:center;justify-content:space-between;padding:0 2px 4px;color:var(--on-surface-v);font-size:12px}',
    '.pe-pgh .b{display:flex;gap:2px}',
    '.pe-pgh{font-size:13px;padding:0 0 6px}',
    '.pe-pgh button{height:36px;padding:0 12px;border-radius:18px;background:var(--surface-high);color:var(--on-surface);font-size:13px;font-weight:500}',
    '.pe-cv{position:relative;line-height:0}',
    '.pe-cv canvas{margin:0!important}',
    '.pe-ov{position:absolute;inset:0;overflow:hidden;border-radius:8px}',
    '.tool-select .pe-ov{touch-action:pan-x pan-y pinch-zoom}',
    '.pe-root:not(.tool-select) .pe-ov{touch-action:none;cursor:crosshair}',
    '.pe-a{position:absolute;touch-action:none;box-sizing:border-box}',
    '.pe-a.sel{outline:2px dashed var(--primary);outline-offset:2px}',
    '.pe-text{white-space:pre;line-height:1.2;font-family:Helvetica,Arial,sans-serif;cursor:move;min-width:12px;min-height:1em;padding:0;margin:0}',
    '.pe-text[contenteditable=true],.pe-text[contenteditable=plaintext-only]{cursor:text;outline:2px solid var(--primary);outline-offset:2px;background:rgba(255,255,255,.6);user-select:text;-webkit-user-select:text}',
    '.pe-hl{mix-blend-mode:multiply;opacity:.45;cursor:move}',
    '.pe-wo{cursor:move}',
    '.pe-rect{cursor:move}',
    '.pe-img{cursor:move}',
    '.pe-img img{width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none}',
    '.pe-draw{inset:0;pointer-events:none}',
    '.pe-draw svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.pe-draw polyline{pointer-events:stroke}',
    '.pe-draw.sel{outline:none}',
    '.pe-draw.sel polyline.vis{filter:drop-shadow(0 0 3px var(--primary))}',
    '.pe-h{position:absolute;right:-12px;bottom:-12px;width:24px;height:24px;border-radius:50%;background:var(--primary);border:2px solid #fff;touch-action:none}',
    '.pe-msg{padding:32px;text-align:center;color:var(--on-surface-v)}',
    '.pe-form label{display:block;margin:0 0 12px}',
    '.pe-form label span{display:block;font-size:12px;color:var(--on-surface-v);margin-bottom:2px}',
    '.pe-form input[type=text],.pe-form select{width:100%;height:40px;border-radius:8px;border:1px solid var(--outline);background:var(--surface);color:var(--on-surface);padding:0 10px;font:inherit}'
  ].join('\n');
  document.head.append(css);

  /* ---------- libraries ---------- */
  var plP = null;
  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (plP) return plP;
    plP = new Promise(function (res, rej) {
      function load(list) {
        var s = document.createElement('script'); s.src = list[0];
        s.onload = function () { res(window.PDFLib); };
        s.onerror = function () {
          s.remove();
          if (list.length > 1) load(list.slice(1)); else { plP = null; rej(new Error('PDF editing library failed to load')); }
        };
        document.head.append(s);
      }
      load(['vendor/pdf-lib.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js']);
    });
    return plP;
  }

  /* ---------- state ---------- */
  var states = new Map();
  var DEFAULT_COLORS = { text: '#111111', draw: '#d93025', hl: '#ffe600', rect: '#d93025', wo: '#ffffff', image: '#000000', select: '#d93025' };
  var ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  function fresh(e, bytes) {
    return {
      e: e, bytes: bytes, fileRef: e.file, annots: [], hist: [], tool: 'select', sel: null, colors: Object.assign({}, DEFAULT_COLORS),
      size: 16, zoom: 1, pages: [], uid: 0, dirty: false, pending: null, cur: null, token: 0, root: null
    };
  }
  function cloneAnnots(list) {
    return list.map(function (a) { var c = Object.assign({}, a, { el: null }); if (a.pts) c.pts = a.pts.map(function (p) { return p.slice(); }); return c; });
  }
  function snap(S) {
    S.hist.push({ bytes: S.bytes, annots: cloneAnnots(S.annots) });
    if (S.hist.length > 25) S.hist.shift();
    S.dirty = true; updateBar(S);
  }
  function toast(m) { O.toast(m); }
  function hexRgb(PL, hex) {
    var h = (hex || '#000000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return PL.rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
  }
  function dataToBytes(dataUrl) {
    var b = atob(dataUrl.split(',')[1]), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function pickFiles(accept, multiple) {
    return new Promise(function (res) {
      var i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.style.display = 'none';
      i.onchange = function () { res(Array.from(i.files || [])); i.remove(); };
      i.addEventListener('cancel', function () { res([]); i.remove(); });
      document.body.append(i); i.click();
    });
  }
  function imageToPng(file, maxDim) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, (maxDim || 1600) / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res({ dataUrl: c.toDataURL('image/png'), w: c.width, h: c.height });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read the image')); };
      img.src = url;
    });
  }

  /* ---------- render ---------- */
  async function render(e, token) {
    var S = states.get(e.id);
    try {
      if (!S || S.fileRef !== e.file) { S = fresh(e, new Uint8Array(await e.file.arrayBuffer())); states.set(e.id, S); }
      S.token = token;
      await draw(S);
    } catch (err) {
      if (token !== O.token) return;
      console.warn('PDF editor unavailable, using basic viewer', err);
      await O.renderPdf(e, token);
    }
  }

  async function draw(S) {
    var token = S.token, box = $('#pdfView'), scroll = box.scrollTop;
    var stale = function () { return token !== O.token; };
    box.innerHTML = '<div class="pe-msg">Loading PDF…</div>';
    var lib = await O.loadPdfJs();
    var pdf = await lib.getDocument({ data: S.bytes.slice() }).promise;
    if (stale()) return;
    box.innerHTML = '';
    S.root = document.createElement('div'); S.root.className = 'pe-root tool-' + S.tool;
    S.bar = buildBar(S); S.dock = buildDock(S);
    box.append(S.bar, S.root, S.dock);
    S.pages = [];
    var avail = Math.max(240, box.clientWidth - 24), cssW = Math.round(avail * S.zoom), dpr = window.devicePixelRatio || 1;
    S.numPages = pdf.numPages;
    for (var i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      if (stale()) return;
      var vp1 = page.getViewport({ scale: 1 }), k = cssW / vp1.width, v = page.getViewport({ scale: k * dpr });
      var wrap = document.createElement('div'); wrap.className = 'pe-pg'; wrap.style.width = cssW + 'px';
      wrap.append(pageHeader(S, i, pdf.numPages));
      var cv = document.createElement('div'); cv.className = 'pe-cv';
      var c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
      c.style.width = cssW + 'px'; c.style.height = (v.height / dpr) + 'px';
      var ov = document.createElement('div'); ov.className = 'pe-ov'; ov.dataset.p = i;
      cv.append(c, ov); wrap.append(cv); S.root.append(wrap);
      S.pages.push({ n: i, w: cssW, h: v.height / dpr, k: k, ov: ov });
      await page.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
    }
    attachPointer(S);
    S.annots.forEach(function (a) { buildAnnot(S, a); });
    box.scrollTop = scroll;
    updateBar(S);
  }

  function pageHeader(S, n, total) {
    var h = document.createElement('div'); h.className = 'pe-pgh';
    var t = document.createElement('span'); t.textContent = 'Page ' + n + ' of ' + total;
    var x = document.createElement('button'); x.type = 'button'; x.textContent = 'Page options ▾'; x.setAttribute('data-menu', '1');
    x.onclick = function (ev) {
      O.showMenu(ev.currentTarget, [
        { icon: 'file', label: 'Rotate left', run: function () { pageOp(S, function (d, PL) { var p = d.getPage(n - 1); p.setRotation(PL.degrees((((p.getRotation().angle - 90) % 360) + 360) % 360)); }); } },
        { icon: 'file', label: 'Rotate right', run: function () { pageOp(S, function (d, PL) { var p = d.getPage(n - 1); p.setRotation(PL.degrees((((p.getRotation().angle + 90) % 360) + 360) % 360)); }); } },
        { icon: 'file', label: 'Move up', hidden: n < 2, run: function () { reorder(S, n - 1, n - 2); } },
        { icon: 'file', label: 'Move down', hidden: n >= total, run: function () { reorder(S, n - 1, n); } },
        { icon: 'add', label: 'Duplicate page', run: function () { duplicate(S, n - 1); } },
        { icon: 'trash', label: 'Delete page', run: function () {
          if (total < 2) { toast('A PDF needs at least one page'); return; }
          if (!confirm('Delete page ' + n + '?')) return;
          pageOp(S, function (d) { d.removePage(n - 1); });
        } }
      ]);
    };
    h.append(t, x); return h;
  }

  /* ---------- toolbar ---------- */
  var SIZES = [8, 10, 12, 14, 16, 18, 24, 32, 48, 64];
  var SWATCHES = ['#111111', '#d93025', '#1a73e8', '#188038', '#f9ab00'];
  var HL_SWATCHES = ['#ffe600', '#7cfc00', '#ff9ecb', '#66d9ff', '#ffb347'];
  var TOOL_SVG = {
    select: '<path d="M6 3l12 8-5.5 1.5L10 18z"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    draw: '<path d="M4 20l1-4L16 5l3 3L8 19z M14 7l3 3"/>',
    hl: '<path d="M9 14l6-6 3 3-6 6H9z M9 17l-3 3h5"/>',
    wo: '<path d="M5 15l8-9 6 5-6 8H8z M8 20h11"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M5 18l5-5 4 4 2-2 3 3"/>'
  };
  var HINTS = {
    select: 'Tap an item to select it. Scroll the page normally.',
    text: 'Tap the page where you want to type.',
    draw: 'Draw on the page with your finger.',
    hl: 'Drag over the area to highlight.',
    wo: 'Drag to cover text with a white box. Then add new text on top.',
    rect: 'Drag on the page to draw a box.',
    image: 'Tap the page where the image should go.'
  };
  function buildBar(S) {
    var bar = document.createElement('div'); bar.className = 'pe-bar';
    S.btn = {};
    function add(parent, key, label, fn, title, cls) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pe-b sl' + (cls ? ' ' + cls : ''); b.textContent = label;
      if (title) { b.title = title; b.setAttribute('aria-label', title); }
      b.onclick = function (ev) { fn(ev); }; S.btn[key] = b; parent.append(b); return b;
    }
    add(bar, 'undo', '↶ Undo', function () { undo(S); }, 'Undo');
    add(bar, 'zout', '−', function () { zoom(S, -1); }, 'Zoom out');
    var zl = document.createElement('span'); zl.className = 'pe-zl'; S.zoomEl = zl; bar.append(zl);
    add(bar, 'zin', '+', function () { zoom(S, 1); }, 'Zoom in');
    var sp = document.createElement('span'); sp.className = 'pe-sp'; bar.append(sp);
    add(bar, 'more', 'More ▾', function (ev) { moreMenu(S, ev.currentTarget); }).setAttribute('data-menu', '1');
    add(bar, 'save', 'Save', function () { save(S); }, 'Save changes');
    return bar;
  }
  function buildDock(S) {
    var dock = document.createElement('div'); dock.className = 'pe-dock';
    var ctx = document.createElement('div'); ctx.className = 'pe-ctx'; S.ctx = ctx;
    var hint = document.createElement('div'); hint.className = 'pe-hint'; S.hintEl = hint; ctx.append(hint);
    var sw = document.createElement('span'); sw.style.cssText = 'display:inline-flex;gap:6px;align-items:center'; S.swEl = sw; ctx.append(sw);
    var step = document.createElement('span'); step.className = 'pe-step'; S.stepEl = step;
    var m = document.createElement('button'); m.type = 'button'; m.textContent = '−'; m.setAttribute('aria-label', 'Smaller');
    var lab = document.createElement('span'); S.sizeLab = lab;
    var p = document.createElement('button'); p.type = 'button'; p.textContent = '+'; p.setAttribute('aria-label', 'Bigger');
    function stepBy(d) {
      var a = selAnnot(S), cur = a && a.t === 'text' ? a.sz : S.size, i = 0;
      for (var k = 0; k < SIZES.length; k++) if (SIZES[k] <= cur) i = k;
      setSize(S, SIZES[Math.max(0, Math.min(SIZES.length - 1, i + d))]); updateBar(S);
    }
    m.onclick = function () { stepBy(-1); }; p.onclick = function () { stepBy(1); };
    step.append(m, lab, p); ctx.append(step);
    var del = document.createElement('button'); del.type = 'button'; del.className = 'pe-b danger sl'; del.textContent = 'Delete';
    del.onclick = function () { removeSel(S); }; S.btn.del = del; ctx.append(del);
    var tools = document.createElement('div'); tools.className = 'pe-tools';
    [['select', 'Select'], ['text', 'Text'], ['draw', 'Draw'], ['hl', 'Highlight'], ['wo', 'Whiteout'], ['rect', 'Box'], ['image', 'Image']].forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pe-t sl'; b.setAttribute('aria-label', t[1]);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + TOOL_SVG[t[0]] + '</svg><span>' + t[1] + '</span>';
      b.onclick = function () { setTool(S, t[0]); }; S.btn['t_' + t[0]] = b; tools.append(b);
    });
    dock.append(ctx, tools);
    return dock;
  }
  function updateBar(S) {
    if (!S.btn || !S.hintEl) return;
    ['select', 'text', 'draw', 'hl', 'wo', 'rect', 'image'].forEach(function (t) { S.btn['t_' + t].classList.toggle('on', S.tool === t); });
    var a = selAnnot(S), tool = a ? (a.t === 'img' ? 'image' : a.t) : S.tool;
    S.btn.undo.disabled = !S.hist.length;
    S.btn.save.classList.toggle('prim', S.dirty);
    S.btn.zout.disabled = S.zoom <= ZOOMS[0]; S.btn.zin.disabled = S.zoom >= ZOOMS[ZOOMS.length - 1];
    S.zoomEl.textContent = Math.round(S.zoom * 100) + '%';
    S.hintEl.textContent = a ? 'Drag to move. Use the round handle to resize.' : (HINTS[S.tool] || '');
    S.btn.del.hidden = !a;
    var hasColor = tool !== 'wo' && tool !== 'image' && tool !== 'select';
    S.swEl.hidden = !hasColor; S.swEl.innerHTML = '';
    if (hasColor) {
      var cur = (a && a.col ? a.col : (S.colors[tool] || '#000000')).toLowerCase(), list = tool === 'hl' ? HL_SWATCHES : SWATCHES;
      list.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'pe-sw' + (c === cur ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', 'Colour ' + c);
        b.onclick = function () { setColor(S, c); updateBar(S); }; S.swEl.append(b);
      });
      var ci = document.createElement('input'); ci.type = 'color'; ci.value = /^#[0-9a-f]{6}$/.test(cur) ? cur : '#000000'; ci.setAttribute('aria-label', 'Custom colour');
      ci.onchange = function () { setColor(S, ci.value); updateBar(S); }; S.swEl.append(ci);
    }
    var showSize = tool === 'text' || tool === 'draw';
    S.stepEl.hidden = !showSize;
    S.sizeLab.textContent = tool === 'draw' ? 'Pen ' + S.size : (a && a.t === 'text' ? a.sz : S.size) + ' pt';
  }
  function setTool(S, t) {
    if (t === 'image') {
      pickFiles('image/*', false).then(async function (fl) {
        if (!fl.length) return;
        try { S.pending = await imageToPng(fl[0], 1600); setToolRaw(S, 'image'); toast('Tap the page where the image should go'); }
        catch (err) { toast(String(err.message || err)); }
      });
      return;
    }
    setToolRaw(S, t);
  }
  function setToolRaw(S, t) {
    S.tool = t; if (t !== 'select') select(S, null);
    S.root.className = 'pe-root tool-' + t; updateBar(S);
  }
  function setColor(S, c) {
    var a = selAnnot(S);
    if (a && a.col !== undefined) { snap(S); a.col = c; layoutAnnot(S, a); }
    else S.colors[S.tool] = c;
  }
  function setSize(S, n) {
    var a = selAnnot(S);
    if (a && a.t === 'text') { snap(S); a.sz = n; layoutAnnot(S, a); }
    else S.size = n;
  }
  function zoom(S, d) {
    var i = ZOOMS.indexOf(S.zoom); if (i < 0) i = 2;
    S.zoom = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + d))];
    draw(S);
  }

  /* ---------- annotations (DOM) ---------- */
  function selAnnot(S) { return S.sel ? S.annots.filter(function (a) { return a.id === S.sel; })[0] : null; }
  function select(S, id) {
    S.sel = id;
    S.annots.forEach(function (a) { if (a.el) layoutAnnot(S, a); });
    updateBar(S);
  }
  function removeSel(S) {
    var a = selAnnot(S); if (!a) return;
    snap(S); if (a.el) a.el.remove();
    S.annots = S.annots.filter(function (x) { return x !== a; }); S.sel = null; updateBar(S);
  }
  function newAnnot(S, p, t, extra) {
    var a = Object.assign({ id: 'a' + (++S.uid), p: p, t: t, el: null }, extra); S.annots.push(a); return a;
  }
  function buildAnnot(S, a) {
    var pg = S.pages[a.p - 1]; if (!pg) return;
    var el = document.createElement('div'); el.className = 'pe-a pe-' + a.t; el.dataset.id = a.id; a.el = el;
    pg.ov.append(el); layoutAnnot(S, a);
  }
  function pct(v) { return (v * 100) + '%'; }
  function layoutAnnot(S, a) {
    var pg = S.pages[a.p - 1], el = a.el; if (!pg || !el) return;
    var st = el.style, sel = S.sel === a.id;
    el.classList.toggle('sel', sel);
    var old = el.querySelector('.pe-h'); if (old) old.remove();
    if (a.t === 'text') {
      st.left = pct(a.x); st.top = pct(a.y); st.fontSize = (a.sz * pg.k) + 'px'; st.color = a.col;
      if (document.activeElement !== el) el.textContent = a.txt;
    } else if (a.t === 'hl' || a.t === 'wo' || a.t === 'rect' || a.t === 'img') {
      st.left = pct(a.x); st.top = pct(a.y); st.width = pct(a.w); st.height = pct(a.h);
      if (a.t === 'hl') st.background = a.col;
      else if (a.t === 'wo') st.background = '#fff';
      else if (a.t === 'rect') { st.border = Math.max(1, a.lw * pg.k) + 'px solid ' + a.col; }
      else if (!el.firstChild) { var im = document.createElement('img'); im.src = a.src; im.alt = ''; el.append(im); }
      if (sel) { var h = document.createElement('div'); h.className = 'pe-h'; h.dataset.h = '1'; el.append(h); }
    } else if (a.t === 'draw') {
      var W = pg.w, H = pg.h, pts = a.pts.map(function (p) { return (p[0] * W).toFixed(1) + ',' + (p[1] * H).toFixed(1); }).join(' ');
      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><polyline class="hit" points="' + pts + '" fill="none" stroke="transparent" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<polyline class="vis" points="' + pts + '" fill="none" stroke="' + a.col + '" stroke-width="' + (a.lw * pg.k) + '" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"/></svg>';
      el.classList.toggle('sel', sel);
    }
  }
  function norm(ev, ov) {
    var r = ov.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))];
  }

  function addText(S, p, pt) {
    var a = newAnnot(S, p, 'text', { x: pt[0], y: pt[1], txt: '', sz: S.size, col: S.colors.text });
    buildAnnot(S, a); a.isNew = true; startEdit(S, a);
  }
  function startEdit(S, a) {
    var el = a.el; if (!el) return;
    var before = a.txt;
    try { el.contentEditable = 'plaintext-only'; } catch (err) { /* fall back below */ }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.textContent = a.txt; el.focus();
    var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    function done() {
      el.removeEventListener('blur', done); el.contentEditable = 'false';
      var txt = el.innerText.replace(/\n$/, '');
      if (!txt.trim()) { el.remove(); S.annots = S.annots.filter(function (x) { return x !== a; }); if (S.sel === a.id) S.sel = null; updateBar(S); return; }
      if (txt !== before || a.isNew) { var keep = a.txt; a.txt = before; snap(S); a.txt = txt; if (keep === undefined) a.txt = txt; }
      delete a.isNew; a.txt = txt; layoutAnnot(S, a); setToolRaw(S, 'select'); select(S, a.id);
    }
    el.addEventListener('blur', done);
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.preventDefault(); el.blur(); } });
  }

  function placeImage(S, p, pt) {
    if (!S.pending) { toast('Choose an image first'); setToolRaw(S, 'select'); return; }
    var pg = S.pages[p - 1], w = 0.3, h = w * (pg.w / pg.h) * (S.pending.h / S.pending.w);
    var x = Math.max(0, Math.min(1 - w, pt[0] - w / 2)), y = Math.max(0, Math.min(1 - h, pt[1] - h / 2));
    snap(S);
    var a = newAnnot(S, p, 'img', { x: x, y: y, w: w, h: Math.min(h, 1), src: S.pending.dataUrl });
    buildAnnot(S, a); setToolRaw(S, 'select'); select(S, a.id);
  }

  /* ---------- pointer handling ---------- */
  function attachPointer(S) {
    var root = S.root;
    root.addEventListener('pointerdown', function (ev) {
      var ov = ev.target.closest('.pe-ov'); if (!ov) return;
      var p = +ov.dataset.p, pg = S.pages[p - 1];
      if (ev.target.closest('[contenteditable=true],[contenteditable=plaintext-only]')) return;
      if (S.tool === 'select') {
        var h = ev.target.closest('.pe-h'), aEl = ev.target.closest('.pe-a');
        if (!aEl) { if (S.sel) select(S, null); return; }
        var a = S.annots.filter(function (x) { return x.id === aEl.dataset.id; })[0]; if (!a) return;
        var wasSel = S.sel === a.id;
        if (!wasSel) select(S, a.id);
        ev.preventDefault();
        startDrag(S, a, ov, ev, !!h, wasSel);
        return;
      }
      ev.preventDefault();
      var pt = norm(ev, ov);
      if (S.tool === 'text') { addText(S, p, pt); return; }
      if (S.tool === 'image') { placeImage(S, p, pt); return; }
      var cur = { p: p, ov: ov, start: pt, pts: [pt], pg: pg };
      var prev = document.createElement('div'); prev.className = 'pe-a';
      if (S.tool === 'draw') { prev.className = 'pe-a pe-draw'; }
      ov.append(prev); cur.el = prev; S.cur = cur;
      try { ov.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      drawPreview(S);
    });
    root.addEventListener('pointermove', function (ev) {
      var c = S.cur; if (!c) return;
      ev.preventDefault();
      var pt = norm(ev, c.ov);
      if (S.tool === 'draw') c.pts.push(pt); else c.end = pt;
      drawPreview(S);
    });
    function finish(ev) {
      var c = S.cur; if (!c) return; S.cur = null; c.el.remove();
      try { c.ov.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      var t = S.tool;
      if (t === 'draw') {
        if (c.pts.length < 2) return;
        snap(S);
        var a = newAnnot(S, c.p, 'draw', { pts: c.pts, col: S.colors.draw, lw: Math.max(1, S.size / 5) });
        buildAnnot(S, a);
      } else {
        var e2 = c.end || c.start, x = Math.min(c.start[0], e2[0]), y = Math.min(c.start[1], e2[1]), w = Math.abs(e2[0] - c.start[0]), h = Math.abs(e2[1] - c.start[1]);
        if (w * c.pg.w < 8 || h * c.pg.h < 6) return;
        snap(S);
        var b = newAnnot(S, c.p, t, { x: x, y: y, w: w, h: h, col: t === 'wo' ? '#ffffff' : S.colors[t], lw: 1.5 });
        buildAnnot(S, b);
      }
    }
    root.addEventListener('pointerup', finish);
    root.addEventListener('pointercancel', finish);
  }
  function drawPreview(S) {
    var c = S.cur, pg = c.pg, el = c.el;
    if (S.tool === 'draw') {
      var pts = c.pts.map(function (p) { return (p[0] * pg.w).toFixed(1) + ',' + (p[1] * pg.h).toFixed(1); }).join(' ');
      el.innerHTML = '<svg viewBox="0 0 ' + pg.w + ' ' + pg.h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + S.colors.draw + '" stroke-width="' + (Math.max(1, S.size / 5) * pg.k) + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
      var e2 = c.end || c.start, st = el.style;
      st.left = pct(Math.min(c.start[0], e2[0])); st.top = pct(Math.min(c.start[1], e2[1]));
      st.width = pct(Math.abs(e2[0] - c.start[0])); st.height = pct(Math.abs(e2[1] - c.start[1]));
      if (S.tool === 'hl') { st.background = S.colors.hl; st.opacity = '.45'; }
      else if (S.tool === 'wo') { st.background = '#fff'; st.border = '1px dashed #888'; }
      else st.border = '2px solid ' + S.colors.rect;
    }
  }
  function startDrag(S, a, ov, ev0, resize, wasSel) {
    var pg = S.pages[a.p - 1], r = ov.getBoundingClientRect(), sx = ev0.clientX, sy = ev0.clientY;
    var orig = { x: a.x, y: a.y, w: a.w, h: a.h, pts: a.pts && a.pts.map(function (p) { return p.slice(); }) };
    var moved = false, snapped = false;
    function move(ev) {
      var dx = (ev.clientX - sx) / r.width, dy = (ev.clientY - sy) / r.height;
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return;
      moved = true; if (!snapped) { snap(S); snapped = true; }
      if (resize && a.w !== undefined) { a.w = Math.max(0.01, Math.min(1 - a.x, orig.w + dx)); a.h = Math.max(0.008, Math.min(1 - a.y, orig.h + dy)); }
      else if (a.t === 'draw') {
        var ddx = Math.max(-Math.min.apply(null, orig.pts.map(function (p) { return p[0]; })), Math.min(1 - Math.max.apply(null, orig.pts.map(function (p) { return p[0]; })), dx));
        var ddy = Math.max(-Math.min.apply(null, orig.pts.map(function (p) { return p[1]; })), Math.min(1 - Math.max.apply(null, orig.pts.map(function (p) { return p[1]; })), dy));
        a.pts = orig.pts.map(function (p) { return [p[0] + ddx, p[1] + ddy]; });
      } else {
        a.x = Math.max(0, Math.min(1 - (a.w || 0.02), orig.x + dx)); a.y = Math.max(0, Math.min(1 - (a.h || 0.02), orig.y + dy));
      }
      layoutAnnot(S, a);
    }
    function up() {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (!moved && wasSel && a.t === 'text' && !resize) startEdit(S, a);
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }

  /* ---------- history ---------- */
  async function undo(S) {
    var h = S.hist.pop(); if (!h) return;
    var bytesChanged = h.bytes !== S.bytes;
    S.bytes = h.bytes; S.annots = h.annots; S.sel = null; S.dirty = S.hist.length > 0;
    if (bytesChanged) await draw(S);
    else { S.pages.forEach(function (pg) { pg.ov.innerHTML = ''; }); S.annots.forEach(function (a) { buildAnnot(S, a); }); updateBar(S); }
  }

  /* ---------- writing annotations into the PDF ---------- */
  async function flatten(S) {
    if (!S.annots.length) return;
    var PL = await loadPdfLib(), lib = await O.loadPdfJs();
    var doc = await PL.PDFDocument.load(S.bytes, { ignoreEncryption: true });
    var font = await doc.embedFont(PL.StandardFonts.Helvetica);
    var pj = await lib.getDocument({ data: S.bytes.slice() }).promise;
    var byPage = {};
    S.annots.forEach(function (a) { (byPage[a.p] = byPage[a.p] || []).push(a); });
    for (var key in byPage) {
      var pn = +key, page = doc.getPage(pn - 1), jp = await pj.getPage(pn), vp = jp.getViewport({ scale: 1 });
      var W = vp.width, H = vp.height, R = vp.rotation || 0;
      var conv = function (fx, fy) { return vp.convertToPdfPoint(fx * W, fy * H); };
      for (var i = 0; i < byPage[key].length; i++) {
        var a = byPage[key][i];
        if (a.t === 'hl' || a.t === 'wo' || a.t === 'rect') {
          var p1 = conv(a.x, a.y), p2 = conv(a.x + a.w, a.y + a.h);
          var o = { x: Math.min(p1[0], p2[0]), y: Math.min(p1[1], p2[1]), width: Math.abs(p2[0] - p1[0]), height: Math.abs(p2[1] - p1[1]) };
          if (a.t === 'hl') page.drawRectangle(Object.assign(o, { color: hexRgb(PL, a.col), opacity: 0.4, borderWidth: 0 }));
          else if (a.t === 'wo') page.drawRectangle(Object.assign(o, { color: PL.rgb(1, 1, 1), opacity: 1, borderWidth: 0 }));
          else page.drawRectangle(Object.assign(o, { borderColor: hexRgb(PL, a.col), borderWidth: a.lw || 1.5 }));
        } else if (a.t === 'text') {
          var lines = String(a.txt).split('\n');
          for (var li = 0; li < lines.length; li++) {
            var ln = Array.from(lines[li]).map(function (ch) { try { font.encodeText(ch); return ch; } catch (err) { return '?'; } }).join('');
            if (!ln) continue;
            var bp = conv(a.x, a.y + (0.93 * a.sz + li * 1.2 * a.sz) / H);
            page.drawText(ln, { x: bp[0], y: bp[1], size: a.sz, font: font, color: hexRgb(PL, a.col), rotate: PL.degrees(R) });
          }
        } else if (a.t === 'img') {
          var img = await doc.embedPng(dataToBytes(a.src)), bl = conv(a.x, a.y + a.h);
          page.drawImage(img, { x: bl[0], y: bl[1], width: a.w * W, height: a.h * H, rotate: PL.degrees(R) });
        } else if (a.t === 'draw') {
          for (var j = 1; j < a.pts.length; j++) {
            var s = conv(a.pts[j - 1][0], a.pts[j - 1][1]), e = conv(a.pts[j][0], a.pts[j][1]);
            page.drawLine({ start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: a.lw, color: hexRgb(PL, a.col), lineCap: PL.LineCapStyle.Round });
          }
        }
      }
    }
    S.bytes = await doc.save(); S.annots = []; S.sel = null;
  }

  /* ---------- page operations ---------- */
  async function pageOp(S, fn) {
    try {
      snap(S);
      await flatten(S);
      var PL = await loadPdfLib();
      var doc = await PL.PDFDocument.load(S.bytes, { ignoreEncryption: true });
      var out = await fn(doc, PL);
      S.bytes = await (out || doc).save();
      await draw(S);
    } catch (err) {
      S.hist.pop(); console.warn(err); toast('That did not work: ' + (err && err.message ? err.message : err));
      await draw(S);
    }
  }
  async function rebuild(doc, PL, order) {
    var nd = await PL.PDFDocument.create(), pages = await nd.copyPages(doc, order);
    pages.forEach(function (p) { nd.addPage(p); });
    return nd;
  }
  function reorder(S, from, to) {
    pageOp(S, function (doc, PL) {
      var order = doc.getPageIndices(); order.splice(to, 0, order.splice(from, 1)[0]); return rebuild(doc, PL, order);
    });
  }
  function duplicate(S, i) {
    pageOp(S, function (doc, PL) {
      var order = doc.getPageIndices(); order.splice(i + 1, 0, i); return rebuild(doc, PL, order);
    });
  }
  function parseRange(str, n) {
    var out = [], seen = {};
    String(str).split(/[,\s]+/).filter(Boolean).forEach(function (part) {
      var m = /^(\d+)(?:-(\d+))?$/.exec(part); if (!m) throw new Error('Use a format like 1-3,5');
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (a < 1 || b > n || a > b) throw new Error('Pages must be between 1 and ' + n);
      for (var i = a; i <= b; i++) if (!seen[i]) { seen[i] = 1; out.push(i - 1); }
    });
    if (!out.length) throw new Error('Enter page numbers');
    return out;
  }
  function rangeDialog(S, title, confirm, run) {
    O.showForm({
      title: title, note: 'This PDF has ' + S.numPages + ' pages. Example: 1-3,5',
      fields: [{ id: 'r', label: 'Pages', placeholder: '1-3,5' }], confirm: confirm,
      onSubmit: async function (f) {
        try { run(parseRange(f.get('r'), S.numPages)); } catch (err) { toast(err.message); return false; }
      }
    });
  }

  /* ---------- More menu ---------- */
  function moreMenu(S, anchor) {
    O.showMenu(anchor, [
      { icon: 'add', label: 'Add blank page', run: function () { pageOp(S, function (d) { var last = d.getPage(d.getPageCount() - 1), s = last.getSize(); d.addPage([s.width, s.height]); }); } },
      { icon: 'add', label: 'Merge another PDF', run: function () { mergePdf(S); } },
      { icon: 'image', label: 'Add images as pages', run: function () { imagesAsPages(S); } },
      { icon: 'file', label: 'Extract pages to new PDF', run: function () { rangeDialog(S, 'Extract pages', 'Extract', function (idx) { extract(S, idx); }); } },
      { icon: 'trash', label: 'Delete pages', run: function () {
        rangeDialog(S, 'Delete pages', 'Delete', function (idx) {
          if (idx.length >= S.numPages) { toast('A PDF needs at least one page'); return; }
          pageOp(S, function (d) { idx.slice().sort(function (a, b) { return b - a; }).forEach(function (i) { d.removePage(i); }); });
        });
      } },
      { icon: 'edit', label: 'Fill form fields', run: function () { formDialog(S); } },
      { icon: 'zip', label: 'Export pages as images', run: function () { exportImages(S); } },
      { icon: 'download', label: 'Download a copy', run: function () { downloadCopy(S); } }
    ]);
  }
  async function mergePdf(S) {
    var fl = await pickFiles('application/pdf,.pdf', true); if (!fl.length) return;
    pageOp(S, async function (doc, PL) {
      for (var i = 0; i < fl.length; i++) {
        var other = await PL.PDFDocument.load(new Uint8Array(await fl[i].arrayBuffer()), { ignoreEncryption: true });
        var pages = await doc.copyPages(other, other.getPageIndices()); pages.forEach(function (p) { doc.addPage(p); });
      }
    });
  }
  async function imagesAsPages(S) {
    var fl = await pickFiles('image/*', true); if (!fl.length) return;
    try {
      var imgs = []; for (var i = 0; i < fl.length; i++) imgs.push(await imageToPng(fl[i], 2400));
      pageOp(S, async function (doc) {
        for (var j = 0; j < imgs.length; j++) {
          var k = Math.min(1, 595 / imgs[j].w), w = imgs[j].w * k, h = imgs[j].h * k;
          var im = await doc.embedPng(dataToBytes(imgs[j].dataUrl)), pg = doc.addPage([w, h]);
          pg.drawImage(im, { x: 0, y: 0, width: w, height: h });
        }
      });
    } catch (err) { toast(String(err.message || err)); }
  }
  async function extract(S, idx) {
    try {
      await flatten(S);
      var PL = await loadPdfLib(), doc = await PL.PDFDocument.load(S.bytes, { ignoreEncryption: true });
      var nd = await rebuild(doc, PL, idx), bytes = await nd.save();
      var name = S.e.name.replace(/\.pdf$/i, '') + '-pages.pdf';
      var f = new File([bytes], name, { type: 'application/pdf' }), added = O.addFile(f, name.indexOf('/') < 0 ? name : name, null);
      await O.finish([added]); toast('Created ' + name);
    } catch (err) { toast(String(err.message || err)); }
  }
  async function exportImages(S) {
    try {
      await flatten(S);
      var lib = await O.loadPdfJs(), pdf = await lib.getDocument({ data: S.bytes.slice() }).promise, list = [];
      for (var i = 1; i <= pdf.numPages; i++) {
        toast('Rendering page ' + i + ' / ' + pdf.numPages + '…');
        var page = await pdf.getPage(i), vp = page.getViewport({ scale: 2 }), c = document.createElement('canvas');
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
        list.push({ path: 'page-' + String(i).padStart(3, '0') + '.png', data: new Uint8Array(await blob.arrayBuffer()) });
      }
      O.downloadBlob(O.makeZip(list), S.e.name.replace(/\.pdf$/i, '') + '-pages.zip'); toast('Images saved as a zip');
    } catch (err) { toast(String(err.message || err)); }
  }
  async function formDialog(S) {
    try {
      await flatten(S);
      var PL = await loadPdfLib(), doc = await PL.PDFDocument.load(S.bytes, { ignoreEncryption: true });
      var form = doc.getForm(), fields = form.getFields();
      if (!fields.length) { toast('This PDF has no fillable fields'); return; }
      var old = $('#peForm'); if (old) old.remove();
      var scrim = document.createElement('div'); scrim.id = 'peForm'; scrim.className = 'dscrim';
      var dlg = document.createElement('div'); dlg.className = 'dialog wide'; dlg.innerHTML = '<h3>Fill form</h3>';
      var body = document.createElement('div'); body.className = 'pe-form'; body.style.cssText = 'max-height:55vh;overflow:auto';
      var getters = [];
      fields.forEach(function (f) {
        var name = f.getName(), lab = document.createElement('label'), sp = document.createElement('span'); sp.textContent = name; lab.append(sp);
        if (f instanceof PL.PDFTextField) {
          var i = document.createElement('input'); i.type = 'text'; i.value = f.getText() || ''; lab.append(i);
          getters.push(function () { f.setText(i.value); });
        } else if (f instanceof PL.PDFCheckBox) {
          var c = document.createElement('input'); c.type = 'checkbox'; c.checked = f.isChecked(); lab.append(c);
          getters.push(function () { if (c.checked) f.check(); else f.uncheck(); });
        } else if (f instanceof PL.PDFDropdown || f instanceof PL.PDFRadioGroup) {
          var s = document.createElement('select'), none = document.createElement('option'); none.value = ''; none.textContent = '—'; s.append(none);
          f.getOptions().forEach(function (o) { var op = document.createElement('option'); op.value = o; op.textContent = o; s.append(op); });
          var cur = f instanceof PL.PDFDropdown ? (f.getSelected()[0] || '') : (f.getSelected() || ''); s.value = cur; lab.append(s);
          getters.push(function () { if (s.value) f.select(s.value); });
        } else return;
        body.append(lab);
      });
      dlg.append(body);
      var act = document.createElement('div'); act.className = 'actions';
      var cancel = document.createElement('button'); cancel.className = 'btn text sl'; cancel.textContent = 'Cancel'; cancel.onclick = function () { scrim.remove(); };
      var ok = document.createElement('button'); ok.className = 'btn text sl'; ok.textContent = 'Apply';
      ok.onclick = async function () {
        try {
          snap(S); getters.forEach(function (g) { g(); });
          S.bytes = await doc.save(); scrim.remove(); await draw(S);
        } catch (err) { S.hist.pop(); toast(String(err.message || err)); }
      };
      act.append(cancel, ok); dlg.append(act); scrim.append(dlg);
      scrim.addEventListener('click', function (ev) { if (ev.target === scrim) scrim.remove(); });
      document.body.append(scrim);
    } catch (err) { toast(String(err.message || err)); }
  }

  /* ---------- saving ---------- */
  async function save(S) {
    try {
      await flatten(S);
      var name = S.e.name, blob = new Blob([S.bytes], { type: 'application/pdf' });
      var file = new File([blob], name, { type: 'application/pdf' });
      S.e.file = file; S.fileRef = file;
      if (S.e.url) { URL.revokeObjectURL(S.e.url); S.e.url = null; }
      O.persistMany([S.e]);
      O.downloadBlob(blob, name.replace(/\.pdf$/i, '') + '-edited.pdf');
      S.dirty = false; S.hist = [];
      await draw(S);
      toast('Saved. A copy was also downloaded.');
    } catch (err) { console.warn(err); toast('Could not save: ' + (err && err.message ? err.message : err)); }
  }
  async function downloadCopy(S) {
    try { await flatten(S); O.downloadBlob(new Blob([S.bytes], { type: 'application/pdf' }), S.e.name.replace(/\.pdf$/i, '') + '-edited.pdf'); await draw(S); }
    catch (err) { toast(String(err.message || err)); }
  }

  O.pdfRender = render;
  O.pdfEdit = { states: states, flatten: flatten, loadPdfLib: loadPdfLib, parseRange: parseRange };
  var cur = O.cur(); if (cur && cur.kind === 'pdf') O.renderAll();
})();
