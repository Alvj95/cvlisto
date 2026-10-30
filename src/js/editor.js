import { renderCV, emptyCV, TEMPLATES, ACCENTS } from './cv-render.js';
import { OFICIOS, SECTORES, ejemploCV } from '../data/oficios.js';
import { extractLines, parseCV } from './importer.js';
import { LANGS, tr, known } from './i18n.js';
import { reviewCV, notaTexto } from './reviewer.js';
import { htmlToPdf, shareOrDownload, fileName } from './share.js';

// Todo se guarda en el navegador del usuario: el currículum nunca sale de su dispositivo.
const STORE_KEY = 'cvlisto:cv:v1';
const LIST_KEY = 'cvlisto:cvs:v1';
const PRINT_TIP_KEY = 'cvlisto:print-tip-seen';
const A4_W = 793.7; // 210 mm en píxeles CSS
const A4_H = 1122.5; // 297 mm

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const storage = {
  get(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); return true; } catch { return false; }
  },
  del(k) {
    try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ }
  },
};

const blankCV = () => ({ ...emptyCV(), oficio: '' });
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Varios currículums: la lista vive en LIST_KEY y el abierto se copia también en
// STORE_KEY, que es el que lee la página de la carta.
function loadList() {
  try {
    const raw = storage.get(LIST_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list.items) && list.items.length) return list;
    }
  } catch { /* datos corruptos: empezamos de cero */ }
  // Primera vez con la lista: el currículum que ya tenía pasa a ser el primero.
  let first = blankCV();
  try {
    const raw = storage.get(STORE_KEY);
    if (raw) first = { ...first, ...JSON.parse(raw) };
  } catch { /* sin currículum previo */ }
  const id = newId();
  return { active: id, items: [{ id, label: '', updated: Date.now(), data: first }] };
}

let list = loadList();
const current = () => list.items.find((x) => x.id === list.active) || list.items[0];
let cv = { ...blankCV(), ...current().data };
const isEmpty = () => !cv.nombre && !cv.perfil && cv.experiencia.length === 0;
const oficio = () => OFICIOS.find((o) => o.slug === cv.oficio);

/* ---------- Guardado y vista previa ---------- */
let saveTimer;
function changed({ rerenderForm = false } = {}) {
  if (rerenderForm) renderForm();
  updateProgress();
  updateLangNote();
  updateReviewBadge();
  renderPreview();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

function save() {
  clearTimeout(saveTimer);
  const item = current();
  item.data = cv;
  item.updated = Date.now();
  const ok = storage.set(LIST_KEY, JSON.stringify(list)) && storage.set(STORE_KEY, JSON.stringify(cv));
  renderSwitcher();
  const el = $('#saved');
  if (el) el.textContent = ok ? 'Guardado en este dispositivo ✓' : '';
}
// Si se sale de la página antes de que salte el temporizador, guardamos igual.
addEventListener('pagehide', save);

/* ---------- Mis currículums ---------- */
function labelOf(item) {
  if (item.label) return item.label;
  const d = item.data || {};
  const o = OFICIOS.find((x) => x.slug === d.oficio);
  return d.puesto?.trim() || o?.nombre || d.nombre?.trim() || 'Mi currículum';
}

function renderSwitcher() {
  const el = $('#cv-switch-label');
  if (!el) return;
  el.textContent = labelOf(current());
  $('#cv-switch-count').textContent = list.items.length > 1 ? `${list.items.length} guardados` : 'Crear otro';
}

function renderCvList() {
  const fecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const sorted = [...list.items].sort((a, b) => b.updated - a.updated);
  $('#cvs-list').innerHTML = sorted
    .map((item) => {
      const o = OFICIOS.find((x) => x.slug === item.data?.oficio);
      const active = item.id === list.active;
      return `<li class="${active ? 'active' : ''}">
        <span class="cvs-ico">${o?.icono || '📄'}</span>
        <div class="grow"><strong>${esc(labelOf(item))}</strong><small>${esc(item.data?.nombre || 'Sin nombre')} · ${fecha.format(item.updated)}${active ? ' · <b>Abierto</b>' : ''}</small></div>
        <span class="cvs-actions">
          ${active ? '' : `<button type="button" class="btn btn-sm" data-cv-open="${item.id}">Abrir</button>`}
          <button type="button" class="icon-btn" data-cv-dup="${item.id}" title="Duplicar" aria-label="Duplicar">⧉</button>
          <button type="button" class="icon-btn" data-cv-ren="${item.id}" title="Cambiar nombre" aria-label="Cambiar nombre">✎</button>
          <button type="button" class="icon-btn" data-cv-del="${item.id}" title="Eliminar" aria-label="Eliminar">🗑</button>
        </span></li>`;
    })
    .join('');
  const find = (id) => list.items.find((x) => x.id === id);
  $$('[data-cv-open]').forEach((b) => b.addEventListener('click', () => switchTo(b.dataset.cvOpen)));
  $$('[data-cv-dup]').forEach((b) =>
    b.addEventListener('click', () => {
      save();
      const src = find(b.dataset.cvDup);
      const id = newId();
      list.items.push({ id, label: `${labelOf(src)} (copia)`, updated: Date.now(), data: JSON.parse(JSON.stringify(src.data)) });
      switchTo(id);
    }),
  );
  $$('[data-cv-ren]').forEach((b) =>
    b.addEventListener('click', () => {
      const item = find(b.dataset.cvRen);
      const name = prompt('Nombre para este currículum (por ejemplo, "Hostelería" o "Para tiendas"):', labelOf(item));
      if (name === null) return;
      item.label = name.trim();
      save();
      renderCvList();
    }),
  );
  $$('[data-cv-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const item = find(b.dataset.cvDel);
      if (!confirm(`¿Eliminar "${labelOf(item)}"? No se puede deshacer.`)) return;
      list.items = list.items.filter((x) => x !== item);
      if (!list.items.length) list.items.push({ id: newId(), label: '', updated: Date.now(), data: blankCV() });
      if (item.id === list.active) openItem(list.items[0].id);
      else {
        save();
        renderCvList();
      }
    }),
  );
}

function switchTo(id) {
  save();
  openItem(id);
}

// Abre un currículum de la lista sin guardar antes el actual (p. ej. tras borrarlo).
function openItem(id) {
  list.active = id;
  cv = { ...blankCV(), ...current().data };
  renderForm();
  changed();
  save();
  renderCvList();
  if ($('#dlg-cvs').open) $('#dlg-cvs').close();
  window.scrollTo(0, 0);
}

function newCV() {
  save();
  const id = newId();
  list.items.push({ id, label: '', updated: Date.now(), data: blankCV() });
  switchTo(id);
}

/* ---------- Idioma del currículum ---------- */
// Lo que escribe el usuario a mano no se traduce: avisamos de qué textos siguen igual.
function updateLangNote() {
  const note = $('#lang-note');
  if (!note) return;
  const lang = cv.lang || 'es';
  if (lang === 'es') {
    note.hidden = true;
    return;
  }
  const pending = [
    cv.puesto,
    cv.perfil,
    ...cv.experiencia.flatMap((e) => [e.puesto, ...String(e.tareas).split('\n')]),
    ...cv.habilidades,
    ...String(cv.otros).split('\n'),
  ]
    .map((t) => String(t ?? '').trim())
    .filter((t) => t && !known(t));
  const name = LANGS.find((l) => l.id === lang).es;
  note.hidden = false;
  note.innerHTML = pending.length
    ? `<strong>✍️ ${pending.length} ${pending.length === 1 ? 'texto escrito por ti' : 'textos escritos por ti'} no se traducen solos.</strong> Escríbelos en ${esc(name)} en el formulario, por ejemplo: <em>${pending
        .slice(0, 2)
        .map((t) => esc(t.length > 50 ? `${t.slice(0, 50)}…` : t))
        .join('</em>, <em>')}</em>.`
    : `<strong>✅ Todo tu currículum está en ${esc(name)}.</strong>`;
}

/* ---------- Revisor ---------- */
// Cuenta las páginas aunque la vista previa esté oculta (móvil, pestaña Editar).
function countPages() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
  probe.innerHTML = renderCV(cv);
  document.body.appendChild(probe);
  const pages = Math.ceil((probe.firstElementChild.offsetHeight - 2) / A4_H);
  probe.remove();
  return pages;
}

function updateReviewBadge() {
  const { consejos } = reviewCV(cv, { pages: 1 });
  const importantes = consejos.filter((c) => c.nivel !== 'baja').length;
  $('#review-badge').textContent = importantes || '';
}

function openReview() {
  const { nota, consejos } = reviewCV(cv, { pages: countPages() });
  const { label, color } = notaTexto(nota);
  const ring = $('#review-score');
  ring.style.setProperty('--p', nota);
  ring.style.setProperty('--c', color);
  $('span', ring).textContent = nota;
  $('#review-title').textContent = label;
  $('#review-sub').textContent = consejos.length
    ? `Te damos ${consejos.length} ${consejos.length === 1 ? 'consejo' : 'consejos'} para mejorarlo.`
    : 'No hemos encontrado nada que mejorar.';
  const NIVEL = { alta: 'Importante', media: 'Mejorable', baja: 'Detalle' };
  $('#review-list').innerHTML = consejos.length
    ? consejos
        .map(
          (c, i) => `<li class="${c.nivel}"><span class="dot" title="${NIVEL[c.nivel]}"></span><div class="grow"><strong>${esc(c.titulo)}</strong><small>${esc(c.detalle)}</small></div>
          <button type="button" class="btn btn-ghost btn-sm" data-fix="${i}">Corregir</button></li>`,
        )
        .join('')
    : '<li class="review-ok">🎉 Tu currículum está listo para enviar.</li>';
  $$('[data-fix]').forEach((b) =>
    b.addEventListener('click', () => {
      const c = consejos[b.dataset.fix];
      $('#dlg-review').close();
      goToSection({ escritura: 'experiencia' }[c.seccion] || c.seccion, c.campo);
    }),
  );
  $('#dlg-review').showModal();
}

function goToSection(sec, campo) {
  const editor = $('.editor');
  if (editor.classList.contains('show-preview')) $('#tab-edit').click();
  const block = $(`[data-sec="${sec}"]`)?.parentElement;
  if (!block) return;
  block.open = true;
  const field = (campo && $(`#${campo}`)) || $$('input, textarea, select', block).find((el) => el.offsetParent && el.type !== 'file');
  (field || block).scrollIntoView({ behavior: 'smooth', block: field ? 'center' : 'start' });
  setTimeout(() => field?.focus({ preventScroll: true }), 400);
}

/* ---------- Progreso ---------- */
const STEPS = [
  { sec: 'datos', ok: () => cv.nombre.trim() && (cv.telefono.trim() || cv.email.trim()), tip: 'Añade tu nombre y un teléfono o email.' },
  { sec: 'datos', ok: () => cv.puesto.trim(), tip: 'Indica el puesto que buscas.' },
  { sec: 'perfil', ok: () => cv.perfil.trim().length > 40, tip: 'Escribe un perfil de 2-3 líneas (o toca una sugerencia).' },
  { sec: 'experiencia', ok: () => cv.experiencia.some((e) => e.puesto.trim()), tip: 'Añade al menos una experiencia.' },
  { sec: 'formacion', ok: () => cv.formacion.some((f) => f.titulo.trim()), tip: 'Añade tus estudios o un curso.' },
  { sec: 'habilidades', ok: () => cv.habilidades.length >= 4, tip: 'Añade al menos 4 habilidades.' },
  { sec: 'idiomas', ok: () => cv.idiomas.some((i) => i.idioma.trim()), tip: 'Indica qué idiomas hablas.' },
];

function updateProgress() {
  const done = STEPS.filter((s) => s.ok());
  const pct = Math.round((done.length / STEPS.length) * 100);
  const next = STEPS.find((s) => !s.ok());
  $('#prog-pct').textContent = `${pct}%`;
  $('#prog-bar').style.width = `${pct}%`;
  $('#prog-title').textContent =
    pct === 100 ? '¡Tu CV está completo! 🎉' : pct >= 60 ? '¡Vas muy bien!' : pct > 0 ? 'Tu CV va tomando forma' : 'Empecemos tu CV';
  $('#prog-tip').textContent = next ? `Siguiente paso: ${next.tip}` : 'Ya puedes descargarlo en PDF.';
  const secs = new Set(STEPS.map((s) => s.sec));
  secs.forEach((sec) => {
    const ok = STEPS.filter((s) => s.sec === sec).every((s) => s.ok());
    $(`[data-sec="${sec}"]`)?.parentElement.classList.toggle('is-done', Boolean(ok));
  });
}

function renderPreview() {
  const wrap = $('#sheet');
  if (!wrap || wrap.offsetParent === null) return;
  wrap.innerHTML = renderCV(cv);
  const sheet = wrap.firstElementChild;
  const scale = Math.min(1, wrap.clientWidth / A4_W);
  sheet.style.transform = `scale(${scale})`;
  const h = Math.max(sheet.offsetHeight, A4_H);
  wrap.style.height = `${h * scale}px`;
  const pages = Math.ceil((sheet.offsetHeight - 2) / A4_H);
  for (let p = 1; p < pages; p++) {
    const line = document.createElement('div');
    line.className = 'page-break';
    line.style.top = `${p * A4_H * scale}px`;
    line.innerHTML = `<span>Página ${p + 1}</span>`;
    wrap.appendChild(line);
  }
  const info = $('#pages-info');
  if (info) info.textContent = pages > 1 ? `Ocupa ${pages} páginas. Intenta resumir para que quepa en una.` : 'Cabe en 1 página ✓';
}

/* ---------- Campos simples ---------- */
function bindSimpleFields() {
  $$('[data-f]').forEach((el) => {
    el.value = cv[el.dataset.f] ?? '';
    el.addEventListener('input', () => {
      cv[el.dataset.f] = el.value;
      changed();
    });
  });
}

function syncSimpleFields() {
  $$('[data-f]').forEach((el) => (el.value = cv[el.dataset.f] ?? ''));
}

/* ---------- Oficio y sugerencias ---------- */
function renderOficio() {
  const sel = $('#oficio');
  sel.value = cv.oficio || '';
  const o = oficio();
  const box = $('#perfil-sugg');
  box.innerHTML = o
    ? `<div class="sugg-title">Ideas para ${esc(o.nombre.toLowerCase())}</div>` +
      o.perfiles.map((p, i) => `<button type="button" data-perfil="${i}">${esc(tr(p, cv.lang))}</button>`).join('')
    : '';
  $$('[data-perfil]', box).forEach((b) =>
    b.addEventListener('click', () => {
      cv.perfil = tr(o.perfiles[Number(b.dataset.perfil)], cv.lang);
      $('[data-f="perfil"]').value = cv.perfil;
      changed();
    }),
  );
}

/* ---------- Listas repetibles ---------- */
const LISTS = {
  experiencia: {
    el: '#exp-list',
    blank: () => ({ puesto: '', empresa: '', lugar: '', inicio: '', fin: '', actual: false, tareas: '' }),
    label: (x, i) => x.puesto || `Experiencia ${i + 1}`,
    body: (x) => `
      <div class="field"><label>Puesto</label><input data-k="puesto" value="${esc(x.puesto)}" placeholder="Ej.: Camarero de sala"></div>
      <div class="row2">
        <div class="field"><label>Empresa</label><input data-k="empresa" value="${esc(x.empresa)}"></div>
        <div class="field"><label>Ciudad</label><input data-k="lugar" value="${esc(x.lugar)}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Desde</label><input data-k="inicio" value="${esc(x.inicio)}" placeholder="2022"></div>
        <div class="field"><label>Hasta</label><input data-k="fin" value="${esc(x.fin)}" placeholder="2024" ${x.actual ? 'disabled' : ''}></div>
      </div>
      <label class="check"><input type="checkbox" data-k="actual" ${x.actual ? 'checked' : ''}> Trabajo aquí actualmente</label>
      <div class="field"><label>Qué hacías (una tarea por línea)</label><textarea data-k="tareas" rows="4">${esc(x.tareas)}</textarea></div>
      ${tareasSugg(x)}`,
  },
  formacion: {
    el: '#edu-list',
    blank: () => ({ titulo: '', centro: '', inicio: '', fin: '' }),
    label: (x, i) => x.titulo || `Formación ${i + 1}`,
    body: (x) => `
      <div class="field"><label>Título o curso</label><input data-k="titulo" value="${esc(x.titulo)}" placeholder="Ej.: Curso de manipulador de alimentos"></div>
      <div class="field"><label>Centro</label><input data-k="centro" value="${esc(x.centro)}"></div>
      <div class="row2">
        <div class="field"><label>Desde</label><input data-k="inicio" value="${esc(x.inicio)}"></div>
        <div class="field"><label>Hasta</label><input data-k="fin" value="${esc(x.fin)}"></div>
      </div>`,
  },
  idiomas: {
    el: '#lang-list',
    blank: () => ({ idioma: '', nivel: '' }),
    label: (x, i) => x.idioma || `Idioma ${i + 1}`,
    body: (x) => `
      <div class="row2">
        <div class="field"><label>Idioma</label><input data-k="idioma" value="${esc(x.idioma)}" placeholder="Inglés"></div>
        <div class="field"><label>Nivel</label>
          <select data-k="nivel">${['', 'Nativo', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1', 'Básico', 'Intermedio', 'Avanzado']
            .map((n) => `<option ${n === x.nivel ? 'selected' : ''} value="${n}">${n || '—'}</option>`)
            .join('')}</select>
        </div>
      </div>`,
  },
};

function tareasSugg(x) {
  const o = oficio();
  if (!o) return '';
  const used = new Set(String(x.tareas).split('\n').map((t) => tr(t.trim(), 'es')));
  return `<div class="sugg-title">Toca para añadir</div><div class="chips">${o.tareas
    .map((t) => `<button type="button" class="chip ${used.has(t) ? 'used' : ''}" data-tarea="${esc(tr(t, cv.lang))}">+ ${esc(tr(t, cv.lang))}</button>`)
    .join('')}</div>`;
}

function renderList(key) {
  const def = LISTS[key];
  const box = $(def.el);
  box.innerHTML = cv[key]
    .map(
      (x, i) => `<div class="item" data-i="${i}">
        <div class="item-head"><span>${esc(def.label(x, i))}</span><span class="actions">
          <button type="button" class="icon-btn" data-act="up" title="Subir" aria-label="Subir">↑</button>
          <button type="button" class="icon-btn" data-act="down" title="Bajar" aria-label="Bajar">↓</button>
          <button type="button" class="icon-btn" data-act="del" title="Eliminar" aria-label="Eliminar">✕</button>
        </span></div>${def.body(x)}</div>`,
    )
    .join('');

  $$('.item', box).forEach((item) => {
    const i = Number(item.dataset.i);
    $$('[data-k]', item).forEach((input) => {
      const ev = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(ev, () => {
        const k = input.dataset.k;
        cv[key][i][k] = input.type === 'checkbox' ? input.checked : input.value;
        if (k === 'actual') {
          $('[data-k="fin"]', item).disabled = input.checked;
        }
        if (k === Object.keys(def.blank())[0]) $('.item-head > span', item).textContent = def.label(cv[key][i], i);
        changed();
      });
    });
    $$('[data-tarea]', item).forEach((chip) =>
      chip.addEventListener('click', () => {
        const t = chip.dataset.tarea;
        const cur = cv[key][i].tareas.trim();
        const list = cur ? cur.split('\n') : [];
        if (list.some((l) => tr(l.trim(), 'es') === tr(t, 'es'))) return;
        cv[key][i].tareas = [...list, t].join('\n');
        $('[data-k="tareas"]', item).value = cv[key][i].tareas;
        chip.classList.add('used');
        changed();
      }),
    );
    $$('[data-act]', item).forEach((b) =>
      b.addEventListener('click', () => {
        const arr = cv[key];
        if (b.dataset.act === 'del') {
          if (!confirm('¿Eliminar este elemento?')) return;
          arr.splice(i, 1);
        } else {
          const j = b.dataset.act === 'up' ? i - 1 : i + 1;
          if (j < 0 || j >= arr.length) return;
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        renderList(key);
        changed();
      }),
    );
  });
}

/* ---------- Habilidades ---------- */
function renderSkills() {
  const sel = $('#skills-sel');
  sel.innerHTML = cv.habilidades
    .map((h, i) => `<button type="button" class="chip chip-sel" data-del="${i}" title="Quitar">${esc(h)}</button>`)
    .join('');
  $$('[data-del]', sel).forEach((b) =>
    b.addEventListener('click', () => {
      cv.habilidades.splice(Number(b.dataset.del), 1);
      renderSkills();
      changed();
    }),
  );
  const o = oficio();
  const sugg = $('#skills-sugg');
  const have = new Set(cv.habilidades.map((h) => tr(h, 'es').toLowerCase()));
  const options = o ? o.habilidades.filter((h) => !have.has(h.toLowerCase())).map((h) => tr(h, cv.lang)) : [];
  sugg.innerHTML = options.length
    ? `<div class="sugg-title">Sugerencias</div><div class="chips">${options
        .map((h) => `<button type="button" class="chip" data-add="${esc(h)}">+ ${esc(h)}</button>`)
        .join('')}</div>`
    : '';
  $$('[data-add]', sugg).forEach((b) => b.addEventListener('click', () => addSkill(b.dataset.add)));
}

function addSkill(raw) {
  const h = raw.trim();
  if (!h || cv.habilidades.some((x) => x.toLowerCase() === h.toLowerCase())) return;
  cv.habilidades.push(h);
  renderSkills();
  changed();
}

/* ---------- Foto ---------- */
function renderPhoto() {
  const ph = $('#photo-preview');
  ph.style.backgroundImage = cv.foto ? `url("${cv.foto}")` : '';
  ph.textContent = cv.foto ? '' : '👤';
  $('#photo-remove').hidden = !cv.foto;
}

function readPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    // Recorte cuadrado centrado y reducido para que quepa en el almacenamiento local.
    const size = 360;
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    cv.foto = c.toDataURL('image/jpeg', 0.85);
    URL.revokeObjectURL(url);
    renderPhoto();
    changed();
  };
  img.src = url;
}

/* ---------- Plantillas y color ---------- */
function renderDesign() {
  const sample = { ...cv, nombre: cv.nombre || 'Tu nombre', puesto: cv.puesto || 'Puesto' };
  $('#tpl-pick').innerHTML = TEMPLATES.map(
    (t) => `<button type="button" class="tpl-opt ${t.pro ? 'locked' : ''}" data-tpl="${t.id}" aria-pressed="${cv.template === t.id}">
      <div class="mini">${t.pro ? '' : renderCV({ ...sample, template: t.id })}</div>${t.name}</button>`,
  ).join('');
  $$('[data-tpl]').forEach((b) =>
    b.addEventListener('click', () => {
      const t = TEMPLATES.find((x) => x.id === b.dataset.tpl);
      if (t.pro) return $('#dlg-pro').showModal();
      cv.template = t.id;
      renderDesign();
      changed();
    }),
  );
  $('#lang-pick').innerHTML = LANGS.map(
    (l) => `<button type="button" class="chip lang-opt" data-lang="${l.id}" aria-pressed="${(cv.lang || 'es') === l.id}">${l.flag} ${l.name}</button>`,
  ).join('');
  $$('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => {
      cv.lang = b.dataset.lang;
      renderOficio();
      renderList('experiencia');
      renderSkills();
      renderDesign();
      changed();
    }),
  );
  $('#swatches').innerHTML = ACCENTS.map(
    (c) => `<button type="button" class="swatch" style="background:${c}" data-accent="${c}" aria-pressed="${cv.accent === c}" aria-label="Color ${c}"></button>`,
  ).join('');
  $$('[data-accent]').forEach((b) =>
    b.addEventListener('click', () => {
      cv.accent = b.dataset.accent;
      renderDesign();
      changed();
    }),
  );
}

function renderForm() {
  syncSimpleFields();
  renderOficio();
  Object.keys(LISTS).forEach(renderList);
  renderSkills();
  renderPhoto();
  renderDesign();
}

/* ---------- Descargar PDF ---------- */
function printCV() {
  $('#print-root').innerHTML = renderCV(cv);
  const title = document.title;
  document.title = `CV ${cv.nombre || ''}`.trim();
  window.print();
  document.title = title;
}

function download() {
  if (!cv.nombre.trim()) {
    alert('Escribe al menos tu nombre antes de descargar.');
    return;
  }
  if (storage.get(PRINT_TIP_KEY)) return printCV();
  $('#dlg-print').showModal();
}

/* ---------- Enviar (WhatsApp, email…) ---------- */
async function share(button, html, name, text) {
  const buttons = $$('.js-share');
  const labels = buttons.map((b) => b.textContent);
  buttons.forEach((b) => {
    b.classList.add('busy');
    b.textContent = '⏳ Preparando…';
  });
  try {
    const blob = await htmlToPdf(html);
    const result = await shareOrDownload(blob, name, text);
    if (result === 'downloaded') $('#dlg-shared').showModal();
  } catch {
    alert('No hemos podido preparar el PDF. Prueba con "Descargar PDF".');
  } finally {
    buttons.forEach((b, i) => {
      b.classList.remove('busy');
      b.textContent = labels[i];
    });
  }
}

/* ---------- Importar un currículum antiguo ---------- */
let imported = null;

async function importFile(file) {
  if (!file) return;
  const card = $('.import-card');
  const label = $('label', card);
  const prev = label.firstChild.textContent;
  card.classList.add('busy');
  label.firstChild.textContent = 'Leyendo…';
  try {
    const lines = await extractLines(file);
    const data = parseCV(lines);
    const any = data.nombre || data.email || data.telefono || data.experiencia.length || data.perfil;
    if (!any) {
      alert(
        file.name.toLowerCase().endsWith('.pdf')
          ? 'No hemos podido leer texto en este PDF. Puede que sea una foto escaneada. Prueba con el archivo de Word o escribe tus datos.'
          : 'No hemos encontrado datos en este archivo. Prueba con otro formato o escribe tus datos.',
      );
      return;
    }
    imported = data;
    showImportSummary(data);
  } catch (err) {
    alert(
      err.message === 'doc'
        ? 'Los archivos .doc antiguos no se pueden leer. Ábrelo en Word y guárdalo como .docx o PDF.'
        : 'No hemos podido leer este archivo. Usa un PDF, un Word (.docx) o un texto (.txt).',
    );
  } finally {
    card.classList.remove('busy');
    label.firstChild.textContent = prev;
    $('#import-input').value = '';
  }
}

function showImportSummary(d) {
  const row = (label, value) =>
    `<li class="${value ? '' : 'miss'}"><b>${label}</b>${value ? esc(value) : 'No encontrado'}</li>`;
  const list = (items) => items.filter(Boolean).join(' · ');
  const dates = (x) => [x.inicio, x.actual ? 'Actualidad' : x.fin].filter(Boolean).join(' – ');
  // Una línea por entrada, para que se vea si algo se ha juntado.
  const entries = (label, items) =>
    `<li class="${items.length ? '' : 'miss'}"><b>${label}</b>${
      items.length
        ? `<ol class="import-entries">${items
            .map(([parts, when]) => `<li>${esc(parts.filter(Boolean).join(' · '))}${when ? ` <small>${esc(when)}</small>` : ''}</li>`)
            .join('')}</ol>`
        : 'No encontrado'
    }</li>`;
  $('#import-summary').innerHTML = `<ul class="import-sum">
    ${row('Nombre', d.nombre)}
    ${row('Puesto', d.puesto)}
    ${row('Contacto', list([d.telefono, d.email, d.ciudad, d.web]))}
    ${row('Perfil', d.perfil && (d.perfil.length > 140 ? `${d.perfil.slice(0, 140)}…` : d.perfil))}
    ${entries(`Experiencia (${d.experiencia.length})`, d.experiencia.map((e) => [[e.puesto, e.empresa, e.lugar], dates(e)]))}
    ${entries(`Formación (${d.formacion.length})`, d.formacion.map((f) => [[f.titulo, f.centro], dates(f)]))}
    ${row(`Habilidades (${d.habilidades.length})`, list(d.habilidades))}
    ${row('Idiomas', list(d.idiomas.map((i) => [i.idioma, i.nivel].filter(Boolean).join(' '))))}
  </ul>`;
  $('#dlg-import').showModal();
}

function applyImport() {
  if (!imported) return;
  const { _secciones, ...data } = imported;
  cv = { ...emptyCV(), template: cv.template, accent: cv.accent, lang: cv.lang, oficio: cv.oficio, foto: cv.foto, ...data };
  imported = null;
  $('#dlg-import').close();
  renderForm();
  $$('.ed-block').forEach((b) => (b.open = true));
  changed();
}

/* ---------- Arranque ---------- */
function applyExample(slug) {
  const o = OFICIOS.find((x) => x.slug === slug);
  if (!o) return;
  cv = { ...emptyCV(), template: cv.template, accent: cv.accent, oficio: o.slug, ...ejemploCV(o) };
  renderForm();
  changed();
}

function init() {
  // Al imprimir se oculta todo lo que cuelga de <body> salvo #print-root.
  document.body.appendChild($('#print-root'));

  $('#oficio').innerHTML =
    '<option value="">— Elige tu oficio (opcional) —</option>' +
    SECTORES.map(
      (sec) =>
        `<optgroup label="${esc(sec.nombre)}">${OFICIOS.filter((o) => o.sector === sec.id)
          .map((o) => `<option value="${o.slug}">${esc(o.nombre)}</option>`)
          .join('')}</optgroup>`,
    ).join('') +
    '<option value="">Otro</option>';
  $('#oficio').addEventListener('change', (e) => {
    cv.oficio = e.target.value;
    renderOficio();
    renderList('experiencia');
    renderSkills();
    changed();
  });

  bindSimpleFields();

  for (const [key, def] of Object.entries(LISTS)) {
    $(`[data-add-to="${key}"]`).addEventListener('click', () => {
      cv[key].push(def.blank());
      renderList(key);
      const items = $$(`${def.el} .item`);
      items.at(-1)?.querySelector('input')?.focus();
      changed();
    });
  }

  $('#skill-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(e.target.value);
      e.target.value = '';
    }
  });
  $('#skill-add').addEventListener('click', () => {
    addSkill($('#skill-input').value);
    $('#skill-input').value = '';
  });

  $('#photo-input').addEventListener('change', (e) => readPhoto(e.target.files[0]));
  $('#photo-remove').addEventListener('click', () => {
    cv.foto = '';
    $('#photo-input').value = '';
    renderPhoto();
    changed();
  });

  $$('.js-review').forEach((b) => b.addEventListener('click', openReview));
  $('#cv-switch').addEventListener('click', () => {
    save();
    renderCvList();
    $('#dlg-cvs').showModal();
  });
  $('#cvs-new').addEventListener('click', newCV);
  $('#import-input').addEventListener('change', (e) => importFile(e.target.files[0]));
  $('#dlg-import-ok').addEventListener('click', applyImport);

  $$('.js-download').forEach((b) => b.addEventListener('click', download));
  $$('.js-share').forEach((b) =>
    b.addEventListener('click', () => {
      if (!cv.nombre.trim()) return alert('Escribe al menos tu nombre antes de enviarlo.');
      share(b, renderCV(cv), fileName('CV', cv.nombre), 'Te envío mi currículum.');
    }),
  );
  $('#dlg-print-ok').addEventListener('click', () => {
    storage.set(PRINT_TIP_KEY, '1');
    $('#dlg-print').close();
    setTimeout(printCV, 50);
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('¿Vaciar este currículum y empezar de cero? Los demás currículums guardados no se tocan.')) return;
    cv = blankCV();
    renderForm();
    changed();
  });

  $('#btn-example').addEventListener('click', () => {
    if (!cv.oficio) {
      alert('Primero elige tu oficio en la lista de arriba.');
      $('#oficio').focus();
      return;
    }
    if (!isEmpty() && !confirm('Se sustituirá lo que has escrito por el ejemplo. ¿Continuar?')) return;
    applyExample(cv.oficio);
  });

  const editor = $('.editor');
  const setTab = (preview) => {
    editor.classList.toggle('show-preview', preview);
    $('#tab-edit').setAttribute('aria-pressed', String(!preview));
    $('#tab-preview').setAttribute('aria-pressed', String(preview));
    window.scrollTo(0, 0);
    if (preview) renderPreview();
  };
  $('#tab-edit').addEventListener('click', () => setTab(false));
  $('#tab-preview').addEventListener('click', () => setTab(true));

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(renderPreview, 120);
  });

  // ?oficio=camarero llega desde las páginas de ejemplo.
  const params = new URLSearchParams(location.search);
  const pedido = params.get('oficio');
  if (pedido && OFICIOS.some((o) => o.slug === pedido)) {
    if (isEmpty()) {
      applyExample(pedido);
    } else if (pedido !== cv.oficio) {
      cv.oficio = pedido;
      $('#dlg-example').showModal();
      $('#dlg-example-ok').addEventListener('click', () => {
        $('#dlg-example').close();
        applyExample(pedido);
      });
    }
    history.replaceState(null, '', location.pathname);
  }

  renderForm();
  updateProgress();
  updateLangNote();
  updateReviewBadge();
  renderSwitcher();
  renderPreview();
}

init();
