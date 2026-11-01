// Genera el sitio estático en dist/. Sin dependencias: solo Node 18+.
//   node scripts/build.mjs
import { mkdir, rm, writeFile, cp, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/config.js';
import { OFICIOS, SECTORES, ejemploCV } from '../src/data/oficios.js';
import { ARTICULOS } from '../src/data/articulos.js';
import { GENERALES } from '../src/data/entrevista.js';
import { renderCV, TEMPLATES } from '../src/js/cv-render.js';
import { generateLetter, emptyLetter } from '../src/js/letter.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');
const BASE = CONFIG.base.endsWith('/') ? CONFIG.base : `${CONFIG.base}/`;
const SITE = CONFIG.url.replace(/\/$/, '');
const YEAR = new Date().getFullYear();

const url = (p = '') => BASE + p.replace(/^\//, '');
const abs = (p = '') => SITE + '/' + p.replace(/^\//, '');

const PROMO = CONFIG.promo?.codigo ? CONFIG.promo : null;
// La oferta desaparece sola pasada la fecha, aunque la web no se vuelva a publicar.
const promoUntil = (sel) =>
  `<script>(function(){if(new Date()>new Date('${PROMO.hasta}T23:59:59')){document.querySelectorAll('${sel}').forEach(function(e){e.remove()})}})()</script>`;
const promoTicket = () =>
  PROMO
    ? `<div class="cp-ticket" id="oferta"><span class="cp-tag">🎉 OFERTA DE LANZAMIENTO</span><div class="cp-off">−${PROMO.descuento}</div>
  <p class="cp-sub">${CONFIG.proCheckoutUrl ? 'en Tu CV Gratis Pro con este código:' : 'en Tu CV Gratis Pro. Guarda este código para cuando abramos la compra:'}</p>
  <div class="cp-code"><b>${PROMO.codigo}</b><button type="button" data-copy="${PROMO.codigo}" onclick="var b=this,t=b.dataset.copy,ok=function(){b.textContent='¡Copiado!';setTimeout(function(){b.textContent='Copiar'},2000)};if(navigator.clipboard){navigator.clipboard.writeText(t).then(ok,function(){prompt('Copia el código:',t)})}else{prompt('Copia el código:',t)}">Copiar</button></div>
  <p class="cp-price"><s>${CONFIG.proPrecio}</s> → <strong>${PROMO.precio}</strong> · pago único</p>
  <p class="cp-time">⏳ Hasta el ${PROMO.hastaTexto}</p></div>${promoUntil('.cp-ticket')}`
    : '';
const PROMO_BAR = PROMO
  ? `<div class="cp-bar" id="cp-bar"><span>🎁 Lanzamiento: Pro con <b>−${PROMO.descuento}</b> usando el código <code>${PROMO.codigo}</code></span><a href="${url('pro/')}#oferta">Ver oferta →</a><button type="button" class="cp-bar-x" aria-label="Cerrar">✕</button></div>
<script>(function(){var b=document.getElementById('cp-bar');try{if(new Date()>new Date('${PROMO.hasta}T23:59:59')||localStorage.getItem('cvlisto:promo-x')==='${PROMO.codigo}'){b.remove();return}}catch(e){}b.querySelector('.cp-bar-x').onclick=function(){b.remove();try{localStorage.setItem('cvlisto:promo-x','${PROMO.codigo}')}catch(e){}}})()</script>`
  : '';

// Primera letra en minúscula, respetando siglas: "auxiliar de enfermería (TCAE)".
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pages = [];

// Herramientas: se muestran en el menú "Herramientas" (ordenador y móvil) y en la portada.
const TOOLS = [
  { href: 'carta/', icon: '✉️', t: 't2', name: 'Carta', desc: 'Se escribe sola con tu currículum' },
  { href: 'crear/?analizar=1', icon: '🎯', t: 't4', name: 'Analizar oferta', desc: 'Qué te falta para cada empleo' },
  { href: 'entrevista/', icon: '🎤', t: 't2', name: 'Simular entrevista', desc: 'Preguntas y respuestas modelo', nuevo: true },
  { href: 'candidaturas/', icon: '📋', t: 't5', name: 'Mis candidaturas', desc: 'Organiza tus envíos', nuevo: true },
  { href: 'herramientas-pdf/', icon: '📎', t: 't1', name: 'Herramientas PDF', desc: 'Unir, comprimir, JPG a PDF…', nuevo: true },
  { href: 'app/', icon: '📲', t: 't3', name: 'Instalar app', desc: 'Tenlo en tu móvil como una app' },
];
const toolCards = (cls = 'tool-card', withDesc = true) =>
  TOOLS.map(
    (x) => `<a class="${cls}" href="${url(x.href)}"><span class="icon-tile ${x.t}">${x.icon}</span><span><strong>${x.name}${x.nuevo ? '<span class="new">NUEVO</span>' : ''}</strong>${withDesc ? `<small>${x.desc}</small>` : ''}</span></a>`,
  ).join('');

// Instalar la app en la pantalla de inicio (ver src/js/install.js).
const INSTALL_DIALOG = `<dialog id="dlg-install">
  <h2>📲 Instala Tu CV Gratis</h2>
  <div data-os="ios">
    <p>En iPhone se instala desde Safari en 3 toques:</p>
    <ol>
      <li>Toca el botón <strong>Compartir</strong> <span aria-hidden="true">(el cuadrado con la flecha ↑)</span>, abajo o arriba de la pantalla.</li>
      <li>Baja y elige <strong>Añadir a pantalla de inicio</strong>.</li>
      <li>Toca <strong>Añadir</strong>. ¡Listo! Te aparecerá el icono como una app más.</li>
    </ol>
    <p class="muted-s">Si usas Chrome en el iPhone, el botón Compartir está arriba a la derecha.</p>
  </div>
  <div data-os="android">
    <p>En Android:</p>
    <ol>
      <li>Toca el menú <strong>⋮</strong> de arriba a la derecha del navegador.</li>
      <li>Elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
      <li>Confirma con <strong>Instalar</strong>. Te aparecerá el icono con tus apps.</li>
    </ol>
  </div>
  <div data-os="desktop">
    <p>En el ordenador (Chrome o Edge):</p>
    <ol>
      <li>Busca el icono de <strong>instalar</strong> <span aria-hidden="true">(una pantalla con una flecha)</span> a la derecha de la barra de direcciones.</li>
      <li>O abre el menú <strong>⋮</strong> → <strong>Guardar y compartir</strong> → <strong>Instalar página como aplicación</strong>.</li>
    </ol>
    <p class="muted-s">También puedes abrir esta web en tu móvil e instalarla allí.</p>
  </div>
  <div class="dlg-actions">
    <button type="button" class="btn" onclick="this.closest('dialog').close()">Entendido</button>
  </div>
</dialog>`;

const INSTALL_BAR = `<div class="install-bar" id="install-bar" hidden>
  <img src="${url('icons/icon-192.png')}" alt="" width="40" height="40">
  <div><strong>Instala la app</strong><small>Gratis, sin ocupar espacio</small></div>
  <button type="button" class="btn btn-sm js-install">Instalar</button>
  <button type="button" class="install-x js-install-close" aria-label="Cerrar">✕</button>
</div>`;

function layout({ path, title, description, body, active = '', ads = true, bodyClass = '', head = '', jsonld = null }) {
  const canonical = abs(path);
  const adsense =
    ads && CONFIG.adsenseClient
      ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CONFIG.adsenseClient)}" crossorigin="anonymous"></script>`
      : '';
  const nav =
    `<details class="tools-dd"><summary>🧰 Herramientas</summary><div class="tools-dd-menu">${toolCards('tool-row', true)}</div></details>` +
    [
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
<script>try{var pro=JSON.parse(localStorage.getItem('cvlisto:pro:v1')||'null');if(pro&&pro.key){document.documentElement.classList.add('is-pro');(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1}}catch(e){}</script>
${adsense}
${head}
</head>
<body class="${bodyClass}">
${/editor-page/.test(bodyClass) ? '' : PROMO_BAR}
<header class="site-head"><div class="wrap">
  <a class="logo" href="${url()}"><span class="logo-mark">CV</span>${CONFIG.nombreSitio}<span class="pro-chip pro-only">👑 PRO</span></a>
  <nav class="nav">${nav}<a class="btn btn-sm" href="${url('crear/')}">Crear mi CV</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="site-foot"><div class="wrap">
  <div><strong>${CONFIG.nombreSitio}</strong> · Currículum gratis, sin trampas. © ${YEAR}</div>
  <nav>
    <a href="${url('entrevista/')}">🎤 Simulador de entrevista</a>
    <a href="${url('candidaturas/')}">📋 Mis candidaturas</a>
    <a href="${url('herramientas-pdf/')}">📎 Herramientas PDF</a>
    <a href="${url('app/')}">📲 Instalar la app</a>
    <a href="${url('pro/')}">Versión Pro</a>
    <a href="${url('sobre-nosotros/')}">Quiénes somos</a>
    <a href="${url('contacto/')}">Contacto</a>
    <a href="${url('aviso-legal/')}">Aviso legal</a>
    <a href="${url('privacidad/')}">Privacidad</a>
    <a href="${url('cookies/')}">Cookies</a>
    <a href="${url('condiciones/')}">Condiciones de venta</a>
  </nav>
</div></footer>
${
  bodyClass.includes('editor-page')
    ? ''
    : `<nav class="tabbar" aria-label="Navegación">
  ${[
    ['', '🏠', 'Inicio', 'inicio'],
    ['ejemplos/', '📄', 'Ejemplos', 'ejemplos'],
    ['crear/', '✚', 'Crear', 'crear', 'fab'],
    ['#herramientas', '🧰', 'Herramientas', 'herramientas', 'js-tools'],
    ['consejos/', '💡', 'Consejos', 'consejos'],
  ]
    .map(
      ([href, icon, label, key, cls]) =>
        `<a href="${href.startsWith('#') ? href : url(href)}"${cls ? ` class="${cls}"` : ''}${active === key ? ' aria-current="page"' : ''}><span class="ti">${icon}</span>${label}</a>`,
    )
    .join('')}
</nav>
<div class="tools-sheet" id="tools-sheet" hidden>
  <div class="tools-sheet-bg js-tools-close"></div>
  <div class="tools-sheet-panel" role="dialog" aria-label="Herramientas">
    <div class="grab"></div>
    <h3>🧰 Herramientas</h3>
    <div class="tools-grid tools-grid-sheet">${toolCards('tool-card', false)}</div>
  </div>
</div>
<script>document.addEventListener('click',function(e){var d=document.querySelector('.tools-dd[open]');if(d&&!d.contains(e.target))d.open=false});</script>
<script>(function(){var s=document.getElementById('tools-sheet');if(!s)return;var b=document.querySelector('.js-tools');function t(open){s.hidden=!open;b.classList.toggle('on',open)}b.addEventListener('click',function(e){e.preventDefault();t(s.hidden)});s.querySelector('.js-tools-close').addEventListener('click',function(){t(false)});addEventListener('keydown',function(e){if(e.key==='Escape')t(false)})})();</script>`
}
${bodyClass.includes('editor-page') ? '' : INSTALL_BAR}
${INSTALL_DIALOG}
<script src="${url('assets/js/install.js')}" defer></script>
<script type="module">import { recheck } from '${url('assets/js/pro.js')}'; recheck();</script>
${CONFIG.cfAnalyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${esc(CONFIG.cfAnalyticsToken)}"}'></script>` : ''}
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
  title: 'Crear currículum gratis online y descargar en PDF | Tu CV Gratis',
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
    <span class="pill free-only">✨ 100% gratis · sin registro</span>
    <span class="pill pro-only">👑 Eres Pro · todo desbloqueado</span>
    <h1>Consigue trabajo con un currículum <span class="hl">que destaca</span></h1>
    <p class="lead">Elige tu oficio, toca las frases que encajan contigo y descarga tu CV en PDF en minutos. Sin suscripciones y sin sorpresas al final.</p>
    <div class="hero-cta">
      <a class="btn btn-white" href="${url('crear/')}">Crear mi currículum →</a>
      <a class="btn btn-lg btn-glass" href="${url('ejemplos/')}">Ver ejemplos</a>
    </div>
    <p class="hero-first"><a href="${url('primer-empleo/')}">🌱 ¿Es tu primer currículum? Te ayudamos paso a paso →</a></p>
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

<section class="section tools-home"><div class="wrap">
  <div class="center"><span class="eyebrow">Todo en un sitio</span><h2>Tus herramientas para conseguir trabajo</h2></div>
  <div class="tools-grid">${toolCards()}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="center"><span class="eyebrow">Así de fácil</span><h2>Tu CV en 3 pasos</h2><p class="sub">Sin complicaciones y desde el móvil.</p></div>
  <div class="grid grid-3">
    <div class="card step"><span class="step-n">1</span><h3>Elige tu oficio</h3><p>Camarero, dependiente, repartidor, cuidadora… Te proponemos frases y habilidades para ese trabajo.</p></div>
    <div class="card step"><span class="step-n">2</span><h3>Toca y personaliza</h3><p>Rellena tus datos, toca las sugerencias que te sirvan y mira el resultado en tiempo real.</p></div>
    <div class="card step"><span class="step-n">3</span><h3>Descarga en PDF</h3><p>Gratis, las veces que quieras. Listo para enviar por email, WhatsApp o portales de empleo.</p></div>
  </div>
</div></section>

<section class="wrap"><div class="first-job">
  <span class="icon-tile t4">🌱</span>
  <div><h2>¿Nunca has hecho un currículum?</h2><p>Responde 8 preguntas sencillas y te lo escribimos. Contamos tus prácticas, voluntariado, cursos y disponibilidad, aunque no hayas tenido un contrato.</p></div>
  <a class="btn btn-lg" href="${url('primer-empleo/')}">Empezar paso a paso</a>
</div></section>

<section class="section section-alt"><div class="wrap">
  <span class="eyebrow">Plantillas</span>
  <h2>Diseños que llaman la atención</h2>
  <p class="sub">Profesionales, limpios y pensados para caber en una página.</p>
  <div class="tpl-gallery">
    ${TEMPLATES.map(
      (t, i) => `<div class="tpl-thumb">${
        `<div class="mini">${renderCV(sampleCV('dependiente', t.id, ['#5b4bff', '#e0457b', '#0f766e', '#c2410c'][i % 4]))}${t.pro ? '<span class="crown">👑 Pro</span>' : ''}</div>`
      }
      <strong>${t.name} ${t.pro ? '<span class="badge badge-pro">Pro</span>' : '<span class="badge badge-free">Gratis</span>'}</strong>
      <small>${t.desc}</small></div>`,
    ).join('')}
  </div>
</div></section>

<section class="section"><div class="wrap">
  <span class="eyebrow">Ejemplos reales</span>
  <h2>Currículums por oficio</h2>
  <p class="sub">${OFICIOS.length} oficios con ejemplo completo. Míralos, cópialos y adáptalos a tu experiencia en un toque.</p>
  <div class="grid grid-3">
    ${OFICIOS.slice(0, 9).map(
      (o, i) => `<a class="card oficio-card" href="${url(`ejemplos/${o.slug}/`)}"><span class="icon-tile ${TILES[i % 5]}">${o.icono}</span><div><h3>${esc(o.nombre)}</h3><p>${esc(o.intro.split('. ')[0])}.</p><span class="more">Ver ejemplo →</span></div></a>`,
    ).join('')}
  </div>
  <p class="center" style="margin-top:24px"><a class="btn btn-lg" href="${url('ejemplos/')}">Ver los ${OFICIOS.length} oficios →</a></p>
</div></section>

<section class="section section-alt"><div class="wrap">
  <div class="center"><span class="eyebrow">Por qué Tu CV Gratis</span><h2>Hecho para ayudarte, no para cobrarte</h2><p class="sub">Lo que otras webs no te cuentan.</p></div>
  <div class="grid grid-3">
    <div class="card"><span class="icon-tile t4">💸</span><h3>Gratis de verdad</h3><p>Otras webs te dejan hacer el CV y te cobran al descargarlo, a veces con una suscripción. Aquí la descarga es gratis.</p></div>
    <div class="card"><span class="icon-tile t3">🧰</span><h3>Para trabajos reales</h3><p>Hostelería, comercio, logística, limpieza, cuidados y más. No solo para oficinas.</p></div>
    <div class="card"><span class="icon-tile t1">🪄</span><h3>Nunca en blanco</h3><p>Frases ya escritas para tu perfil, tus tareas y tus habilidades. Solo tienes que tocarlas.</p></div>
    <div class="card"><span class="icon-tile t4">📂</span><h3>Sube tu CV antiguo</h3><p>¿Ya tienes uno en Word o PDF? Súbelo y pasamos tus datos a una plantilla nueva en segundos.</p></div>
    <div class="card"><span class="icon-tile t5">🌍</span><h3>En 5 idiomas</h3><p>Español, inglés, francés, portugués e italiano. Ideal para trabajar en el extranjero o en zonas turísticas.</p></div>
    <div class="card"><span class="icon-tile t2">🔒</span><h3>Privado</h3><p>Sin registro. Tu currículum se guarda solo en tu dispositivo y no lo enviamos a ningún sitio.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap"><div class="app-promo">
  <div>
    <span class="eyebrow">📲 App gratis</span>
    <h2>Llévalo en el móvil como una app</h2>
    <p>Instala Tu CV Gratis en tu pantalla de inicio: se abre al momento, a pantalla completa y funciona incluso sin conexión. No ocupa casi espacio y no hace falta tienda de aplicaciones.</p>
    <div class="hero-cta">
      <button type="button" class="btn btn-lg js-install" hidden>Instalar la app</button>
      <span class="badge js-install-done" hidden>✅ Ya la tienes instalada</span>
      <a class="btn btn-lg btn-ghost" href="${url('app/')}">Cómo funciona</a>
    </div>
  </div>
  <img class="app-promo-icon" src="${url('icons/icon-512.png')}" alt="Icono de la app Tu CV Gratis" width="160" height="160" loading="lazy">
</div></div></section>

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
const MOBILE_BAR = `<div class="mobile-bar">
  <button type="button" class="btn btn-ghost" id="tab-edit" aria-pressed="true">✎ Editar</button>
  <button type="button" class="btn btn-ghost" id="tab-preview" aria-pressed="false">👁 Ver</button>
  <button type="button" class="btn btn-ghost js-share">📤 Enviar</button>
  <button type="button" class="btn js-download">⬇ PDF</button>
</div>`;

const SHARE_DIALOG = `<dialog id="dlg-shared">
  <h2>PDF descargado ✅</h2>
  <p>Lo tienes en tu carpeta de <strong>Descargas</strong>. Para enviarlo por WhatsApp:</p>
  <ol>
    <li>Abre WhatsApp Web y entra en el chat.</li>
    <li>Pulsa el clip 📎, elige <em>Documento</em> y selecciona el PDF.</li>
  </ol>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Cerrar</button>
    <a class="btn" href="https://web.whatsapp.com/" target="_blank" rel="noopener">Abrir WhatsApp Web</a>
  </div>
</dialog>`;

const PRO_DIALOG = `<dialog id="dlg-pro" class="dlg-pro">
  <button type="button" class="dlg-x" onclick="this.closest('dialog').close()" aria-label="Cerrar">✕</button>
  <div class="dlg-pro-top"><span class="crown-big">👑</span><h2 id="dlg-pro-title">Esta plantilla es Pro</h2><p id="dlg-pro-text">Te queda genial, ¿verdad? Consigue Pro y descárgala hoy.</p></div>
  <ul class="tick">
    <li>8 plantillas premium que destacan</li>
    <li>Descarga en Word (.docx)</li>
    <li>Sin anuncios · pago único, para siempre</li>
    <li>Analizador de ofertas y simulador de entrevista</li>
    <li>Cartas a juego y candidaturas ilimitadas</li>
    <li>Editar y firmar PDF</li>
  </ul>
  <p class="price-line">${CONFIG.proPrecioAntes ? `<s>${CONFIG.proPrecioAntes}</s> ` : ''}<strong>${CONFIG.proPrecio}</strong> · pago único, para siempre</p>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost js-free-tpl">Usar una gratis</button>
    <a class="btn" href="${url('pro/')}">👑 Ver Pro</a>
  </div>
</dialog>`;

const PRINT_DIALOG = `<dialog id="dlg-print">
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
</dialog>`;

page('crear/', {
  title: 'Crear currículum gratis | Tu CV Gratis',
  description: 'Editor de currículum online gratis: rellena tus datos, elige plantilla y descarga en PDF. Sin registro.',
  ads: false,
  bodyClass: 'editor-page',
  head: `<script type="module" src="${url('assets/js/editor.js')}"></script>`,
  body: `
<div class="editor">
  <section class="ed-form" aria-label="Datos del currículum">
    <button type="button" class="cv-switch" id="cv-switch">
      <span class="ico">📁</span>
      <span class="grow"><small>Estás editando</small><strong id="cv-switch-label">Mi currículum</strong></span>
      <span class="cv-switch-more"><span id="cv-switch-count">Crear otro</span> ▾</span>
    </button>
    <div class="progress-card" aria-live="polite">
      <div class="top"><strong id="prog-title">Empecemos tu CV</strong><span class="pct" id="prog-pct">0%</span></div>
      <div class="progress-bar"><i id="prog-bar"></i></div>
      <p id="prog-tip">Elige tu oficio para ver sugerencias.</p>
      <button type="button" class="btn btn-white btn-sm review-btn js-review">🔍 Revisar mi CV <span class="review-badge" id="review-badge"></span></button>
    </div>
    <div class="import-card">
      <span class="ico t4">📂</span>
      <div><strong>¿Ya tienes un currículum?</strong><p>Súbelo (Word, PDF o texto) y pasamos tus datos a la nueva plantilla.</p></div>
      <label class="btn btn-sm" style="cursor:pointer">Subir<input type="file" id="import-input" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden></label>
    </div>
    <a class="import-card first-card" href="${url('primer-empleo/')}">
      <span class="ico t4">🌱</span>
      <div><strong>¿Es tu primer currículum?</strong><p>Responde 8 preguntas sencillas y te lo escribimos.</p></div>
      <span class="btn btn-sm btn-ghost">Empezar</span>
    </a>
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

    <div class="import-card offer-card">
      <span class="ico t4">🎯</span>
      <div><strong>¿Vas a enviarlo a una oferta?</strong><p>Pega el anuncio y te decimos qué palabras clave te faltan.</p></div>
      <button type="button" class="btn btn-sm js-offer">Analizar oferta</button>
    </div>
    <div class="import-card iv-card-link">
      <span class="ico t2">🎤</span>
      <div><strong>¿Te han llamado para una entrevista?</strong><p>Practica las preguntas de tu sector con respuestas modelo.</p></div>
      <a class="btn btn-sm" href="${url('entrevista/')}">Practicar</a>
    </div>
    <div class="import-card tr-card-link">
      <span class="ico t5">📋</span>
      <div><strong>¿Ya lo has enviado?</strong><p>Apunta tus candidaturas y sabrás cuándo volver a llamar.</p></div>
      <a class="btn btn-sm" href="${url('candidaturas/')}">Mis candidaturas</a>
    </div>
    <div class="import-card word-card">
      <span class="ico t3">📄</span>
      <div><strong>Descárgalo en Word <span class="badge badge-pro">👑 Pro</span></strong><p>Para editarlo en tu ordenador o cuando una empresa te lo pida en .docx.</p></div>
      <button type="button" class="btn btn-sm js-word">Descargar .docx</button>
    </div>
    <div class="import-card" style="border-color:#dcd8ff">
      <span class="ico t1">✉️</span>
      <div><strong>¿Te piden carta de presentación?</strong><p>Se escribe sola con los datos de este currículum.</p></div>
      <a class="btn btn-sm" href="${url('carta/')}">Crear carta</a>
    </div>
    <p style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="saved" id="saved"></span>
      <button type="button" class="btn-link" id="btn-reset" style="color:#b91c1c">Vaciar este CV</button>
    </p>
  </section>

  <section class="ed-preview" aria-label="Vista previa">
    <div class="ed-toolbar">
      <span class="grow" id="pages-info"></span>
      <a class="btn btn-ghost" href="${url('carta/')}">✉️ Carta de presentación</a>
      <button type="button" class="btn btn-ghost js-share">📤 Enviar</button>
      <button type="button" class="btn btn-ghost js-word" title="Descargar en Word (Pro)">📄 Word <span class="crown-mini">👑</span></button>
      <button type="button" class="btn js-download">⬇ Descargar PDF gratis</button>
    </div>
    <div class="pro-lock" id="pro-lock" hidden>
      <span>👑 Estás probando una <strong>plantilla Pro</strong>. Pruébala gratis; para descargarla, consigue Pro.</span>
      <span class="pro-lock-btns"><button type="button" class="btn btn-sm btn-ghost js-free-tpl">Usar una gratis</button><a class="btn btn-sm" href="${url('pro/')}">Ver Pro</a></span>
    </div>
    <div class="sheet-wrap" id="sheet"></div>
  </section>
</div>

${MOBILE_BAR}
${PRINT_DIALOG}
${SHARE_DIALOG}

${PRO_DIALOG}

<dialog id="dlg-offer" class="dlg-offer">
  <h2>🎯 Analizador de ofertas <span class="badge badge-pro">👑 Pro</span></h2>
  <div id="offer-step1">
    <p>Copia el texto completo de la oferta de empleo (de InfoJobs, Indeed, LinkedIn…) y pégalo aquí.</p>
    <textarea id="offer-text" rows="9" placeholder="Ej.: Camarero/a de sala. Buscamos persona con experiencia de 2 años, inglés y disponibilidad de fines de semana…"></textarea>
    <div class="dlg-actions">
      <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Cerrar</button>
      <button type="button" class="btn" id="offer-go">Analizar</button>
    </div>
  </div>
  <div id="offer-result" hidden></div>
</dialog>

<dialog id="dlg-example">
  <h2>¿Cargar el ejemplo?</h2>
  <p>Ya tienes un currículum empezado. Si cargas el ejemplo, se sustituirá lo que has escrito.</p>
  <div class="dlg-actions">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Mantener el mío</button>
    <button type="button" class="btn" id="dlg-example-ok">Cargar ejemplo</button>
  </div>
</dialog>

<dialog id="dlg-cvs" class="dlg-wide">
  <h2>Mis currículums</h2>
  <p class="hint" style="margin:0 0 12px">Ten uno para cada tipo de trabajo. Se guardan solo en este dispositivo.</p>
  <ul class="cvs-list" id="cvs-list"></ul>
  <div class="dlg-actions" style="justify-content:space-between">
    <button type="button" class="btn btn-ghost" onclick="this.closest('dialog').close()">Cerrar</button>
    <button type="button" class="btn" id="cvs-new">+ Nuevo currículum</button>
  </div>
</dialog>

<dialog id="dlg-review" class="dlg-wide">
  <div class="review-head">
    <div class="score" id="review-score"><span></span></div>
    <div><h2 id="review-title">Revisión de tu CV</h2><p id="review-sub" style="margin:0"></p></div>
  </div>
  <ul class="review-list" id="review-list"></ul>
  <div class="dlg-actions">
    <button type="button" class="btn" onclick="this.closest('dialog').close()">Cerrar</button>
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

/* ---------- Asistente primer empleo ---------- */
page('primer-empleo/', {
  title: 'Currículum para tu primer empleo, paso a paso y gratis | Tu CV Gratis',
  description:
    'Haz tu primer currículum respondiendo 8 preguntas sencillas. Ideal si no tienes experiencia: contamos tus prácticas, voluntariado y cursos. Gratis y sin registro.',
  ads: false,
  bodyClass: 'editor-page wizard-page',
  head: `<script type="module" src="${url('assets/js/wizard.js')}"></script>`,
  body: `
<div class="wizard">
  <div class="w-top">
    <div class="w-count" id="w-count"></div>
    <div class="progress-bar w-progress"><i id="w-bar"></i></div>
  </div>
  <div class="w-card">
    <h1 id="w-title"></h1>
    <p class="w-sub" id="w-sub"></p>
    <div id="w-body"></div>
    <p class="w-error" id="w-error" role="alert"></p>
  </div>
  <div class="w-nav">
    <button type="button" class="btn btn-ghost" id="w-back">← Atrás</button>
    <button type="button" class="btn" id="w-next">Siguiente →</button>
  </div>
  <input type="hidden" id="w-done-url" value="${url('crear/')}">
  <p class="w-skip"><a href="${url('crear/')}">Prefiero rellenarlo yo directamente</a></p>
</div>`,
});

/* ---------- Carta de presentación ---------- */
page('carta/', {
  title: 'Carta de presentación gratis: se escribe sola con tu CV | Tu CV Gratis',
  description:
    'Crea tu carta de presentación en 1 minuto: usa los datos de tu currículum, elige empresa y puesto, y descárgala en PDF gratis. En español, inglés, francés, portugués e italiano.',
  active: 'carta',
  ads: false,
  bodyClass: 'editor-page',
  head: `<script type="module" src="${url('assets/js/carta-editor.js')}"></script>`,
  body: `
<div class="editor">
  <section class="ed-form" aria-label="Datos de la carta">
    <div class="progress-card">
      <div class="top"><strong>✉️ Carta de presentación</strong></div>
      <p style="margin-top:6px">Se escribe sola con los datos de tu currículum. Solo dinos a qué empresa y puesto te presentas.</p>
    </div>

    <div class="import-card" id="cv-missing" hidden>
      <span class="ico t3">📄</span>
      <div><strong>Primero crea tu currículum</strong><p>La carta usa tu nombre, tu experiencia y tus habilidades.</p></div>
      <a class="btn btn-sm" href="${url('crear/')}">Crear CV</a>
    </div>
    <div class="import-card" id="cv-ok" hidden>
      <span class="ico t4">✅</span>
      <div><strong id="cv-name"></strong><p>Usamos los datos de tu currículum.</p></div>
      <a class="btn btn-sm btn-ghost" href="${url('crear/')}">Editar CV</a>
    </div>

    <details class="ed-block" open><summary><span class="ico t1">🏢</span>¿A dónde la envías?</summary><div class="ed-body">
      <div class="field"><label for="l-empresa">Empresa</label><input id="l-empresa" data-l="empresa" placeholder="Ej.: Hotel Miramar"></div>
      <div class="field"><label for="l-puesto">Puesto al que te presentas</label><input id="l-puesto" data-l="puesto"></div>
      <div class="field"><label for="l-contacto">Persona de contacto (opcional)</label><input id="l-contacto" data-l="contacto" placeholder="Ej.: Sra. García"></div>
      <div class="field"><label for="l-fuente">¿Dónde viste la oferta?</label><select id="l-fuente" data-l="fuente"></select></div>
      <div class="field" id="portal-field"><label for="l-portal">Nombre del portal (opcional)</label><input id="l-portal" data-l="portal" placeholder="Ej.: InfoJobs, Indeed, LinkedIn"></div>
    </div></details>

    <details class="ed-block" open><summary><span class="ico t2">✍️</span>Texto de la carta</summary><div class="ed-body">
      <p class="hint">Puedes cambiar lo que quieras. Deja una línea en blanco entre párrafos.</p>
      <div class="field"><textarea id="l-texto" rows="16" aria-label="Texto de la carta"></textarea></div>
      <p class="lang-note" id="regen-hint" hidden>Has cambiado el texto a mano, así que no lo tocamos. <button type="button" class="btn-link" id="btn-regen">Volver a escribirla con los datos nuevos</button></p>
      <button type="button" class="add-btn" id="btn-variant">🔄 Otra versión</button>
    </div></details>

    <details class="ed-block" open><summary><span class="ico t5">🎨</span>Diseño e idioma</summary><div class="ed-body">
      <div class="lbl">Diseño de la carta</div>
      <div class="tpl-pick" id="letter-pick"></div>
      <div class="lbl" style="margin-top:12px">Idioma</div>
      <div class="chips" id="lang-pick"></div>
      <p class="hint" style="margin:0">El color es el mismo que el de tu currículum.</p>
    </div></details>

    <p><span class="saved" id="saved"></span></p>
  </section>

  <section class="ed-preview" aria-label="Vista previa">
    <div class="ed-toolbar">
      <span class="grow" id="pages-info"></span>
      <a class="btn btn-ghost" href="${url('crear/')}">📄 Mi currículum</a>
      <button type="button" class="btn btn-ghost js-share">📤 Enviar</button>
      <button type="button" class="btn js-download">⬇ Descargar PDF gratis</button>
    </div>
    <div class="pro-lock" id="pro-lock" hidden>
      <span>👑 Estás probando un <strong>diseño Pro</strong>. Pruébalo gratis; para descargarlo, consigue Pro.</span>
      <span class="pro-lock-btns"><button type="button" class="btn btn-sm btn-ghost js-free-tpl">Usar la sencilla</button><a class="btn btn-sm" href="${url('pro/')}">Ver Pro</a></span>
    </div>
    <div class="sheet-wrap" id="sheet"></div>
  </section>
</div>

${MOBILE_BAR}
${PRO_DIALOG}
${PRINT_DIALOG}
${SHARE_DIALOG}

<div id="print-root"></div>`,
});

/* ---------- Ejemplos ---------- */
page('ejemplos/', {
  title: `${OFICIOS.length} ejemplos de currículum por oficio (gratis) | Tu CV Gratis`,
  description: `${OFICIOS.length} ejemplos de currículum para camarero, cajero, conductor, electricista, auxiliar de enfermería, limpieza y más. Cópialos y descárgalos en PDF gratis.`,
  active: 'ejemplos',
  body: `
<div class="wrap">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Ejemplos</p>
  <div class="prose"><h1>Ejemplos de currículum por oficio</h1>
  <p>Elige tu trabajo y verás un currículum de ejemplo completo, con las tareas y habilidades que más piden las empresas. Con un toque lo abres en el editor y lo adaptas a ti.</p></div>
  <nav class="sector-nav" aria-label="Sectores">${SECTORES.map((sec) => `<a href="#${sec.id}">${esc(sec.nombre)}</a>`).join('')}</nav>
  ${SECTORES.map(
    (sec, si) => `<section class="sector" id="${sec.id}"><h2>${esc(sec.nombre)}</h2><div class="grid grid-3">${OFICIOS.filter((o) => o.sector === sec.id)
      .map(
        (o) => `<a class="card oficio-card" href="${url(`ejemplos/${o.slug}/`)}"><span class="icon-tile ${TILES[si % 5]}">${o.icono}</span><div><h3>Currículum de ${esc(lc(o.nombre))}</h3><p>${esc(o.descripcion)}</p><span class="more">Ver ejemplo →</span></div></a>`,
      )
      .join('')}</div></section>`,
  ).join('')}
</div>`,
});

OFICIOS.forEach((o, idx) => {
  const ejemplo = renderCV(sampleCV(o.slug, idx % 2 ? 'clasica' : 'moderna', ['#5b4bff', '#0f766e', '#e0457b'][idx % 3]));
  // Primero los del mismo sector, luego el resto.
  const otros = [...OFICIOS.filter((x) => x.sector === o.sector), ...OFICIOS.filter((x) => x.sector !== o.sector)]
    .filter((x) => x.slug !== o.slug)
    .slice(0, 5);
  const carta = generateLetter({ ...sampleCV(o.slug, 'clasica'), lang: 'es' }, { ...emptyLetter(), empresa: 'Empresa Ejemplo' }, o);
  page(`ejemplos/${o.slug}/`, {
    title: `${o.titulo} | Tu CV Gratis`,
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
  <h1>Currículum de ${esc(lc(o.nombre))}: <span class="grad-text">ejemplo y plantilla</span></h1>
  <p>${esc(o.intro)}</p>
  ${ctaBox('Usa este ejemplo como base y cámbialo en 5 minutos.', `crear/?oficio=${o.slug}`, 'Usar este ejemplo')}

  <h2>Ejemplo completo</h2>
  <div class="example-preview"><div class="scaler" data-fit>${ejemplo}</div></div>

  <h2>Cómo escribir el perfil</h2>
  <p>El perfil son 2 o 3 líneas al principio que resumen quién eres y qué ofreces. Dos ejemplos que puedes adaptar:</p>
  ${o.perfiles.map((p, i) => `<div class="perfil-ej"><strong>${i === 0 ? 'Con experiencia' : 'Sin experiencia'}:</strong> ${esc(p)}</div>`).join('')}

  <h2>Tareas y funciones de ${esc(lc(o.nombre))}</h2>
  <p>Elige las que hayas hecho de verdad y ponlas en tu experiencia, empezando por las más importantes:</p>
  <ul class="tick">${o.tareas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

  <h2>Habilidades que buscan las empresas</h2>
  <ul class="tags">${o.habilidades.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>

  <h2>Consejos para que te llamen</h2>
  <ul>${o.consejos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

  <h2>Carta de presentación de ${esc(lc(o.nombre))}</h2>
  <p>Así queda una carta escrita automáticamente con los datos de este currículum. La tuya se escribe igual, con tus datos.</p>
  <div class="letter-sample">${carta
    .split('\n\n')
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')}</div>

  ${ctaBox(`Crea tu currículum de ${esc(lc(o.nombre))} gratis.`, `crear/?oficio=${o.slug}`, 'Empezar ahora')}

  <h2>Otros ejemplos</h2>
  <ul>${otros.map((x) => `<li><a href="${url(`ejemplos/${x.slug}/`)}">Currículum de ${esc(lc(x.nombre))}</a></li>`).join('')}
  <li><a href="${url('consejos/curriculum-sin-experiencia/')}">Cómo hacer un currículum sin experiencia</a></li></ul>
</div>
${FIT_SCRIPT}`,
  });
});

/* ---------- Consejos ---------- */
page('consejos/', {
  title: 'Consejos para hacer un buen currículum | Tu CV Gratis',
  description: 'Guías prácticas para tu currículum y tu búsqueda de empleo: perfil, habilidades, entrevistas, trabajo de verano, sin experiencia y más.',
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
    title: `${a.titulo} | Tu CV Gratis`,
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

/* ---------- Simulador de entrevista ---------- */
page('entrevista/', {
  title: 'Simulador de entrevista de trabajo: preguntas y respuestas | Tu CV Gratis',
  description: 'Practica tu entrevista de trabajo con las preguntas más habituales y por sector (hostelería, comercio, logística…), con consejos y respuestas modelo.',
  body: `
<section class="iv-hero"><div class="narrow">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Simulador de entrevista</p>
  <span class="eyebrow">🎤 Simulador de entrevista</span>
  <h1>Llega a la entrevista con las respuestas preparadas</h1>
  <p class="sub">Practica las preguntas que más se repiten y las de tu sector. Escribe tu respuesta, escúchala en voz alta y compárala con una respuesta modelo.</p>
</div></section>
<div class="narrow iv">
  <div class="chips iv-groups" id="iv-groups"></div>
  <div class="iv-card" id="iv-card"><p class="muted-s">Cargando preguntas…</p></div>
  <a id="iv-pro-link" href="${url('pro/')}" hidden>Pro</a>
  <p class="muted-s center" style="margin-top:20px">Tus respuestas se guardan solo en este dispositivo. ¿Quieres más consejos? Lee <a href="${url('consejos/como-preparar-una-entrevista-de-trabajo/')}">cómo preparar una entrevista de trabajo</a>.</p>
</div>
<div class="narrow prose">
  <h2>Cómo usar el simulador</h2>
  <ol>
    <li><strong>Elige un grupo de preguntas.</strong> Empieza por las generales, que salen en casi todas las entrevistas, y sigue con las de tu sector. Si ya has creado tu currículum, tu sector aparece marcado con ⭐.</li>
    <li><strong>Responde antes de mirar.</strong> Escribe tu respuesta o dila en voz alta, como si tuvieras delante a la persona que te entrevista. Pulsa "🔊 Escuchar" para oír la pregunta.</li>
    <li><strong>Compara con la respuesta modelo.</strong> Fíjate en qué busca la empresa con esa pregunta y en el consejo. No copies la respuesta: adáptala a tu experiencia real.</li>
    <li><strong>Repite hasta que te salga natural.</strong> Lo ideal es contestar en uno o dos minutos, sin leer y con ejemplos concretos.</li>
  </ol>
  <h2>Las preguntas que más se repiten en una entrevista</h2>
  <p>Estas son las preguntas generales que hacen en casi cualquier entrevista de trabajo, tanto en hostelería y comercio como en oficinas o fábricas, y lo que la empresa quiere descubrir con cada una:</p>
  <ol>${GENERALES.map((g) => `<li><strong>${esc(g.q)}</strong> ${esc(g.busca)}</li>`).join('')}</ol>
  <h2>Consejos para el día de la entrevista</h2>
  <ul>
    <li><strong>Infórmate sobre la empresa:</strong> qué hace, dónde está y qué tipo de clientes tiene. Mira su web y sus redes sociales. Es la mejor forma de responder a "¿por qué quieres trabajar aquí?".</li>
    <li><strong>Llega 10 minutos antes</strong> y revisa el camino el día anterior. Si la entrevista es por videollamada, prueba la cámara, el micrófono y la conexión con tiempo.</li>
    <li><strong>Lleva tu currículum impreso</strong> y una lista con tus fechas de trabajo, para no dudar si te preguntan por ellas.</li>
    <li><strong>Usa ejemplos reales.</strong> En lugar de "soy muy trabajador", cuenta una situación concreta: qué pasó, qué hiciste y qué resultado tuvo.</li>
    <li><strong>Habla bien de tus antiguos trabajos,</strong> aunque te fuera mal en alguno. Criticar a un jefe anterior es de lo que peor impresión causa.</li>
    <li><strong>Prepara una o dos preguntas</strong> para el final: cómo es un día normal en el puesto, cómo es el equipo o cuáles son los siguientes pasos del proceso.</li>
    <li><strong>Después, da las gracias.</strong> Si en una semana no sabes nada, es correcto llamar o escribir para preguntar cómo va el proceso.</li>
  </ul>
  <h2>Preguntas frecuentes</h2>
  <h3>¿Cuánto tiempo debo practicar?</h3><p>Con 20 o 30 minutos al día durante dos o tres días es suficiente para llegar con soltura. Practica sobre todo las preguntas generales y dos o tres de tu sector.</p>
  <h3>¿Se guardan mis respuestas?</h3><p>Sí, en tu propio dispositivo. No se envían a ningún sitio: si vuelves otro día, las encontrarás donde las dejaste.</p>
  <h3>¿Es gratis?</h3><p>Puedes practicar todas las preguntas gratis y ver el consejo y la respuesta modelo de las tres primeras. Con <a href="${url('pro/')}">Tu CV Gratis Pro</a> se desbloquean las respuestas modelo de todas.</p>
  <p>¿Aún no tienes el currículum listo? <a href="${url('crear/')}">Créalo gratis aquí</a> y apunta tus envíos en <a href="${url('candidaturas/')}">Mis candidaturas</a>.</p>
</div>
<script type="module" src="${url('assets/js/interview.js')}"></script>`,
});

/* ---------- Seguimiento de candidaturas ---------- */
page('candidaturas/', {
  title: 'Seguimiento de candidaturas: organiza tu búsqueda de empleo | Tu CV Gratis',
  description: 'Apunta a qué empresas has enviado tu currículum, en qué estado está cada proceso y cuándo volver a llamar. Gratis y sin registro.',
  ads: false,
  body: `
<section class="iv-hero"><div class="narrow">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Mis candidaturas</p>
  <span class="eyebrow">📋 Seguimiento de candidaturas</span>
  <h1>Tu búsqueda de empleo, bajo control</h1>
  <p class="sub">Apunta cada CV que envías y en qué punto está. Te avisamos cuando toca volver a llamar.</p>
</div></section>
<div class="narrow tr">
  <div class="tr-stats" id="tr-stats"></div>
  <div class="tr-bar"><div class="chips" id="tr-filters"></div><button type="button" class="btn" id="tr-add">+ Añadir candidatura</button></div>
  <p class="pro-lock" id="tr-limit" hidden><span>👑 Sin Pro puedes seguir 3 candidaturas. Con Pro, todas las que quieras.</span><a class="btn btn-sm" href="${url('pro/')}">Ver Pro</a></p>
  <div id="tr-list"></div>
  <p class="muted-s center" style="margin-top:20px">Tus candidaturas se guardan solo en este dispositivo.</p>
</div>
<dialog id="dlg-tr">
  <h2 id="tr-dlg-title">Nueva candidatura</h2>
  <form id="tr-form" class="tr-form">
    <div class="field"><label for="tr-empresa">Empresa *</label><input id="tr-empresa" name="empresa" required placeholder="Ej.: Hotel Miramar"></div>
    <div class="field"><label for="tr-puesto">Puesto</label><input id="tr-puesto" name="puesto" placeholder="Ej.: Recepcionista"></div>
    <div class="tr-row">
      <div class="field"><label for="tr-fecha">Fecha de envío</label><input id="tr-fecha" name="fecha" type="date"></div>
      <div class="field"><label for="tr-estado">Estado</label><select id="tr-estado" name="estado"></select></div>
    </div>
    <div class="field"><label for="tr-enlace">Enlace a la oferta</label><input id="tr-enlace" name="enlace" inputmode="url" placeholder="https://…"></div>
    <div class="field"><label for="tr-contacto">Persona de contacto</label><input id="tr-contacto" name="contacto" placeholder="Nombre, teléfono o email"></div>
    <div class="field"><label for="tr-notas">Notas</label><textarea id="tr-notas" name="notas" rows="3" placeholder="Ej.: Entrevista el martes a las 10:00"></textarea></div>
    <div class="dlg-actions"><button type="button" class="btn btn-ghost" id="tr-cancel">Cancelar</button><button type="submit" class="btn">Guardar</button></div>
  </form>
</dialog>
${PRO_DIALOG}
<script type="module" src="${url('assets/js/tracker.js')}"></script>`,
});

/* ---------- Herramientas PDF ---------- */
const PDF_TOOLS = [
  {
    slug: 'editar-firmar-pdf', tool: 'editar', icon: '✍️', t: 't3', name: 'Editar y firmar PDF', pro: true,
    title: 'Editar y firmar PDF online: cambia el texto y añade tu firma | Tu CV Gratis',
    h1: 'Editar y firmar PDF',
    lead: 'Cambia el texto de un PDF, rellena formularios, marca casillas y añade tu firma, escrita o dibujada con el dedo.',
    desc: 'Edita el texto de un PDF y fírmalo desde el móvil o el ordenador: escribe tu nombre como firma o dibújala, rellena formularios y marca casillas. Sin subir tus archivos.',
    steps: ['Elige el PDF.', 'Toca "Editar texto" y después el texto que quieras cambiar, o usa "Añadir texto", "Fecha" o "Marcar".', 'Toca "Firmar": escribe tu nombre y elige un estilo de firma, dibújala con el dedo o sube una foto de tu firma.', 'Coloca la firma en su sitio, ajusta el tamaño y descarga el PDF.'],
    guide: `<h2>Qué puedes hacer</h2>
<ul><li><strong>Cambiar un texto del PDF:</strong> tocas la línea, escribes lo nuevo y queda en su sitio, con un tamaño y un color parecidos al original.</li><li><strong>Escribir donde quieras:</strong> tu nombre, tu DNI, una dirección o cualquier dato que falte.</li><li><strong>Rellenar formularios:</strong> si el PDF trae campos para escribir, aparecen en una lista para rellenarlos cómodamente.</li><li><strong>Marcar casillas</strong> con ✓ o ✗, <strong>tapar</strong> datos que no quieras enseñar y <strong>resaltar</strong> lo importante.</li><li><strong>Añadir imágenes,</strong> como un logotipo o un sello.</li></ul>
<h2>Tu firma, en segundos</h2>
<p>Escribe tu nombre y elige entre varios estilos de letra de firma, dibújala con el dedo o el ratón, o sube una foto de tu firma en papel: quitamos el fondo blanco automáticamente. Puedes guardarla en tu dispositivo para no tener que hacerla otra vez.</p>
<p>Es una firma que se añade al documento como imagen, igual que si lo imprimieras, lo firmaras y lo escanearas, pero sin papel. Sirve para el día a día: aceptar una oferta de trabajo, autorizaciones, formularios o documentos entre particulares.</p>
<h2>Consejos</h2>
<ul><li>Si el PDF es un escaneo o una foto, no tiene texto que se pueda tocar. Usa "Tapar" sobre lo que quieras cambiar y escribe encima con "Añadir texto".</li><li>Amplía la página con los dedos para colocar la firma con precisión.</li><li>Antes de enviarlo, abre el PDF descargado y revisa que todo esté en su sitio.</li></ul>`,
    faq: [['¿Puedo probarlo gratis?', 'Sí. Puedes abrir tu PDF, editarlo y firmarlo para ver cómo queda. Para descargar el resultado necesitas Tu CV Gratis Pro, con pago único y sin suscripciones.'], ['¿Se guarda mi firma en algún servidor?', 'No. Si eliges recordarla, se guarda solo en tu propio dispositivo. Tus documentos tampoco se suben a internet.'], ['¿Se pueden cambiar las palabras originales del PDF?', 'Se tapan con el color del fondo y se escribe el texto nuevo encima, en la misma posición. Es como lo hacen la mayoría de editores de PDF.']],
  },
  {
    slug: 'unir-pdf', tool: 'unir', icon: '📎', t: 't1', name: 'Unir PDF',
    title: 'Unir PDF gratis y sin subir archivos | Tu CV Gratis',
    h1: 'Unir PDF gratis',
    lead: 'Junta varios PDF en uno solo: tu currículum, la carta de presentación y tus títulos en un único archivo, como piden muchas empresas.',
    desc: 'Une varios PDF en uno gratis desde el móvil o el ordenador. Sin registro, sin marcas de agua y sin subir tus archivos a ningún servidor.',
    steps: ['Elige dos o más archivos PDF.', 'Ordénalos con las flechas.', 'Pulsa "Unir PDF" y descarga el resultado.'],
    guide: `<h2>¿Cuándo hace falta unir PDF?</h2>
<p>Muchas ofertas de empleo solo dejan adjuntar <strong>un archivo</strong>, y otras te piden "currículum, carta de presentación y títulos" en el mismo envío. Si mandas cinco archivos sueltos, es fácil que alguno se pierda o que nadie lo abra. Con un único PDF, quien lo recibe tiene toda tu información en orden y de un vistazo.</p>
<h2>En qué orden poner los documentos</h2>
<ol><li><strong>Carta de presentación</strong>, si la envías: es lo primero que se lee.</li><li><strong>Currículum.</strong></li><li><strong>Títulos y certificados</strong>, del más importante para el puesto al menos importante.</li><li><strong>Otros documentos</strong> que pida la oferta: carné, cartas de recomendación…</li></ol>
<h2>Consejos para el archivo final</h2>
<ul><li>Ponle un nombre claro, por ejemplo <em>CV-Laura-Garcia-Recepcionista.pdf</em>. Evita nombres como <em>documento(3).pdf</em>.</li><li>Si el PDF final pesa más de 2 MB, pásalo por <a href="${url('comprimir-pdf/')}">Comprimir PDF</a>: muchos portales de empleo no aceptan archivos más grandes.</li><li>Si tienes algún título en foto, conviértelo antes con <a href="${url('jpg-a-pdf/')}">JPG a PDF</a> y después únelo con el resto.</li></ul>`,
    faq: [['¿Hay límite de archivos?', 'No. Puedes unir todos los que quieras; con archivos muy grandes puede tardar un poco más en el móvil.'], ['¿Pone marca de agua?', 'No. El PDF unido queda exactamente igual que los originales.']],
  },
  {
    slug: 'jpg-a-pdf', tool: 'jpg-a-pdf', icon: '🖼️', t: 't3', name: 'JPG a PDF',
    title: 'Convertir JPG a PDF gratis (fotos a PDF) | Tu CV Gratis',
    h1: 'Convertir JPG a PDF',
    lead: 'Pasa a PDF las fotos de tu título, tu DNI o un certificado. Puedes juntar varias imágenes en un mismo PDF.',
    desc: 'Convierte fotos e imágenes JPG o PNG a PDF gratis. Ideal para títulos, certificados y documentos. Sin subir nada a internet.',
    steps: ['Elige una o varias fotos (JPG, PNG…).', 'Ordénalas y elige el tamaño de página.', 'Pulsa "Crear PDF" y descárgalo.'],
    guide: `<h2>Cómo hacer una buena foto de un documento</h2>
<ul><li><strong>Luz natural y sin flash:</strong> junto a una ventana, de día. El flash crea brillos que tapan el texto.</li><li><strong>Fondo liso y oscuro,</strong> como una mesa, para que se vean bien los bordes del papel.</li><li><strong>El móvil paralelo al papel,</strong> justo encima, para que el documento no salga torcido ni deformado.</li><li><strong>Que se vea entero,</strong> con un poco de margen alrededor, y comprueba que el texto se lee al ampliar la foto.</li></ul>
<h2>¿Qué documentos se suelen pedir en PDF?</h2>
<p>En los procesos de selección es habitual que pidan el título de la ESO, Bachillerato, FP o la universidad, certificados de cursos (por ejemplo, manipulador de alimentos o prevención de riesgos laborales), el carné de conducir, el DNI o NIE y la vida laboral. Si los tienes en papel, una foto convertida a PDF es suficiente en la mayoría de los casos.</p>
<h2>Si la foto no se convierte</h2>
<p>Algunos móviles guardan las fotos en formato <strong>HEIC</strong>, que no todos los navegadores pueden abrir. En iPhone puedes cambiarlo en <em>Ajustes › Cámara › Formatos › Más compatible</em>. Otra solución rápida es hacer una captura de pantalla de la foto y convertir la captura.</p>`,
    faq: [['¿Puedo hacer la foto con el móvil?', 'Sí. Haz la foto con buena luz y sobre un fondo liso, y conviértela aquí directamente.'], ['¿Se pierde calidad?', 'Muy poca. Las imágenes se optimizan para que el PDF no pese demasiado.']],
  },
  {
    slug: 'comprimir-pdf', tool: 'comprimir', icon: '🗜️', t: 't4', name: 'Comprimir PDF',
    title: 'Comprimir PDF gratis: reduce el tamaño de tu PDF | Tu CV Gratis',
    h1: 'Comprimir PDF',
    lead: 'Muchos portales de empleo no aceptan archivos de más de 2 MB. Reduce el peso de tu PDF en segundos.',
    desc: 'Reduce el tamaño de un PDF gratis para poder enviarlo por email o subirlo a portales de empleo. Sin registro y sin subir tus archivos.',
    steps: ['Elige el PDF que pesa demasiado.', 'Elige el nivel de compresión.', 'Pulsa "Comprimir PDF" y descarga la versión ligera.'],
    guide: `<h2>¿Por qué pesa tanto mi PDF?</h2>
<p>Casi siempre por las <strong>imágenes</strong>: documentos escaneados, fotos de títulos hechas con el móvil o currículums con una foto muy grande. Un PDF con solo texto pesa muy poco, pero cada página escaneada puede ocupar varios megas.</p>
<h2>Límites de tamaño habituales</h2>
<ul><li>Muchos portales de empleo y formularios web aceptan archivos de <strong>2 MB</strong> como máximo, y algunos solo 1 MB.</li><li>En el correo electrónico, lo normal es un límite de 20 a 25 MB por mensaje, pero un adjunto ligero llega antes y se abre mejor en el móvil.</li><li>Para un currículum, lo ideal es que pese <strong>menos de 1 MB</strong>.</li></ul>
<h2>Qué nivel de compresión elegir</h2>
<p>Empieza por el nivel intermedio. Si el archivo sigue pesando demasiado, prueba el máximo; si el texto se ve borroso al ampliarlo, vuelve a un nivel más suave. Revisa siempre el resultado antes de enviarlo.</p>`,
    faq: [['¿Funciona con cualquier PDF?', 'Funciona muy bien con PDF escaneados o con fotos. Si tu PDF es solo texto, puede que ya esté optimizado.'], ['¿Por qué no puedo seleccionar el texto después?', 'Para reducir tanto el peso, cada página se guarda como imagen. Se ve igual, pero el texto no se puede copiar.']],
  },
  {
    slug: 'pdf-a-jpg', tool: 'pdf-a-jpg', icon: '📸', t: 't2', name: 'PDF a JPG',
    title: 'Convertir PDF a JPG gratis | Tu CV Gratis',
    h1: 'Convertir PDF a JPG',
    lead: 'Convierte cada página de un PDF en una imagen JPG: para compartirla por WhatsApp, subirla a redes o a un formulario que solo acepta imágenes.',
    desc: 'Convierte las páginas de un PDF a imágenes JPG gratis, en alta calidad. Sin registro y sin subir tus archivos a internet.',
    steps: ['Elige un PDF.', 'Elige la calidad.', 'Pulsa "Convertir a JPG": si tiene varias páginas, las descargas todas juntas en un .zip.'],
    guide: `<h2>¿Para qué sirve pasar un PDF a imagen?</h2>
<ul><li><strong>Para compartirlo por WhatsApp o redes sociales:</strong> una imagen se ve directamente en el chat, sin tener que abrir ni descargar nada.</li><li><strong>Para formularios que solo aceptan imágenes,</strong> como algunos perfiles de portales de empleo.</li><li><strong>Para sacar una página concreta</strong> de un documento largo y enseñarla.</li></ul>
<h2>Qué calidad elegir</h2>
<p>La calidad normal es suficiente para verlo en el móvil o compartirlo. La alta es mejor si vas a imprimir la imagen o si el documento tiene letra pequeña. Las imágenes en alta calidad pesan más.</p>
<p>Si lo que necesitas es lo contrario, convertir fotos en un PDF, usa <a href="${url('jpg-a-pdf/')}">JPG a PDF</a>.</p>`,
    faq: [['¿Cómo abro el .zip en el móvil?', 'En Android, desde la app "Archivos"; en iPhone, tocando el archivo en la app "Archivos". Se descomprime con un toque.']],
  },
  {
    slug: 'dividir-pdf', tool: 'dividir', icon: '✂️', t: 't5', name: 'Dividir PDF',
    title: 'Dividir PDF y extraer páginas gratis | Tu CV Gratis',
    h1: 'Dividir PDF y extraer páginas',
    lead: 'Quédate solo con las páginas que necesitas, o separa cada página en un PDF distinto.',
    desc: 'Extrae páginas de un PDF o sepáralo en varios archivos gratis. Sin registro, sin marcas de agua y sin subir tus archivos.',
    steps: ['Elige un PDF.', 'Escribe las páginas que quieres (por ejemplo 1-3, 5) o marca "separar cada página".', 'Pulsa "Extraer páginas" y descarga.'],
    guide: `<h2>Casos en los que te sirve</h2>
<ul><li>Te han enviado un documento largo y solo tienes que entregar <strong>una o dos páginas</strong>, por ejemplo la del título o la de un certificado.</li><li>Escaneaste varios documentos juntos y necesitas <strong>separarlos</strong> en archivos distintos.</li><li>Tu currículum tiene una página de más y quieres enviar <strong>solo la primera</strong>.</li><li>Un archivo pesa demasiado para subirlo de una vez y quieres <strong>partirlo</strong> en trozos.</li></ul>
<h2>Consejo</h2>
<p>Después de separar las páginas, ponle a cada archivo un nombre que diga qué es: <em>Titulo-FP.pdf</em>, <em>Certificado-PRL.pdf</em>… Así quien lo recibe lo encuentra a la primera. Si luego quieres juntar algunas páginas con otros documentos, usa <a href="${url('unir-pdf/')}">Unir PDF</a>.</p>`,
    faq: [['¿Cómo indico las páginas?', 'Con números y guiones: "2" es la página 2, "1-3" las páginas 1, 2 y 3, y "1-3, 7" añade también la 7.']],
  },
  {
    slug: 'pdf-a-word', tool: 'pdf-a-word', icon: '📝', t: 't1', name: 'PDF a Word',
    title: 'Convertir PDF a Word gratis (texto editable) | Tu CV Gratis',
    h1: 'Convertir PDF a Word',
    lead: 'Pasa el texto de un PDF a un documento de Word (.docx) para poder editarlo.',
    desc: 'Convierte el texto de un PDF a Word (.docx) editable gratis, sin registro y sin subir tus archivos a ningún servidor.',
    steps: ['Elige un PDF con texto.', 'Pulsa "Convertir a Word".', 'Abre el .docx y revisa el formato.'],
    guide: `<h2>¿Cuándo conviene pasar un PDF a Word?</h2>
<p>Cuando necesitas <strong>cambiar el texto</strong> de un documento del que solo tienes el PDF: actualizar una carta, corregir un dato o reutilizar párrafos. La herramienta saca el texto con sus títulos y párrafos para que lo edites en Word, Google Docs o LibreOffice.</p>
<h2>Limitaciones</h2>
<ul><li>Solo funciona con PDF que tienen <strong>texto real</strong>. Si el PDF es un escaneo o una foto, el texto es una imagen y no se puede extraer.</li><li>Las tablas, columnas, imágenes y diseños complejos no se conservan: tendrás que darle formato de nuevo.</li></ul>
<h2>Si lo que quieres es actualizar tu currículum</h2>
<p>Es más fácil <a href="${url('crear/')}">subirlo a nuestro editor</a>: leemos tu CV antiguo, lo pasamos a una plantilla moderna y lo descargas en PDF o en Word en unos minutos.</p>`,
    faq: [['¿Se mantiene el diseño?', 'Se conserva el texto, los títulos y los párrafos. Las imágenes, tablas y diseños complejos no se conservan.'], ['¿Quieres editar tu currículum?', 'Mejor súbelo a nuestro editor: lo pasamos a una plantilla nueva y lo descargas en PDF o en Word.']],
  },
];

page('herramientas-pdf/', {
  title: 'Herramientas PDF gratis: unir, comprimir, convertir | Tu CV Gratis',
  description: 'Herramientas PDF gratis y sin subir archivos: unir PDF, JPG a PDF, comprimir, PDF a JPG, dividir y PDF a Word. Desde el móvil o el ordenador.',
  body: `
<section class="iv-hero"><div class="narrow">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › Herramientas PDF</p>
  <span class="eyebrow">🧰 Herramientas PDF</span>
  <h1>Prepara tus documentos en segundos</h1>
  <p class="sub">Une tu CV con la carta y tus títulos, pasa fotos a PDF o reduce el peso para subirlo a un portal de empleo. Gratis y <strong>sin subir tus archivos</strong>: todo se hace en tu dispositivo.</p>
</div></section>
<section class="section" style="padding-top:28px"><div class="wrap">
  <div class="tools-grid">${PDF_TOOLS.map((x) => `<a class="tool-card" href="${url(x.slug + '/')}"><span class="icon-tile ${x.t}">${x.icon}</span><span><strong>${x.name}${x.pro ? ' 👑' : ''}</strong><small>${esc(x.lead.split('.')[0])}.</small></span></a>`).join('')}</div>
</div></section>
<div class="narrow prose">
  <h2>Los documentos que más se piden al buscar trabajo</h2>
  <p>Además del currículum, en muchos procesos de selección te pedirán otros papeles: la carta de presentación, títulos y certificados de cursos, el carné de conducir, el DNI o NIE o la vida laboral. Estas herramientas sirven para tenerlos todos listos en el formato que piden las empresas, sin instalar nada.</p>
  <h2>Qué herramienta necesitas</h2>
  <ul>
    <li><strong>Te piden todo en un solo archivo:</strong> <a href="${url('unir-pdf/')}">Unir PDF</a> junta tu CV, la carta y los títulos.</li>
    <li><strong>Tienes el título o el DNI en foto:</strong> <a href="${url('jpg-a-pdf/')}">JPG a PDF</a> lo convierte en un documento.</li>
    <li><strong>El portal de empleo dice que el archivo es demasiado grande:</strong> <a href="${url('comprimir-pdf/')}">Comprimir PDF</a> reduce su peso.</li>
    <li><strong>Quieres enviarlo por WhatsApp como imagen:</strong> <a href="${url('pdf-a-jpg/')}">PDF a JPG</a>.</li>
    <li><strong>Solo necesitas algunas páginas:</strong> <a href="${url('dividir-pdf/')}">Dividir PDF</a>.</li>
    <li><strong>Quieres editar el texto de un PDF:</strong> <a href="${url('pdf-a-word/')}">PDF a Word</a>.</li>
    <li><strong>Tienes que rellenar o firmar un documento:</strong> <a href="${url('editar-firmar-pdf/')}">Editar y firmar PDF</a> 👑.</li>
  </ul>
  <h2>Tus archivos no salen de tu dispositivo</h2>
  <p>La mayoría de webs de PDF suben tus documentos a sus servidores para procesarlos. Aquí no: todo se hace dentro de tu navegador, en tu móvil o tu ordenador. Es importante cuando se trata de tu DNI, tu vida laboral o tus datos personales. Por eso también funciona aunque tengas poca cobertura, una vez cargada la página.</p>
  <h2>Consejos antes de enviar tus documentos</h2>
  <ul>
    <li>Envía siempre el currículum en <strong>PDF</strong>: se ve igual en cualquier móvil u ordenador, mientras que un Word puede descolocarse.</li>
    <li>Usa nombres de archivo claros, con tu nombre y el puesto: <em>CV-Ana-Lopez-Dependienta.pdf</em>.</li>
    <li>Intenta que cada archivo pese <strong>menos de 2 MB</strong>.</li>
    <li>Abre el archivo final antes de enviarlo y comprueba que todas las páginas se ven bien y en orden.</li>
  </ul>
</div>`,
});

PDF_TOOLS.forEach((x) => {
  page(`${x.slug}/`, {
    title: x.title,
    description: x.desc,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${x.name} · ${CONFIG.nombreSitio}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      url: abs(`${x.slug}/`),
    },
    body: `
<section class="iv-hero"><div class="narrow">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › <a href="${url('herramientas-pdf/')}">Herramientas PDF</a> › ${x.name}</p>
  <h1>${x.icon} ${x.h1}</h1>
  <p class="sub">${x.lead}</p>
</div></section>
<div class="narrow pt-wrap">
  ${x.pro ? '<p class="pe-pro-note pro-hide">👑 Herramienta <strong>Pro</strong>: pruébala gratis con tu PDF; para descargar el resultado necesitas Pro.</p>' : ''}
  <div class="pt-card" id="${x.pro ? 'pdf-edit' : 'pdf-tool'}" data-tool="${x.tool}"><p class="muted-s">Cargando…</p></div>
  <div class="pt-private">🔒 <strong>100 % privado:</strong> tus archivos se procesan en tu propio dispositivo y nunca se suben a internet.</div>
  <div class="prose" style="margin-top:28px">
    <h2>Cómo funciona</h2>
    <ol>${x.steps.map((st) => `<li>${st}</li>`).join('')}</ol>
    ${x.guide}
    <h2>Preguntas frecuentes</h2>
    ${x.faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}
    ${x.pro ? '' : '<h3>¿Es gratis?</h3><p>Sí, totalmente gratis, sin registro y sin marcas de agua.</p>'}
    <h2>Más herramientas</h2>
    <ul>${PDF_TOOLS.filter((o) => o !== x).map((o) => `<li><a href="${url(o.slug + '/')}">${o.icon} ${o.name}${o.pro ? ' 👑' : ''}</a></li>`).join('')}</ul>
  </div>
  ${ctaBox('¿Buscas trabajo? Crea también tu currículum gratis y descárgalo en PDF.')}
</div>
${x.pro ? PRO_DIALOG : ''}
<script type="module" src="${url(`assets/js/${x.pro ? 'pdfedit' : 'pdftools'}.js`)}"></script>`,
  });
});

/* ---------- App ---------- */
page('app/', {
  title: 'Descargar la app de Tu CV Gratis para Android e iPhone',
  description: 'Instala gratis la app de Tu CV Gratis en tu móvil Android o iPhone: crea tu currículum desde la pantalla de inicio, incluso sin conexión.',
  body: `
<div class="narrow prose">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › App</p>
  <h1>📲 La app de Tu CV Gratis</h1>
  <p>Puedes tener Tu CV Gratis en el móvil como una aplicación más: con su icono en la pantalla de inicio, a pantalla completa y sin barra del navegador. Es <strong>gratis</strong>, se instala en segundos y casi no ocupa espacio.</p>
  <p class="app-cta">
    <button type="button" class="btn btn-lg js-install" hidden>Instalar la app</button>
    <span class="badge js-install-done" hidden>✅ Ya la tienes instalada en este dispositivo</span>
  </p>
  <h2>Ventajas</h2>
  <ul class="tick">
    <li>Abres tu currículum con un toque, sin buscar la web.</li>
    <li>Funciona también sin conexión: puedes editar tu CV en el metro o sin cobertura.</li>
    <li>Siempre actualizada: no tienes que descargar actualizaciones.</li>
    <li>Tus datos siguen guardados solo en tu móvil.</li>
  </ul>
  <h2>Cómo instalarla en Android</h2>
  <ol>
    <li>Abre <strong>tucvgratis.es</strong> en Chrome.</li>
    <li>Toca el botón <strong>Instalar la app</strong> de esta página, o el menú <strong>⋮</strong> → <strong>Instalar aplicación</strong>.</li>
    <li>Confirma con <strong>Instalar</strong>. El icono aparecerá con el resto de tus apps.</li>
  </ol>
  <h2>Cómo instalarla en iPhone</h2>
  <ol>
    <li>Abre <strong>tucvgratis.es</strong> en Safari.</li>
    <li>Toca <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>
    <li>Elige <strong>Añadir a pantalla de inicio</strong> y toca <strong>Añadir</strong>.</li>
  </ol>
  <h2>¿Cómo la desinstalo?</h2>
  <p>Como cualquier otra app: mantén pulsado el icono y elige <em>Desinstalar</em> o <em>Eliminar app</em>. Ten en cuenta que, si borras los datos, también se borran los currículums guardados en ese dispositivo; descárgalos antes en PDF.</p>
  ${ctaBox('¿Prefieres no instalar nada? Puedes crear tu currículum directamente desde el navegador.')}
</div>`,
});

/* ---------- Pro ---------- */
// Funciones Pro aún en construcción: se muestran con la etiqueta "Muy pronto".
const PRO_SOON = new Set();
const soonTag = (name) => (PRO_SOON.has(name) ? ' <span class="badge badge-soon">Muy pronto</span>' : '');
const PRO_FEATURES = [
  ['👑', 't3', '8 plantillas premium', 'Impacto, Ejecutiva, Creativa, Nocturna, Cronología, Elegante, Geométrica y Suave. Diseños que se recuerdan.'],
  ['📄', 't5', 'Descarga en Word', 'Además del PDF, descarga tu currículum en Word (.docx) para cuando una empresa o un portal te lo pida así.'],
  ['🎯', 't4', 'Analizador de ofertas', 'Pega el anuncio de trabajo y te decimos qué palabras clave te faltan para pasar los filtros.'],
  ['🎤', 't2', 'Simulador de entrevista', 'Preguntas reales de tu oficio con respuestas modelo para que llegues preparado.'],
  ['✉️', 't1', 'Cartas premium', 'Cartas de presentación con el mismo diseño que tu currículum. Todo a juego.'],
  ['📋', 't3', 'Seguimiento de candidaturas', 'Apunta a qué empresas enviaste el CV, cuándo y cómo va cada proceso.'],
  ['✍️', 't2', 'Editar y firmar PDF', 'Cambia el texto de cualquier PDF, rellena formularios y fírmalo con tu nombre o con el dedo.'],
  ['🚫', 't5', 'Sin anuncios', 'Navega por toda la web sin publicidad.'],
  ['♾️', 't4', 'Para siempre', 'Un solo pago. Sin suscripciones, sin renovaciones y con todas las mejoras futuras incluidas.'],
];
const PRO_ROWS = [
  ['Crear y editar tu currículum', true, true],
  ['Descarga en PDF', true, true],
  ['Ejemplos para 30 oficios', true, true],
  ['Carta de presentación', true, true],
  ['Currículum en 5 idiomas', true, true],
  ['Plantillas', '4', '12'],
  ['Descarga en Word (.docx)', false, true],
  ['Analizador de ofertas', false, true],
  ['Simulador de entrevista', false, true],
  ['Cartas premium a juego', false, true],
  ['Seguimiento de candidaturas', false, true],
  ['Editar y firmar PDF', false, true],
  ['Sin anuncios', false, true],
];
const PRO_FAQ = [
  ['¿Es una suscripción?', `No. Pagas ${CONFIG.proPrecio} una sola vez y es tuyo para siempre. No hay cobros mensuales ni renovaciones automáticas.`],
  ['¿Cómo lo activo?', 'Al comprar recibes por email una clave de licencia. La pegas en la web y Pro se activa al momento en ese dispositivo. No hace falta crear una cuenta.'],
  ['¿En cuántos dispositivos puedo usarlo?', 'Hasta en 3: por ejemplo, tu móvil, tu ordenador y una tablet.'],
  ['¿Y si no me convence?', 'Tienes 14 días para pedir la devolución del dinero, sin preguntas. Solo escríbenos.'],
  ['¿Es seguro pagar?', 'Sí. El pago lo gestiona Lemon Squeezy (de Stripe), una de las plataformas de pago más usadas del mundo. Nosotros nunca vemos los datos de tu tarjeta. Puedes pagar con tarjeta, PayPal, Apple Pay o Google Pay.'],
  ['¿Recibo factura?', 'Sí, recibes el recibo por email automáticamente, con el IVA incluido.'],
  ['¿Lo gratis sigue siendo gratis?', 'Siempre. Crear y descargar tu currículum en PDF con las plantillas gratuitas no tiene ni tendrá coste.'],
];
const proBuy = (cls = 'btn btn-white btn-lg') =>
  CONFIG.proCheckoutUrl
    ? `<a class="${cls} js-buy" href="${esc(CONFIG.proCheckoutUrl + (CONFIG.promo?.codigo ? `${CONFIG.proCheckoutUrl.includes('?') ? '&' : '?'}checkout[discount_code]=${CONFIG.promo.codigo}` : ''))}" rel="nofollow">👑 Conseguir Pro por ${CONFIG.proPrecio}</a>`
    : `<span class="${cls} is-soon" aria-disabled="true">👑 Muy pronto disponible</span>`;
const yes = (v) => (v === true ? '<span class="yes">✓</span>' : v === false ? '<span class="no">—</span>' : `<strong>${v}</strong>`);

page('pro/', {
  title: `Tu CV Gratis Pro: plantillas premium y más por ${CONFIG.proPrecio} (pago único)`,
  active: 'pro',
  description: `Consigue Tu CV Gratis Pro: 8 plantillas premium, descarga en Word, analizador de ofertas y simulador de entrevista. Pago único de ${CONFIG.proPrecio}, sin suscripciones.`,
  body: `
<section class="pro-hero"><div class="wrap">
  <span class="pill">👑 Tu CV Gratis Pro</span>
  <div class="pro-owned pro-only">🎉 <strong>Ya eres Pro en este dispositivo.</strong> Gracias por tu apoyo. <a href="${url('crear/')}">Ir a mi currículum →</a></div>
  <h1>Un currículum que no pasa <span class="hl">desapercibido</span></h1>
  <p class="lead">8 plantillas premium y las herramientas para conseguir la entrevista. Paga una vez y es tuyo para siempre.</p>
  ${promoTicket()}
  <div class="pro-price">
    ${CONFIG.proPrecioAntes ? `<s>${CONFIG.proPrecioAntes}</s>` : ''}<strong>${CONFIG.proPrecio}</strong><span>pago único<br>sin suscripción</span>
  </div>
  <div class="hero-cta center-cta">
    ${proBuy()}
    <a class="btn btn-lg btn-glass" href="${url('crear/')}">Probar las plantillas gratis</a>
  </div>
  <p class="pro-trust">🔒 Pago seguro · 💳 Tarjeta, PayPal, Apple Pay y Google Pay · ↩️ 14 días de garantía</p>
  <p class="pro-trust"><a href="${url('pro/activar/')}">¿Ya lo has comprado? Activa tu clave →</a></p>
  <div class="pro-fan" aria-hidden="true">
    ${['impacto', 'nocturna', 'creativa', 'geometrica', 'ejecutiva']
      .map((t, i) => `<div class="paper p${i}">${renderCV(sampleCV(['camarero', 'recepcionista', 'dependiente', 'repartidor', 'camarero'][i], t, ['#5b4bff', '#e0457b', '#0f766e', '#c2410c', '#1f5fbf'][i]))}</div>`)
      .join('')}
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="center"><span class="eyebrow">Todo lo que incluye</span><h2>Más que un currículum bonito</h2><p class="sub">Lo necesario para pasar los filtros y llegar preparado a la entrevista.</p></div>
  <div class="grid pro-feats">
    ${PRO_FEATURES.map(([ico, t, h, p]) => `<div class="card"><span class="icon-tile ${t}">${ico}</span><h3>${h}${soonTag(h)}</h3><p>${p}</p></div>`).join('')}
  </div>
</div></section>

<section class="section section-alt"><div class="wrap">
  <div class="center"><span class="eyebrow">Plantillas premium</span><h2>8 diseños para destacar</h2><p class="sub">Pruébalos gratis con tus datos en el editor. Cambian al color que elijas.</p></div>
  <div class="tpl-gallery">
    ${TEMPLATES.filter((t) => t.pro)
      .map(
        (t, i) => `<div class="tpl-thumb"><div class="mini">${renderCV(sampleCV(['camarero', 'dependiente', 'recepcionista', 'repartidor'][i % 4], t.id, ['#5b4bff', '#e0457b', '#0f766e', '#c2410c', '#1f5fbf', '#334155'][i % 6]))}<span class="crown">👑 Pro</span></div>
      <strong>${t.name}</strong><small>${t.desc}</small></div>`,
      )
      .join('')}
  </div>
  <p class="center" style="margin-top:24px"><a class="btn btn-lg" href="${url('crear/')}">Probarlas con mi currículum</a></p>
</div></section>

<section class="section"><div class="narrow">
  <div class="center"><span class="eyebrow">Compara</span><h2>Gratis vs Pro</h2><p class="sub">Lo gratis seguirá siendo gratis. Pro es para ir un paso más allá.</p></div>
  <div class="cmp-wrap"><table class="cmp">
    <thead><tr><th></th><th>Gratis</th><th class="pro-col">👑 Pro</th></tr></thead>
    <tbody>${PRO_ROWS.map(([f, a, b]) => `<tr><td>${f}${soonTag(f)}</td><td>${yes(a)}</td><td class="pro-col">${yes(b)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td></td><td><strong>0 €</strong></td><td class="pro-col"><strong>${CONFIG.proPrecio}</strong><small>una vez</small></td></tr></tfoot>
  </table></div>
</div></section>

<section class="section section-alt"><div class="wrap">
  <div class="pro-vs">
    <div class="card"><span class="eyebrow">Otras webs</span><h3>"Gratis"… hasta que descargas</h3><ul class="x-list"><li>Te cobran al final, cuando ya has hecho el CV</li><li>Suscripción mensual que se renueva sola</li><li>Cuesta darse de baja</li></ul></div>
    <div class="card card-pro"><span class="eyebrow">Tu CV Gratis Pro</span><h3>Claro desde el principio</h3><ul class="tick-list"><li>Lo básico, gratis de verdad</li><li>Pro: un solo pago de ${CONFIG.proPrecio}</li><li>Sin suscripciones ni sorpresas</li></ul></div>
  </div>
</div></section>

<section class="section"><div class="wrap"><div class="guarantee">
  <span class="g-badge">14<small>días</small></span>
  <div><h2>Garantía de devolución</h2><p>Si en 14 días Pro no te convence, te devolvemos el dinero. Sin preguntas y sin letra pequeña.</p></div>
</div></div></section>

<section class="section"><div class="narrow faq">
  <div class="center"><span class="eyebrow">Dudas</span><h2>Preguntas frecuentes</h2></div>
  <div style="margin-top:24px">${PRO_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  <p class="center muted-s" style="margin-top:18px">¿Ya tienes Pro? <a href="${url('pro/activar/')}">Activa tu clave aquí</a>. Consulta las <a href="${url('condiciones/')}">condiciones de venta</a> y la <a href="${url('reembolsos/')}">política de reembolso</a>.</p>
</div></section>

<section class="wrap"><div class="big-cta">
  <h2>Destaca entre todos los candidatos</h2>
  <p>${CONFIG.proPrecioAntes ? `<s>${CONFIG.proPrecioAntes}</s> ` : ''}<strong>${CONFIG.proPrecio}</strong> · pago único, para siempre.</p>
  ${proBuy()}
</div></section>`,
});

page('pro/activar/', {
  title: 'Activar Tu CV Gratis Pro',
  description: 'Activa tu licencia de Tu CV Gratis Pro con la clave que recibiste por email.',
  ads: false,
  body: `
<div class="narrow activate">
  <p class="breadcrumb"><a href="${url()}">Inicio</a> › <a href="${url('pro/')}">Pro</a> › Activar</p>
  <div class="act-card" id="act-form-card">
    <span class="crown-big">👑</span>
    <h1>Activa Tu CV Gratis Pro</h1>
    <p>Pega la <strong>clave de licencia</strong> que te llegó por email al comprar. Si no la encuentras, mira en la carpeta de spam.</p>
    <form id="act-form" autocomplete="off">
      <input id="act-key" class="act-input" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" spellcheck="false" aria-label="Clave de licencia" required>
      <button class="btn btn-lg" type="submit" id="act-btn">Activar Pro</button>
    </form>
    <p class="act-error" id="act-error" role="alert" hidden></p>
    <p class="muted-s">¿Aún no tienes Pro? <a href="${url('pro/')}">Consíguelo por ${CONFIG.proPrecio}</a></p>
  </div>
  <div class="act-card act-ok" id="act-ok" hidden>
    <span class="crown-big">🎉</span>
    <h1>¡Ya eres Pro!</h1>
    <p>Todas las funciones Pro están desbloqueadas en este dispositivo. Gracias por apoyar Tu CV Gratis.</p>
    <p class="act-info" id="act-info"></p>
    <p><a class="btn btn-lg" href="${url('crear/')}">Ir a mi currículum</a></p>
    <p class="muted-s">Puedes activar la misma clave en hasta 3 dispositivos.<br>
    <button type="button" class="btn-link" id="act-deactivate">Desactivar Pro en este dispositivo</button></p>
  </div>
</div>
<script type="module">
import { activate, deactivate, proInfo } from '${url('assets/js/pro.js')}';
const $ = (s) => document.querySelector(s);
function show() {
  const info = proInfo();
  $('#act-form-card').hidden = Boolean(info);
  $('#act-ok').hidden = !info;
  if (info) $('#act-info').textContent = 'Clave: ' + info.key.slice(0, 8) + '…' + (info.email ? ' · ' + info.email : '');
}
$('#act-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#act-btn');
  btn.disabled = true;
  btn.textContent = 'Comprobando…';
  $('#act-error').hidden = true;
  const r = await activate($('#act-key').value);
  btn.disabled = false;
  btn.textContent = 'Activar Pro';
  if (!r.ok) {
    $('#act-error').textContent = r.error;
    $('#act-error').hidden = false;
    return;
  }
  document.documentElement.classList.add('is-pro');
  show();
});
$('#act-deactivate').addEventListener('click', async () => {
  if (!confirm('¿Desactivar Pro en este dispositivo? Podrás volver a activarlo con tu clave.')) return;
  await deactivate();
  document.documentElement.classList.remove('is-pro');
  show();
});
const k = new URLSearchParams(location.search).get('key');
if (k) $('#act-key').value = k;
show();
</script>`,
});

/* ---------- Páginas legales e institucionales ---------- */
const legal = (path, title, description, html) =>
  page(path, { title: `${title} | Tu CV Gratis`, description, body: `<div class="narrow prose"><h1 style="margin-top:32px">${title}</h1>${html}</div>` });

legal(
  'sobre-nosotros/',
  'Quiénes somos',
  'Qué es Tu CV Gratis, quién está detrás y por qué es gratis.',
  `<p>Tu CV Gratis nació de una idea sencilla: <strong>hacer un currículum no debería costar dinero ni trampas</strong>. Muchas webs te dejan rellenarlo y, al descargar, te piden un pago que acaba siendo una suscripción mensual.</p>
<p>Por eso Tu CV Gratis permite crear y descargar el currículum gratis, con ejemplos pensados para trabajos reales: hostelería, comercio, logística, limpieza, cuidados, construcción y atención al cliente.</p>
<h2>¿Cómo se mantiene?</h2>
<p>Con publicidad en las páginas de contenido y, próximamente, con una versión Pro de pago único y opcional. La descarga del currículum siempre será gratuita.</p>
<h2>Tu privacidad</h2>
<p>No pedimos registro. El currículum se guarda solo en tu navegador y no lo recibimos en ningún servidor.</p>
<p>¿Sugerencias? Escríbenos desde la página de <a href="${url('contacto/')}">contacto</a>.</p>`,
);

legal(
  'contacto/',
  'Contacto',
  'Contacta con Tu CV Gratis para dudas, sugerencias o incidencias.',
  `<p>¿Tienes una duda, una sugerencia o has encontrado un error? Escríbenos y te responderemos lo antes posible.</p>
<p><strong>Email:</strong> <a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a></p>
<p>Recuerda que no guardamos tu currículum: si borras los datos de tu navegador, no podremos recuperarlo.</p>`,
);

legal(
  'aviso-legal/',
  'Aviso legal',
  'Aviso legal e información del titular de Tu CV Gratis.',
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
  'Cómo trata Tu CV Gratis tus datos personales.',
  `<h2>Responsable</h2>
<p>${esc(CONFIG.titular)} — ${esc(CONFIG.email)}</p>
<h2>Tu currículum</h2>
<p>Los datos que escribes en el editor (nombre, contacto, experiencia, foto…) <strong>se guardan únicamente en el almacenamiento local de tu navegador</strong>. No se envían a ningún servidor nuestro y no tenemos acceso a ellos. Puedes borrarlos en cualquier momento con el botón "Borrar todo" del editor o borrando los datos del sitio en tu navegador.</p>
<h2>Publicidad</h2>
<p>Este sitio puede mostrar anuncios de Google AdSense en las páginas de contenido. Google y sus socios pueden usar cookies para mostrar anuncios, personalizados o no, según tu consentimiento. Puedes consultar cómo usa Google los datos en <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow">policies.google.com/technologies/partner-sites</a> y gestionar tus preferencias en <a href="https://adssettings.google.com" rel="nofollow">adssettings.google.com</a>.</p>
<p>El editor de currículum no muestra anuncios.</p>
<h2>Compras de la versión Pro</h2>
<p>Los pagos los procesa <strong>Lemon Squeezy</strong> (Lemon Squeezy LLC), que actúa como vendedor y comerciante registrado. Lemon Squeezy recoge los datos necesarios para el cobro y la factura (nombre, email, país y datos de pago) según su propia <a href="https://www.lemonsqueezy.com/privacy" rel="nofollow">política de privacidad</a>. Nosotros nunca vemos los datos de tu tarjeta; solo recibimos tu nombre, tu email y la clave de licencia, que usamos para darte soporte y gestionar devoluciones.</p>
<p>Al activar Pro, la clave se comprueba con el servicio de licencias de Lemon Squeezy y se guarda en tu navegador.</p>
<h2>Estadísticas de visitas</h2>
<p>Usamos <strong>Cloudflare Web Analytics</strong> para saber cuántas personas visitan el sitio, qué páginas se ven y desde qué país. Es una herramienta <strong>sin cookies</strong> que no te identifica ni guarda datos personales: solo cuenta visitas de forma agregada. Más información en <a href="https://www.cloudflare.com/privacypolicy/" rel="nofollow">cloudflare.com/privacypolicy</a>.</p>
<h2>Contacto por email</h2>
<p>Si nos escribes, usaremos tu email solo para responderte y no lo cederemos a terceros.</p>
<h2>Tus derechos</h2>
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${esc(CONFIG.email)}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>`,
);

legal(
  'cookies/',
  'Política de cookies',
  'Qué cookies usa Tu CV Gratis y cómo gestionarlas.',
  `<h2>Almacenamiento propio</h2>
<p>El editor usa el almacenamiento local del navegador para guardar tu currículum mientras lo escribes. Es imprescindible para que funcione y no se usa para rastrearte.</p>
<h2>Estadísticas</h2>
<p>Contamos las visitas con Cloudflare Web Analytics, que no usa cookies ni identifica a las personas.</p>
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
    title: 'Página no encontrada | Tu CV Gratis',
    description: 'La página que buscas no existe.',
    ads: false,
    body: `<div class="narrow prose" style="text-align:center;padding:64px 0"><h1>Página no encontrada</h1><p>Puede que el enlace esté mal o que la página se haya movido.</p><p><a class="btn" href="${url()}">Ir al inicio</a></p></div>`,
  }),
});

legal(
  'condiciones/',
  'Condiciones de venta',
  'Condiciones de compra de Tu CV Gratis Pro: precio, entrega, licencia, desistimiento y reembolsos.',
  `<p>Estas condiciones regulan la compra de <strong>Tu CV Gratis Pro</strong>, una licencia digital de pago único para usar las funciones premium de ${CONFIG.nombreSitio} (tucvgratis.es). Al comprar, aceptas estas condiciones.</p>
<h2>1. Quién vende</h2>
<p>El producto lo ofrece ${esc(CONFIG.titular)} (NIF ${esc(CONFIG.nif)}, ${esc(CONFIG.domicilio)}, ${esc(CONFIG.email)}). El cobro lo realiza <strong>Lemon Squeezy LLC</strong>, que actúa como revendedor y comerciante registrado (<em>merchant of record</em>): procesa el pago, aplica los impuestos que correspondan y emite el recibo o la factura.</p>
<h2>2. Producto y precio</h2>
<p>Tu CV Gratis Pro incluye las plantillas premium y las funciones marcadas como Pro en la web. El precio es de <strong>${CONFIG.proPrecio}</strong>, impuestos incluidos, en un <strong>pago único</strong>. No es una suscripción y no hay renovaciones automáticas. Las funciones gratuitas siguen siendo gratuitas.</p>
<h2>3. Pago</h2>
<p>Puedes pagar con tarjeta y otros métodos disponibles en la pasarela de Lemon Squeezy (por ejemplo, PayPal, Apple Pay o Google Pay). Nunca tenemos acceso a los datos de tu tarjeta.</p>
<h2>4. Entrega</h2>
<p>Tras el pago recibes al instante, por email, una <strong>clave de licencia</strong>. Para activar Pro, pégala en la web. Si no te llega, revisa la carpeta de spam o escríbenos.</p>
<h2>5. Licencia de uso</h2>
<ul>
  <li>La licencia es personal e intransferible.</li>
  <li>Se puede activar en un máximo de <strong>3 dispositivos o navegadores</strong>.</li>
  <li>Es de por vida mientras el servicio esté disponible, e incluye las mejoras de Pro que se publiquen en el futuro.</li>
  <li>No está permitido revender ni compartir públicamente la clave.</li>
</ul>
<p>Tus currículums se guardan en tu propio dispositivo. Te recomendamos descargarlos en PDF para tener siempre una copia.</p>
<h2>6. Derecho de desistimiento y garantía</h2>
<p>Al tratarse de contenido digital que se entrega al momento, de acuerdo con el artículo 103.m) del Real Decreto Legislativo 1/2007, al completar la compra das tu consentimiento para recibirlo de inmediato y reconoces que pierdes el derecho legal de desistimiento.</p>
<p>Aun así, te ofrecemos voluntariamente una <strong>garantía de devolución de 14 días</strong>: consulta la <a href="${url('reembolsos/')}">política de reembolso</a>.</p>
<h2>7. Soporte</h2>
<p>Para cualquier problema con tu compra o la activación, escríbenos a ${esc(CONFIG.email)}. Respondemos lo antes posible, normalmente en 48 horas.</p>
<h2>8. Responsabilidad</h2>
<p>Pro es una herramienta para ayudarte a preparar tu candidatura. No garantizamos la obtención de un empleo ni el resultado de ningún proceso de selección.</p>
<h2>9. Cambios y legislación</h2>
<p>Podemos actualizar estas condiciones; la versión aplicable es la vigente en el momento de tu compra. Se rigen por la legislación española. Como consumidor, también puedes usar la plataforma europea de resolución de litigios en línea: <a href="https://ec.europa.eu/consumers/odr" rel="nofollow">ec.europa.eu/consumers/odr</a>.</p>
<p class="muted-s">Última actualización: octubre de ${YEAR}.</p>`,
);

legal(
  'reembolsos/',
  'Política de reembolso',
  'Garantía de devolución de 14 días de Tu CV Gratis Pro.',
  `<p>Queremos que estés contento con tu compra. Por eso Tu CV Gratis Pro tiene una <strong>garantía de devolución de 14 días</strong>.</p>
<h2>Cómo pedir el reembolso</h2>
<ol>
  <li>Escríbenos a ${esc(CONFIG.email)} en los <strong>14 días siguientes a la compra</strong>.</li>
  <li>Indica el email con el que compraste (o el número de pedido del recibo).</li>
  <li>No tienes que darnos ningún motivo, aunque nos ayuda saber qué podemos mejorar.</li>
</ol>
<h2>Qué pasa después</h2>
<p>Tramitamos la devolución a través de Lemon Squeezy en un plazo máximo de 5 días hábiles. El dinero vuelve al mismo método de pago que usaste; según tu banco, puede tardar unos días más en aparecer. Al reembolsar, la clave de licencia se desactiva.</p>
<h2>Fuera de plazo</h2>
<p>Pasados 14 días no se ofrecen devoluciones, salvo que el producto no funcione y no podamos solucionarlo, o cuando la ley lo exija.</p>
<p>Consulta también las <a href="${url('condiciones/')}">condiciones de venta</a>.</p>`,
);

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
const PRECACHE = ['', 'crear/', 'assets/css/site.css', 'assets/css/cv.css', 'assets/js/editor.js', 'assets/js/cv-render.js', 'assets/js/importer.js', 'assets/js/reviewer.js', 'assets/js/share.js', 'assets/js/wizard.js', 'primer-empleo/', 'assets/js/letter.js', 'assets/js/carta-editor.js', 'carta/', 'assets/js/i18n.js', 'assets/data/oficios.js', 'assets/data/traducciones.js', 'assets/data/traducciones-mas.js', 'assets/data/traducciones-mas2.js', 'assets/data/oficios-mas.js', 'icons/icon-192.png', 'assets/js/install.js', 'assets/js/pro.js', 'assets/js/docx.js', 'assets/js/analyzer.js', 'assets/js/interview.js', 'assets/data/entrevista.js', 'entrevista/', 'assets/js/tracker.js', 'candidaturas/', 'assets/js/pdftools.js', 'assets/js/pdfedit.js'].map(url);
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
