// Editar y firmar PDF (Pro). El PDF se ve tal cual y encima se añaden textos, firmas,
// marcas y tapados. Todo pasa en el navegador: al descargar, pdf-lib los escribe en el PDF.
import { isPro } from './pro.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = $('#pdf-edit');
const VENDOR = new URL('../vendor/', import.meta.url);
const SIG_KEY = 'cvlisto:firma:v1';

/* ---------- Librerías ---------- */
let pdfLibP;
function pdfLib() {
  pdfLibP ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('pdf-lib/pdf-lib.min.js', VENDOR).href;
    s.onload = () => resolve(window.PDFLib);
    s.onerror = () => {
      pdfLibP = null;
      reject(new Error('LIB'));
    };
    document.head.appendChild(s);
  });
  return pdfLibP;
}
let pdfjsP;
function pdfjs() {
  pdfjsP ||= import(new URL('pdfjs/pdf.min.js', VENDOR).href).then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.js', VENDOR).href;
    return m;
  });
  return pdfjsP;
}

/* ---------- Utilidades ---------- */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pct = (v, total) => `${(v / total) * 100}%`;
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const storage = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v) localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    } catch {}
  },
};

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Fuentes: lo que se ve en pantalla y la fuente estándar del PDF que se parece.
// "base" es dónde queda la línea base dentro de una línea de altura 1.2.
const FONTS = {
  sans: { css: 'Helvetica, Arial, sans-serif', std: ['Helvetica', 'HelveticaBold'], base: 0.947, label: 'Sans' },
  serif: { css: '"Times New Roman", Times, serif', std: ['TimesRoman', 'TimesRomanBold'], base: 0.937, label: 'Serif' },
  mono: { css: '"Courier New", Courier, monospace', std: ['Courier', 'CourierBold'], base: 0.867, label: 'Mono' },
};
const INKS = ['#111111', '#1a3fb8', '#c0262d'];

/* ---------- Estado ---------- */
let fileName = '';
let srcBytes = null;
let pages = []; // { el, layer, hits, canvas, w, h, vp, lines }
let objs = [];
let sel = null;
let mode = null;
let pending = null; // imagen o firma a colocar
let history = [];
let form = null; // { doc, fields: [{ name, kind, el }] }

const MODES = {
  edit: { icon: '✏️', label: 'Editar texto', hint: 'Toca un texto del PDF para cambiarlo.' },
  text: { icon: '🔤', label: 'Añadir texto', hint: 'Toca la página donde quieras escribir.' },
  sign: { icon: '✍️', label: 'Firmar', hint: 'Toca donde quieras poner tu firma.' },
  date: { icon: '📅', label: 'Fecha', hint: 'Toca donde quieras poner la fecha de hoy.' },
  check: { icon: '✔️', label: 'Marcar', hint: 'Toca la casilla que quieras marcar.' },
  cross: { icon: '✖️', label: 'Cruz', hint: 'Toca donde quieras poner una cruz.' },
  cover: { icon: '⬜', label: 'Tapar', hint: 'Toca lo que quieras tapar. Luego ajusta el tamaño desde la esquina.' },
  mark: { icon: '🖍️', label: 'Resaltar', hint: 'Toca el texto que quieras resaltar. Luego ajusta el tamaño desde la esquina.' },
  image: { icon: '🖼️', label: 'Imagen', hint: 'Toca donde quieras poner la imagen.' },
};

root.innerHTML = `
  <label class="pt-drop" id="pe-drop">
    <input type="file" id="pe-input" accept=".pdf,application/pdf" hidden>
    <span class="pt-drop-ico">📂</span>
    <strong>Elige el PDF que quieres editar o firmar</strong>
    <span class="muted-s">o arrástralo aquí · tu archivo no sale de tu dispositivo 🔒</span>
  </label>
  <p class="pe-loading" id="pe-loading" hidden>Abriendo el PDF…</p>
  <div class="pe-app" id="pe-app" hidden>
    <div class="pe-bar" id="pe-bar">${Object.entries(MODES)
      .map(([id, m]) => `<button type="button" data-mode="${id}" aria-pressed="false"><span aria-hidden="true">${m.icon}</span>${m.label}</button>`)
      .join('')}</div>
    <p class="pe-hint" id="pe-hint">Elige una herramienta. Puedes mover cualquier elemento arrastrándolo.</p>
    <div class="pe-fields" id="pe-fields" hidden></div>
    <div class="pe-pages" id="pe-pages"></div>
    <div class="pe-actions">
      <button type="button" class="btn btn-ghost pe-ico" id="pe-undo" disabled aria-label="Deshacer" title="Deshacer">↶</button>
      <button type="button" class="btn btn-ghost pe-ico" id="pe-other" aria-label="Abrir otro PDF" title="Abrir otro PDF">📂</button>
      <button type="button" class="btn" id="pe-save">⬇ Descargar PDF${isPro() ? '' : ' 👑'}</button>
    </div>
  </div>
  <input type="file" id="pe-img" accept="image/*" hidden>
  <input type="file" id="sig-photo" accept="image/*" hidden>
  <dialog id="dlg-sign" class="dlg-sign">
    <h2>Tu firma</h2>
    <div class="sig-saved" id="sig-saved" hidden></div>
    <div class="chips sig-tabs" role="tablist">
      <button type="button" class="chip" data-tab="type" aria-pressed="true">⌨️ Escribir</button>
      <button type="button" class="chip" data-tab="draw" aria-pressed="false">✍️ Dibujar</button>
      <button type="button" class="chip" data-tab="photo" aria-pressed="false">📷 Foto</button>
    </div>
    <div class="sig-pane" data-pane="type">
      <input id="sig-name" class="sig-input" placeholder="Escribe tu nombre" autocomplete="name">
      <div class="sig-styles" id="sig-styles"></div>
    </div>
    <div class="sig-pane" data-pane="draw" hidden>
      <canvas id="sig-pad" class="sig-pad" width="900" height="330"></canvas>
      <p class="muted-s sig-row"><span>Firma con el dedo o el ratón.</span><button type="button" class="btn-link" id="sig-clear">Borrar</button></p>
    </div>
    <div class="sig-pane" data-pane="photo" hidden>
      <p class="muted-s">Firma en un papel blanco, hazle una foto de cerca y súbela. Quitamos el fondo automáticamente.</p>
      <button type="button" class="btn btn-ghost" id="sig-photo-btn">📷 Elegir foto</button>
      <div class="sig-photo-prev" id="sig-photo-prev"></div>
    </div>
    <div class="sig-inks"><span>Color</span>${INKS.slice(0, 2)
      .map((c, i) => `<button type="button" class="ink" data-ink="${c}" style="--ink:${c}" aria-pressed="${i === 0}" aria-label="${i ? 'Azul' : 'Negro'}"></button>`)
      .join('')}</div>
    <label class="pt-check"><input type="checkbox" id="sig-remember" checked> Recordar mi firma en este dispositivo</label>
    <div class="dlg-actions">
      <button type="button" class="btn btn-ghost" id="sig-cancel">Cancelar</button>
      <button type="button" class="btn" id="sig-ok">Usar firma</button>
    </div>
  </dialog>`;

/* ---------- Abrir el PDF ---------- */
async function openFile(file) {
  if (!file) return;
  if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return alert('Elige un archivo PDF.');
  fileName = file.name.replace(/\.pdf$/i, '');
  $('#pe-loading').hidden = false;
  $('#pe-drop').hidden = true;
  try {
    srcBytes = new Uint8Array(await file.arrayBuffer());
    const lib = await pdfjs();
    const doc = await lib.getDocument({ data: srcBytes.slice() }).promise;
    if (doc.numPages > 60) alert(`Este PDF tiene ${doc.numPages} páginas. Puede tardar un poco en abrirse.`);
    objs = [];
    history = [];
    sel = null;
    pages = [];
    $('#pe-pages').innerHTML = '';
    $('#pe-app').hidden = false;
    for (let n = 1; n <= doc.numPages; n++) pages.push(await renderPage(lib, doc, n));
    await loadForm();
    setMode(null);
    updateUndo();
  } catch (e) {
    console.error(e);
    reset();
    if (e?.name === 'PasswordException') alert('Este PDF está protegido con contraseña. Ábrelo con la contraseña, guárdalo sin protección e inténtalo de nuevo.');
    else if (e?.message === 'LIB' || /import|fetch|module/i.test(e?.message || '')) alert('No se ha podido cargar la herramienta. Comprueba tu conexión y vuelve a intentarlo.');
    else alert(`No hemos podido abrir este PDF. Comprueba que no esté dañado.\n(Detalle: ${e?.message || e})`);
  } finally {
    $('#pe-loading').hidden = true;
  }
}

function reset() {
  $('#pe-app').hidden = true;
  $('#pe-drop').hidden = false;
  $('#pe-pages').innerHTML = '';
  $('#pe-fields').hidden = true;
  pages = [];
  objs = [];
  form = null;
}

async function renderPage(lib, doc, n) {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale: 1 });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = clamp((Math.min(900, $('#pe-pages').clientWidth || 600) * dpr) / vp.width, 1, 3);
  const rvp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(rvp.width);
  canvas.height = Math.ceil(rvp.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: rvp, annotationMode: lib.AnnotationMode.ENABLE }).promise;

  const el = document.createElement('div');
  el.className = 'pe-page';
  el.style.aspectRatio = `${vp.width} / ${vp.height}`;
  el.dataset.n = n;
  el.innerHTML = `<div class="pe-hits"></div><div class="pe-layer"></div><span class="pe-num">${n} / ${doc.numPages}</span>`;
  el.prepend(canvas);
  $('#pe-pages').appendChild(el);
  const p = { n, el, layer: $('.pe-layer', el), hits: $('.pe-hits', el), canvas, w: vp.width, h: vp.height, vp, k: canvas.width / vp.width, lines: [] };
  new ResizeObserver(() => el.style.setProperty('--k', el.clientWidth / p.w)).observe(el);
  el.style.setProperty('--k', el.clientWidth / p.w || 1);
  el.addEventListener('click', (e) => onPageClick(e, p));
  try {
    p.lines = textLines(lib, page, vp, await page.getTextContent());
  } catch {}
  return p;
}

// Agrupa los trozos de texto de pdf.js en líneas que se puedan tocar y editar.
function textLines(lib, page, vp, content) {
  const items = [];
  for (const it of content.items) {
    if (!it.str && !it.hasEOL) continue;
    const tx = lib.Util.transform(vp.transform, it.transform);
    if (Math.abs(tx[1]) > 0.01 || Math.abs(tx[2]) > 0.01 || tx[0] <= 0) continue; // solo texto horizontal
    const size = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || Math.abs(tx[0]);
    if (!size) continue;
    let bold = false;
    try {
      bold = /bold|black|heavy|semibold|demi/i.test(page.commonObjs.get(it.fontName)?.name || '');
    } catch {}
    const fam = content.styles[it.fontName]?.fontFamily || 'sans-serif';
    items.push({
      str: it.str,
      x: tx[4],
      base: tx[5],
      size,
      w: it.width * vp.scale,
      font: /mono/i.test(fam) ? 'mono' : /serif/i.test(fam) && !/sans/i.test(fam) ? 'serif' : 'sans',
      bold,
    });
  }
  const lines = [];
  for (const it of items) {
    const last = lines.at(-1);
    const gap = last ? it.x - (last.x + last.w) : 0;
    if (last && Math.abs(it.base - last.base) < last.size * 0.25 && gap > -last.size * 0.5 && gap < last.size * 1.2) {
      const needSpace = gap > last.size * 0.18 && !/\s$/.test(last.str) && !/^\s/.test(it.str);
      last.str += (needSpace ? ' ' : '') + it.str;
      last.w = Math.max(last.w, it.x + it.w - last.x);
    } else if (it.str.trim()) lines.push({ ...it });
  }
  return lines.filter((l) => l.str.trim()).map((l) => ({ ...l, str: l.str.replace(/\s+/g, ' ').trim(), id: uid() }));
}

/* ---------- Formularios del propio PDF ---------- */
async function loadForm() {
  form = null;
  const box = $('#pe-fields');
  box.hidden = true;
  try {
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } = await pdfLib();
    const doc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
    const fields = [];
    for (const f of doc.getForm().getFields()) {
      const name = f.getName();
      const label = esc(name.split('.').pop().replace(/[_-]+/g, ' '));
      if (f instanceof PDFTextField) fields.push({ name, kind: 'text', html: `<label>${label}<input data-f="${esc(name)}" value="${esc(f.getText() || '')}"></label>` });
      else if (f instanceof PDFCheckBox) fields.push({ name, kind: 'check', html: `<label class="pt-check"><input type="checkbox" data-f="${esc(name)}"${f.isChecked() ? ' checked' : ''}> ${label}</label>` });
      else if (f instanceof PDFDropdown || f instanceof PDFRadioGroup) {
        const cur = f instanceof PDFDropdown ? f.getSelected()[0] : f.getSelected();
        const opts = f.getOptions().map((o) => `<option${o === cur ? ' selected' : ''}>${esc(o)}</option>`).join('');
        fields.push({ name, kind: 'choice', html: `<label>${label}<select data-f="${esc(name)}"><option value=""></option>${opts}</select></label>` });
      }
    }
    if (!fields.length) return;
    form = { fields };
    box.innerHTML = `<details open><summary>📝 Este PDF tiene un formulario: rellénalo aquí (${fields.length} campos)</summary><div class="pe-fields-grid">${fields.map((f) => f.html).join('')}</div></details>`;
    box.hidden = false;
  } catch {}
}

/* ---------- Modos ---------- */
function setMode(m) {
  mode = m;
  $$('#pe-bar [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('#pe-hint').textContent = m ? MODES[m].hint : 'Elige una herramienta. Puedes mover cualquier elemento arrastrándolo.';
  $('#pe-hint').classList.toggle('on', Boolean(m));
  root.classList.toggle('pe-placing', Boolean(m) && m !== 'edit');
  renderHits();
}

$('#pe-bar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  const m = b.dataset.mode;
  if (mode === m) return setMode(null);
  select(null);
  if (m === 'sign') return openSign();
  if (m === 'image') return $('#pe-img').click();
  setMode(m);
});

function renderHits() {
  for (const p of pages) {
    if (mode !== 'edit') {
      p.hits.innerHTML = '';
      continue;
    }
    const used = new Set(objs.filter((o) => o.line).map((o) => o.line));
    p.hits.innerHTML = p.lines
      .filter((l) => !used.has(l.id))
      .map((l) => `<button type="button" class="pe-hit" data-line="${l.id}" style="left:${pct(l.x - 1, p.w)};top:${pct(l.base - l.size * 0.95, p.h)};width:${pct(l.w + 2, p.w)};height:${pct(l.size * 1.25, p.h)}" aria-label="Editar: ${esc(l.str)}"></button>`)
      .join('');
  }
  if (mode === 'edit' && !pages.some((p) => p.lines.length))
    $('#pe-hint').textContent = 'Este PDF no tiene texto que se pueda editar (seguramente es un escaneo o una foto). Usa "Tapar" y "Añadir texto" para cambiarlo.';
}

/* ---------- Clics en la página ---------- */
function pointIn(e, p) {
  const r = p.el.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * p.w, y: ((e.clientY - r.top) / r.height) * p.h };
}

function onPageClick(e, p) {
  const hit = e.target.closest('.pe-hit');
  if (hit) return editLine(p, p.lines.find((l) => l.id === hit.dataset.line));
  if (e.target.closest('.pe-obj')) return;
  if (!mode || mode === 'edit') return select(null);
  const { x, y } = pointIn(e, p);
  const m = mode;
  setMode(null);
  snapshot();
  let o;
  if (m === 'text') o = { type: 'text', text: '', size: 12, font: 'sans', bold: false, color: INKS[0], x, y: y - 9 };
  else if (m === 'date') o = { type: 'text', text: today(), size: 12, font: 'sans', bold: false, color: INKS[0], x, y: y - 9 };
  else if (m === 'check' || m === 'cross') o = { type: m, x: x - 7, y: y - 7, w: 14, h: 14, color: m === 'check' ? INKS[1] : INKS[0] };
  else if (m === 'cover') o = { type: 'rect', fill: '#ffffff', x: x - 50, y: y - 10, w: 100, h: 20 };
  else if (m === 'mark') o = { type: 'rect', fill: '#ffe94d', alpha: 0.45, x: x - 50, y: y - 8, w: 100, h: 16 };
  else if ((m === 'sign' || m === 'image') && pending) {
    const w = Math.min(m === 'sign' ? 150 : 200, p.w * 0.6);
    const h = w / pending.ratio;
    o = { type: 'img', src: pending.src, ratio: pending.ratio, x: x - w / 2, y: y - h / 2, w, h };
    pending = null;
  }
  if (!o) return;
  o.page = p.n;
  add(o, m === 'text');
}

// Cambia un texto existente: se tapa con el color del fondo y se escribe el nuevo encima.
function editLine(p, l) {
  if (!l) return;
  const { bg, ink } = sampleColors(p, l);
  const font = FONTS[l.font];
  snapshot();
  const cover = { id: uid(), type: 'rect', fill: bg, x: l.x - 1, y: l.base - l.size * 0.95, w: l.w + 2, h: l.size * 1.25, page: p.n, line: l.id, auto: true };
  objs.push(cover);
  renderObj(cover);
  add({ type: 'text', text: l.str, size: Math.round(l.size * 10) / 10, font: l.font, bold: l.bold, color: ink, x: l.x, y: l.base - font.base * l.size, page: p.n, line: l.id, cover: cover.id }, true);
  renderHits();
}

function sampleColors(p, l) {
  const ctx = p.canvas.getContext('2d', { willReadFrequently: true });
  const k = p.k;
  const px = (x, y) => {
    const d = ctx.getImageData(clamp(Math.round(x * k), 0, p.canvas.width - 1), clamp(Math.round(y * k), 0, p.canvas.height - 1), 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const top = l.base - l.size * 0.95;
  const bottom = l.base + l.size * 0.3;
  const mid = l.base - l.size * 0.35;
  const samples = [px(l.x - 3, mid), px(l.x + l.w + 3, mid)];
  for (const f of [0.15, 0.5, 0.85]) samples.push(px(l.x + l.w * f, top - 2), px(l.x + l.w * f, bottom + 2));
  samples.sort((a, b) => lum(a) - lum(b));
  const bg = samples[Math.floor(samples.length / 2)];
  // Color del texto: el píxel que más contrasta con el fondo dentro de la línea.
  const x0 = Math.max(0, Math.round(l.x * k));
  const y0 = Math.max(0, Math.round(top * k));
  const w = Math.max(1, Math.min(p.canvas.width - x0, Math.round(l.w * k)));
  const h = Math.max(1, Math.min(p.canvas.height - y0, Math.round(l.size * 1.2 * k)));
  const d = ctx.getImageData(x0, y0, w, h).data;
  let best = null;
  let bestD = 0;
  for (let i = 0; i < d.length; i += 16) {
    const dist = Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);
    if (dist > bestD) {
      bestD = dist;
      best = [d[i], d[i + 1], d[i + 2]];
    }
  }
  return { bg: hex(...bg), ink: best && bestD > 60 ? hex(...best) : lum(bg) < 110 ? '#ffffff' : '#111111' };
}

/* ---------- Elementos ---------- */
function add(o, focus = false) {
  o.id ||= uid();
  objs.push(o);
  renderObj(o);
  select(o);
  if (focus && o.type === 'text') {
    const tx = $('.pe-tx', o.el);
    tx.focus();
    placeCaretEnd(tx);
  }
  updateUndo();
}

function pageOf(o) {
  return pages.find((p) => p.n === o.page);
}

const glyph = {
  check: '<svg viewBox="0 0 10 10" preserveAspectRatio="none"><polyline points="1,5.5 4,8.5 9,1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
  cross: '<svg viewBox="0 0 10 10" preserveAspectRatio="none"><path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
};

function renderObj(o) {
  const p = pageOf(o);
  if (!p) return;
  if (!o.el) {
    o.el = document.createElement('div');
    o.el.className = `pe-obj pe-${o.type}`;
    if (o.type === 'text') {
      o.el.innerHTML = '<div class="pe-tx" contenteditable="true" spellcheck="false"></div>';
      const tx = $('.pe-tx', o.el);
      tx.textContent = o.text;
      tx.addEventListener('focus', () => {
        snapshot();
        select(o);
        o.el.classList.add('editing');
      });
      tx.addEventListener('input', () => (o.text = tx.innerText.replace(/ /g, ' ').replace(/\n$/, '')));
      tx.addEventListener('blur', () => {
        o.el.classList.remove('editing');
        if (!o.text.trim()) remove(o, false, true);
      });
      tx.addEventListener('paste', (e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      });
    } else if (o.type === 'img') o.el.innerHTML = `<img src="${o.src}" alt="" draggable="false">`;
    else if (glyph[o.type]) o.el.innerHTML = glyph[o.type];
    if (o.type !== 'text') o.el.insertAdjacentHTML('beforeend', '<span class="pe-rs" aria-hidden="true"></span>');
    o.el.addEventListener('pointerdown', (e) => onObjDown(e, o));
    p.layer.appendChild(o.el);
  }
  const s = o.el.style;
  s.left = pct(o.x, p.w);
  s.top = pct(o.y, p.h);
  if (o.type === 'text') {
    s.fontSize = `calc(var(--k) * ${o.size}px)`;
    s.fontFamily = FONTS[o.font].css;
    s.fontWeight = o.bold ? '700' : '400';
    s.color = o.color;
  } else {
    s.width = pct(o.w, p.w);
    s.height = pct(o.h, p.h);
    if (o.type === 'rect') {
      s.background = o.fill;
      s.opacity = o.alpha ?? 1;
    } else s.color = o.color || '';
  }
}

// Al borrar un texto editado con la papelera también se quita su tapado (vuelve el original).
// Si solo se vacía el texto, el tapado se queda: así se puede borrar un texto del PDF.
function remove(o, snap = true, keepCover = false) {
  if (snap) snapshot();
  const gone = new Set([o.id, !keepCover && o.cover].filter(Boolean));
  objs.filter((x) => gone.has(x.id)).forEach((x) => x.el?.remove());
  objs = objs.filter((x) => !gone.has(x.id));
  if (sel === o) select(null);
  renderHits();
  updateUndo();
}

/* ---------- Selección y barra de cada elemento ---------- */
function select(o) {
  if (sel && sel !== o) {
    sel.el?.classList.remove('sel');
    $('.pe-tools', sel.el || document)?.remove();
  }
  sel = o;
  if (!o?.el) return;
  o.el.classList.add('sel');
  if ($('.pe-tools', o.el)) return;
  const t = document.createElement('div');
  t.className = 'pe-tools';
  t.innerHTML =
    o.type === 'text'
      ? `<button type="button" data-t="smaller" aria-label="Letra más pequeña">A−</button><button type="button" data-t="bigger" aria-label="Letra más grande">A+</button>
         <button type="button" data-t="bold" aria-label="Negrita"><b>B</b></button><button type="button" data-t="font" aria-label="Tipo de letra">Aa</button>
         ${INKS.map((c) => `<button type="button" data-t="ink" data-c="${c}" class="ink" style="--ink:${c}" aria-label="Color"></button>`).join('')}
         <button type="button" data-t="del" aria-label="Borrar">🗑</button>`
      : `${o.type === 'rect' && !o.alpha ? '<button type="button" data-t="white" aria-label="Color del tapado">⬜/⬛</button>' : ''}<button type="button" data-t="del" aria-label="Borrar">🗑</button>`;
  t.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  t.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const a = b.dataset.t;
    if (a === 'del') return remove(o);
    snapshot();
    if (a === 'smaller') o.size = Math.max(5, Math.round((o.size - 1) * 10) / 10);
    if (a === 'bigger') o.size = Math.min(72, Math.round((o.size + 1) * 10) / 10);
    if (a === 'bold') o.bold = !o.bold;
    if (a === 'font') o.font = { sans: 'serif', serif: 'mono', mono: 'sans' }[o.font];
    if (a === 'ink') o.color = b.dataset.c;
    if (a === 'white') o.fill = o.fill === '#000000' ? '#ffffff' : '#000000';
    renderObj(o);
  });
  o.el.appendChild(t);
  o.el.classList.toggle('tools-below', o.y < 40);
}

function placeCaretEnd(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

/* ---------- Mover y cambiar tamaño ---------- */
function onObjDown(e, o) {
  if (e.button > 0) return;
  const tx = o.type === 'text' && $('.pe-tx', o.el);
  if (tx && document.activeElement === tx) return; // escribiendo: el dedo mueve el cursor
  const resizing = e.target.classList.contains('pe-rs');
  e.preventDefault();
  e.stopPropagation();
  select(o);
  const p = pageOf(o);
  const r = p.el.getBoundingClientRect();
  const sx = e.clientX;
  const sy = e.clientY;
  const start = { x: o.x, y: o.y, w: o.w, h: o.h };
  let moved = false;
  o.el.setPointerCapture(e.pointerId);
  const move = (ev) => {
    const dx = ((ev.clientX - sx) / r.width) * p.w;
    const dy = ((ev.clientY - sy) / r.height) * p.h;
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
    if (!moved) snapshot();
    moved = true;
    if (resizing) {
      o.w = Math.max(6, start.w + dx);
      o.h = o.ratio ? o.w / o.ratio : o.type === 'rect' ? Math.max(4, start.h + dy) : o.w;
    } else {
      o.x = clamp(start.x + dx, -10, p.w - 10);
      o.y = clamp(start.y + dy, -10, p.h - 10);
    }
    renderObj(o);
  };
  const up = () => {
    o.el.removeEventListener('pointermove', move);
    o.el.removeEventListener('pointerup', up);
    o.el.removeEventListener('pointercancel', up);
    o.el.classList.toggle('tools-below', o.y < 40);
    if (!moved && tx) {
      tx.focus();
      placeCaretEnd(tx);
    }
  };
  o.el.addEventListener('pointermove', move);
  o.el.addEventListener('pointerup', up);
  o.el.addEventListener('pointercancel', up);
}

document.addEventListener('keydown', (e) => {
  if (!sel || $('#pe-app').hidden) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('[contenteditable], input, textarea')) {
    e.preventDefault();
    remove(sel);
  }
});
document.addEventListener('click', (e) => {
  if (sel && !e.target.closest('.pe-page, .pe-bar, dialog')) select(null);
});

/* ---------- Deshacer ---------- */
const plain = (o) => {
  const { el, ...rest } = o;
  return rest;
};
function snapshot() {
  history.push(objs.map(plain));
  if (history.length > 60) history.shift();
  updateUndo();
}
function updateUndo() {
  $('#pe-undo').disabled = !history.length;
}
$('#pe-undo').addEventListener('click', () => {
  const prev = history.pop();
  if (!prev) return;
  select(null);
  objs.forEach((o) => o.el?.remove());
  objs = prev.map((o) => ({ ...o }));
  objs.forEach(renderObj);
  renderHits();
  updateUndo();
});

/* ---------- Imagen ---------- */
$('#pe-img').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const img = await loadImage(URL.createObjectURL(f));
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const png = /png|gif|webp/i.test(f.type);
    pending = { src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), ratio: c.width / c.height };
    setMode('image');
  } catch {
    alert('No hemos podido abrir esa imagen. Prueba con una foto JPG o PNG, o con una captura de pantalla.');
  }
});

/* ---------- Firma ---------- */
const dlgSign = $('#dlg-sign');
let sigTab = 'type';
let ink = INKS[0];
let sigStyle = 'Great Vibes';
let photoSig = null;
const SIG_FONTS = ['Great Vibes', 'Dancing Script'];

function openSign() {
  const saved = storage.get(SIG_KEY);
  const box = $('#sig-saved');
  box.hidden = !saved;
  if (saved)
    box.innerHTML = `<p class="muted-s">Tu firma guardada</p><button type="button" class="sig-saved-btn" id="sig-use"><img src="${saved}" alt="Tu firma guardada"></button>
      <p class="sig-row"><button type="button" class="btn btn-sm" id="sig-use2">Usar esta firma</button><button type="button" class="btn-link" id="sig-forget">Borrar firma guardada</button></p><p class="muted-s">O crea una nueva:</p>`;
  if (saved) {
    const use = () => {
      dlgSign.close();
      useSignature(saved);
    };
    $('#sig-use').onclick = use;
    $('#sig-use2').onclick = use;
    $('#sig-forget').onclick = () => {
      storage.set(SIG_KEY, null);
      openSign();
    };
  }
  renderSigStyles();
  if (!dlgSign.open) dlgSign.showModal();
}

async function useSignature(src) {
  const img = await loadImage(src);
  pending = { src, ratio: img.naturalWidth / img.naturalHeight };
  setMode('sign');
}

$$('.sig-tabs [data-tab]').forEach((b) =>
  b.addEventListener('click', () => {
    sigTab = b.dataset.tab;
    $$('.sig-tabs [data-tab]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('#dlg-sign [data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== sigTab));
  }),
);
$$('.sig-inks [data-ink]').forEach((b) =>
  b.addEventListener('click', () => {
    ink = b.dataset.ink;
    $$('.sig-inks [data-ink]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderSigStyles();
    recolorPad();
    if (photoSig) showPhotoSig();
  }),
);

function renderSigStyles() {
  const name = $('#sig-name').value.trim() || 'Tu nombre';
  $('#sig-styles').innerHTML = SIG_FONTS.map(
    (f) => `<button type="button" class="sig-style" data-font="${f}" aria-pressed="${f === sigStyle}" style="font-family:'${f}',cursive;color:${ink}">${esc(name)}</button>`,
  ).join('');
  $$('#sig-styles [data-font]').forEach((b) =>
    b.addEventListener('click', () => {
      sigStyle = b.dataset.font;
      renderSigStyles();
    }),
  );
}
$('#sig-name').addEventListener('input', renderSigStyles);

// Recorta los bordes transparentes de un lienzo.
function trim(c) {
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width;
  let y0 = c.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (d[(y * c.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  const pad = 6;
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1 + pad * 2;
  out.height = y1 - y0 + 1 + pad * 2;
  out.getContext('2d').drawImage(c, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function typedSignature() {
  const name = $('#sig-name').value.trim();
  if (!name) return null;
  try {
    await document.fonts.load(`80px "${sigStyle}"`, name);
  } catch {}
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `120px "${sigStyle}", cursive`;
  c.width = Math.ceil(ctx.measureText(name).width + 80);
  c.height = 220;
  ctx.font = `120px "${sigStyle}", cursive`;
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 40, 115);
  return trim(c);
}

// Pizarra para dibujar la firma.
const pad = $('#sig-pad');
const pctx = pad.getContext('2d');
let strokes = [];
function drawStrokes() {
  pctx.clearRect(0, 0, pad.width, pad.height);
  pctx.strokeStyle = ink;
  pctx.lineWidth = 5;
  pctx.lineCap = 'round';
  pctx.lineJoin = 'round';
  for (const s of strokes) {
    pctx.beginPath();
    pctx.moveTo(s[0].x, s[0].y);
    if (s.length === 1) pctx.lineTo(s[0].x + 0.1, s[0].y);
    for (let i = 1; i < s.length - 1; i++) {
      const mx = (s[i].x + s[i + 1].x) / 2;
      const my = (s[i].y + s[i + 1].y) / 2;
      pctx.quadraticCurveTo(s[i].x, s[i].y, mx, my);
    }
    if (s.length > 1) pctx.lineTo(s.at(-1).x, s.at(-1).y);
    pctx.stroke();
  }
}
const recolorPad = drawStrokes;
pad.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  pad.setPointerCapture(e.pointerId);
  const r = pad.getBoundingClientRect();
  const pt = (ev) => ({ x: ((ev.clientX - r.left) / r.width) * pad.width, y: ((ev.clientY - r.top) / r.height) * pad.height });
  const s = [pt(e)];
  strokes.push(s);
  drawStrokes();
  const move = (ev) => {
    s.push(pt(ev));
    drawStrokes();
  };
  const up = () => {
    pad.removeEventListener('pointermove', move);
    pad.removeEventListener('pointerup', up);
    pad.removeEventListener('pointercancel', up);
  };
  pad.addEventListener('pointermove', move);
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', up);
});
$('#sig-clear').addEventListener('click', () => {
  strokes = [];
  drawStrokes();
});

// Firma desde una foto: el papel se vuelve transparente y el trazo toma el color elegido.
$('#sig-photo-btn').addEventListener('click', () => $('#sig-photo').click());
$('#sig-photo').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    photoSig = await loadImage(URL.createObjectURL(f));
    showPhotoSig();
  } catch {
    alert('No hemos podido abrir esa foto. Prueba con una JPG o PNG, o haz una captura de pantalla.');
  }
});
function photoCanvas() {
  if (!photoSig) return null;
  const k = Math.min(1, 1200 / Math.max(photoSig.naturalWidth, photoSig.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(photoSig.naturalWidth * k);
  c.height = Math.round(photoSig.naturalHeight * k);
  const ctx = c.getContext('2d');
  ctx.drawImage(photoSig, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  // Umbral según el brillo medio del papel.
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += lum([d[i], d[i + 1], d[i + 2]]);
  const paper = sum / (d.length / 4);
  const hi = paper - 25;
  const lo = paper - 110;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
  for (let i = 0; i < d.length; i += 4) {
    const L = lum([d[i], d[i + 1], d[i + 2]]);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = L >= hi ? 0 : L <= lo ? 255 : Math.round(((hi - L) / (hi - lo)) * 255);
  }
  ctx.putImageData(img, 0, 0);
  return trim(c);
}
function showPhotoSig() {
  const c = photoCanvas();
  $('#sig-photo-prev').innerHTML = c ? `<img src="${c.toDataURL('image/png')}" alt="Vista previa de tu firma">` : '<p class="muted-s">No se distingue la firma. Prueba con una foto más cerca y con más luz.</p>';
}

$('#sig-cancel').addEventListener('click', () => dlgSign.close());
$('#sig-ok').addEventListener('click', async () => {
  let c = null;
  if (sigTab === 'type') c = await typedSignature();
  else if (sigTab === 'draw') c = strokes.length ? trim(pad) : null;
  else c = photoCanvas();
  if (!c) {
    alert(sigTab === 'type' ? 'Escribe tu nombre.' : sigTab === 'draw' ? 'Dibuja tu firma en el recuadro.' : 'Elige una foto de tu firma.');
    return;
  }
  const src = c.toDataURL('image/png');
  if ($('#sig-remember').checked) storage.set(SIG_KEY, src);
  dlgSign.close();
  useSignature(src);
});

/* ---------- Guardar ---------- */
function rgbOf(lib, color) {
  const v = (i) => parseInt(color.slice(i, i + 2), 16) / 255;
  return lib.rgb(v(1), v(3), v(5));
}

async function buildPdf() {
  const lib = await pdfLib();
  const { PDFDocument, StandardFonts, degrees } = lib;
  const doc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });

  if (form) {
    const f = doc.getForm();
    for (const input of $$('#pe-fields [data-f]')) {
      try {
        const field = f.getField(input.dataset.f);
        if (input.type === 'checkbox') input.checked ? field.check() : field.uncheck();
        else if (input.tagName === 'SELECT') input.value ? field.select(input.value) : field.clear?.();
        else field.setText(input.value);
      } catch {}
    }
  }

  const fonts = {};
  const font = async (name) => (fonts[name] ||= await doc.embedFont(StandardFonts[name]));
  const images = new Map();
  const image = async (src) => {
    if (!images.has(src)) images.set(src, /^data:image\/png/.test(src) ? await doc.embedPng(src) : await doc.embedJpg(src));
    return images.get(src);
  };
  // Las fuentes estándar del PDF no tienen todos los caracteres (por ejemplo, emojis).
  const safe = (f, text) =>
    [...text]
      .map((ch) => {
        try {
          f.encodeText(ch);
          return ch;
        } catch {
          return '?';
        }
      })
      .join('');

  for (const o of objs) {
    const p = pageOf(o);
    const page = doc.getPage(o.page - 1);
    const rot = degrees(p.vp.rotation);
    const at = (x, y) => {
      const [px, py] = p.vp.convertToPdfPoint(x, y);
      return { x: px, y: py };
    };
    if (o.type === 'rect') {
      page.drawRectangle({ ...at(o.x, o.y + o.h), width: o.w, height: o.h, color: rgbOf(lib, o.fill), opacity: o.alpha ?? 1, rotate: rot });
    } else if (o.type === 'img') {
      page.drawImage(await image(o.src), { ...at(o.x, o.y + o.h), width: o.w, height: o.h, rotate: rot });
    } else if (o.type === 'check' || o.type === 'cross') {
      const pt = (fx, fy) => at(o.x + o.w * fx, o.y + o.h * fy);
      const color = rgbOf(lib, o.color);
      const thickness = Math.max(0.8, o.w * 0.14);
      const segs = o.type === 'check' ? [[pt(0.1, 0.55), pt(0.4, 0.85)], [pt(0.4, 0.85), pt(0.9, 0.15)]] : [[pt(0.15, 0.15), pt(0.85, 0.85)], [pt(0.85, 0.15), pt(0.15, 0.85)]];
      for (const [start, end] of segs) page.drawLine({ start, end, thickness, color, lineCap: lib.LineCapStyle.Round });
    } else if (o.type === 'text' && o.text.trim()) {
      const def = FONTS[o.font];
      const f = await font(def.std[o.bold ? 1 : 0]);
      o.text.split('\n').forEach((line, i) => {
        if (!line) return;
        const base = o.y + o.size * (1.2 * i + def.base);
        page.drawText(safe(f, line), { ...at(o.x, base), size: o.size, font: f, color: rgbOf(lib, o.color), rotate: rot });
      });
    }
  }
  return doc.save();
}

$('#pe-save').addEventListener('click', async () => {
  select(null);
  document.activeElement?.blur();
  if (!isPro()) {
    $('#dlg-pro-title').textContent = 'Descarga tu PDF con Pro';
    $('#dlg-pro-text').textContent = 'Tu PDF ya está editado. Consigue Pro para descargarlo con todos los cambios y tu firma.';
    $$('#dlg-pro .js-free-tpl').forEach((b) => (b.hidden = true));
    $('#dlg-pro').showModal();
    return;
  }
  const btn = $('#pe-save');
  btn.disabled = true;
  btn.textContent = 'Preparando…';
  try {
    const out = await buildPdf();
    download(new Blob([out], { type: 'application/pdf' }), `${fileName || 'documento'}-editado.pdf`);
  } catch (e) {
    console.error(e);
    alert(e?.message === 'LIB' ? 'No se ha podido cargar la herramienta. Comprueba tu conexión y vuelve a intentarlo.' : `No hemos podido guardar el PDF.\n(Detalle: ${e?.message || e})`);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Descargar PDF';
  }
});

$('#pe-other').addEventListener('click', () => {
  if (objs.length && !confirm('Se perderán los cambios de este PDF. ¿Abrir otro?')) return;
  reset();
  $('#pe-input').click();
});
$('#pe-input').addEventListener('change', (e) => {
  openFile(e.target.files[0]);
  e.target.value = '';
});
const drop = $('#pe-drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => openFile(e.dataTransfer.files[0]));
window.addEventListener('beforeunload', (e) => {
  if (objs.length) e.preventDefault();
});

