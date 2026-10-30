import { emptyCV } from './cv-render.js';
import { OFICIOS } from '../data/oficios.js';
import { LANGS } from './i18n.js';
import { FUENTES, emptyLetter, generateLetter, renderLetter } from './letter.js';
import { htmlToPdf, shareOrDownload, fileName } from './share.js';

// La carta usa los datos del currículum guardado en este dispositivo.
const CV_KEY = 'cvlisto:cv:v1';
const LETTER_KEY = 'cvlisto:carta:v1';
const PRINT_TIP_KEY = 'cvlisto:print-tip-seen';
const A4_W = 793.7;
const A4_H = 1122.5;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const storage = {
  get(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); return true; } catch { return false; }
  },
};

function read(key, empty) {
  try {
    const raw = storage.get(key);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch { /* datos corruptos */ }
  return empty;
}

let cv = read(CV_KEY, { ...emptyCV(), oficio: '' });
let letter = read(LETTER_KEY, emptyLetter());
const oficio = () => OFICIOS.find((o) => o.slug === cv.oficio);

function regenerate() {
  letter.texto = generateLetter(cv, letter, oficio());
  letter.editado = false;
  $('#l-texto').value = letter.texto;
}

let saveTimer;
function changed() {
  renderPreview();
  $('#regen-hint').hidden = !letter.editado;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

function save() {
  clearTimeout(saveTimer);
  storage.set(LETTER_KEY, JSON.stringify(letter));
  // El idioma se comparte con el currículum.
  storage.set(CV_KEY, JSON.stringify(cv));
  $('#saved').textContent = 'Guardado en este dispositivo ✓';
}
addEventListener('pagehide', save);

function renderPreview() {
  const wrap = $('#sheet');
  if (!wrap || wrap.offsetParent === null) return;
  wrap.innerHTML = renderLetter(cv, letter, letter.texto);
  const sheet = wrap.firstElementChild;
  const scale = Math.min(1, wrap.clientWidth / A4_W);
  sheet.style.transform = `scale(${scale})`;
  wrap.style.height = `${Math.max(sheet.offsetHeight, A4_H) * scale}px`;
  const pages = Math.ceil((sheet.offsetHeight - 2) / A4_H);
  $('#pages-info').textContent = pages > 1 ? 'Ocupa más de una página: acórtala un poco.' : 'Cabe en 1 página ✓';
}

function renderLangs() {
  $('#lang-pick').innerHTML = LANGS.map(
    (l) => `<button type="button" class="chip lang-opt" data-lang="${l.id}" aria-pressed="${(cv.lang || 'es') === l.id}">${l.flag} ${l.name}</button>`,
  ).join('');
  $$('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => {
      if (letter.editado && !confirm('Has cambiado el texto a mano. Al cambiar de idioma se escribirá de nuevo. ¿Continuar?')) return;
      cv.lang = b.dataset.lang;
      renderLangs();
      regenerate();
      changed();
    }),
  );
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

function printLetter() {
  $('#print-root').innerHTML = renderLetter(cv, letter, letter.texto);
  const name = `Carta ${cv.nombre || ''}`.trim();
  if (window.AndroidPrint) {
    window.AndroidPrint.print(name);
    return;
  }
  const title = document.title;
  document.title = name;
  window.print();
  document.title = title;
}

function init() {
  document.body.appendChild($('#print-root'));

  // Sin currículum no hay de dónde sacar los datos.
  const hasCV = cv.nombre.trim() || cv.experiencia.length;
  $('#cv-missing').hidden = Boolean(hasCV);
  $('#cv-ok').hidden = !hasCV;
  if (hasCV) $('#cv-name').textContent = cv.nombre || 'Tu currículum';

  $('#l-fuente').innerHTML = FUENTES.map((f) => `<option value="${f.id}">${f.label}</option>`).join('');
  $$('[data-l]').forEach((el) => {
    el.value = letter[el.dataset.l] ?? '';
    const ev = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      letter[el.dataset.l] = el.value;
      $('#portal-field').hidden = letter.fuente !== 'portal';
      if (!letter.editado) regenerate();
      changed();
    });
  });
  $('#portal-field').hidden = letter.fuente !== 'portal';
  if (!$('#l-puesto').value) $('#l-puesto').placeholder = cv.puesto || oficio()?.nombre || 'Ej.: Camarero/a';

  $('#l-texto').addEventListener('input', (e) => {
    letter.texto = e.target.value;
    letter.editado = true;
    changed();
  });
  $('#btn-variant').addEventListener('click', () => {
    if (letter.editado && !confirm('Se sustituirá el texto que has cambiado a mano. ¿Continuar?')) return;
    letter.variante = (Number(letter.variante) || 0) + 1;
    regenerate();
    changed();
  });
  $('#btn-regen').addEventListener('click', () => {
    regenerate();
    changed();
  });

  renderLangs();
  if (!letter.texto) regenerate();
  else $('#l-texto').value = letter.texto;

  const download = () => {
    if (!cv.nombre.trim()) {
      alert('Primero escribe tu nombre en tu currículum.');
      return;
    }
    if (storage.get(PRINT_TIP_KEY)) return printLetter();
    $('#dlg-print').showModal();
  };
  $$('.js-download').forEach((b) => b.addEventListener('click', download));
  $$('.js-share').forEach((b) =>
    b.addEventListener('click', () => {
      if (!cv.nombre.trim()) return alert('Primero escribe tu nombre en tu currículum.');
      share(b, renderLetter(cv, letter, letter.texto), fileName('Carta', cv.nombre), 'Te envío mi carta de presentación.');
    }),
  );
  $('#dlg-print-ok').addEventListener('click', () => {
    storage.set(PRINT_TIP_KEY, '1');
    $('#dlg-print').close();
    setTimeout(printLetter, 50);
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

  changed();
}

init();
