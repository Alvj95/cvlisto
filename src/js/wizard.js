import { emptyCV } from './cv-render.js';
import { OFICIOS, SECTORES } from '../data/oficios.js';

// Asistente "primer empleo": preguntas sencillas que montan un currículum completo
// para quien nunca ha trabajado. El resultado se guarda como un CV nuevo en la lista.
const CV_KEY = 'cvlisto:cv:v1';
const LIST_KEY = 'cvlisto:cvs:v1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const ESTUDIOS = [
  { id: 'sin', label: 'Sin estudios terminados', titulo: '' },
  { id: 'eso', label: 'ESO / Graduado escolar', titulo: 'Educación Secundaria Obligatoria (ESO)' },
  { id: 'bach', label: 'Bachillerato', titulo: 'Bachillerato' },
  { id: 'fpb', label: 'FP Básica', titulo: 'Formación Profesional Básica' },
  { id: 'fpm', label: 'FP Grado Medio', titulo: 'Técnico de Formación Profesional (Grado Medio)' },
  { id: 'fps', label: 'FP Grado Superior', titulo: 'Técnico Superior de Formación Profesional' },
  { id: 'uni', label: 'Universidad', titulo: 'Grado universitario' },
  { id: 'ext', label: 'Estudios en otro país', titulo: 'Estudios realizados en el extranjero' },
];

// Experiencia informal: cuenta como experiencia y se describe con tareas reales.
const VIVENCIAS = [
  { id: 'practicas', label: '🎓 Prácticas', puesto: 'Prácticas', frase: 'prácticas en empresa', tareas: ['Apoyo al equipo en las tareas diarias', 'Aprendizaje de los procedimientos de la empresa', 'Atención a clientes y usuarios'] },
  { id: 'voluntariado', label: '🤲 Voluntariado', puesto: 'Voluntariado', frase: 'voluntariado', tareas: ['Organización y apoyo en actividades', 'Atención a personas usuarias', 'Trabajo en equipo con otros voluntarios'] },
  { id: 'familiar', label: '🏪 Ayudar en un negocio familiar', puesto: 'Ayudante en negocio familiar', frase: 'atención al público en un negocio familiar', tareas: ['Atención al cliente y cobro', 'Reposición y orden del local', 'Apoyo en las tareas del día a día'] },
  { id: 'cuidado', label: '🧸 Cuidar niños o mayores', puesto: 'Cuidado de niños y personas mayores', frase: 'cuidado de niños y personas mayores', tareas: ['Cuidado y acompañamiento', 'Preparación de comidas', 'Ayuda con las tareas del hogar'] },
  { id: 'temporada', label: '☀️ Trabajo de verano o temporada', puesto: 'Trabajo de temporada', frase: 'trabajos de temporada', tareas: ['Atención al público', 'Trabajo en equipo en temporada alta', 'Cumplimiento de horarios y turnos'] },
  { id: 'clases', label: '📚 Dar clases particulares', puesto: 'Clases particulares', frase: 'clases particulares', tareas: ['Apoyo escolar a alumnos de primaria y ESO', 'Preparación de ejercicios y exámenes', 'Seguimiento del progreso con las familias'] },
  { id: 'eventos', label: '🎪 Ayudar en eventos o fiestas', puesto: 'Auxiliar de eventos', frase: 'organización de eventos', tareas: ['Montaje y desmontaje de espacios', 'Atención e información a asistentes', 'Apoyo en barra y servicio'] },
];

const CURSOS = [
  { id: 'carnet', label: '🚗 Carnet de conducir B', otros: 'Carnet de conducir B' },
  { id: 'vehiculo', label: '🛵 Vehículo propio', otros: 'Vehículo propio' },
  { id: 'manipulador', label: '🍽️ Manipulador de alimentos', curso: 'Curso de manipulador de alimentos', otros: 'Carnet de manipulador de alimentos' },
  { id: 'auxilios', label: '🩹 Primeros auxilios', curso: 'Curso de primeros auxilios' },
  { id: 'prl', label: '🦺 Prevención de riesgos (PRL)', curso: 'Curso de Prevención de Riesgos Laborales (20 h)' },
  { id: 'carretilla', label: '📦 Carretillero', curso: 'Curso de carretillero', otros: 'Carnet de carretillero' },
  { id: 'office', label: '💻 Informática (Word, Excel)', curso: 'Curso de informática (Office)', skill: 'Office (Word, Excel)' },
];

const CUALIDADES = [
  ['Responsable', 'responsable'], ['Puntual', 'puntual'], ['Trabajo en equipo', 'con facilidad para trabajar en equipo'],
  ['Aprendo rápido', 'que aprende rápido'], ['Amable', 'amable'], ['Organizado/a', 'organizada'], ['Paciente', 'paciente'],
  ['Resistencia física', 'con buena condición física'], ['Creativo/a', 'creativa'], ['Buena comunicación', 'comunicativa'],
];
const HABILIDAD = {
  Responsable: 'Responsabilidad', Puntual: 'Puntualidad', 'Trabajo en equipo': 'Trabajo en equipo', 'Aprendo rápido': 'Capacidad de aprendizaje',
  Amable: 'Amabilidad', 'Organizado/a': 'Organización', Paciente: 'Paciencia', 'Resistencia física': 'Resistencia física',
  'Creativo/a': 'Creatividad', 'Buena comunicación': 'Comunicación',
};

const DISPO = [
  ['Inmediata', 'Disponibilidad inmediata', 'inmediata'], ['Mañanas', 'Disponibilidad de mañanas', 'de mañanas'],
  ['Tardes', 'Disponibilidad de tardes', 'de tardes'], ['Fines de semana', 'Disponibilidad para fines de semana', 'para fines de semana'],
  ['Turnos rotativos', 'Disponibilidad para turnos rotativos', 'para turnos rotativos'], ['Noches', 'Disponibilidad para turnos de noche', 'para turnos de noche'],
];

const NIVELES = ['No lo hablo', 'Básico', 'Intermedio', 'Avanzado'];

const state = {
  nombre: '', telefono: '', email: '', ciudad: '',
  oficio: '', genero: '', estudios: '', estudiosDetalle: '', estudiosFin: '',
  vivencias: {}, cursos: [], ingles: 'No lo hablo', otroIdioma: '', cualidades: [], dispo: [],
};

/* ---------- Pasos ---------- */
const STEPS = [
  {
    title: '¡Hola! ¿Cómo te llamas?',
    sub: 'Empezamos por lo básico. Así podrán llamarte para la entrevista.',
    html: () => `
      <div class="field"><label for="w-nombre">Nombre y apellidos</label><input id="w-nombre" data-w="nombre" autocomplete="name"></div>
      <div class="field"><label for="w-tel">Teléfono</label><input id="w-tel" data-w="telefono" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="w-email">Email</label><input id="w-email" data-w="email" type="email" autocomplete="email" placeholder="nombre.apellido@gmail.com"></div>
      <div class="field"><label for="w-ciudad">Ciudad donde vives</label><input id="w-ciudad" data-w="ciudad" autocomplete="address-level2"></div>`,
    valid: () => (state.nombre.trim() && (state.telefono.trim() || state.email.trim()) ? '' : 'Escribe tu nombre y un teléfono o email.'),
  },
  {
    title: '¿Qué trabajo buscas?',
    sub: 'Elige uno. Si aún no lo sabes, no pasa nada.',
    html: () => `
      <div class="lbl">En tu currículum, escribe el puesto en…</div>
      <div class="w-grid w-grid-2">
        <button type="button" class="w-opt ${state.genero === 'f' ? 'on' : ''}" data-genero="f">👩 Femenino (camarera)</button>
        <button type="button" class="w-opt ${state.genero === 'm' ? 'on' : ''}" data-genero="m">👨 Masculino (camarero)</button>
      </div>
      <div class="lbl" style="margin-top:14px">Trabajo</div>
      <button type="button" class="w-opt w-wide ${state.oficio === '' ? 'on' : ''}" data-oficio="">🤷 Aún no lo sé / cualquier trabajo</button>
      ${SECTORES.map(
        (sec) => `<div class="w-group">${esc(sec.nombre)}</div><div class="w-grid">${OFICIOS.filter((o) => o.sector === sec.id)
          .map((o) => `<button type="button" class="w-opt ${state.oficio === o.slug ? 'on' : ''}" data-oficio="${o.slug}">${o.icono} ${esc(o.nombre)}</button>`)
          .join('')}</div>`,
      ).join('')}`,
  },
  {
    title: '¿Qué has estudiado?',
    sub: 'Pon lo último que hayas terminado o estés estudiando.',
    html: () => `
      <div class="w-grid">${ESTUDIOS.map((e) => `<button type="button" class="w-opt ${state.estudios === e.id ? 'on' : ''}" data-estudios="${e.id}">${esc(e.label)}</button>`).join('')}</div>
      <div class="field" style="margin-top:14px"><label for="w-ed">¿Qué estudiaste y dónde? (opcional)</label><input id="w-ed" data-w="estudiosDetalle" placeholder="Ej.: FP de Cocina en el IES Cervantes"></div>
      <div class="field"><label for="w-edf">¿Qué año terminaste? (opcional)</label><input id="w-edf" data-w="estudiosFin" inputmode="numeric" placeholder="Ej.: 2024 o 'en curso'"></div>`,
    valid: () => (state.estudios ? '' : 'Elige una opción.'),
  },
  {
    title: '¿Has hecho alguna de estas cosas?',
    sub: 'Aunque no fuera un trabajo con contrato, cuenta como experiencia. Marca todas las que quieras.',
    html: () => `${VIVENCIAS.map((v) => {
      const on = state.vivencias[v.id];
      return `<div class="w-viv ${on ? 'on' : ''}"><button type="button" class="w-opt w-wide ${on ? 'on' : ''}" data-viv="${v.id}">${v.label}</button>
        ${on ? `<div class="row2"><div class="field"><label>¿Dónde? (opcional)</label><input data-viv-donde="${v.id}" value="${esc(on.donde)}" placeholder="Ej.: Cruz Roja"></div>
        <div class="field"><label>¿Qué año?</label><input data-viv-anio="${v.id}" value="${esc(on.anio)}" inputmode="numeric" placeholder="2024"></div></div>` : ''}</div>`;
    }).join('')}
    <p class="hint">¿Nada de esto? No pasa nada: destacaremos tu formación y tus ganas.</p>`,
  },
  {
    title: '¿Tienes algún curso o carnet?',
    sub: 'Muchos trabajos los piden. Marca los que tengas.',
    html: () => `<div class="w-grid">${CURSOS.map((c) => `<button type="button" class="w-opt ${state.cursos.includes(c.id) ? 'on' : ''}" data-curso="${c.id}">${c.label}</button>`).join('')}</div>`,
  },
  {
    title: '¿Qué idiomas hablas?',
    sub: 'Sé sincero/a: te lo pueden preguntar en la entrevista.',
    html: () => `
      <div class="lbl">Inglés</div>
      <div class="w-grid">${NIVELES.map((n) => `<button type="button" class="w-opt ${state.ingles === n ? 'on' : ''}" data-ingles="${n}">${n}</button>`).join('')}</div>
      <div class="field" style="margin-top:14px"><label for="w-oi">¿Otro idioma? (opcional)</label><input id="w-oi" data-w="otroIdioma" placeholder="Ej.: Francés básico, Árabe nativo"></div>`,
  },
  {
    title: '¿Cómo eres?',
    sub: 'Elige hasta 5 cosas que te describan bien.',
    html: () => `<div class="w-grid">${CUALIDADES.map(([c]) => `<button type="button" class="w-opt ${state.cualidades.includes(c) ? 'on' : ''}" data-cual="${esc(c)}">${esc(c)}</button>`).join('')}</div>`,
    valid: () => (state.cualidades.length ? '' : 'Elige al menos una.'),
  },
  {
    title: '¿Cuándo puedes trabajar?',
    sub: 'Las empresas lo miran mucho. Marca todo lo que te venga bien.',
    html: () => `<div class="w-grid">${DISPO.map(([d]) => `<button type="button" class="w-opt ${state.dispo.includes(d) ? 'on' : ''}" data-dispo="${esc(d)}">${esc(d)}</button>`).join('')}</div>`,
  },
];

/* ---------- Generación del currículum ---------- */
// "Camarero/a" → "Camarero" o "Camarera"; sin elección se deja tal cual.
function puestoDe(nombre) {
  if (!state.genero || !nombre.includes('/a')) return nombre;
  return nombre.replace(/(\p{L}+)\/a\b/u, (m, w) => {
    if (state.genero === 'm') return w;
    if (/o$/.test(w)) return w.slice(0, -1) + 'a';
    if (/e$/.test(w)) return w.slice(0, -1) + 'a';
    return w + 'a';
  });
}

// Primera letra en minúscula salvo siglas ("FP", "ESO").
const low = (t) => (/^\p{Lu}{2}/u.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
const listOf = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} y ${a.at(-1)}`);

function buildCV() {
  const o = OFICIOS.find((x) => x.slug === state.oficio);
  const est = ESTUDIOS.find((e) => e.id === state.estudios);
  const anioFin = state.estudiosFin.trim();
  const enCurso = /curso|actual/i.test(anioFin);

  const formacion = [];
  if (est && est.id !== 'sin') {
    const [titulo, centro] = state.estudiosDetalle.split(/\s+en\s+(?=(?:el|la)?\s*\p{Lu})/u);
    formacion.push({
      titulo: (state.estudiosDetalle.trim() ? titulo.trim() : '') || est.titulo,
      centro: centro?.trim().replace(/^(el|la)\s+/i, '') || '',
      inicio: '',
      fin: enCurso ? 'En curso' : anioFin,
    });
  }
  CURSOS.filter((c) => state.cursos.includes(c.id) && c.curso).forEach((c) => formacion.push({ titulo: c.curso, centro: '', inicio: '', fin: '' }));

  const experiencia = VIVENCIAS.filter((v) => state.vivencias[v.id]).map((v) => {
    const { donde, anio } = state.vivencias[v.id];
    return { puesto: v.puesto, empresa: donde.trim(), lugar: '', inicio: anio.trim(), fin: '', actual: false, tareas: v.tareas.join('\n') };
  });

  const cualidades = CUALIDADES.filter(([c]) => state.cualidades.includes(c));
  const dispo = DISPO.filter(([d]) => state.dispo.includes(d));

  const habilidades = [
    ...cualidades.map(([c]) => HABILIDAD[c]),
    ...CURSOS.filter((c) => state.cursos.includes(c.id) && c.skill).map((c) => c.skill),
    ...(o ? o.habilidades.slice(0, 3) : ['Atención al cliente']),
  ].filter((h, i, a) => a.indexOf(h) === i);

  const idiomas = [{ idioma: 'Español', nivel: 'Nativo' }];
  if (state.ingles !== 'No lo hablo') idiomas.push({ idioma: 'Inglés', nivel: state.ingles });
  const otro = state.otroIdioma.trim();
  if (otro) {
    const m = otro.match(/^(\S+)\s*(.*)$/);
    idiomas.push({ idioma: m[1].charAt(0).toUpperCase() + m[1].slice(1), nivel: /nativ/i.test(m[2]) ? 'Nativo' : /avanz|alto|fluid/i.test(m[2]) ? 'Avanzado' : /medio|intermed/i.test(m[2]) ? 'Intermedio' : m[2] ? 'Básico' : '' });
  }

  const otros = [
    ...CURSOS.filter((c) => state.cursos.includes(c.id) && c.otros).map((c) => c.otros),
    ...dispo.map(([, linea]) => linea),
  ].filter((x, i, a) => a.indexOf(x) === i);

  // Perfil redactado a partir de las respuestas.
  const busco = o ? `Busco mi primer empleo como ${low(puestoDe(o.nombre))}` : 'Busco mi primer empleo';
  const cual = cualidades.slice(0, 3).map(([, frase]) => frase);
  const forma = est && est.id !== 'sin' ? `, con formación en ${low(formacion[0].titulo || est.titulo)}` : '';
  const frases = VIVENCIAS.filter((v) => state.vivencias[v.id]).map((v) => v.frase);
  const exp = frases.length ? ` y experiencia en ${listOf(frases)}` : '';
  const disp = dispo.length ? `, con disponibilidad ${listOf(dispo.map(([, , corto]) => corto))}` : '';
  const perfil = `Persona ${listOf(cual) || 'responsable'}${forma}${exp}. ${busco}${disp}. Tengo muchas ganas de aprender y de aportar desde el primer día.`;

  return {
    ...emptyCV(),
    oficio: state.oficio,
    nombre: state.nombre.trim(),
    telefono: state.telefono.trim(),
    email: state.email.trim(),
    ciudad: state.ciudad.trim(),
    puesto: o ? puestoDe(o.nombre) : '',
    perfil,
    experiencia,
    formacion,
    habilidades,
    idiomas,
    otros: otros.join('\n'),
  };
}

function saveAsNewCV(data) {
  let list = null;
  try {
    list = JSON.parse(localStorage.getItem(LIST_KEY) || 'null');
  } catch { /* lista corrupta */ }
  if (!list || !Array.isArray(list.items)) {
    list = { active: '', items: [] };
    // Si ya había un currículum suelto (versión anterior), no lo perdemos.
    try {
      const old = localStorage.getItem(CV_KEY);
      if (old) list.items.push({ id: `old${Date.now().toString(36)}`, label: '', updated: Date.now() - 1, data: JSON.parse(old) });
    } catch { /* sin currículum previo */ }
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  list.items.push({ id, label: 'Primer empleo', updated: Date.now(), data });
  list.active = id;
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    localStorage.setItem(CV_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/* ---------- Interfaz ---------- */
let step = 0;

function render() {
  const s = STEPS[step];
  $('#w-count').textContent = `Paso ${step + 1} de ${STEPS.length}`;
  $('#w-bar').style.width = `${((step + 1) / STEPS.length) * 100}%`;
  $('#w-title').textContent = s.title;
  $('#w-sub').textContent = s.sub;
  $('#w-body').innerHTML = s.html();
  $('#w-error').textContent = '';
  $('#w-back').hidden = step === 0;
  $('#w-next').textContent = step === STEPS.length - 1 ? '✨ Crear mi currículum' : 'Siguiente →';
  bind();
  window.scrollTo(0, 0);
  $('#w-body input')?.focus({ preventScroll: true });
}

function toggle(arr, v, max = Infinity) {
  const i = arr.indexOf(v);
  if (i >= 0) arr.splice(i, 1);
  else if (arr.length < max) arr.push(v);
}

function bind() {
  $$('[data-w]').forEach((el) => {
    el.value = state[el.dataset.w];
    el.addEventListener('input', () => (state[el.dataset.w] = el.value));
  });
  const click = (sel, fn) => $$(sel).forEach((b) => b.addEventListener('click', () => { fn(b); render(); }));
  click('[data-oficio]', (b) => (state.oficio = b.dataset.oficio));
  click('[data-genero]', (b) => (state.genero = b.dataset.genero));
  click('[data-estudios]', (b) => (state.estudios = b.dataset.estudios));
  click('[data-curso]', (b) => toggle(state.cursos, b.dataset.curso));
  click('[data-ingles]', (b) => (state.ingles = b.dataset.ingles));
  click('[data-cual]', (b) => toggle(state.cualidades, b.dataset.cual, 5));
  click('[data-dispo]', (b) => toggle(state.dispo, b.dataset.dispo));
  click('[data-viv]', (b) => {
    const id = b.dataset.viv;
    if (state.vivencias[id]) delete state.vivencias[id];
    else state.vivencias[id] = { donde: '', anio: '' };
  });
  $$('[data-viv-donde]').forEach((el) => el.addEventListener('input', () => (state.vivencias[el.dataset.vivDonde].donde = el.value)));
  $$('[data-viv-anio]').forEach((el) => el.addEventListener('input', () => (state.vivencias[el.dataset.vivAnio].anio = el.value)));
}

function next() {
  const err = STEPS[step].valid?.() || '';
  if (err) {
    $('#w-error').textContent = err;
    return;
  }
  if (step < STEPS.length - 1) {
    step++;
    render();
    return;
  }
  const data = buildCV();
  if (!saveAsNewCV(data)) {
    alert('No hemos podido guardar el currículum en este dispositivo. Revisa que el navegador permita guardar datos.');
    return;
  }
  location.href = $('#w-done-url').value;
}

$('#w-next').addEventListener('click', next);
$('#w-back').addEventListener('click', () => {
  step = Math.max(0, step - 1);
  render();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') next();
});
render();
