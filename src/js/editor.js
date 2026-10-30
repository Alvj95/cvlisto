import { renderCV, emptyCV, TEMPLATES, ACCENTS } from './cv-render.js';
import { OFICIOS, ejemploCV } from './data/oficios.js';

// Todo se guarda en el navegador del usuario: el currículum nunca sale de su dispositivo.
const STORE_KEY = 'cvlisto:cv:v1';
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

function load() {
  try {
    const raw = storage.get(STORE_KEY);
    if (raw) return { ...emptyCV(), oficio: '', ...JSON.parse(raw) };
  } catch { /* datos corruptos: empezamos de cero */ }
  return { ...emptyCV(), oficio: '' };
}

let cv = load();
const isEmpty = () => !cv.nombre && !cv.perfil && cv.experiencia.length === 0;
const oficio = () => OFICIOS.find((o) => o.slug === cv.oficio);

/* ---------- Guardado y vista previa ---------- */
let saveTimer;
function changed({ rerenderForm = false } = {}) {
  if (rerenderForm) renderForm();
  updateProgress();
  renderPreview();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const ok = storage.set(STORE_KEY, JSON.stringify(cv));
    const el = $('#saved');
    if (el) el.textContent = ok ? 'Guardado en este dispositivo ✓' : '';
  }, 400);
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
      o.perfiles.map((p, i) => `<button type="button" data-perfil="${i}">${esc(p)}</button>`).join('')
    : '';
  $$('[data-perfil]', box).forEach((b) =>
    b.addEventListener('click', () => {
      cv.perfil = o.perfiles[Number(b.dataset.perfil)];
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
  const used = new Set(String(x.tareas).split('\n').map((t) => t.trim()));
  return `<div class="sugg-title">Toca para añadir</div><div class="chips">${o.tareas
    .map((t) => `<button type="button" class="chip ${used.has(t) ? 'used' : ''}" data-tarea="${esc(t)}">+ ${esc(t)}</button>`)
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
        if (list.map((l) => l.trim()).includes(t)) return;
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
  const have = new Set(cv.habilidades.map((h) => h.toLowerCase()));
  const options = o ? o.habilidades.filter((h) => !have.has(h.toLowerCase())) : [];
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
    OFICIOS.map((o) => `<option value="${o.slug}">${esc(o.nombre)}</option>`).join('') +
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

  $$('.js-download').forEach((b) => b.addEventListener('click', download));
  $('#dlg-print-ok').addEventListener('click', () => {
    storage.set(PRINT_TIP_KEY, '1');
    $('#dlg-print').close();
    setTimeout(printCV, 50);
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('¿Borrar todo el currículum y empezar de cero? No se puede deshacer.')) return;
    storage.del(STORE_KEY);
    cv = { ...emptyCV(), oficio: '' };
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
  renderPreview();
}

init();
