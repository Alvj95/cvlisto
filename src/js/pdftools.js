// Herramientas PDF: todo se hace en el navegador, los archivos no se suben a ningún sitio.
// La herramienta se elige con <div id="pdf-tool" data-tool="...">.
import { zip, textToDocx } from './docx.js';

const $ = (s, el = document) => el.querySelector(s);
const root = $('#pdf-tool');
const TOOL = root.dataset.tool;
const VENDOR = new URL('../vendor/', import.meta.url);

/* ---------- Librerías (se cargan solo cuando hacen falta) ---------- */
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
async function pdfjs() {
  pdfjsP ||= import(new URL('pdfjs/pdf.min.js', VENDOR).href).then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.js', VENDOR).href;
    return m;
  });
  return pdfjsP;
}

/* ---------- Utilidades ---------- */
const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const base = (name) => name.replace(/\.[^.]+$/, '');
const bytes = (file) => file.arrayBuffer();
const canvasBlob = (c, q) => new Promise((r) => c.toBlob(r, 'image/jpeg', q));

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

async function openPdf(file) {
  const lib = await pdfjs();
  return lib.getDocument({ data: new Uint8Array(await bytes(file)) }).promise;
}

async function renderPage(doc, n, scale) {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale });
  const c = document.createElement('canvas');
  c.width = Math.ceil(vp.width);
  c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  const real = page.getViewport({ scale: 1 });
  return { canvas: c, w: real.width, h: real.height };
}

// Decodifica una imagen probando varias formas: no todos los navegadores del móvil admiten lo mismo.
async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {}
    try {
      return await createImageBitmap(file);
    } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } catch {
    const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    throw new Error(heic ? 'HEIC' : `IMG:${file.type || file.name}`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Imagen (JPG, PNG, WebP…) a JPEG, respetando la orientación de las fotos del móvil.
async function imageToJpeg(file, max = 2400) {
  const bmp = await decodeImage(file);
  const bw = bmp.width || bmp.naturalWidth;
  const bh = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, max / Math.max(bw, bh));
  const c = document.createElement('canvas');
  c.width = Math.round(bw * k);
  c.height = Math.round(bh * k);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  const blob = await canvasBlob(c, 0.9);
  if (!blob) throw new Error('CANVAS');
  return { data: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
}

// "1-3, 5, 8-" → [1,2,3,5,8,...,total]
function parsePages(text, total) {
  const out = new Set();
  for (const part of String(text).split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d*)\s*-\s*(\d*)$/.exec(part);
    if (m) {
      const a = Math.max(1, Number(m[1] || 1));
      const b = Math.min(total, Number(m[2] || total));
      for (let i = a; i <= b; i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= total) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/* ---------- Interfaz común ---------- */
const CONFIG = {
  unir: { accept: '.pdf,application/pdf', multiple: true, label: 'Elige los PDF que quieres unir', button: 'Unir PDF' },
  'jpg-a-pdf': { accept: 'image/*', multiple: true, label: 'Elige las fotos o imágenes', button: 'Crear PDF' },
  'pdf-a-jpg': { accept: '.pdf,application/pdf', multiple: false, label: 'Elige un PDF', button: 'Convertir a JPG' },
  comprimir: { accept: '.pdf,application/pdf', multiple: false, label: 'Elige el PDF que quieres reducir', button: 'Comprimir PDF' },
  dividir: { accept: '.pdf,application/pdf', multiple: false, label: 'Elige un PDF', button: 'Extraer páginas' },
  'pdf-a-word': { accept: '.pdf,application/pdf', multiple: false, label: 'Elige un PDF', button: 'Convertir a Word' },
};
const cfg = CONFIG[TOOL];
let files = [];
let pageCount = 0;

root.innerHTML = `
  <label class="pt-drop" id="pt-drop">
    <input type="file" id="pt-input" accept="${cfg.accept}" ${cfg.multiple ? 'multiple' : ''} hidden>
    <span class="pt-drop-ico">📂</span>
    <strong>${cfg.label}</strong>
    <span class="muted-s">o arrástralos aquí · tus archivos no salen de tu dispositivo 🔒</span>
  </label>
  <ul class="pt-files" id="pt-files"></ul>
  <div class="pt-opts" id="pt-opts"></div>
  <button type="button" class="btn btn-lg pt-go" id="pt-go" hidden>${cfg.button}</button>
  <div class="pt-result" id="pt-result" hidden></div>`;

function renderOpts() {
  const o = $('#pt-opts');
  if (!files.length) return (o.innerHTML = '');
  if (TOOL === 'jpg-a-pdf')
    o.innerHTML = `<label class="pt-opt">Tamaño de página <select id="pt-size"><option value="a4">A4 (con márgenes)</option><option value="fit">Igual que la imagen</option></select></label>`;
  else if (TOOL === 'comprimir')
    o.innerHTML = `<label class="pt-opt">Nivel <select id="pt-level"><option value="media">Recomendado (buena calidad)</option><option value="fuerte">Máximo (menos peso)</option><option value="baja">Suave (máxima calidad)</option></select></label>
      <p class="muted-s">Ideal para PDF escaneados o con fotos. El texto del resultado no se podrá seleccionar.</p>`;
  else if (TOOL === 'dividir')
    o.innerHTML = `<label class="pt-opt">Páginas a extraer ${pageCount ? `(el PDF tiene ${pageCount})` : ''}<input id="pt-pages" placeholder="Ej.: 1-3, 5" inputmode="numeric"></label>
      <label class="pt-check"><input type="checkbox" id="pt-each"> Separar cada página en un PDF distinto</label>`;
  else if (TOOL === 'pdf-a-word')
    o.innerHTML = `<p class="muted-s">Se convierte el <strong>texto</strong> a un Word editable. Las imágenes y los diseños complejos no se conservan. Si el PDF es una foto escaneada, no tendrá texto que extraer.</p>`;
  else if (TOOL === 'pdf-a-jpg')
    o.innerHTML = `<label class="pt-opt">Calidad <select id="pt-q"><option value="2">Alta</option><option value="1.4">Media (menos peso)</option><option value="3">Máxima</option></select></label>`;
  else o.innerHTML = '';
}

function renderFiles() {
  $('#pt-files').innerHTML = files
    .map(
      (f, i) => `<li><span class="pt-ico">${/\.pdf$/i.test(f.name) ? '📄' : '🖼️'}</span><span class="pt-name">${esc(f.name)}<small>${size(f.size)}</small></span>
      ${cfg.multiple && files.length > 1 ? `<button type="button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button><button type="button" data-down="${i}" ${i === files.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>` : ''}
      <button type="button" data-rm="${i}" aria-label="Quitar">✕</button></li>`,
    )
    .join('');
  $('#pt-go').hidden = !files.length || (TOOL === 'unir' && files.length < 2);
  $('#pt-drop').classList.toggle('has-files', files.length > 0);
  if (TOOL === 'unir' && files.length === 1) $('#pt-files').insertAdjacentHTML('beforeend', '<li class="pt-hint">Añade al menos otro PDF para unirlos.</li>');
  root.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { files.splice(+b.dataset.rm, 1); reset(); }));
  root.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.up; [files[i - 1], files[i]] = [files[i], files[i - 1]]; renderFiles(); }));
  root.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.down; [files[i + 1], files[i]] = [files[i], files[i + 1]]; renderFiles(); }));
}

function reset() {
  $('#pt-result').hidden = true;
  renderFiles();
  renderOpts();
}

async function addFiles(list) {
  const isImg = (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|hei[cf])$/i.test(f.name);
  const ok = [...list].filter((f) => (cfg.accept.includes('image') ? isImg(f) : f.type === 'application/pdf' || /\.pdf$/i.test(f.name)));
  if (!ok.length) return alert(cfg.accept.includes('image') ? 'Elige imágenes (JPG, PNG…).' : 'Elige un archivo PDF.');
  files = cfg.multiple ? [...files, ...ok] : [ok[0]];
  pageCount = 0;
  if (TOOL === 'dividir') {
    try {
      pageCount = (await openPdf(files[0])).numPages;
    } catch {}
  }
  reset();
}

$('#pt-input').addEventListener('change', (e) => {
  addFiles(e.target.files);
  e.target.value = '';
});
const drop = $('#pt-drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

function showResult(items, note = '') {
  const r = $('#pt-result');
  r.innerHTML = `<div class="pt-done">✅ ¡Listo!</div>${note ? `<p>${note}</p>` : ''}
    <div class="pt-dl">${items.map((x, i) => `<button type="button" class="btn ${i ? 'btn-ghost' : ''}" data-dl="${i}">⬇ Descargar ${esc(x.label || x.name)}</button>`).join('')}</div>
    <p class="muted-s">¿Lo vas a enviar a una empresa? <a href="../crear/">Crea también tu currículum gratis</a>.</p>`;
  r.hidden = false;
  r.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => download(items[b.dataset.dl].blob, items[b.dataset.dl].name)));
  download(items[0].blob, items[0].name);
  r.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- Herramientas ---------- */
const RUN = {
  async unir() {
    const { PDFDocument } = await pdfLib();
    const out = await PDFDocument.create();
    for (const f of files) {
      const src = await PDFDocument.load(await bytes(f), { ignoreEncryption: true });
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
    }
    const blob = new Blob([await out.save()], { type: 'application/pdf' });
    showResult([{ blob, name: 'documentos-unidos.pdf' }], `${files.length} PDF unidos en uno (${out.getPageCount()} páginas, ${size(blob.size)}).`);
  },

  async 'jpg-a-pdf'() {
    const { PDFDocument } = await pdfLib();
    const out = await PDFDocument.create();
    const a4 = ($('#pt-size')?.value || 'a4') === 'a4';
    for (const f of files) {
      const img = await imageToJpeg(f);
      const jpg = await out.embedJpg(img.data);
      if (a4) {
        const [W, H] = img.w > img.h ? [841.89, 595.28] : [595.28, 841.89];
        const m = 28;
        const k = Math.min((W - 2 * m) / img.w, (H - 2 * m) / img.h);
        const page = out.addPage([W, H]);
        page.drawImage(jpg, { x: (W - img.w * k) / 2, y: (H - img.h * k) / 2, width: img.w * k, height: img.h * k });
      } else {
        const k = 72 / 150;
        const page = out.addPage([img.w * k, img.h * k]);
        page.drawImage(jpg, { x: 0, y: 0, width: img.w * k, height: img.h * k });
      }
    }
    const blob = new Blob([await out.save()], { type: 'application/pdf' });
    showResult([{ blob, name: files.length === 1 ? `${base(files[0].name)}.pdf` : 'imagenes.pdf' }], `${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'} en un PDF (${size(blob.size)}).`);
  },

  async 'pdf-a-jpg'() {
    const doc = await openPdf(files[0]);
    const scale = Number($('#pt-q')?.value || 2);
    const imgs = [];
    for (let n = 1; n <= doc.numPages; n++) {
      progress(`Página ${n} de ${doc.numPages}…`);
      const { canvas } = await renderPage(doc, n, scale);
      imgs.push({ name: `${base(files[0].name)}-pagina-${n}.jpg`, blob: await canvasBlob(canvas, 0.9) });
    }
    if (imgs.length === 1) return showResult([imgs[0]], 'Tu PDF convertido a imagen JPG.');
    const z = zip(await Promise.all(imgs.map(async (x) => ({ name: x.name, data: new Uint8Array(await x.blob.arrayBuffer()) }))), 'application/zip');
    showResult([{ blob: z, name: `${base(files[0].name)}-jpg.zip`, label: `las ${imgs.length} imágenes (.zip)` }], `${imgs.length} páginas convertidas en imágenes JPG.`);
  },

  async comprimir() {
    const level = { baja: [1.6, 0.8], media: [1.25, 0.65], fuerte: [0.95, 0.5] }[$('#pt-level')?.value || 'media'];
    const doc = await openPdf(files[0]);
    const { PDFDocument } = await pdfLib();
    const out = await PDFDocument.create();
    for (let n = 1; n <= doc.numPages; n++) {
      progress(`Página ${n} de ${doc.numPages}…`);
      const { canvas, w, h } = await renderPage(doc, n, level[0]);
      const jpg = await out.embedJpg(new Uint8Array(await (await canvasBlob(canvas, level[1])).arrayBuffer()));
      out.addPage([w, h]).drawImage(jpg, { x: 0, y: 0, width: w, height: h });
    }
    const blob = new Blob([await out.save()], { type: 'application/pdf' });
    const before = files[0].size;
    if (blob.size >= before)
      return showResult([{ blob: files[0], name: files[0].name, label: 'el original' }], `Tu PDF ya estaba bien optimizado (${size(before)}): comprimirlo no reduce su peso. Prueba con el nivel "Máximo".`);
    const pct = Math.round((1 - blob.size / before) * 100);
    showResult([{ blob, name: `${base(files[0].name)}-comprimido.pdf` }], `De <strong>${size(before)}</strong> a <strong>${size(blob.size)}</strong> (−${pct} %).`);
  },

  async dividir() {
    const { PDFDocument } = await pdfLib();
    const src = await PDFDocument.load(await bytes(files[0]), { ignoreEncryption: true });
    const total = src.getPageCount();
    const typed = $('#pt-pages')?.value.trim();
    const pages = typed ? parsePages(typed, total) : Array.from({ length: total }, (_, i) => i + 1);
    if (!pages.length) return alert(`Escribe páginas válidas entre 1 y ${total}. Ej.: 1-3, 5`);
    const make = async (list) => {
      const out = await PDFDocument.create();
      (await out.copyPages(src, list.map((n) => n - 1))).forEach((p) => out.addPage(p));
      return new Blob([await out.save()], { type: 'application/pdf' });
    };
    if ($('#pt-each')?.checked && pages.length > 1) {
      const parts = [];
      for (const n of pages) parts.push({ name: `${base(files[0].name)}-pagina-${n}.pdf`, data: new Uint8Array(await (await make([n])).arrayBuffer()) });
      return showResult([{ blob: zip(parts, 'application/zip'), name: `${base(files[0].name)}-paginas.zip`, label: `los ${parts.length} PDF (.zip)` }], `${parts.length} páginas separadas, cada una en su PDF.`);
    }
    const blob = await make(pages);
    showResult([{ blob, name: `${base(files[0].name)}-extracto.pdf` }], `${pages.length} ${pages.length === 1 ? 'página extraída' : 'páginas extraídas'} de ${total}.`);
  },

  async 'pdf-a-word'() {
    const doc = await openPdf(files[0]);
    const pages = [];
    let chars = 0;
    for (let n = 1; n <= doc.numPages; n++) {
      progress(`Página ${n} de ${doc.numPages}…`);
      const tc = await (await doc.getPage(n)).getTextContent();
      // Agrupa los trozos de texto en líneas (misma altura) y las líneas en párrafos.
      const rows = [];
      for (const it of tc.items) {
        if (!it.str) continue;
        const y = Math.round(it.transform[5]);
        const h = Math.abs(it.transform[3]) || it.height || 10;
        let row = rows.find((r) => Math.abs(r.y - y) <= h * 0.4);
        if (!row) rows.push((row = { y, h, parts: [] }));
        row.parts.push({ x: it.transform[4], s: it.str });
        row.h = Math.max(row.h, h);
      }
      rows.sort((a, b) => b.y - a.y);
      const hs = rows.map((r) => r.h).sort((a, b) => a - b);
      const body = hs[Math.floor(hs.length / 2)] || 10;
      const paras = [];
      let cur = null;
      let prev = null;
      for (const r of rows) {
        const text = r.parts.sort((a, b) => a.x - b.x).map((p) => p.s).join('').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        chars += text.length;
        const heading = r.h > body * 1.25 && text.length < 90;
        const gap = prev ? prev.y - r.y : 0;
        // Párrafo nuevo: título, salto grande, viñeta, o línea anterior que acaba en punto y esta empieza en mayúscula.
        const bullet = /^[•·▪●◦*–-]\s/.test(text);
        const ended = cur && /[.:!?]$/.test(cur.text) && /^[A-ZÁÉÍÓÚÑ¿¡0-9]/.test(text);
        if (!cur || heading || cur.heading || bullet || ended || gap > Math.max(prev.h, r.h) * 1.7) {
          cur = { text, heading };
          paras.push(cur);
        } else cur.text += (cur.text.endsWith('-') ? '' : ' ') + text;
        prev = r;
      }
      pages.push(paras);
    }
    if (chars < 20)
      return alert('Este PDF no tiene texto que se pueda extraer: probablemente es una imagen escaneada. Prueba con "PDF a JPG".');
    const blob = textToDocx(pages, base(files[0].name));
    showResult([{ blob, name: `${base(files[0].name)}.docx` }], `Texto de ${doc.numPages} ${doc.numPages === 1 ? 'página' : 'páginas'} pasado a Word. Revisa el formato antes de enviarlo.`);
  },
};

function progress(text) {
  $('#pt-go').textContent = `⏳ ${text}`;
}

$('#pt-go').addEventListener('click', async () => {
  const btn = $('#pt-go');
  btn.disabled = true;
  btn.textContent = '⏳ Procesando…';
  try {
    await RUN[TOOL]();
  } catch (err) {
    console.error(err);
    const msg = String(err?.message || err);
    alert(
      /password|encrypt/i.test(msg)
        ? 'Este PDF está protegido con contraseña. Quítale la protección e inténtalo de nuevo.'
        : msg === 'HEIC'
          ? 'Esta foto está en formato HEIC, que tu navegador no puede abrir. En la cámara del móvil, activa "JPG" (o "Más compatible") o haz una captura de pantalla de la foto y usa esa.'
          : msg === 'LIB'
            ? 'No se pudo cargar la herramienta. Comprueba tu conexión a internet e inténtalo de nuevo.'
            : msg.startsWith('IMG:')
              ? `Tu navegador no puede abrir esta imagen (${msg.slice(4)}). Prueba con una foto en JPG o PNG.`
              : `No hemos podido procesar el archivo. Comprueba que no esté dañado e inténtalo de nuevo.\n\n(Detalle: ${msg.slice(0, 120)})`,
    );
  } finally {
    btn.disabled = false;
    btn.textContent = cfg.button;
  }
});
