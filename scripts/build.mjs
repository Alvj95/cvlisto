// Genera el sitio estático en dist/. Sin dependencias: solo Node 18+.
//   node scripts/build.mjs
import { mkdir, rm, writeFile, cp, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/config.js';
import { OFICIOS, ejemploCV } from '../src/data/oficios.js';
import { ARTICULOS } from '../src/data/articulos.js';
import { renderCV, TEMPLATES } from '../src/js/cv-render.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');
const BASE = CONFIG.base.endsWith('/') ? CONFIG.base : `${CONFIG.base}/`;
const SITE = CONFIG.url.replace(/\/$/, '');
const YEAR = new Date().getFullYear();

const url = (p = '') => BASE + p.replace(/^\//, '');
const abs = (p = '') => SITE + '/' + p.replace(/^\//, '');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pages = [];

function layout({ path, title, description, body, active = '', ads = true, bodyClass = '', head = '', jsonld = null }) {
  const canonical = abs(path);
  const adsense =
    ads && CONFIG.adsenseClient
      ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CONFIG.adsenseClient)}" crossorigin="anonymous"></script>`
      : '';
  const nav = [
    ['ejemplos/', 'Ejemplos', 'ejemplos'],
    ['consejos/', 'Consejos', 'consejos'],
  ]
    .map(([href, label, key]) => `<a href="${url(href)}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${CONFIG.nombreSitio}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="es_ES">
<meta name="theme-color" content="#5b4bff">
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<link rel="manifest" href="${url('manifest.webmanifest')}">
<link rel="apple-touch-icon" href="${url('icons/icon-192.png')}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${CONFIG.nombreSitio}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="${url('assets/css/site.css')}">
<link rel="stylesheet" href="${url('assets/css/cv.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${adsense}
${head}
</head>
<body class="${bodyClass}">
<header class="site-head"><div class="wrap">
  <a class="logo" href="${url()}"><span class="logo-mark">CV</span>${CONFIG.nombreSitio}</a>
  <nav class="nav">${nav}<a class="btn btn-sm" href="${url('crear/')}">Crear mi CV</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="site-foot"><div class="wrap">
  <div><strong>${CONFIG.nombreSitio}</strong> · Currículum gratis, sin trampas. © ${YEAR}</div>
  <nav>
    <a href="${url('sobre-nosotros/')}">Quiénes somos</a>
    <a href="${url('contacto/')}">Contacto</a>
    <a href="${url('aviso-legal/')}">Aviso legal</a>
    <a href="${url('privacidad/')}">Privacidad</a>
    <a href="${url('cookies/')}">Cookies</a>
  </nav>
</div></footer>
${
  bodyClass === 'editor-page'
    ? ''
    : `<nav class="tabbar" aria-label="Navegación">
  ${[
    ['', '🏠', 'Inicio', 'inicio'],
    ['ejemplos/', '📄', 'Ejemplos', 'ejemplos'],
    ['crear/', '✚', 'Crear', 'crear', 'fab'],
    ['consejos/', '💡', 'Consejos', 'consejos'],
    ['pro/', '⭐', 'Pro', 'pro'],
  ]
    .map(
      ([href, icon, label, key, cls]) =>
        `<a href="${url(href)}"${cls ? ` class="${cls}"` : ''}${active === key ? ' aria-current="page"' : ''}><span class="ti">${icon}</span>${label}</a>`,
    )
    .join('')}
</nav>`
}
<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${url('sw.js')}').catch(function(){})})}</script>
</body>
</html>
`;
}

function page(path, opts) {
  pages.push({ path, html: layout({ path, ...opts }) });
}

/* ---------- Bloques reutilizables ---------- */
const sampleCV = (slug, template, accent) => ({
  ...ejemploCV(OFICIOS.find((o) => o.slug === slug)),
  template,
  accent: accent || '#1f5fbf',
});

const ctaBox = (text, href = 'crear/', label = 'Crear mi currículum gratis') =>
  `<div class="cta-box"><p>${text}</p><a class="btn" href="${url(href)}">${label}</a></div>`;

// Ajusta las vistas previas a lo ancho de su contenedor.
const FIT_SCRIPT = `<script>
(function(){function fit(){document.querySelectorAll('[data-fit]').forEach(function(s){var cv=s.querySelector('.cv');if(!cv)return;var w=s.parentElement.clientWidth;var k=Math.min(1,w/793.7);cv.style.transform='scale('+k+')';s.style.width=(793.7*k)+'px';s.style.height=(cv.offsetHeight*k)+'px';});}
window.addEventListener('resize',fit);fit();})();
</script>`;

/* ---------- Portada ---------- */
const FAQ = [
  ['¿De verdad es gratis descargar el currículum?', 'Sí. Puedes crear tu currículum y descargarlo en PDF las veces que quieras sin pagar ni registrarte. No hay suscripciones escondidas.'],
  ['¿Dónde se guardan mis datos?', 'Solo en tu navegador, en tu propio dispositivo. Tu currículum no se envía ni se guarda en ningún servidor.'],
  ['¿Cómo descargo el PDF?', 'Pulsa "Descargar PDF" y, en la ventana que se abre, elige "Guardar como PDF" como destino. Funciona en ordenador, Android y iPhone.'],
  ['¿Necesito crear una cuenta?', 'No. Entras, rellenas y descargas. Tu progreso se guarda automáticamente en el dispositivo que estés usando.'],
  ['¿Puedo subir mi currículum antiguo?', 'Sí. En el editor pulsa "Subir" y elige tu currículum en Word (.docx), PDF o texto. Leemos tus datos en tu propio dispositivo y los pasamos a la plantilla nueva para que solo tengas que revisarlos.'],
  ['¿Puedo hacer el currículum en otros idiomas?', 'Sí: español, inglés, francés, portugués e italiano. Los títulos y las frases sugeridas se traducen solos; lo que escribas tú, te avisamos para que lo pongas en ese idioma.'],
  ['¿Sirve si no tengo experiencia?', 'Sí. Puedes destacar tu formación, cursos, voluntariado y disponibilidad. Tenemos una guía específica para hacer un currículum sin experiencia.'],
];

const TILES = ['t1', 't2', 't3', 't4', 't5'];
const heroCV = renderCV(sampleCV('camarero', 'moderna', '#5b4bff'));
const heroCV2 = renderCV(sampleCV('recepcionista', 'compacta', '#0f766e'));

page('', {
  title: 'Crear currículum gratis online y descargar en PDF | CV Listo',
  description:
    'Haz tu currículum gratis en 10 minutos: plantillas profesionales, ejemplos por oficio y frases ya escritas. Descarga en PDF sin registro y sin pagar.',
  active: 'inicio',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: CONFIG.nombreSitio,
      url: abs(''),
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android',
      inLanguage: 'es',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
  body: `
<section class="hero"><div class="wrap">
  <div>
    <span class="pill">✨ 100% gratis · sin registro</span>
    <h1>Consigue trabajo con un currículum <span class="hl">que destaca</span></h1>
    <p class="lead">Elige tu oficio, toca las frases que encajan contigo y descarga tu CV en PDF en minutos. Sin suscripciones y sin sorpresas al final.</p>
    <div class="hero-cta">
      <a class="btn btn-white" href="${url('crear/')}">Crear mi currículum →</a>
      <a class="btn btn-lg btn-glass" href="${url('ejemplos/')}">Ver ejemplos</a>
    </div>
    <div class="stats">
      <div><strong>10 min</strong><span>y lo tienes listo</span></div>
      <div><strong>${OFICIOS.length} oficios</strong><span>con frases hechas</span></div>
      <div><strong>0 €</strong><span>por descargarlo</span></div>
    </div>
  </div>
  <div class="hero-visual" aria-hidden="true">
    <div class="paper" style="transform:scale(.4) rotate(-6deg);left:0;top:50px">${heroCV2}</div>
    <div class="paper" style="transform:scale(.46) rotate(4deg);left:120px;top:0">${heroCV}</div>
    <div class="float-chip" style="left:10px;top:20px"><span class="dot t4">✅</span><div>PDF descargado<small>Listo para enviar</small></div></div>
    <div class="float-chip" style="right:0;bottom:40px;animation-delay:-2s"><span class="dot t3">⭐</span><div>Tu CV está al 100%<small>¡Perfecto!</small></div></div>
  </div>
</div></section>
<svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 360 0 1080 80 1440 30 L1440 60 L0 60 Z" fill="#f7f7fc"/></svg>

<section class="section"><div class="wrap">
  <div class="center"><span class="eyebrow">Así de fácil</span><h2>Tu CV en 3 pasos</h2><p class="sub">Sin complicaciones y desde el móvil.</p></div>
  <div class="grid grid-3">
    <div class="card step"><span class="step-n">1</span><h3>Elige tu oficio</h3><p>Camarero, dependiente, repartidor, cuidadora… Te proponemos frases y habilidades para ese trabajo.</p></div>
    <div class="card step"><span class="step-n">2</span><h3>Toca y personaliza</h3><p>Rellena tus datos, toca las sugerencias que te sirvan y mira el resultado en tiempo real.</p></div>
    <div class="card step"><span class="step-n">3</span><h3>Descarga en PDF</h3><p>Gratis, las veces que quieras. Listo para enviar por email, WhatsApp o portales de empleo.</p></div>
  </div>
</div></section>

<section class="section section-alt"><div class="wrap">
  <span class="eyebrow">Plantillas</span>
  <h2>Diseños que llaman la atención</h2>
  <p class="sub">Profesionales, limpios y pensados para caber en una página.</p>
  <div class="tpl-gallery">
    ${TEMPLATES.map(
      (t, i) => `<div class="tpl-thumb">${
        t.pro
          ? '<div class="mini locked">🔒</div>'
          : `<div class="mini">${renderCV(sampleCV('dependiente', t.id, ['#5b4bff', '#e0457b', '#0f766e', '#c2410c'][i % 4]))}</div>`
      }
      <strong>${t.name} ${t.pro ? '<span class="badge">Pro · pronto</span>' : '<span class="badge badge-free">Gratis</span>'}</strong>
      <small>${t.desc}</small></div>`,
    ).join('')}
  </div>
</div></section>

<section class="section"><div class="wrap">
  <span class="eyebrow">Ejemplos reales</span>
  <h2>Currículums por oficio</h2>
  <p class="sub">Míralos, cópialos y adáptalos a tu experiencia en un toque.</p>
  <div class="grid grid-3">
    ${OFICIOS.map(
      (o, i) => `<a class="card oficio-card" href="${url(`ejemplos/${o.slug}/`)}"><span class="icon-tile ${TILES[i % 5]}">${o.icono}</span><div><h3>${esc(o.nombre)}</h3><p>${esc(o.intro.split('. ')[0])}.</p><span class="more">Ver ejemplo →</span></div></a>`,
    ).join('')}
  </div>
</div></section>

<section class="section section-alt"><div class="wrap">
  <div class="center"><span class="eyebrow">Por qué CV Listo</span><h2>Hecho para ayudarte, no para cobrarte</h2><p class="sub">Lo que otras webs no te cuentan.</p></div>
  <div class="grid grid-3">
    <div class="card"><span class="icon-tile t4">💸</span><h3>Gratis de verdad</h3><p>Otras webs te dejan hacer el CV y te cobran al descargarlo, a veces con una suscripción. Aquí la descarga es gratis.</p></div>
    <div class="card"><span class="icon-tile t3">🧰</span><h3>Para trabajos reales</h3><p>Hostelería, comercio, logística, limpieza, cuidados y más. No solo para oficinas.</p></div>
    <div class="card"><span class="icon-tile t1">🪄</span><h3>Nunca en blanco</h3><p>Frases ya escritas para tu perfil, tus tareas y tus habilidades. Solo tienes que tocarlas.</p></div>
    <div class="card"><span class="icon-tile t4">📂</span><h3>Sube tu CV antiguo</h3><p>¿Ya tienes uno en Word o PDF? Súbelo y pasamos tus datos a una plantilla nueva en segundos.</p></div>
    <div class="card"><span class="icon-tile t5">🌍</span><h3>En 5 idiomas</h3><p>Español, inglés, francés, portugués e italiano. Ideal para trabajar en el extranjero o en zonas turísticas.</p></div>
    <div class="card"><span class="icon-tile t2">🔒</span><h3>Privado</h3><p>Sin registro. Tu currículum se guarda solo en tu dispositivo y no lo enviamos a ningún sitio.</p></div>
  </div>
</div></section>

<section class="section"><div class="narrow faq">
  <div class="center"><span class="eyebrow">Dudas</span><h2>Preguntas frecuentes</h2></div>
  <div style="margin-top:24px">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div></section>

<section class="wrap"><div class="big-cta">
  <h2>Tu próximo trabajo empieza aquí</h2>
  <p>Crea tu currículum ahora. Es gratis y tardas menos que en tomarte un café.</p>
  <a class="btn btn-white btn-lg" href="${url('crear/')}">Crear mi currículum gratis</a>
</div></section>`,
});

/* ---------- Editor ---------- */
page('crear/', {
  title: 'Crear currículum gratis | CV Listo',
  description: 'Editor de currículum online gratis: rellena tus datos, elige plantilla y descarga en PDF. Sin registro.',
  ads: false,
  bodyClass: 'editor-page',
  head: `<script type="module" src="${url('assets/js/editor.js')}"></script>`,
  body: `
<div class="editor">
  <section class="ed-form" aria-label="Datos del currículum">
    <div class="progress-card" aria-live="polite">
      <div class="top"><strong id="prog-title">Empecemos tu CV</strong><span class="pct" id="prog-pct">0%</span></div>
      <div class="progress-bar"><i id="prog-bar"></i></div>
      <p id="prog-tip">Elige tu oficio para ver sugerencias.</p>
    </div>
    <div class="import-card">
      <span class="ico t4">📂</span>
      <div><strong>¿Ya tienes un currículum?</strong><p>Súbelo (Word, PDF o texto) y pasamos tus datos a la nueva plantilla.</p></div>
      <label class="btn btn-sm" style="cursor:pointer">Subir<input type="file" id="import-input" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden></label>
    </div>
    <div class="oficio-box">
      <div class="field"><label for="oficio">¿A qué trabajo te presentas?</label><select id="oficio"></select></div>
      <p>Te sugerimos frases y habilidades para ese oficio. <button type="button" class="btn-link" id="btn-example">Rellenar con un ejemplo</button></p>
    </div>

    <details class="ed-block" open><summary data-sec="datos"><span class="ico t1">👤</span>Datos personales<span class="done">✓</span></summary><div class="ed-body">
      <div class="photo-row">
        <div class="ph" id="photo-preview">👤</div>
        <div>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer">Subir foto (opcional)<input type="file" id="photo-input" accept="image/*" hidden></label>
          <button type="button" class="btn-link" id="photo-remove" hidden style="margin-left:8px">Quitar</button>
        </div>
      </div>
      <div class="field"><label for="f-nombre">Nombre y apellidos</label><input id="f-nombre" data-f="nombre" autocomplete="name"></div>
      <div class="field"><label for="f-puesto">Puesto que buscas</label><input id="f-puesto" data-f="puesto" placeholder="Ej.: Camarera de sala"></div>
      <div class="row2">
        <div class="field"><label for="f-tel">Teléfono</label><input id="f-tel" data-f="telefono" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="f-email">Email</label><input id="f-email" data-f="email" type="email" autocomplete="email"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="f-ciudad">Ciudad</label><input id="f-ciudad" data-f="ciudad" autocomplete="address-level2"></div>
        <div class="field"><label for="f-web">LinkedIn o web</label><input id="f-web" data-f="web"></div>
      </div>
    </div></details>

    <details class="ed-block" open><summary data-sec="perfil"><span class="ico t2">✍️</span>Perfil<span class="done">✓</span></summary><div class="ed-body">
      <div class="field"><label for="f-perfil">Preséntate en 2-3 líneas</label><textarea id="f-perfil" data-f="perfil" rows="4"></textarea></div>
      <div class="perfil-sugg" id="perfil-sugg"></div>
    </div></details>

    <details class="ed-block" open><summary data-sec="experiencia"><span class="ico t3">💼</span>Experiencia<span class="done">✓</span></summary><div class="ed-body">
      <p class="hint">Empieza por la más reciente. ¿Sin experiencia? Pon prácticas, voluntariado o trabajos informales.</p>
      <div id="exp-list"></div>
      <button type="button" class="add-btn" data-add-to="experiencia">+ Añadir experiencia</button>
    </div></details>

    <details class="ed-block"><summary data-sec="formacion"><span class="ico t4">🎓</span>Formación<span class="done">✓</span></summary><div class="ed-body">
      <p class="hint">Estudios y también cursos cortos: manipulador de alimentos, PRL, carretillero…</p>
      <div id="edu-list"></div>
      <button type="button" class="add-btn" data-add-to="formacion">+ Añadir formación</button>
    </div></details>

    <details class="ed-block"><summary data-sec="habilidades"><span class="ico t5">⭐</span>Habilidades<span class="done">✓</span></summary><div class="ed-body">
      <div class="chips" id="skills-sel"></div>
      <div class="row2" style="grid-template-columns:1fr auto">
        <div class="field" style="margin:0"><input id="skill-input" placeholder="Escribe una y pulsa Enter" aria-label="Nueva habilidad"></div>
        <button type="button" class="btn btn-ghost" id="skill-add">Añadir</button>
      </div>
      <div id="skills-sugg" style="margin-top:8px"></div>
    </div></details>

    <details class="ed-block"><summary data-sec="idiomas"><span class="ico t1">🌍</span>Idiomas<span class="done">✓</span></summary><div class="ed-body">
      <div id="lang-list"></div>
      <button type="button" class="add-btn" data-add-to="idiomas">+ Añadir idioma</button>
    </div></details>

    <details class="ed-block"><summary data-sec="otros"><span class="ico t2">📌</span>Otros datos<span class="done">✓</span></summary><div class="ed-body">
      <div class="field"><label for="f-otros">Uno por línea</label><textarea id="f-otros" data-f="otros" rows="4" placeholder="Carnet de conducir B&#10;Disponibilidad inmediata&#10;Permiso de trabajo en vigor"></textarea></div>
    </div></details>

    <details class="ed-block" open><summary data-sec="diseno"><span class="ico t3">🎨</span>Diseño e idioma<span class="done">✓</span></summary><div class="ed-body">
      <div class="lbl">Idioma del currículum</div>
      <div class="chips" id="lang-pick"></div>
      <p class="lang-note" id="lang-note" hidden></p>
      <div class="lbl" style="margin-top:12px">Plantilla</div>
      <div class="tpl-pick" id="tpl-pick"></div>
      <div class="lbl" style="margin-top:12px">Color</div>
      <div class="swatches" id="swatches"></div>
    </div></details>

    <p style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="saved" id="saved"></span>
      <button type="button" class="btn-link" id="btn-reset" style="color:#b91c1c">Borrar todo</button>
    </p>
  </section>

  <section class="ed-preview" aria-label="Vista previa">
    <div class="ed-toolbar">
      <span class="grow" id="pages-info"></span>
      <button type="button" class="btn js-download">⬇ Descargar PDF gratis</button>
    </div>
    <div class="sheet-wrap" id="sheet"></div>
  </section>
</div>

<div class="mobile-bar">
  <button type="button" class="btn btn-ghost" id="tab-edit" aria-pressed="true">✎ Editar</button>
  <button type="button" class="btn btn-ghost" id="tab-preview" aria-pressed="false">👁 Ver</button>
  <button type="button" class="btn js-download">⬇ PDF</button>
</div>

<dialog id="dlg-print">
  <h2>Descargar en PDF</h2>
  <p>Se abrirá la ventana de imprimir de tu dispositivo. Para guardarlo como archivo:</p>
  <ul>
    <li><strong>Ordenador:</strong> en "Destino" elige <em>Guardar como PDF</em>.</li>
    <li><strong>Android:</strong> arriba, elige <em>Guardar como PDF</em> y toca el botón PDF.</li>
    <li><strong>iPhone:</strong> toca <em>Compartir</em> (arriba) y luego <em>Guardar en Archivos</em>.</li>
  </ul>
  <p>Si ves cabeceras o la fecha en los márgenes, desactiva <em>Encabezados y pies de página</em>.</p>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Cancelar</button>
    <button type="button" class="btn" id="dlg-print-ok">Entendido, descargar</button>
  </div>
</dialog>

<dialog id="dlg-pro">
  <h2>Plantillas Pro</h2>
  <p>Estamos preparando plantillas premium y nuevas funciones con un <strong>pago único</strong>, sin suscripciones.</p>
  <p>Mientras tanto, todas las plantillas gratuitas y la descarga en PDF siguen siendo gratis.</p>
  <div class="dlg-actions">
    <a class="btn btn-ghost" href="${url('pro/')}">Saber más</a>
    <button type="button" class="btn" onclick="this.closest('dialog').close()">Vale</button>
  </div>
</dialog>

<dialog id="dlg-example">
  <h2>¿Cargar el ejemplo?</h2>
  <p>Ya tienes un currículum empezado. Si cargas el ejemplo, se sustituirá lo que has escrito.</p>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Mantener el mío</button>
    <button type="button" class="btn" id="dlg-example-ok">Cargar ejemplo</button>
  </div>
</dialog>

<dialog id="dlg-import">
  <h2>Revisa lo que hemos encontrado</h2>
  <div id="import-summary"></div>
  <p class="hint" style="margin:12px 0 0">La lectura automática puede fallar con diseños complicados. Después podrás corregir cualquier dato en el editor. Se sustituirá lo que tengas ahora en el editor.</p>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Cancelar</button>
    <button type="button" class="btn" id="dlg-import-ok">Usar estos datos</button>
  </div>
</dialog>

<div id="print-root"></div>`,
});

/* ---------- Ejemplos ---------- */
page('ejemplos/', {
  title: 'Ejemplos de currículum por oficio (gratis) | CV Listo',
  description: 'Ejemplos de currículum para camarero, dependiente, repartidor, limpieza, cuidadora y más. Cópialos y descárgalos en PDF gratis.',
  active: 'ejemplos',
  body: `
<div class="wrap">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Ejemplos</p>
  <div class="prose"><h1>Ejemplos de currículum por oficio</h1>
  <p>Elige tu trabajo y verás un currículum de ejemplo completo, con las tareas y habilidades que más piden las empresas. Con un toque lo abres en el editor y lo adaptas a ti.</p></div>
  <div class="grid grid-3" style="margin-top:24px">
    ${OFICIOS.map(
      (o, i) => `<a class="card oficio-card" href="${url(`ejemplos/${o.slug}/`)}"><span class="icon-tile ${TILES[i % 5]}">${o.icono}</span><div><h3>Currículum de ${esc(o.nombre.toLowerCase())}</h3><p>${esc(o.descripcion)}</p><span class="more">Ver ejemplo →</span></div></a>`,
    ).join('')}
  </div>
</div>`,
});

OFICIOS.forEach((o, idx) => {
  const ejemplo = renderCV(sampleCV(o.slug, idx % 2 ? 'clasica' : 'moderna', ['#5b4bff', '#0f766e', '#e0457b'][idx % 3]));
  const otros = OFICIOS.filter((x) => x.slug !== o.slug).slice(0, 4);
  page(`ejemplos/${o.slug}/`, {
    title: `${o.titulo} | CV Listo`,
    description: o.descripcion,
    active: 'ejemplos',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: abs('') },
        { '@type': 'ListItem', position: 2, name: 'Ejemplos', item: abs('ejemplos/') },
        { '@type': 'ListItem', position: 3, name: o.nombre, item: abs(`ejemplos/${o.slug}/`) },
      ],
    },
    body: `
<div class="narrow prose">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › <a href="${url('ejemplos/')}">Ejemplos</a> › ${esc(o.nombre)}</p>
  <span class="icon-tile ${TILES[idx % 5]}" style="margin-top:8px">${o.icono}</span>
  <h1>Currículum de ${esc(o.nombre.toLowerCase())}: <span class="grad-text">ejemplo y plantilla</span></h1>
  <p>${esc(o.intro)}</p>
  ${ctaBox('Usa este ejemplo como base y cámbialo en 5 minutos.', `crear/?oficio=${o.slug}`, 'Usar este ejemplo')}

  <h2>Ejemplo completo</h2>
  <div class="example-preview"><div class="scaler" data-fit>${ejemplo}</div></div>

  <h2>Cómo escribir el perfil</h2>
  <p>El perfil son 2 o 3 líneas al principio que resumen quién eres y qué ofreces. Dos ejemplos que puedes adaptar:</p>
  ${o.perfiles.map((p, i) => `<div class="perfil-ej"><strong>${i === 0 ? 'Con experiencia' : 'Sin experiencia'}:</strong> ${esc(p)}</div>`).join('')}

  <h2>Tareas y funciones de ${esc(o.nombre.toLowerCase())}</h2>
  <p>Elige las que hayas hecho de verdad y ponlas en tu experiencia, empezando por las más importantes:</p>
  <ul class="tick">${o.tareas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

  <h2>Habilidades que buscan las empresas</h2>
  <ul class="tags">${o.habilidades.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>

  <h2>Consejos para que te llamen</h2>
  <ul>${o.consejos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

  ${ctaBox(`Crea tu currículum de ${esc(o.nombre.toLowerCase())} gratis.`, `crear/?oficio=${o.slug}`, 'Empezar ahora')}

  <h2>Otros ejemplos</h2>
  <ul>${otros.map((x) => `<li><a href="${url(`ejemplos/${x.slug}/`)}">Currículum de ${esc(x.nombre.toLowerCase())}</a></li>`).join('')}
  <li><a href="${url('consejos/curriculum-sin-experiencia/')}">Cómo hacer un currículum sin experiencia</a></li></ul>
</div>
${FIT_SCRIPT}`,
  });
});

/* ---------- Consejos ---------- */
page('consejos/', {
  title: 'Consejos para hacer un buen currículum | CV Listo',
  description: 'Guías prácticas para hacer tu currículum: sin experiencia, si eres extranjero en España y los errores más comunes.',
  active: 'consejos',
  body: `
<div class="wrap">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Consejos</p>
  <div class="prose"><h1>Consejos para tu currículum</h1><p>Guías cortas y prácticas para que tu currículum funcione.</p></div>
  <div class="grid grid-3" style="margin-top:24px">
    ${ARTICULOS.map((a) => `<a class="card" href="${url(`consejos/${a.slug}/`)}"><h3>${esc(a.titulo)}</h3><p>${esc(a.resumen)}</p><span class="more">Leer →</span></a>`).join('')}
  </div>
</div>`,
});

ARTICULOS.forEach((a) => {
  const otros = ARTICULOS.filter((x) => x.slug !== a.slug);
  page(`consejos/${a.slug}/`, {
    title: `${a.titulo} | CV Listo`,
    description: a.descripcion,
    active: 'consejos',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.titulo,
      description: a.descripcion,
      inLanguage: 'es',
      mainEntityOfPage: abs(`consejos/${a.slug}/`),
      publisher: { '@type': 'Organization', name: CONFIG.nombreSitio },
    },
    body: `
<article class="narrow prose">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › <a href="${url('consejos/')}">Consejos</a></p>
  <h1>${esc(a.titulo)}</h1>
  ${a.cuerpo}
  ${ctaBox('Pon en práctica estos consejos con nuestro editor gratuito.')}
  <h2>Sigue leyendo</h2>
  <ul>${otros.map((x) => `<li><a href="${url(`consejos/${x.slug}/`)}">${esc(x.titulo)}</a></li>`).join('')}
  <li><a href="${url('ejemplos/')}">Ejemplos de currículum por oficio</a></li></ul>
</article>`,
  });
});

/* ---------- Pro ---------- */
page('pro/', {
  title: 'CV Listo Pro | Pago único, sin suscripciones',
  active: 'pro',
  description: 'CV Listo Pro: plantillas premium y funciones extra con un pago único. La descarga en PDF siempre seguirá siendo gratis.',
  body: `
<div class="narrow prose">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Pro</p>
  <h1>CV Listo Pro</h1>
  <p>CV Listo es y seguirá siendo <strong>gratis</strong> para crear y descargar tu currículum. La versión Pro es para quien quiera un extra, con un <strong>pago único</strong>, sin suscripciones ni renovaciones automáticas.</p>
  <h2>Qué incluirá</h2>
  <ul class="tick">
    <li>Plantillas premium (Ejecutiva, Creativa y más)</li>
    <li>Más colores y tipos de letra</li>
    <li>Carta de presentación a juego con tu currículum</li>
    <li>Adaptar tu currículum a una oferta de empleo concreta</li>
  </ul>
  ${
    CONFIG.proCheckoutUrl
      ? `<p><a class="btn btn-lg" href="${esc(CONFIG.proCheckoutUrl)}" rel="nofollow">Conseguir Pro</a></p>`
      : `<p><span class="badge">Próximamente</span> Estamos terminándola. Mientras tanto, todo lo demás es gratis.</p>`
  }
  ${ctaBox('Crea tu currículum gratis ahora.')}
</div>`,
});

/* ---------- Páginas legales e institucionales ---------- */
const legal = (path, title, description, html) =>
  page(path, { title: `${title} | CV Listo`, description, body: `<div class="narrow prose"><h1 style="margin-top:32px">${title}</h1>${html}</div>` });

legal(
  'sobre-nosotros/',
  'Quiénes somos',
  'Qué es CV Listo, quién está detrás y por qué es gratis.',
  `<p>CV Listo nació de una idea sencilla: <strong>hacer un currículum no debería costar dinero ni trampas</strong>. Muchas webs te dejan rellenarlo y, al descargar, te piden un pago que acaba siendo una suscripción mensual.</p>
<p>Por eso CV Listo permite crear y descargar el currículum gratis, con ejemplos pensados para trabajos reales: hostelería, comercio, logística, limpieza, cuidados, construcción y atención al cliente.</p>
<h2>¿Cómo se mantiene?</h2>
<p>Con publicidad en las páginas de contenido y, próximamente, con una versión Pro de pago único y opcional. La descarga del currículum siempre será gratuita.</p>
<h2>Tu privacidad</h2>
<p>No pedimos registro. El currículum se guarda solo en tu navegador y no lo recibimos en ningún servidor.</p>
<p>¿Sugerencias? Escríbenos desde la página de <a href="${url('contacto/')}">contacto</a>.</p>`,
);

legal(
  'contacto/',
  'Contacto',
  'Contacta con CV Listo para dudas, sugerencias o incidencias.',
  `<p>¿Tienes una duda, una sugerencia o has encontrado un error? Escríbenos y te responderemos lo antes posible.</p>
<p><strong>Email:</strong> <a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a></p>
<p>Recuerda que no guardamos tu currículum: si borras los datos de tu navegador, no podremos recuperarlo.</p>`,
);

legal(
  'aviso-legal/',
  'Aviso legal',
  'Aviso legal e información del titular de CV Listo.',
  `<h2>Titular del sitio web</h2>
<p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular:</p>
<ul>
  <li><strong>Titular:</strong> ${esc(CONFIG.titular)}</li>
  <li><strong>NIF:</strong> ${esc(CONFIG.nif)}</li>
  <li><strong>Domicilio:</strong> ${esc(CONFIG.domicilio)}</li>
  <li><strong>Email:</strong> ${esc(CONFIG.email)}</li>
</ul>
<h2>Objeto</h2>
<p>Este sitio ofrece una herramienta gratuita para crear currículums, así como ejemplos y consejos de carácter informativo.</p>
<h2>Responsabilidad</h2>
<p>El usuario es responsable de la veracidad de los datos que introduce en su currículum. Los contenidos del sitio son orientativos y no sustituyen el asesoramiento profesional. El titular no se hace responsable del resultado de los procesos de selección.</p>
<h2>Propiedad intelectual</h2>
<p>Los textos, diseños y código del sitio pertenecen a su titular. Los currículums que crees son tuyos y puedes usarlos libremente.</p>
<h2>Legislación aplicable</h2>
<p>Este aviso se rige por la legislación española.</p>`,
);

legal(
  'privacidad/',
  'Política de privacidad',
  'Cómo trata CV Listo tus datos personales.',
  `<h2>Responsable</h2>
<p>${esc(CONFIG.titular)} — ${esc(CONFIG.email)}</p>
<h2>Tu currículum</h2>
<p>Los datos que escribes en el editor (nombre, contacto, experiencia, foto…) <strong>se guardan únicamente en el almacenamiento local de tu navegador</strong>. No se envían a ningún servidor nuestro y no tenemos acceso a ellos. Puedes borrarlos en cualquier momento con el botón "Borrar todo" del editor o borrando los datos del sitio en tu navegador.</p>
<h2>Publicidad</h2>
<p>Este sitio puede mostrar anuncios de Google AdSense en las páginas de contenido. Google y sus socios pueden usar cookies para mostrar anuncios, personalizados o no, según tu consentimiento. Puedes consultar cómo usa Google los datos en <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow">policies.google.com/technologies/partner-sites</a> y gestionar tus preferencias en <a href="https://adssettings.google.com" rel="nofollow">adssettings.google.com</a>.</p>
<p>El editor de currículum no muestra anuncios.</p>
<h2>Contacto por email</h2>
<p>Si nos escribes, usaremos tu email solo para responderte y no lo cederemos a terceros.</p>
<h2>Tus derechos</h2>
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${esc(CONFIG.email)}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>`,
);

legal(
  'cookies/',
  'Política de cookies',
  'Qué cookies usa CV Listo y cómo gestionarlas.',
  `<h2>Almacenamiento propio</h2>
<p>El editor usa el almacenamiento local del navegador para guardar tu currículum mientras lo escribes. Es imprescindible para que funcione y no se usa para rastrearte.</p>
<h2>Cookies de terceros</h2>
<p>En las páginas con publicidad, Google AdSense puede instalar cookies para mostrar y medir anuncios. Solo se usarán con tu consentimiento, que se solicita mediante el aviso de cookies que aparece la primera vez que visitas el sitio.</p>
<h2>Cómo gestionarlas</h2>
<p>Puedes cambiar tu consentimiento desde el aviso de cookies, o borrar y bloquear las cookies desde la configuración de tu navegador.</p>`,
);

/* ---------- 404 ---------- */
pages.push({
  path: '404.html',
  html: layout({
    path: '404.html',
    title: 'Página no encontrada | CV Listo',
    description: 'La página que buscas no existe.',
    ads: false,
    body: `<div class="narrow prose" style="text-align:center;padding:64px 0"><h1>Página no encontrada</h1><p>Puede que el enlace esté mal o que la página se haya movido.</p><p><a class="btn" href="${url()}">Ir al inicio</a></p></div>`,
  }),
});

/* ---------- Escritura ---------- */
await rm(OUT, { recursive: true, force: true });
for (const p of pages) {
  const file = p.path.endsWith('.html') ? join(OUT, p.path) : join(OUT, p.path, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, p.html);
}

await cp(join(ROOT, 'src/css'), join(OUT, 'assets/css'), { recursive: true });
await cp(join(ROOT, 'src/js'), join(OUT, 'assets/js'), { recursive: true });
await cp(join(ROOT, 'src/data'), join(OUT, 'assets/data'), { recursive: true });
await cp(join(ROOT, 'src/vendor'), join(OUT, 'assets/vendor'), { recursive: true });
for (const f of await readdir(join(ROOT, 'src/static'))) await cp(join(ROOT, 'src/static', f), join(OUT, f), { recursive: true });

// App instalable (PWA): es también la base para publicarla en Google Play como TWA.
await writeFile(
  join(OUT, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: `${CONFIG.nombreSitio}: crea tu currículum gratis`,
      short_name: CONFIG.nombreSitio,
      description: 'Crea tu currículum gratis con ejemplos por oficio y descárgalo en PDF.',
      id: BASE,
      start_url: BASE,
      scope: BASE,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#f7f7fc',
      theme_color: '#5b4bff',
      lang: 'es',
      categories: ['business', 'productivity'],
      icons: [
        { src: url('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: url('icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: url('icons/maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Crear currículum', url: url('crear/') },
        { name: 'Ejemplos', url: url('ejemplos/') },
      ],
    },
    null,
    2,
  ),
);

// Service worker: páginas primero desde la red (para ver siempre lo último) y
// recursos desde la caché; así el editor funciona también sin conexión.
const VERSION = Date.now().toString(36);
const PRECACHE = ['', 'crear/', 'assets/css/site.css', 'assets/css/cv.css', 'assets/js/editor.js', 'assets/js/cv-render.js', 'assets/js/importer.js', 'assets/js/i18n.js', 'assets/data/oficios.js', 'assets/data/traducciones.js', 'icons/icon-192.png'].map(url);
await writeFile(
  join(OUT, 'sw.js'),
  `const CACHE = 'cvlisto-${VERSION}';
const PRECACHE = ${JSON.stringify(PRECACHE)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match(${JSON.stringify(url('crear/'))}))));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
});
`,
);

const sitemapUrls = pages.filter((p) => !p.path.endsWith('.html')).map((p) => abs(p.path));
await writeFile(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);
await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
if (CONFIG.adsenseClient) {
  const pub = CONFIG.adsenseClient.replace(/^ca-/, '');
  await writeFile(join(OUT, 'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
}
if (process.env.CUSTOM_DOMAIN) await writeFile(join(OUT, 'CNAME'), `${process.env.CUSTOM_DOMAIN}\n`);

console.log(`✓ ${pages.length} páginas generadas en dist/ (base ${BASE})`);
