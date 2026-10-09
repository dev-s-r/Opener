/* Opener - Office viewer: docx, xlsx, pptx, odt, ods, odp, csv, tsv, rtf, legacy doc/xls/ppt (text only), audio and video. No libraries. */
(function () {
  'use strict';
  var O = window.__opener;
  if (!O || !O.readZip) return;

  var css = document.createElement('style');
  css.textContent = [
    '.ov{flex:1;display:flex;flex-direction:column;min-height:0;background:var(--surface)}',
    '.ov-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--outline-v);background:var(--surface-low);flex-wrap:wrap}',
    '.ov-tag{font-size:12px;font-weight:500;padding:3px 10px;border-radius:12px;background:var(--secondary-c);color:var(--on-secondary-c)}',
    '.ov-sp{flex:1}',
    '.ov-btn{height:34px;padding:0 12px;border-radius:17px;background:var(--secondary-c);color:var(--on-secondary-c);font-size:13px;font-weight:500;white-space:nowrap}',
    '.ov-tabs{display:flex;gap:6px;padding:8px 12px;overflow-x:auto;border-bottom:1px solid var(--outline-v);flex:none}',
    '.ov-tabs button{height:32px;padding:0 14px;border-radius:16px;border:1px solid var(--outline-v);color:var(--on-surface);white-space:nowrap;font-size:13px;flex:none}',
    '.ov-tabs button.on{background:var(--primary);color:var(--on-primary);border-color:transparent}',
    '.ov-note{padding:8px 14px;font-size:13px;background:var(--surface-mid);color:var(--on-surface-v)}',
    '.ov-frame{flex:1;width:100%;border:0;background:#fff;min-height:0}',
    '.ov-media{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;min-height:0}',
    '.ov-media video{max-width:100%;max-height:100%;border-radius:12px;background:#000}',
    '.ov-media audio{width:100%;max-width:520px}',
    '.ov-msg{padding:32px 24px;text-align:center;color:var(--on-surface-v)}'
  ].join('\n');
  document.head.append(css);

  /* ---------- helpers ---------- */
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var extOf = function (n) { var i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i + 1).toLowerCase(); };
  var dec = function (u8) { return new TextDecoder('utf-8').decode(u8); };
  var kids = function (el) { return el ? Array.prototype.slice.call(el.children) : []; };
  var kid = function (el, name) { var c = kids(el); for (var i = 0; i < c.length; i++) if (c[i].localName === name) return c[i]; return null; };
  var all = function (el, name) { return el ? Array.prototype.slice.call(el.getElementsByTagNameNS('*', name)) : []; };
  var attr = function (el, name) {
    if (!el) return null;
    var v = el.getAttribute(name); if (v !== null) return v;
    for (var i = 0; i < el.attributes.length; i++) if (el.attributes[i].localName === name) return el.attributes[i].value;
    return null;
  };
  function xml(u8) { return new DOMParser().parseFromString(dec(u8), 'application/xml'); }
  function mapZip(entries) { var m = {}; entries.forEach(function (e) { if (!e.dir) m[e.name.replace(/^\/+/, '')] = e; }); return m; }
  async function getXml(Z, name) { var e = Z[name]; return e ? xml(await e.bytes()) : null; }
  function resolve(base, target) {
    if (/^\//.test(target)) return target.slice(1);
    var parts = base.split('/'); parts.pop();
    target.split('/').forEach(function (p) { if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); });
    return parts.join('/');
  }
  async function rels(Z, partName) {
    var i = partName.lastIndexOf('/');
    var relName = partName.slice(0, i + 1) + '_rels/' + partName.slice(i + 1) + '.rels';
    var d = await getXml(Z, relName), out = {};
    all(d, 'Relationship').forEach(function (r) { out[attr(r, 'Id')] = { target: attr(r, 'Target'), mode: attr(r, 'TargetMode'), type: attr(r, 'Type') || '' }; });
    return out;
  }
  var IMG_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml' };
  var dataCache = {};
  async function imgData(Z, path) {
    var e = Z[path]; if (!e) return '';
    var mime = IMG_MIME[extOf(path)]; if (!mime) return '';
    if (e.size > 6e6) return '';
    var u8 = await e.bytes(), s = '';
    for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return 'data:' + mime + ';base64,' + btoa(s);
  }
  var colName = function (n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  var colIndex = function (ref) { var m = /^([A-Z]+)/i.exec(ref) || ['', 'A'], n = 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].toUpperCase().charCodeAt(i) - 64); return n - 1; };

  var PAGE_CSS = 'html,body{margin:0;background:#fff;color:#1b1b1f}body{font:15px/1.55 Roboto,system-ui,sans-serif;padding:16px;word-wrap:break-word;overflow-wrap:anywhere}' +
    'img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{vertical-align:top}a{color:#0b57d0}' +
    '.doc p{margin:0 0 .7em;min-height:1em}.doc h1,.doc h2,.doc h3,.doc h4{line-height:1.3;margin:1em 0 .4em}' +
    '.doc table{margin:0 0 1em;display:block;overflow-x:auto}.doc td,.doc th{border:1px solid #c4c6d0;padding:4px 8px}' +
    '.sheet{overflow:auto}.sheet table{font-size:13px;white-space:nowrap}.sheet td,.sheet th{border:1px solid #d0d3da;padding:3px 8px;max-width:360px;overflow:hidden;text-overflow:ellipsis}' +
    '.sheet th{background:#eef0f5;font-weight:500;color:#555;position:sticky;top:0;z-index:1}.sheet th.rn{left:0;z-index:2}.sheet td.rn{background:#eef0f5;color:#555;text-align:center;position:sticky;left:0}' +
    '.sheet td.num{text-align:right}.more{display:block;margin:12px auto;padding:8px 18px}' +
    '.slide{position:relative;width:100%;max-width:900px;margin:0 auto 14px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.25);overflow:hidden}' +
    '.slide .sh{position:absolute;box-sizing:border-box;overflow:hidden}.slide .sh p{margin:0}.slide .sh table{border-collapse:collapse;width:100%}.slide .sh td{border:1px solid #bbb;padding:2px 4px}' +
    '.cap{text-align:center;font-size:12px;color:#666;margin:-6px 0 14px}pre{white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,monospace}';

  function frameDoc(inner, extra) {
    return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + PAGE_CSS + (extra || '') + '</style><body>' + inner;
  }

  /* ---------- DOCX ---------- */
  async function docx(Z) {
    var main = Z['word/document.xml'] ? 'word/document.xml' : null;
    if (!main) throw new Error('This is not a valid Word file');
    var doc = await getXml(Z, main), R = await rels(Z, main);
    var num = await getXml(Z, 'word/numbering.xml'), numFmt = {}, absOf = {};
    all(num, 'abstractNum').forEach(function (a) {
      var id = attr(a, 'abstractNumId'); numFmt[id] = {};
      all(a, 'lvl').forEach(function (l) { var f = kid(l, 'numFmt'); numFmt[id][attr(l, 'ilvl')] = f ? attr(f, 'val') : 'bullet'; });
    });
    all(num, 'num').forEach(function (n) { var a = kid(n, 'abstractNumId'); if (a) absOf[attr(n, 'numId')] = attr(a, 'val'); });
    var counters = {};
    var imgs = 0;

    async function runs(p) {
      var out = '';
      var nodes = kids(p);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i], ln = n.localName;
        if (ln === 'r') out += await run(n);
        else if (ln === 'hyperlink') {
          var id = attr(n, 'id'), inner = '';
          var rs = kids(n);
          for (var j = 0; j < rs.length; j++) if (rs[j].localName === 'r') inner += await run(rs[j]);
          var href = id && R[id] ? R[id].target : (attr(n, 'anchor') ? '#' : '');
          out += /^(https?:|mailto:)/i.test(href) ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + '</a>' : inner;
        } else if (ln === 'smartTag' || ln === 'sdt' || ln === 'ins') {
          var sc = ln === 'sdt' ? kid(n, 'sdtContent') : n;
          var cc = kids(sc);
          for (var k = 0; k < cc.length; k++) if (cc[k].localName === 'r') out += await run(cc[k]);
        }
      }
      return out;
    }
    async function run(r) {
      var pr = kid(r, 'rPr'), st = '', open = '', close = '';
      if (pr) {
        var has = function (nm) { var x = kid(pr, nm); return x && attr(x, 'val') !== '0' && attr(x, 'val') !== 'false'; };
        if (has('b')) { open += '<b>'; close = '</b>' + close; }
        if (has('i')) { open += '<i>'; close = '</i>' + close; }
        var u = kid(pr, 'u'); if (u && attr(u, 'val') !== 'none') { open += '<u>'; close = '</u>' + close; }
        if (has('strike')) { open += '<s>'; close = '</s>' + close; }
        var va = kid(pr, 'vertAlign');
        if (va && attr(va, 'val') === 'superscript') { open += '<sup>'; close = '</sup>' + close; }
        if (va && attr(va, 'val') === 'subscript') { open += '<sub>'; close = '</sub>' + close; }
        var c = kid(pr, 'color'); if (c && /^[0-9a-f]{6}$/i.test(attr(c, 'val') || '')) st += 'color:#' + attr(c, 'val') + ';';
        var sz = kid(pr, 'sz'); if (sz && +attr(sz, 'val')) st += 'font-size:' + (+attr(sz, 'val') / 2) + 'pt;';
        var hl = kid(pr, 'highlight'); if (hl) { var hc = { yellow: '#ff0', green: '#0f0', cyan: '#0ff', magenta: '#f0f', red: '#f00', blue: '#00f', lightGray: '#ccc' }[attr(hl, 'val')]; if (hc) st += 'background:' + hc + ';'; }
      }
      var t = '';
      var cs = kids(r);
      for (var i = 0; i < cs.length; i++) {
        var c2 = cs[i], nm = c2.localName;
        if (nm === 't') t += esc(c2.textContent);
        else if (nm === 'tab') t += '&emsp;';
        else if (nm === 'br' || nm === 'cr') t += '<br>';
        else if (nm === 'drawing' || nm === 'pict') {
          var blip = all(c2, 'blip')[0];
          var rid = blip ? (attr(blip, 'embed') || attr(blip, 'link')) : null;
          if (rid && R[rid] && imgs < 60) { imgs++; var src = await imgData(Z, resolve(main, R[rid].target)); if (src) t += '<img src="' + src + '">'; }
        }
      }
      if (!t) return '';
      return (st ? '<span style="' + st + '">' : '') + open + t + close + (st ? '</span>' : '');
    }
    async function para(p) {
      var ppr = kid(p, 'pPr'), tag = 'p', st = '', prefix = '';
      if (ppr) {
        var ps = kid(ppr, 'pStyle'), sn = ps ? attr(ps, 'val') || '' : '';
        var hm = /^heading\s*([1-6])$/i.exec(sn.replace(/\s+/g, ' '));
        if (hm) tag = 'h' + hm[1]; else if (/^title$/i.test(sn)) { tag = 'h1'; st += 'text-align:center;'; } else if (/^subtitle$/i.test(sn)) st += 'color:#555;font-size:1.2em;';
        var jc = kid(ppr, 'jc'); if (jc) { var a = attr(jc, 'val'); if (a === 'center' || a === 'right') st += 'text-align:' + a + ';'; else if (a === 'both') st += 'text-align:justify;'; }
        var ind = kid(ppr, 'ind'); if (ind && +attr(ind, 'left')) st += 'margin-left:' + Math.round(+attr(ind, 'left') / 20) + 'pt;';
        var np = kid(ppr, 'numPr');
        if (np) {
          var il = kid(np, 'ilvl'), ni = kid(np, 'numId');
          var lvl = il ? attr(il, 'val') : '0', nid = ni ? attr(ni, 'val') : '0';
          if (nid !== '0') {
            var f = (numFmt[absOf[nid]] || {})[lvl] || 'bullet';
            st += 'margin-left:' + (22 + (+lvl) * 22) + 'pt;text-indent:-16pt;';
            if (f === 'bullet') prefix = '&bull;&nbsp;&nbsp;';
            else {
              var key = nid + ':' + lvl; counters[key] = (counters[key] || 0) + 1;
              for (var d = (+lvl) + 1; d < 9; d++) delete counters[nid + ':' + d];
              prefix = counters[key] + '.&nbsp;&nbsp;';
            }
          }
        }
      }
      var body = await runs(p);
      if (!body && !prefix) return '<p>&nbsp;</p>';
      return '<' + tag + (st ? ' style="' + st + '"' : '') + '>' + prefix + body + '</' + tag + '>';
    }
    async function table(t) {
      var h = '<table>';
      var rows = kids(t);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].localName !== 'tr') continue;
        h += '<tr>';
        var cells = kids(rows[i]);
        for (var j = 0; j < cells.length; j++) {
          if (cells[j].localName !== 'tc') continue;
          var tcp = kid(cells[j], 'tcPr'), span = tcp ? kid(tcp, 'gridSpan') : null, shd = tcp ? kid(tcp, 'shd') : null;
          var cst = shd && /^[0-9a-f]{6}$/i.test(attr(shd, 'fill') || '') ? ' style="background:#' + attr(shd, 'fill') + '"' : '';
          h += '<td' + (span ? ' colspan="' + attr(span, 'val') + '"' : '') + cst + '>' + await block(cells[j]) + '</td>';
        }
        h += '</tr>';
      }
      return h + '</table>';
    }
    async function block(parent) {
      var h = '', c = kids(parent);
      for (var i = 0; i < c.length; i++) {
        if (c[i].localName === 'p') h += await para(c[i]);
        else if (c[i].localName === 'tbl') h += await table(c[i]);
        else if (c[i].localName === 'sdt') { var sc = kid(c[i], 'sdtContent'); if (sc) h += await block(sc); }
      }
      return h;
    }
    var body = kid(doc.documentElement, 'body');
    return { html: '<div class="doc">' + await block(body) + '</div>' };
  }

  /* ---------- XLSX ---------- */
  var DATE_IDS = { 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 45: 1, 46: 1, 47: 1 };
  function serialToDate(v, withTime) {
    var ms = Math.round((v - 25569) * 86400000), d = new Date(ms);
    if (isNaN(d)) return String(v);
    var p = function (n) { return ('0' + n).slice(-2); };
    var ds = d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
    return (withTime || v % 1) ? ds + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) : ds;
  }
  function fmtNum(v) {
    var n = Number(v); if (!isFinite(n)) return String(v);
    return String(parseFloat(n.toPrecision(15)));
  }
  async function xlsx(Z) {
    if (!Z['xl/workbook.xml']) throw new Error('This is not a valid Excel file');
    var wb = await getXml(Z, 'xl/workbook.xml'), R = await rels(Z, 'xl/workbook.xml');
    var sst = [], sd = await getXml(Z, 'xl/sharedStrings.xml');
    all(sd, 'si').forEach(function (si) {
      var t = '';
      (function walk(n) {
        kids(n).forEach(function (c) {
          if (c.localName === 't') t += c.textContent;
          else if (c.localName === 'r') { var tt = kid(c, 't'); if (tt) t += tt.textContent; }
        });
      })(si);
      sst.push(t);
    });
    var st = await getXml(Z, 'xl/styles.xml'), custom = {}, xfs = [];
    all(st, 'numFmt').forEach(function (n) { custom[attr(n, 'numFmtId')] = attr(n, 'formatCode') || ''; });
    var cx = kid(st && st.documentElement, 'cellXfs');
    kids(cx).forEach(function (x) { xfs.push(+attr(x, 'numFmtId') || 0); });
    function kindOfStyle(s) {
      var id = xfs[s] || 0;
      if (DATE_IDS[id]) return 'date';
      if (id === 9) return 'pct0'; if (id === 10) return 'pct2';
      var code = custom[id];
      if (code && /[ymdh]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '')) && !/^(General|0|#)/i.test(code)) return 'date';
      if (code && /%/.test(code)) return /\.0/.test(code) ? 'pct2' : 'pct0';
      return '';
    }
    var sheets = [];
    var sh = all(wb, 'sheet');
    for (var i = 0; i < sh.length && i < 60; i++) {
      var rid = attr(sh[i], 'id'), rel = R[rid]; if (!rel) continue;
      var path = resolve('xl/workbook.xml', rel.target);
      var d = await getXml(Z, path); if (!d) continue;
      var rows = {}, maxC = 0, maxR = 0;
      all(d, 'row').forEach(function (r) {
        var rn = (+attr(r, 'r') || 0) - 1;
        kids(r).forEach(function (c) {
          if (c.localName !== 'c') return;
          var ref = attr(c, 'r') || '', ci = colIndex(ref), t = attr(c, 't'), s = +attr(c, 's') || 0;
          var vEl = kid(c, 'v'), v = vEl ? vEl.textContent : '', out = '', isNum = false;
          if (t === 's') out = sst[+v] || '';
          else if (t === 'inlineStr') out = all(c, 't').map(function (x) { return x.textContent; }).join('');
          else if (t === 'b') out = v === '1' ? 'TRUE' : 'FALSE';
          else if (t === 'str' || t === 'e') out = v;
          else if (v !== '') {
            var k = kindOfStyle(s); isNum = true;
            if (k === 'date') { out = serialToDate(+v); isNum = false; }
            else if (k === 'pct0') out = Math.round(v * 100) + '%';
            else if (k === 'pct2') out = (v * 100).toFixed(2) + '%';
            else out = fmtNum(v);
          }
          if (out === '') return;
          (rows[rn] = rows[rn] || {})[ci] = { v: out, n: isNum };
          if (ci > maxC) maxC = ci; if (rn > maxR) maxR = rn;
        });
      });
      var merges = [];
      all(d, 'mergeCell').forEach(function (m) { merges.push(attr(m, 'ref')); });
      sheets.push({ name: attr(sh[i], 'name') || 'Sheet' + (i + 1), rows: rows, cols: maxC + 1, nrows: maxR + 1, merges: merges });
    }
    return { sheets: sheets };
  }
  function sheetHtml(S, limit) {
    var cols = Math.min(S.cols, 200), rowsN = Math.min(S.nrows, limit);
    var skip = {}, span = {};
    (S.merges || []).forEach(function (m) {
      var p = m.split(':'); if (p.length !== 2) return;
      var c1 = colIndex(p[0]), r1 = (+/\d+/.exec(p[0])[0]) - 1, c2 = colIndex(p[1]), r2 = (+/\d+/.exec(p[1])[0]) - 1;
      span[r1 + ',' + c1] = [r2 - r1 + 1, c2 - c1 + 1];
      for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) if (r !== r1 || c !== c1) skip[r + ',' + c] = 1;
    });
    var h = '<div class="sheet"><table><tr><th class="rn"></th>';
    for (var c = 0; c < cols; c++) h += '<th>' + colName(c) + '</th>';
    h += '</tr>';
    for (var r = 0; r < rowsN; r++) {
      var row = S.rows[r] || {};
      h += '<tr><td class="rn">' + (r + 1) + '</td>';
      for (var c2 = 0; c2 < cols; c2++) {
        if (skip[r + ',' + c2]) continue;
        var cell = row[c2], sp = span[r + ',' + c2];
        h += '<td' + (cell && cell.n ? ' class="num"' : '') + (sp ? ' rowspan="' + sp[0] + '" colspan="' + sp[1] + '"' : '') + '>' + (cell ? esc(cell.v) : '') + '</td>';
      }
      h += '</tr>';
    }
    h += '</table></div>';
    if (S.nrows > rowsN) h += '<p class="cap">Showing first ' + rowsN + ' of ' + S.nrows + ' rows</p>';
    return h;
  }

  /* ---------- PPTX ---------- */
  var EMU = 12700;
  async function pptx(Z) {
    if (!Z['ppt/presentation.xml']) throw new Error('This is not a valid PowerPoint file');
    var pres = await getXml(Z, 'ppt/presentation.xml'), R = await rels(Z, 'ppt/presentation.xml');
    var sz = all(pres, 'sldSz')[0], W = sz ? +attr(sz, 'cx') : 9144000, H = sz ? +attr(sz, 'cy') : 5143500;
    var wpt = W / EMU;
    var theme = {}, th = null;
    Object.keys(Z).some(function (k) { if (/^ppt\/theme\/theme\d+\.xml$/.test(k)) { th = k; return true; } });
    var td = th ? await getXml(Z, th) : null, cs = td ? all(td, 'clrScheme')[0] : null;
    kids(cs).forEach(function (c) {
      var v = kids(c)[0]; if (!v) return;
      theme[c.localName] = attr(v, 'val') && v.localName === 'srgbClr' ? attr(v, 'val') : (attr(v, 'lastClr') || '000000');
    });
    var alias = { tx1: 'dk1', bg1: 'lt1', tx2: 'dk2', bg2: 'lt2' };
    function color(el) {
      if (!el) return '';
      var c = kids(el)[0]; if (!c) return '';
      var hex = '';
      if (c.localName === 'srgbClr') hex = attr(c, 'val');
      else if (c.localName === 'schemeClr') { var n = attr(c, 'val'); hex = theme[alias[n] || n] || ''; }
      else if (c.localName === 'sysClr') hex = attr(c, 'lastClr') || '000000';
      if (!/^[0-9a-f]{6}$/i.test(hex || '')) return '';
      var lm = kid(c, 'lumMod'), lo = kid(c, 'lumOff');
      if (lm || lo) {
        var r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4), 16) / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, hh = 0;
        if (mx !== mn) {
          var dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn);
          hh = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; hh /= 6;
        }
        l = Math.min(1, Math.max(0, l * (lm ? +attr(lm, 'val') / 1e5 : 1) + (lo ? +attr(lo, 'val') / 1e5 : 0)));
        var f = function (p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
        var q2 = l < .5 ? l * (1 + s) : l + s - l * s, p2 = 2 * l - q2;
        var rgb = s === 0 ? [l, l, l] : [f(p2, q2, hh + 1 / 3), f(p2, q2, hh), f(p2, q2, hh - 1 / 3)];
        hex = rgb.map(function (x) { return ('0' + Math.round(x * 255).toString(16)).slice(-2); }).join('');
      }
      return '#' + hex;
    }
    var slidePaths = [];
    all(pres, 'sldId').forEach(function (s) { var r = R[s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')]; if (r) slidePaths.push(resolve('ppt/presentation.xml', r.target)); });
    var xf = function (sp) {
      var sppr = kid(sp, 'spPr') || kid(sp, 'grpSpPr'), x = sppr ? kid(sppr, 'xfrm') : (kid(sp, 'xfrm'));
      if (!x) return null;
      var off = kid(x, 'off'), ext = kid(x, 'ext');
      if (!off || !ext) return null;
      return { x: +attr(off, 'x'), y: +attr(off, 'y'), w: +attr(ext, 'cx'), h: +attr(ext, 'cy') };
    };
    function phKey(sp) {
      var nv = kid(sp, 'nvSpPr') || kid(sp, 'nvPicPr'), nvp = nv ? kid(nv, 'nvPr') : null, ph = nvp ? kid(nvp, 'ph') : null;
      return ph ? { type: attr(ph, 'type') || 'body', idx: attr(ph, 'idx') } : null;
    }
    function findPh(doc, key) {
      if (!doc || !key) return null;
      var tree = all(doc, 'spTree')[0], found = null;
      kids(tree).forEach(function (sp) {
        if (found || sp.localName !== 'sp') return;
        var k = phKey(sp); if (!k) return;
        if ((key.idx && k.idx === key.idx) || (!key.idx && k.type === key.type) || (key.type === 'ctrTitle' && k.type === 'title')) found = sp;
      });
      return found;
    }
    var out = [];
    for (var si = 0; si < slidePaths.length && si < 200; si++) {
      var sp = slidePaths[si], sdoc = await getXml(Z, sp), SR = await rels(Z, sp);
      if (!sdoc) continue;
      var layoutPath = null, layout = null, master = null;
      Object.keys(SR).forEach(function (k) { if (/slideLayout$/.test(SR[k].type)) layoutPath = resolve(sp, SR[k].target); });
      if (layoutPath) {
        layout = await getXml(Z, layoutPath);
        var LR = await rels(Z, layoutPath);
        for (var lk in LR) if (/slideMaster$/.test(LR[lk].type)) master = await getXml(Z, resolve(layoutPath, LR[lk].target));
      }
      var bgEl = all(sdoc, 'bg')[0], bg = '#fff';
      if (!bgEl && layout) bgEl = all(layout, 'bg')[0];
      if (!bgEl && master) bgEl = all(master, 'bg')[0];
      if (bgEl) { var bp = kid(bgEl, 'bgPr'); var sf = bp ? kid(bp, 'solidFill') : null; var cc = color(sf); if (cc) bg = cc; }
      var html = '', tree = all(sdoc, 'spTree')[0];
      async function shape(el) {
        var ln = el.localName;
        if (ln === 'grpSp') { var ch = kids(el), s = ''; for (var i = 0; i < ch.length; i++) s += await shape(ch[i]); return s; }
        var box = xf(el);
        if (!box) {
          var key = phKey(el), lp = key && findPh(layout, key);
          if (lp) box = xf(lp);
          if (!box && key) {
            var mk = lp ? phKey(lp) : key, mt = mk.type === 'ctrTitle' ? 'title' : mk.type;
            var mp = findPh(master, { type: mt, idx: null }) || findPh(master, key);
            if (mp) box = xf(mp);
          }
        }
        if (ln === 'graphicFrame') {
          var gx = kid(el, 'xfrm'), go = gx ? kid(gx, 'off') : null, ge = gx ? kid(gx, 'ext') : null;
          if (go && ge) box = { x: +attr(go, 'x'), y: +attr(go, 'y'), w: +attr(ge, 'cx'), h: +attr(ge, 'cy') };
        }
        if (!box) return '';
        var pos = 'left:' + (box.x / W * 100).toFixed(3) + '%;top:' + (box.y / H * 100).toFixed(3) + '%;width:' + (box.w / W * 100).toFixed(3) + '%;height:' + (box.h / H * 100).toFixed(3) + '%;';
        var fs = function (pt) { var v = (pt / wpt * 100).toFixed(3); return 'font-size:' + v + 'vw;font-size:' + v + 'cqw;'; };
        if (ln === 'pic') {
          var blip = all(el, 'blip')[0], rid = blip ? attr(blip, 'embed') : null;
          if (!rid || !SR[rid]) return '';
          var src = await imgData(Z, resolve(sp, SR[rid].target));
          return src ? '<div class="sh" style="' + pos + '"><img src="' + src + '" style="width:100%;height:100%;object-fit:contain"></div>' : '';
        }
        if (ln === 'graphicFrame') {
          var tbl = all(el, 'tbl')[0]; if (!tbl) return '';
          var th2 = '<table style="' + fs(14) + '">';
          kids(tbl).forEach(function (tr) {
            if (tr.localName !== 'tr') return;
            th2 += '<tr>';
            kids(tr).forEach(function (tc) { if (tc.localName === 'tc') th2 += '<td>' + esc(all(tc, 't').map(function (t) { return t.textContent; }).join(' ')) + '</td>'; });
            th2 += '</tr>';
          });
          return '<div class="sh" style="' + pos + '">' + th2 + '</table></div>';
        }
        if (ln !== 'sp') return '';
        var sppr = kid(el, 'spPr'), fill = sppr ? color(kid(sppr, 'solidFill')) : '', line = '';
        var lnEl = sppr ? kid(sppr, 'ln') : null; if (lnEl && kid(lnEl, 'solidFill')) line = color(kid(lnEl, 'solidFill'));
        var geom = sppr ? kid(sppr, 'prstGeom') : null, g = geom ? attr(geom, 'prst') : '';
        var st = pos + (fill ? 'background:' + fill + ';' : '') + (line ? 'border:1px solid ' + line + ';' : '') + (g === 'ellipse' ? 'border-radius:50%;' : g === 'roundRect' ? 'border-radius:12px;' : '');
        var tb = kid(el, 'txBody'), key2 = phKey(el), txt = '';
        var phNode = key2 && (findPh(layout, key2) || findPh(master, key2));
        var defSz = key2 && /title/i.test(key2.type) ? 32 : 18;
        var vAnchor = 'flex-start';
        var bp2 = tb ? kid(tb, 'bodyPr') : null; if (bp2) { var an = attr(bp2, 'anchor'); vAnchor = an === 'ctr' ? 'center' : an === 'b' ? 'flex-end' : 'flex-start'; }
        if (tb) {
          kids(tb).forEach(function (p) {
            if (p.localName !== 'p') return;
            var ppr = kid(p, 'pPr'), al = ppr ? attr(ppr, 'algn') : '', lvl = ppr ? +attr(ppr, 'lvl') || 0 : 0;
            var bullet = ppr && kid(ppr, 'buChar') ? '&bull;&nbsp;' : '';
            var rs = '';
            kids(p).forEach(function (r) {
              if (r.localName === 'br') { rs += '<br>'; return; }
              if (r.localName !== 'r' && r.localName !== 'fld') return;
              var t = kid(r, 't'); if (!t) return;
              var rp = kid(r, 'rPr'), rst = '';
              var size = rp && +attr(rp, 'sz') ? +attr(rp, 'sz') / 100 : defSz;
              rst += fs(size);
              if (rp && attr(rp, 'b') === '1') rst += 'font-weight:700;';
              if (rp && attr(rp, 'i') === '1') rst += 'font-style:italic;';
              if (rp && attr(rp, 'u') && attr(rp, 'u') !== 'none') rst += 'text-decoration:underline;';
              var rc = rp ? color(kid(rp, 'solidFill')) : ''; if (rc) rst += 'color:' + rc + ';';
              rs += '<span style="' + rst + '">' + esc(t.textContent) + '</span>';
            });
            if (!rs) rs = '<span style="' + fs(defSz) + '">&nbsp;</span>';
            txt += '<p style="' + (al === 'ctr' ? 'text-align:center;' : al === 'r' ? 'text-align:right;' : '') + (lvl ? 'margin-left:' + lvl * 4 + '%;' : '') + '">' + bullet + rs + '</p>';
          });
        }
        void phNode;
        return '<div class="sh" style="' + st + 'display:flex;flex-direction:column;justify-content:' + vAnchor + ';padding:0.5%;">' + txt + '</div>';
      }
      var els = kids(tree);
      for (var ei = 0; ei < els.length; ei++) html += await shape(els[ei]);
      out.push('<div class="slide" style="container-type:inline-size;aspect-ratio:' + W + '/' + H + ';background:' + bg + '">' + html + '</div><div class="cap">Slide ' + (si + 1) + ' of ' + slidePaths.length + '</div>');
    }
    return { html: out.join('') || '<p>No slides found.</p>' };
  }

  /* ---------- OpenDocument ---------- */
  async function odf(Z, ext) {
    var d = await getXml(Z, 'content.xml');
    if (!d) throw new Error('Could not read this file');
    var imgs = 0;
    async function inline(p) {
      var h = '';
      var nodes = Array.prototype.slice.call(p.childNodes);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType === 3) h += esc(n.nodeValue);
        else if (n.nodeType === 1) {
          var ln = n.localName;
          if (ln === 's') h += '&nbsp;'.repeat(+attr(n, 'c') || 1);
          else if (ln === 'tab') h += '&emsp;';
          else if (ln === 'line-break') h += '<br>';
          else if (ln === 'a') h += '<a href="' + esc(attr(n, 'href') || '#') + '" target="_blank" rel="noopener">' + await inline(n) + '</a>';
          else if (ln === 'span') h += await inline(n);
          else if (ln === 'frame') {
            var im = all(n, 'image')[0], href = im ? attr(im, 'href') : null;
            if (href && imgs < 60) { imgs++; var src = await imgData(Z, href.replace(/^\.\//, '')); if (src) h += '<img src="' + src + '">'; }
          }
        }
      }
      return h;
    }
    async function block(parent) {
      var h = '', c = kids(parent);
      for (var i = 0; i < c.length; i++) {
        var n = c[i], ln = n.localName;
        if (ln === 'h') h += '<h' + Math.min(6, +attr(n, 'outline-level') || 1) + '>' + await inline(n) + '</h' + Math.min(6, +attr(n, 'outline-level') || 1) + '>';
        else if (ln === 'p') h += '<p>' + (await inline(n) || '&nbsp;') + '</p>';
        else if (ln === 'list') {
          var items = kids(n), lh = '<ul>';
          for (var j = 0; j < items.length; j++) lh += '<li>' + await block(items[j]) + '</li>';
          h += lh + '</ul>';
        } else if (ln === 'table') h += await otable(n);
        else if (ln === 'section') h += await block(n);
      }
      return h;
    }
    async function otable(t) {
      var h = '<table>', rows = all(t, 'table-row');
      for (var i = 0; i < rows.length && i < 500; i++) {
        h += '<tr>';
        var cells = kids(rows[i]);
        for (var j = 0; j < cells.length; j++) {
          if (cells[j].localName !== 'table-cell') continue;
          h += '<td' + (attr(cells[j], 'number-columns-spanned') ? ' colspan="' + attr(cells[j], 'number-columns-spanned') + '"' : '') + '>' + await block(cells[j]) + '</td>';
        }
        h += '</tr>';
      }
      return h + '</table>';
    }
    var body = all(d, 'body')[0];
    var content = kids(body)[0];
    if (ext === 'ods') {
      var sheets = [];
      all(content, 'table').forEach(function (t) {
        if (t.parentNode !== content) return;
        var rows = {}, maxC = 0, r = 0;
        kids(t).forEach(function (row) {
          var group = row.localName === 'table-row-group' || row.localName === 'table-header-rows' ? kids(row) : [row];
          group.forEach(function (rw) {
            if (rw.localName !== 'table-row') return;
            var rep = Math.min(+attr(rw, 'number-rows-repeated') || 1, 50), cells = {}, c = 0, any = false;
            kids(rw).forEach(function (cell) {
              if (cell.localName !== 'table-cell' && cell.localName !== 'covered-table-cell') return;
              var crep = Math.min(+attr(cell, 'number-columns-repeated') || 1, 50);
              var vt = attr(cell, 'value-type'), text = all(cell, 'p').map(function (p) { return p.textContent; }).join('\n');
              if (vt === 'date' && attr(cell, 'date-value')) text = attr(cell, 'date-value').replace('T', ' ').replace(/:00$/, '');
              if (vt === 'percentage' && !text) text = Math.round(attr(cell, 'value') * 100) + '%';
              if (text !== '') {
                any = true;
                for (var k = 0; k < crep; k++) cells[c + k] = { v: text, n: /float|percentage|currency/.test(vt || '') };
              }
              c += crep;
            });
            if (any) for (var q = 0; q < rep; q++) { rows[r + q] = cells; if (c > maxC) maxC = c; }
            r += rep;
          });
        });
        sheets.push({ name: attr(t, 'name') || 'Sheet', rows: rows, cols: Math.max(1, maxC), nrows: r, merges: [] });
      });
      return { sheets: sheets };
    }
    if (ext === 'odp') {
      var h = '', n = 0, pages = all(content, 'page');
      pages.forEach(function (pg) {
        n++;
        var txt = all(pg, 'p').map(function (p) { return '<p>' + esc(p.textContent) + '</p>'; }).join('');
        h += '<div style="background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.25);padding:20px;margin:0 auto 4px;max-width:900px;min-height:160px">' + txt + '</div><div class="cap">Slide ' + n + ' of ' + pages.length + '</div>';
      });
      return { html: h };
    }
    return { html: '<div class="doc">' + await block(content) + '</div>' };
  }

  /* ---------- CSV / RTF / legacy ---------- */
  function parseCsv(text, delim) {
    var rows = [], row = [], cur = '', q = false;
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); cur = ''; rows.push(row); row = [];
        if (rows.length >= 20000) break;
      } else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function csvSheet(text, ext) {
    var delim = ext === 'tsv' ? '\t' : ',';
    if (ext === 'csv') {
      var first = text.slice(0, 2000).split('\n')[0] || '';
      if ((first.match(/;/g) || []).length > (first.match(/,/g) || []).length) delim = ';';
    }
    var rows = parseCsv(text, delim), data = {}, maxC = 0;
    rows.forEach(function (r, i) {
      var o = {};
      r.forEach(function (v, j) { if (v !== '') { o[j] = { v: v, n: /^-?\d+([.,]\d+)?$/.test(v.trim()) }; if (j > maxC) maxC = j; } });
      data[i] = o;
    });
    return { sheets: [{ name: 'Table', rows: data, cols: maxC + 1, nrows: rows.length, merges: [] }] };
  }
  function rtfText(s) {
    var out = '', depth = 0, skipAt = -1, i = 0;
    var skipDest = /^(fonttbl|colortbl|stylesheet|info|pict|header|footer|\*)/;
    while (i < s.length) {
      var c = s[i];
      if (c === '{') { depth++; i++; if (skipAt < 0 && skipDest.test(s.slice(i).replace(/^\\/, ''))) skipAt = depth; }
      else if (c === '}') { if (depth === skipAt) skipAt = -1; depth--; i++; }
      else if (c === '\\') {
        var m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(s.slice(i, i + 40));
        if (m) {
          if (skipAt < 0) { if (m[1] === 'par' || m[1] === 'line') out += '\n'; else if (m[1] === 'tab') out += '\t'; else if (m[1] === 'u' && m[2]) out += String.fromCharCode(+m[2] < 0 ? +m[2] + 65536 : +m[2]); }
          i += m[0].length;
        } else if (s[i + 1] === "'") { if (skipAt < 0) out += String.fromCharCode(parseInt(s.substr(i + 2, 2), 16)); i += 4; }
        else { if (skipAt < 0 && /[\\{}]/.test(s[i + 1] || '')) out += s[i + 1]; i += 2; }
      } else { if (skipAt < 0 && c !== '\r' && c !== '\n') out += c; i++; }
    }
    return out;
  }
  function legacyText(u8) {
    function runs(get, step) {
      var out = [], cur = '';
      for (var i = 0; i + step <= u8.length; i += step) {
        var v = get(i);
        if ((v >= 32 && v < 127) || v === 9 || v === 10 || v === 13 || (v >= 160 && v < 0x2fff && step === 2)) cur += v === 13 ? '\n' : String.fromCharCode(v);
        else { if (cur.length >= 6 && /[a-z]{2}/i.test(cur)) out.push(cur); cur = ''; }
      }
      if (cur.length >= 6) out.push(cur);
      return out.join('\n');
    }
    var a = runs(function (i) { return u8[i]; }, 1), b = runs(function (i) { return u8[i] | (u8[i + 1] << 8); }, 2);
    return (b.length > a.length * 0.5 ? b : a).slice(0, 400000);
  }

  /* ---------- UI ---------- */
  var states = new Map();
  var LABEL = { docx: 'Word', docm: 'Word', dotx: 'Word', odt: 'Writer', doc: 'Word 97', rtf: 'RTF', xlsx: 'Excel', xlsm: 'Excel', ods: 'Calc', xls: 'Excel 97', csv: 'CSV', tsv: 'TSV', pptx: 'PowerPoint', pptm: 'PowerPoint', odp: 'Impress', ppt: 'PowerPoint 97' };

  async function load(e) {
    var ext = extOf(e.name), buf;
    if (ext === 'csv' || ext === 'tsv') return csvSheet(await e.file.text(), ext);
    if (ext === 'rtf') { var t = rtfText(await e.file.text()); return { html: '<pre>' + esc(t) + '</pre>' }; }
    buf = await e.file.arrayBuffer();
    if (ext === 'doc' || ext === 'xls' || ext === 'ppt') {
      var u8 = new Uint8Array(buf);
      if (u8[0] === 0x50 && u8[1] === 0x4b) ext = ext + 'x';
      else return { html: '<pre>' + esc(legacyText(u8)) + '</pre>', note: 'Old ' + LABEL[ext] + ' format: showing the text only. Re-save it as ' + ext + 'x to see the full layout.' };
    }
    var Z = mapZip(O.readZip(buf));
    if (ext === 'docx' || ext === 'docm' || ext === 'dotx') return docx(Z);
    if (ext === 'xlsx' || ext === 'xlsm') return xlsx(Z);
    if (ext === 'pptx' || ext === 'pptm') return pptx(Z);
    if (ext === 'odt' || ext === 'ods' || ext === 'odp') return odf(Z, ext);
    throw new Error('Unsupported file type');
  }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  async function renderMedia(e, box) {
    var ext = extOf(e.name), isAudio = /^(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(ext);
    if (!e.url) e.url = URL.createObjectURL(e.file);
    var wrap = el('div', 'ov-media'), m = document.createElement(isAudio ? 'audio' : 'video');
    m.controls = true; m.src = e.url; m.preload = 'metadata'; m.setAttribute('playsinline', '');
    wrap.append(m); box.append(wrap);
  }

  async function render(e, token) {
    var box = O.$('#zipView');
    box.innerHTML = '';
    var root = el('div', 'ov'); box.append(root);
    var ext = extOf(e.name);
    var bar = el('div', 'ov-bar');
    bar.append(el('span', 'ov-tag', e.kind === 'media' ? 'Media' : (LABEL[ext] || ext.toUpperCase())), el('span', 'ov-sp'));
    function btn(label, fn) { var b = el('button', 'ov-btn', label); b.onclick = fn; bar.append(b); }
    if (e.kind === 'media') { root.append(bar); btn('Save copy', function () { O.downloadBlob(e.file, e.name); }); await renderMedia(e, root); return; }
    root.append(bar);
    if (ext === 'csv' || ext === 'tsv') btn('Edit as text', function () { e.kind = 'text'; e.mode = 'code'; O.openEntry(e.id); });
    else if (/^(docx|xlsx|pptx|odt|ods|odp|docm|xlsm|pptm|dotx)$/.test(ext)) btn('Archive view', function () { e.kind = 'zip'; O.renderAll(); });
    btn('Save copy', function () { O.downloadBlob(e.file, e.name); });
    var msg = el('div', 'ov-msg', 'Opening ' + e.name + '…'); root.append(msg);

    var S = states.get(e.id);
    if (!S || S.file !== e.file) {
      try { S = { file: e.file, data: await load(e), sheet: 0, limit: 1000 }; }
      catch (err) {
        if (token !== O.token) return;
        msg.textContent = 'Could not open this file: ' + (err && err.message ? err.message : err);
        return;
      }
      states.set(e.id, S);
    }
    if (token !== O.token) return;
    msg.remove();
    draw(root, S);
  }

  function draw(root, S) {
    Array.prototype.slice.call(root.querySelectorAll('.ov-tabs,.ov-note,.ov-frame,.ov-more')).forEach(function (n) { n.remove(); });
    var d = S.data;
    if (d.note) root.append(el('div', 'ov-note', d.note));
    var fr = el('iframe', 'ov-frame');
    fr.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox');
    if (d.sheets) {
      if (!d.sheets.length) { root.append(el('div', 'ov-msg', 'This file has no sheets.')); return; }
      if (d.sheets.length > 1) {
        var tabs = el('div', 'ov-tabs');
        d.sheets.forEach(function (sh, i) {
          var b = el('button', i === S.sheet ? 'on' : '', sh.name);
          b.onclick = function () { S.sheet = i; S.limit = 1000; draw(root, S); };
          tabs.append(b);
        });
        root.append(tabs);
      }
      var sh = d.sheets[S.sheet];
      fr.srcdoc = frameDoc(sheetHtml(sh, S.limit));
      root.append(fr);
      if (sh.nrows > S.limit) {
        var mb = el('button', 'ov-btn ov-more', 'Show more rows'); mb.style.margin = '8px auto';
        mb.onclick = function () { S.limit += 2000; draw(root, S); };
        root.append(mb);
      }
      return;
    }
    fr.srcdoc = frameDoc(d.html);
    root.append(fr);
  }

  /* ---------- image zoom ---------- */
  function imgTools() {
    var box = O.$('#imgView'), img = O.$('#img'); if (!box || !img) return;
    var old = box.querySelector('.iv-bar'); if (old) old.remove();
    var z = 0;
    function apply() {
      if (z === 0) img.style.cssText = 'margin:auto;max-height:calc(100% - 64px)';
      else img.style.cssText = 'margin:auto;max-width:none;max-height:none;width:' + (z * 100) + '%;height:auto;flex:none';
      lab.textContent = z === 0 ? 'Fit' : Math.round(z * 100) + '%';
    }
    var bar = el('div', 'iv-bar');
    function b(t, fn, label) { var x = el('button', 'ov-btn', t); x.setAttribute('aria-label', label); x.onclick = fn; bar.append(x); return x; }
    var lab = el('span', 'iv-lab');
    b('−', function () { z = z === 0 ? 0.75 : Math.max(0.5, z - 0.5 < 0.5 ? 0.5 : z - 0.5); if (z <= 0.5) z = 0.5; apply(); }, 'Zoom out');
    bar.append(lab);
    b('+', function () { z = z === 0 ? 2 : Math.min(8, z + 1); apply(); }, 'Zoom in');
    b('Fit', function () { z = 0; apply(); }, 'Fit to screen');
    b('Save', function () { var e = O.cur(); if (e) O.downloadBlob(e.file, e.name); }, 'Save copy');
    box.append(bar); apply();
  }
  O.imgTools = imgTools;
  var st = document.createElement('style');
  st.textContent = '#imgView{flex-direction:column;align-items:stretch}#imgView img{align-self:auto}.iv-bar{position:sticky;bottom:0;margin-top:auto;align-self:center;display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:26px;background:var(--surface-low);box-shadow:var(--e2);flex:none;z-index:3}.iv-bar .ov-btn{height:40px;min-width:40px}.iv-lab{min-width:44px;text-align:center;font-size:13px;color:var(--on-surface-v)}';
  document.head.append(st);

  O.officeRender = render;
})();
