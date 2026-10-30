// Convierte los datos de un currículum en HTML. No usa el DOM, así que sirve
// tanto en el navegador (editor) como en Node (páginas de ejemplo generadas).

export const TEMPLATES = [
  { id: 'clasica', name: 'Clásica', pro: false, desc: 'Sobria y fácil de leer. Vale para cualquier empleo.' },
  { id: 'moderna', name: 'Moderna', pro: false, desc: 'Barra lateral de color con foto y datos de contacto.' },
  { id: 'minimal', name: 'Minimal', pro: false, desc: 'Mucho espacio en blanco y fechas a la izquierda.' },
  { id: 'compacta', name: 'Compacta', pro: false, desc: 'Cabe mucho en una sola página.' },
  { id: 'ejecutiva', name: 'Ejecutiva', pro: true, desc: 'Para puestos de responsabilidad.' },
  { id: 'creativa', name: 'Creativa', pro: true, desc: 'Diseño llamativo para destacar.' },
];

export const ACCENTS = ['#1f5fbf', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c', '#334155'];

export function emptyCV() {
  return {
    template: 'clasica',
    accent: ACCENTS[0],
    nombre: '',
    puesto: '',
    email: '',
    telefono: '',
    ciudad: '',
    web: '',
    foto: '',
    perfil: '',
    experiencia: [],
    formacion: [],
    habilidades: [],
    idiomas: [],
    otros: '',
  };
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const lines = (s) =>
  String(s ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);

const range = (a, b, actual) => {
  const fin = actual ? 'Actualidad' : b;
  if (a && fin) return `${esc(a)} – ${esc(fin)}`;
  return esc(a || fin || '');
};

const has = (d, key) => (Array.isArray(d[key]) ? d[key].length > 0 : Boolean(String(d[key] ?? '').trim()));

function contactItems(d) {
  return [
    d.telefono && `<li><span class="cv-ic" aria-hidden="true">☎</span>${esc(d.telefono)}</li>`,
    d.email && `<li><span class="cv-ic" aria-hidden="true">✉</span>${esc(d.email)}</li>`,
    d.ciudad && `<li><span class="cv-ic" aria-hidden="true">⌂</span>${esc(d.ciudad)}</li>`,
    d.web && `<li><span class="cv-ic" aria-hidden="true">↗</span>${esc(d.web)}</li>`,
  ]
    .filter(Boolean)
    .join('');
}

const section = (title, body, cls = '') => (body ? `<section class="cv-sec ${cls}"><h2>${title}</h2>${body}</section>` : '');

function experienceBlock(d, datesLeft = false) {
  if (!has(d, 'experiencia')) return '';
  return d.experiencia
    .map((e) => {
      const tareas = lines(e.tareas);
      const meta = [e.empresa, e.lugar].filter(Boolean).map(esc).join(' · ');
      const dates = range(e.inicio, e.fin, e.actual);
      const list = tareas.length ? `<ul>${tareas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
      if (datesLeft) {
        return `<div class="cv-item cv-row"><div class="cv-date">${dates}</div><div><h3>${esc(e.puesto)}</h3>${meta ? `<p class="cv-meta">${meta}</p>` : ''}${list}</div></div>`;
      }
      return `<div class="cv-item"><div class="cv-item-head"><h3>${esc(e.puesto)}</h3><span class="cv-date">${dates}</span></div>${meta ? `<p class="cv-meta">${meta}</p>` : ''}${list}</div>`;
    })
    .join('');
}

function educationBlock(d, datesLeft = false) {
  if (!has(d, 'formacion')) return '';
  return d.formacion
    .map((f) => {
      const dates = range(f.inicio, f.fin, false);
      if (datesLeft) {
        return `<div class="cv-item cv-row"><div class="cv-date">${dates}</div><div><h3>${esc(f.titulo)}</h3>${f.centro ? `<p class="cv-meta">${esc(f.centro)}</p>` : ''}</div></div>`;
      }
      return `<div class="cv-item"><div class="cv-item-head"><h3>${esc(f.titulo)}</h3><span class="cv-date">${dates}</span></div>${f.centro ? `<p class="cv-meta">${esc(f.centro)}</p>` : ''}</div>`;
    })
    .join('');
}

const skillsBlock = (d) =>
  has(d, 'habilidades') ? `<ul class="cv-tags">${d.habilidades.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '';

const langBlock = (d) =>
  has(d, 'idiomas')
    ? `<ul class="cv-langs">${d.idiomas
        .filter((i) => i.idioma)
        .map((i) => `<li><strong>${esc(i.idioma)}</strong>${i.nivel ? ` <span>${esc(i.nivel)}</span>` : ''}</li>`)
        .join('')}</ul>`
    : '';

const otherBlock = (d) => {
  const items = lines(d.otros);
  return items.length ? `<ul class="cv-list">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
};

const photo = (d) => (d.foto ? `<img class="cv-photo" src="${esc(d.foto)}" alt="">` : '');
const perfil = (d) => (has(d, 'perfil') ? `<p class="cv-perfil">${esc(d.perfil)}</p>` : '');

function header(d, withContact = true) {
  return `<header class="cv-head">${photo(d)}<div class="cv-id"><h1>${esc(d.nombre) || 'Tu nombre'}</h1>${
    d.puesto ? `<p class="cv-role">${esc(d.puesto)}</p>` : ''
  }${withContact ? `<ul class="cv-contact">${contactItems(d)}</ul>` : ''}</div></header>`;
}

const RENDERERS = {
  clasica: (d) =>
    header(d) +
    section('Perfil', perfil(d)) +
    section('Experiencia', experienceBlock(d)) +
    section('Formación', educationBlock(d)) +
    section('Habilidades', skillsBlock(d)) +
    section('Idiomas', langBlock(d)) +
    section('Otros datos', otherBlock(d)),

  moderna: (d) =>
    `<aside class="cv-side">${photo(d)}${section('Contacto', `<ul class="cv-contact">${contactItems(d)}</ul>`)}${section(
      'Habilidades',
      skillsBlock(d),
    )}${section('Idiomas', langBlock(d))}${section('Otros datos', otherBlock(d))}</aside>` +
    `<div class="cv-main">${header({ ...d, foto: '' }, false)}${section('Perfil', perfil(d))}${section(
      'Experiencia',
      experienceBlock(d),
    )}${section('Formación', educationBlock(d))}</div>`,

  minimal: (d) =>
    header(d) +
    section('Perfil', perfil(d)) +
    section('Experiencia', experienceBlock(d, true)) +
    section('Formación', educationBlock(d, true)) +
    `<div class="cv-cols">${section('Habilidades', skillsBlock(d))}${section('Idiomas', langBlock(d))}</div>` +
    section('Otros datos', otherBlock(d)),

  compacta: (d) =>
    header(d) +
    `<div class="cv-body"><div class="cv-main">${section('Perfil', perfil(d))}${section('Experiencia', experienceBlock(d))}${section(
      'Formación',
      educationBlock(d),
    )}</div><div class="cv-aside">${section('Habilidades', skillsBlock(d))}${section('Idiomas', langBlock(d))}${section(
      'Otros datos',
      otherBlock(d),
    )}</div></div>`,
};

export function renderCV(d) {
  const tpl = RENDERERS[d.template] ? d.template : 'clasica';
  const accent = /^#[0-9a-f]{6}$/i.test(d.accent || '') ? d.accent : ACCENTS[0];
  return `<article class="cv tpl-${tpl}" style="--accent:${accent}">${RENDERERS[tpl](d)}</article>`;
}
