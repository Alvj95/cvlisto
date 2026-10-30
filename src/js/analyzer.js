// Analizador de ofertas (Pro): compara el texto de una oferta de empleo con el
// currículum. Sin IA: busca palabras clave conocidas por oficio y términos
// repetidos en la oferta, y revisa requisitos típicos (idiomas, carnet,
// disponibilidad, años de experiencia).
import { OFICIOS } from '../data/oficios.js';

const STOP = new Set(
  `a al algo algun alguna algunas alguno algunos ante antes aqui asi aun cada como con contra cual cuando de del desde donde dos el ella ellas ello ellos en entre era es esa esas ese eso esos esta estas este esto estos fue ha han hasta hay la las le les lo los mas me mi mucho muy nada ni no nos o os otra otras otro otros para pero poco por porque que quien se ser si sin sobre son su sus tambien te tiene tienen todo todos tu tus un una unas uno unos y ya yo nuestro nuestra nuestros nuestras vuestro tu usted ustedes the and or of to in for with`.split(' '),
);

// Palabras típicas de cualquier oferta que no aportan como palabra clave.
const GENERIC = new Set(
  `empresa empresas buscamos busca buscando ofrecemos ofrece ofertas oferta puesto puestos trabajo trabajar trabajos candidato candidata candidatos persona personas perfil requisitos requisito minimo minima valorara valoraran valorable imprescindible deseable funciones funcion tareas contrato contratos salario sueldo bruto anual mensual euros jornada completa parcial horario horarios incorporacion inmediata semana semanas meses mes dias dia horas hora equipo zona centro sector importante empresa nivel experiencia anos ano demostrable formar parte inscribete enviar envia curriculum interesados interesadas seleccion proceso ubicacion lugar localidad provincia madrid barcelona valencia sevilla bilbao malaga zaragoza espana nuestro nuestra gran grandes nueva nuevo nuevas nuevos posibilidad posibilidades desarrollo estabilidad buen buena buenas buenos excelente atractivo plan carrera profesional profesionales cliente clientes`.split(' '),
);

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ+#]+/g, ' ')
    .trim();

// Raíz simple: quita plurales y la vocal final, para que "camareros" = "camarera".
const stem = (w) => {
  let s = w;
  if (s.length > 4 && s.endsWith('es')) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith('s')) s = s.slice(0, -1);
  if (s.length > 4 && /[aoe]$/.test(s)) s = s.slice(0, -1);
  return s;
};

const tokens = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w));
const stems = (s) => tokens(s).map(stem);

// Términos que se suelen pedir en ofertas, además de las habilidades de cada oficio.
const EXTRA = [
  'Caja', 'TPV', 'Excel', 'Word', 'Paquete Office', 'SAP', 'Informática', 'Redes sociales',
  'Carnet de conducir', 'Carnet B', 'Carnet C', 'Vehículo propio', 'Carretilla elevadora', 'Transpaleta',
  'Manipulador de alimentos', 'APPCC', 'Alérgenos', 'Prevención de riesgos laborales', 'PRL', 'Primeros auxilios',
  'Atención al cliente', 'Atención telefónica', 'Trabajo en equipo', 'Trabajo bajo presión', 'Orientación a objetivos',
  'Ventas', 'Reposición', 'Inventario', 'Almacén', 'Preparación de pedidos', 'Picking', 'Reparto', 'Carga y descarga',
  'Limpieza', 'Mantenimiento', 'Electricidad', 'Fontanería', 'Soldadura', 'Pintura', 'Albañilería',
  'Cocina', 'Barra', 'Sala', 'Coctelería', 'Plancha', 'Pastelería',
  'Facturación', 'Contabilidad', 'Recepción', 'Gestión de agenda', 'Archivo', 'Call center',
  'Geriatría', 'Atención sociosanitaria', 'Movilizaciones', 'Auxiliar de enfermería', 'TCAE',
  'Turnos rotativos', 'Fines de semana', 'Disponibilidad inmediata', 'Noches',
  'Bachillerato', 'ESO', 'Grado Medio', 'Grado Superior', 'Formación Profesional',
];

const DICTIONARY = (() => {
  const seen = new Map();
  for (const t of [...EXTRA, ...OFICIOS.flatMap((o) => o.habilidades || [])]) {
    const k = stems(t).join(' ');
    if (k && !seen.has(k)) seen.set(k, t);
  }
  return [...seen.entries()].map(([k, t]) => ({ term: t, seq: k.split(' ') }));
})();

const hasSeq = (hay, seq) => {
  for (let i = 0; i + seq.length <= hay.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) if (hay[i + j] !== seq[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
};

const LANGS = ['inglés', 'francés', 'alemán', 'italiano', 'portugués', 'catalán', 'valenciano', 'euskera', 'gallego', 'chino', 'árabe', 'ruso', 'neerlandés', 'rumano'];

function cvText(cv) {
  return [
    cv.puesto,
    cv.perfil,
    ...(cv.experiencia || []).flatMap((e) => [e.puesto, e.empresa, e.tareas]),
    ...(cv.formacion || []).flatMap((f) => [f.titulo, f.centro]),
    ...(cv.habilidades || []),
    ...(cv.idiomas || []).flatMap((i) => [i.idioma, i.nivel]),
    cv.otros,
  ]
    .filter(Boolean)
    .join('\n');
}

// Años de experiencia aproximados a partir de las fechas.
function yearsOfExperience(cv) {
  const now = new Date().getFullYear();
  let total = 0;
  for (const e of cv.experiencia || []) {
    const a = Number((String(e.inicio).match(/\d{4}/) || [])[0]);
    const b = e.actual ? now : Number((String(e.fin).match(/\d{4}/) || [])[0]) || a;
    if (a && b >= a) total += Math.max(0.5, b - a);
  }
  return Math.round(total * 10) / 10;
}

// Primera línea corta de la oferta: suele ser el nombre del puesto.
function offerTitle(text) {
  const first = String(text).split('\n').map((l) => l.trim()).find(Boolean) || '';
  const clean = first.replace(/^(se busca|buscamos|oferta( de empleo)?|puesto)\s*:?\s*/i, '').replace(/[.:!]+$/, '');
  return clean.length >= 3 && clean.length <= 60 && clean.split(' ').length <= 8 ? clean : '';
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function analyzeOffer(offer, cv) {
  const offerStems = stems(offer);
  const cvStems = stems(cvText(cv));
  const cvSet = new Set(cvStems);
  const inCV = (term) => stems(term).every((s) => cvSet.has(s)) || hasSeq(cvStems, stems(term));

  // 1) Palabras clave conocidas que aparecen en la oferta.
  const keys = [];
  const used = new Set();
  for (const { term, seq } of DICTIONARY) {
    if (hasSeq(offerStems, seq)) {
      keys.push(term);
      seq.forEach((s) => used.add(s));
    }
  }
  // Quita términos contenidos en otros más largos ("Caja" si ya está "TPV y caja").
  const keysClean = keys.filter((t) => !keys.some((o) => o !== t && o.length > t.length && hasSeq(stems(o), stems(t))));

  // 2) Palabras que la oferta repite y no están en el diccionario.
  const counts = new Map();
  tokens(offer).forEach((w) => {
    if (w.length < 5 || GENERIC.has(w) || /^\d+$/.test(w)) return;
    const s = stem(w);
    if (used.has(s)) return;
    const c = counts.get(s) || { n: 0, word: w };
    c.n++;
    counts.set(s, c);
  });
  const frequent = [...counts.values()]
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((c) => cap(c.word));

  const all = [...keysClean, ...frequent].slice(0, 24);
  const found = all.filter(inCV);
  const missing = all.filter((t) => !inCV(t));
  const score = all.length ? Math.round((found.length / all.length) * 100) : 0;

  // 3) Requisitos típicos.
  const checks = [];
  const o = norm(offer);
  const c = norm(cvText(cv));

  const cvLangs = (cv.idiomas || []).map((i) => norm(i.idioma));
  const askedLangs = LANGS.filter((l) => new RegExp(`\\b${norm(l)}\\b`).test(o));
  askedLangs.forEach((l) => {
    const ok = cvLangs.some((x) => x.includes(norm(l))) || (norm(l) === 'ingles' && cvLangs.some((x) => x.includes('english')));
    checks.push({ ok, title: `Idioma: ${l}`, detail: ok ? 'Lo tienes en tu currículum.' : `La oferta menciona ${l} y no aparece en tus idiomas. Si lo hablas, añádelo con tu nivel.` });
  });

  const DRIVE = /\b(carnet|carne|permiso)( de)? (conducir|b|c|c1|d|e)\b|\bvehiculo propio\b|\bconducir\b/;
  if (DRIVE.test(o)) {
    const ok = DRIVE.test(c);
    checks.push({ ok, title: 'Carnet de conducir', detail: ok ? 'Lo mencionas en tu currículum.' : 'La oferta pide carnet o vehículo. Si lo tienes, ponlo en "Otros datos".' });
  }

  if (/\b(fines de semana|turnos|nocturno|noches|festivos|disponibilidad|incorporacion inmediata)\b/.test(o)) {
    const ok = /\b(disponib|fines de semana|turnos|noches|festivos|inmediata)/.test(c);
    checks.push({ ok, title: 'Disponibilidad', detail: ok ? 'Indicas tu disponibilidad.' : 'La oferta habla de horarios o disponibilidad. Añade la tuya en "Otros datos" (p. ej. "Disponibilidad inmediata y fines de semana").' });
  }

  const yrs = o.match(/(?:minimo|al menos|mas de)?\s*(\d{1,2})\s*anos? (?:de )?experiencia|experiencia (?:minima )?(?:de )?(\d{1,2})\s*anos?/);
  if (yrs) {
    const need = Number(yrs[1] || yrs[2]);
    const have = yearsOfExperience(cv);
    const ok = have >= need;
    checks.push({ ok, title: `Experiencia: ${need} ${need === 1 ? 'año' : 'años'}`, detail: ok ? `Tu currículum suma unos ${have} años. ¡Cumples!` : `Tu currículum suma unos ${have} años. Si tienes más experiencia (prácticas, trabajos informales), añádela.` });
  }

  const title = offerTitle(offer);
  if (title) {
    const ts = stems(title);
    const ok = ts.some((s) => stems(cv.puesto || '').includes(s));
    checks.push({ ok, title: 'Título del currículum', detail: ok ? `Tu título encaja con el puesto «${title}».` : `Pon como título de tu CV el nombre del puesto: «${title}». Es lo primero que se lee.`, action: ok ? null : { type: 'puesto', value: title } });
  }

  return { score, found, missing, checks, total: all.length };
}
