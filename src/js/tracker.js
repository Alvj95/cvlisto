// Seguimiento de candidaturas: a qué empresas has enviado el CV y cómo va cada
// proceso. Sin Pro se pueden guardar hasta 3; con Pro, sin límite.
import { isPro } from './pro.js';

const KEY = 'cvlisto:candidaturas:v1';
const FREE_LIMIT = 3;
const STATES = [
  { id: 'enviada', label: 'Enviada', icon: '📤' },
  { id: 'entrevista', label: 'Entrevista', icon: '🎤' },
  { id: 'oferta', label: 'Oferta', icon: '🎉' },
  { id: 'descartada', label: 'Descartada', icon: '✖️' },
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Fechas en hora local (toISOString usa UTC y puede dar el día anterior).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ageDays = (date) => Math.floor((new Date(`${today()}T00:00`) - new Date(`${date}T00:00`)) / 864e5);

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}
function store() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

let items = load();
let filter = 'todas';
let editing = null;
const pro = isPro();

function daysAgo(date) {
  const d = ageDays(date);
  return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
}

function renderStats() {
  const n = (st) => items.filter((x) => x.estado === st).length;
  const answered = items.filter((x) => x.estado !== 'enviada').length;
  const rate = items.length ? Math.round((answered / items.length) * 100) : 0;
  $('#tr-stats').innerHTML = `
    <div><strong>${items.length}</strong><span>Enviadas</span></div>
    <div><strong>${n('entrevista')}</strong><span>Entrevistas</span></div>
    <div><strong>${n('oferta')}</strong><span>Ofertas</span></div>
    <div><strong>${rate}%</strong><span>Con respuesta</span></div>`;
}

function renderFilters() {
  const tabs = [{ id: 'todas', label: 'Todas', icon: '' }, ...STATES];
  $('#tr-filters').innerHTML = tabs
    .map((t) => {
      const count = t.id === 'todas' ? items.length : items.filter((x) => x.estado === t.id).length;
      return `<button type="button" class="chip" data-filter="${t.id}" aria-pressed="${filter === t.id}">${t.icon} ${t.label} · ${count}</button>`;
    })
    .join('');
  $$('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      render();
    }),
  );
}

function renderList() {
  const list = items.filter((x) => filter === 'todas' || x.estado === filter).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  if (!list.length) {
    $('#tr-list').innerHTML = `<div class="tr-empty"><span>📋</span><p>${
      items.length ? 'No hay candidaturas en este estado.' : 'Aún no has apuntado ninguna candidatura. Añade la primera cuando envíes tu CV.'
    }</p></div>`;
    return;
  }
  $('#tr-list').innerHTML = list
    .map((x) => {
      const old = x.estado === 'enviada' && x.fecha && ageDays(x.fecha) >= 10;
      return `<article class="tr-item st-${x.estado}">
        <div class="tr-main">
          <h3>${esc(x.empresa)}</h3>
          <p>${esc(x.puesto || 'Puesto sin indicar')} · <span class="muted-s">${x.fecha ? daysAgo(x.fecha) : ''}</span></p>
          ${x.notas ? `<p class="tr-notes">${esc(x.notas)}</p>` : ''}
          ${x.enlace ? `<a class="tr-link" href="${esc(x.enlace)}" target="_blank" rel="noopener nofollow">Ver oferta ↗</a>` : ''}
          ${old ? '<p class="tr-tip">💡 Han pasado más de 10 días. Es buen momento para llamar o escribir y preguntar cómo va el proceso.</p>' : ''}
        </div>
        <div class="tr-side">
          <select data-state="${x.id}" aria-label="Estado">${STATES.map((s) => `<option value="${s.id}"${s.id === x.estado ? ' selected' : ''}>${s.icon} ${s.label}</option>`).join('')}</select>
          <span class="tr-actions"><button type="button" class="btn-link" data-edit="${x.id}">Editar</button> <button type="button" class="btn-link tr-del" data-del="${x.id}">Borrar</button></span>
        </div>
      </article>`;
    })
    .join('');
  $$('[data-state]').forEach((s) =>
    s.addEventListener('change', () => {
      items.find((x) => x.id === s.dataset.state).estado = s.value;
      store();
      render();
    }),
  );
  $$('[data-edit]').forEach((b) => b.addEventListener('click', () => openForm(items.find((x) => x.id === b.dataset.edit))));
  $$('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!confirm('¿Borrar esta candidatura?')) return;
      items = items.filter((x) => x.id !== b.dataset.del);
      store();
      render();
    }),
  );
}

function render() {
  renderStats();
  renderFilters();
  renderList();
  $('#tr-limit').hidden = pro || items.length < FREE_LIMIT;
}

function openForm(item = null) {
  if (!item && !pro && items.length >= FREE_LIMIT) {
    $('#dlg-pro-title').textContent = 'Candidaturas ilimitadas con Pro';
    $('#dlg-pro-text').textContent = `Sin Pro puedes seguir ${FREE_LIMIT} candidaturas. Con Pro, todas las que quieras.`;
    $$('#dlg-pro .js-free-tpl').forEach((b) => (b.hidden = true));
    $('#dlg-pro').showModal();
    return;
  }
  editing = item;
  const f = $('#tr-form');
  f.reset();
  $('#tr-dlg-title').textContent = item ? 'Editar candidatura' : 'Nueva candidatura';
  f.elements.estado.innerHTML = STATES.map((s) => `<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');
  const data = item || { fecha: today(), estado: 'enviada' };
  ['empresa', 'puesto', 'fecha', 'estado', 'enlace', 'contacto', 'notas'].forEach((k) => (f.elements[k].value = data[k] || ''));
  $('#dlg-tr').showModal();
  setTimeout(() => f.elements.empresa.focus(), 50);
}

function saveForm(e) {
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(['empresa', 'puesto', 'fecha', 'estado', 'enlace', 'contacto', 'notas'].map((k) => [k, f.elements[k].value.trim()]));
  if (!data.empresa) return;
  if (data.enlace && !/^https?:\/\//i.test(data.enlace)) data.enlace = `https://${data.enlace}`;
  if (editing) Object.assign(editing, data);
  else items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data });
  store();
  $('#dlg-tr').close();
  render();
}

$('#tr-add').addEventListener('click', () => openForm());
$('#tr-form').addEventListener('submit', saveForm);
$('#tr-cancel').addEventListener('click', () => $('#dlg-tr').close());
render();
