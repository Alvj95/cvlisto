// Simulador de entrevista (Pro). Las 3 primeras preguntas generales son gratis;
// el resto muestra la pregunta pero bloquea el consejo y la respuesta modelo.
import { GENERALES, POR_SECTOR } from '../data/entrevista.js';
import { SECTORES, OFICIOS } from '../data/oficios.js';
import { isPro } from './pro.js';

const FREE = 3;
const NOTES_KEY = 'cvlisto:entrevista:v1';
const $ = (s, el = document) => el.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const storage = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

const cv = storage.get('cvlisto:cv:v1', {});
const notes = storage.get(NOTES_KEY, {});
const pro = isPro();

const groups = [{ id: 'generales', nombre: 'Generales', preguntas: GENERALES }, ...SECTORES.map((s) => ({ id: s.id, nombre: s.nombre, preguntas: POR_SECTOR[s.id] || [] }))];
const cvSector = OFICIOS.find((o) => o.slug === cv.oficio)?.sector;

let group = groups[0];
let i = 0;

// "Háblame de ti" con los datos del propio currículum.
function personal(qIndex) {
  if (group.id !== 'generales' || qIndex !== 0 || !cv.perfil) return '';
  const intro = cv.nombre ? `Me llamo ${cv.nombre.split(' ')[0]}. ` : '';
  return `<div class="iv-mine"><strong>✨ Tu versión, a partir de tu currículum</strong><p>${esc(intro + cv.perfil)}</p></div>`;
}

const locked = (gid, idx) => !pro && !(gid === 'generales' && idx < FREE);

function render() {
  $('#iv-groups').innerHTML = groups
    .map((g) => `<button type="button" class="chip" data-g="${g.id}" aria-pressed="${g === group}">${g.id === cvSector ? '⭐ ' : ''}${esc(g.nombre)}</button>`)
    .join('');
  $('#iv-groups')
    .querySelectorAll('[data-g]')
    .forEach((b) =>
      b.addEventListener('click', () => {
        group = groups.find((g) => g.id === b.dataset.g);
        i = 0;
        render();
      }),
    );

  const qs = group.preguntas;
  const q = qs[i];
  const id = `${group.id}-${i}`;
  const lock = locked(group.id, i);
  $('#iv-card').innerHTML = `
    <div class="iv-top"><span class="iv-count">Pregunta ${i + 1} de ${qs.length}</span>
      <button type="button" class="btn-link" id="iv-say">🔊 Escuchar</button></div>
    <h2 class="iv-q">${esc(q.q)}</h2>
    <label class="iv-lbl" for="iv-note">Tu respuesta (escríbela o dila en voz alta)</label>
    <textarea id="iv-note" rows="4" placeholder="Practica aquí tu respuesta…">${esc(notes[id] || '')}</textarea>
    <div class="iv-reveal ${lock ? 'is-locked' : ''}">
      <button type="button" class="btn btn-ghost" id="iv-show"${lock ? ' hidden' : ''}>💡 Ver consejo y respuesta modelo</button>
      <div class="iv-answer" id="iv-answer" ${lock ? '' : 'hidden'}>
        <p><strong>🎯 Qué buscan:</strong> ${esc(q.busca)}</p>
        <p><strong>💡 Consejo:</strong> ${esc(q.consejo)}</p>
        <div class="iv-model"><strong>Respuesta modelo</strong><p>${esc(q.r)}</p></div>
        ${personal(i)}
      </div>
      ${
        lock
          ? `<div class="iv-unlock"><span class="crown-big">👑</span><strong>Respuestas modelo con Pro</strong><p>Desbloquea los consejos y respuestas de las ${GENERALES.length + Object.values(POR_SECTOR).flat().length} preguntas, por sector.</p><a class="btn" href="${$('#iv-pro-link').href}">Ver Pro</a></div>`
          : ''
      }
    </div>
    <div class="iv-nav">
      <button type="button" class="btn btn-ghost" id="iv-prev"${i === 0 ? ' disabled' : ''}>← Anterior</button>
      <button type="button" class="btn" id="iv-next">${i === qs.length - 1 ? 'Volver a empezar' : 'Siguiente →'}</button>
    </div>`;

  $('#iv-show')?.addEventListener('click', (e) => {
    $('#iv-answer').hidden = false;
    e.currentTarget.hidden = true;
  });
  $('#iv-note').addEventListener('input', (e) => {
    notes[id] = e.target.value;
    storage.set(NOTES_KEY, notes);
  });
  $('#iv-prev').addEventListener('click', () => {
    i = Math.max(0, i - 1);
    render();
  });
  $('#iv-next').addEventListener('click', () => {
    i = i === qs.length - 1 ? 0 : i + 1;
    render();
    $('#iv-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const say = $('#iv-say');
  if (!('speechSynthesis' in window)) say.hidden = true;
  else
    say.addEventListener('click', () => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(q.q);
      u.lang = 'es-ES';
      speechSynthesis.speak(u);
    });
}

if (cvSector) group = groups.find((g) => g.id === cvSector) || group;
// Sin Pro se empieza por las preguntas generales, que tienen respuestas gratis.
if (!pro) group = groups[0];
render();
