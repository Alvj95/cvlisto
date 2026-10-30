// Lee un currículum antiguo (Word, PDF o texto) en el navegador y trata de
// repartir su contenido en los campos del editor. Nada sale del dispositivo.

const BULLET = /^[\s•●▪◦‣∙·\-–—*►▸✓✔➤→☐■□]+\s*/;
const ICONS = /^[\s☎✆📞📱✉📧@⌂🏠📍↗🔗🌐]+\s*/u;

/* ---------- Extracción de texto ---------- */

export async function extractLines(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return docxLines(await file.arrayBuffer());
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return pdfLines(await file.arrayBuffer());
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return (await file.text()).split(/\r?\n/);
  if (name.endsWith('.doc')) throw new Error('doc');
  throw new Error('formato');
}

// .docx es un ZIP: buscamos word/document.xml en el directorio central y lo descomprimimos.
async function docxLines(buf) {
  const view = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('formato');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  let entry = null;
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    const fname = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    if (fname === 'word/document.xml') { entry = { method, size, offset }; break; }
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!entry) throw new Error('formato');
  const lh = entry.offset;
  const start = lh + 30 + view.getUint16(lh + 26, true) + view.getUint16(lh + 28, true);
  let data = new Uint8Array(buf, start, entry.size);
  if (entry.method === 8) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    data = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const xml = new DOMParser().parseFromString(dec.decode(data), 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const lines = [];
  for (const para of xml.getElementsByTagNameNS(W, 'p')) {
    let text = '';
    for (const node of para.getElementsByTagNameNS(W, '*')) {
      if (node.localName === 't') text += node.textContent;
      else if (node.localName === 'tab') text += ' ';
      else if (node.localName === 'br') text += '\n';
    }
    const style = para.getElementsByTagNameNS(W, 'pStyle')[0]?.getAttributeNS(W, 'val') || '';
    const isList = para.getElementsByTagNameNS(W, 'numPr').length > 0 || /list|lista|vi[ñn]eta|bullet/i.test(style);
    for (const part of text.split('\n')) lines.push(isList && part.trim() ? `• ${part}` : part);
  }
  return lines;
}

let pdfjs;
async function loadPdfjs() {
  if (!pdfjs) {
    const base = new URL('../vendor/pdfjs/', import.meta.url);
    pdfjs = await import(new URL('pdf.min.js', base).href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.js', base).href;
  }
  return pdfjs;
}

async function pdfLines(buf) {
  const lib = await loadPdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const out = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const width = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: Math.abs(it.transform[3]) || 10 }));
    out.push(...pageLines(items, width));
  }
  return out;
}

// Agrupa los trozos de texto en líneas. Si la página tiene dos columnas
// (barra lateral), se lee primero una columna entera y luego la otra.
function pageLines(items, width) {
  const split = findColumnSplit(items, width);
  let groups = split ? [items.filter((i) => i.x < split), items.filter((i) => i.x >= split)] : [items];
  // La columna que contiene el texto más grande (el nombre) va primero.
  if (split) {
    const big = (g) => Math.max(...g.map((i) => i.h));
    if (big(groups[1]) > big(groups[0])) groups = [groups[1], groups[0]];
  }
  const lines = [];
  for (const group of groups) {
    const rows = [];
    for (const it of group.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const row = rows.find((r) => Math.abs(r.y - it.y) < Math.max(2.5, it.h * 0.4));
      if (row) row.items.push(it);
      else rows.push({ y: it.y, items: [it] });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      let text = '';
      let end = null;
      for (const it of row.items) {
        if (end !== null) {
          const gap = it.x - end;
          // Hueco grande = elementos separados (etiquetas, fecha a la derecha).
          if (gap > it.h * 0.9) text = text.trimEnd() + '  ';
          else if (gap > 1.5 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
        }
        text += it.str;
        end = it.x + it.w;
      }
      lines.push(text);
    }
    lines.push('');
  }
  return lines;
}

function findColumnSplit(items, width) {
  let best = null;
  for (let s = width * 0.2; s <= width * 0.6; s += 4) {
    if (items.some((i) => i.x < s && i.x + i.w > s)) continue;
    const left = items.filter((i) => i.x < s).length;
    const right = items.length - left;
    if (left >= 6 && right >= 6) {
      const score = Math.min(left, right);
      if (!best || score > best.score) best = { s, score };
    }
  }
  return best ? best.s : null;
}

/* ---------- Interpretación ---------- */

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[:.]+$/, '').trim();

const SECTIONS = {
  perfil: ['perfil', 'perfil profesional', 'sobre mi', 'acerca de mi', 'resumen', 'resumen profesional', 'objetivo', 'objetivo profesional', 'presentacion', 'profile', 'summary', 'professional summary', 'about me', 'objective', 'profil', 'a propos de moi', 'sobre mim', 'resumo', 'profilo', 'chi sono'],
  experiencia: ['experiencia', 'experiencia laboral', 'experiencia profesional', 'trayectoria profesional', 'historial laboral', 'experiencia de trabajo', 'work experience', 'experience', 'professional experience', 'employment history', 'employment', 'experience professionnelle', 'experiences professionnelles', 'experiencia profissional', 'esperienza', 'esperienza lavorativa', 'esperienze lavorative', 'esperienza professionale'],
  formacion: ['formacion', 'formacion academica', 'educacion', 'estudios', 'formacion complementaria', 'cursos', 'cursos y certificaciones', 'certificaciones', 'titulaciones', 'education', 'training', 'courses', 'certifications', 'formation', 'formacao', 'formacao academica', 'educacao', 'istruzione', 'formazione', 'istruzione e formazione'],
  habilidades: ['habilidades', 'competencias', 'aptitudes', 'conocimientos', 'capacidades', 'habilidades y competencias', 'competencias profesionales', 'informatica', 'skills', 'key skills', 'competences', 'competencias tecnicas', 'competencias', 'competenze', 'habilidades tecnicas'],
  idiomas: ['idiomas', 'languages', 'langues', 'linguas', 'lingue', 'idiomi', 'conocimiento de idiomas'],
  otros: ['otros datos', 'datos adicionales', 'informacion adicional', 'otros', 'otra informacion', 'additional information', 'other', 'others', 'informations complementaires', 'outras informacoes', 'altre informazioni', 'intereses', 'aficiones', 'hobbies', 'interests', 'referencias', 'references', 'disponibilidad', 'carnet', 'carnet de conducir', 'permiso de conducir'],
  ignorar: ['contacto', 'datos personales', 'datos de contacto', 'contact', 'personal details', 'personal information', 'curriculum vitae', 'curriculum', 'cv'],
};
const SECTION_OF = new Map(Object.entries(SECTIONS).flatMap(([k, list]) => list.map((t) => [t, k])));

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const WEB = /((https?:\/\/)?(www\.)?(linkedin\.com\/[^\s]+|[\w-]+\.(com|es|net|org|io|dev|me)(\/[^\s]*)?))/i;

const MONTH = '(?:ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|set|oct|octubre|nov|noviembre|dic|diciembre|jan|january|february|march|apr|april|june|july|aug|august|september|october|november|dec|december|janv|fevr|avr|mai|juin|juil|aout|déc|fev|abr|mai|ago|out|dez|gen|mag|giu|lug|ott)\\.?';
const POINT = `(?:(?:${MONTH}\\s*(?:de\\s*)?)?(?:19|20)\\d{2}|\\d{1,2}\\s*[/.-]\\s*(?:19|20)\\d{2})`;
const NOW = '(?:actualidad|actualmente|presente|actual|hoy|la fecha|present|current|now|today|aujourd.hui|atual|atualmente|oggi|in corso)';
const RANGE = new RegExp(`(${POINT})(?:\\s*(?:-|–|—|/|a|al|hasta|to|until|à|ate|até)\\s*|\\s+)(${POINT}|${NOW})`, 'i');
const SINGLE = new RegExp(`(${POINT})`, 'i');
const LEVEL = /\b(nativ[oa]|lengua materna|native|mother tongue|bilingüe|bilingue|bilingual|[abc][12]|b[áa]sico|basic|elemental|intermedio|intermediate|medio|avanzado|advanced|alto|fluido|fluent|conversacional)\b/i;

// Incluye el área de uso privado: algunos PDF guardan ahí guiones e iconos.
const ICON_ANY = /[☎✆📞📱✉📧⌂🏠📍↗🔗🌐\uE000-\uF8FF]/gu;
function cleanLine(s) {
  return s.replace(ICON_ANY, ' ').replace(/[ \t\u00a0\u2000-\u200b]+/g, (m) => (m.length > 1 ? '  ' : ' ')).replace(ICONS, '').trim();
}

function dates(line) {
  const r = line.match(RANGE);
  if (r) {
    const actual = new RegExp(`^${NOW}$`, 'i').test(r[2].trim());
    return { inicio: r[1].trim(), fin: actual ? '' : r[2].trim(), actual, rest: line.replace(r[0], '') };
  }
  const s = line.match(SINGLE);
  if (s) return { inicio: '', fin: s[1].trim(), actual: false, rest: line.replace(s[0], '') };
  return null;
}

const tidy = (s) => s.replace(/^[\s|·,:;()–—-]+|[\s|·,:;()–—-]+$/g, '').replace(/\(\s*\)/g, '').trim();

function splitPlace(s) {
  const m = s.split(/\s+[·|–—-]\s+|,\s+(?=[A-ZÁÉÍÓÚÑ][^,]*$)/);
  return m.length > 1 ? { empresa: tidy(m[0]), lugar: tidy(m.slice(1).join(', ')) } : { empresa: tidy(s), lugar: '' };
}

// "Puesto — Empresa, Ciudad" o "Puesto | Empresa" en una sola línea.
function splitTitle(s) {
  const parts = s.split(/\s+[—–|]\s+|\s+-\s+/).map(tidy).filter(Boolean);
  if (parts.length < 2) return { title: s, rest: '' };
  return { title: parts[0], rest: parts.slice(1).join(' · ') };
}

function parseEntries(lines, kind) {
  const exp = kind === 'experiencia';
  const entries = [];
  let cur = null;
  let pending = null;
  const setDates = (d) => d && Object.assign(cur, exp ? { inicio: d.inicio, fin: d.fin, actual: d.actual } : { inicio: d.inicio, fin: d.fin });
  const hasDates = () => cur && (cur.inicio || cur.fin || cur.actual);
  const fresh = (text, d) => {
    const { title, rest } = splitTitle(text);
    cur = exp
      ? { puesto: title, empresa: '', lugar: '', inicio: '', fin: '', actual: false, tareas: [], bullets: false }
      : { titulo: title, centro: '', inicio: '', fin: '' };
    entries.push(cur);
    if (rest) exp ? Object.assign(cur, splitPlace(rest)) : (cur.centro = rest);
    setDates(d);
  };
  for (const { text, bullet } of lines) {
    const d = dates(text);
    const rest = tidy(d ? d.rest : text);
    if (bullet && exp && cur) {
      cur.tareas.push(text);
      cur.bullets = true;
      continue;
    }
    if (!rest) {
      if (d && cur && !hasDates() && (!exp || cur.tareas.length === 0)) setDates(d);
      else if (d) pending = d;
      continue;
    }
    const second = exp ? cur && !cur.empresa && cur.tareas.length === 0 : cur && !cur.centro;
    if (exp) {
      if (!cur || pending || (cur.bullets && !bullet && rest.length <= 80) || (d && !second) || (d && hasDates())) {
        fresh(rest, d || pending);
        pending = null;
      } else if (second && rest.length <= 70) {
        Object.assign(cur, splitPlace(rest));
        if (!hasDates()) setDates(d);
      } else {
        cur.tareas.push(rest);
      }
    } else if (!cur || pending || !second || (d && hasDates())) {
      fresh(rest, d || pending);
      pending = null;
    } else {
      cur.centro = splitPlace(rest).empresa;
      if (!hasDates()) setDates(d);
    }
  }
  if (exp) return entries.map(({ bullets, ...e }) => ({ ...e, tareas: e.tareas.join('\n') }));
  return entries;
}

function parseSkills(lines) {
  const out = [];
  for (const { text } of lines) {
    for (const part of text.split(/\s*[,;|•·]\s*|\s{2,}/)) {
      const s = tidy(part);
      if (s.length >= 2 && s.length <= 45 && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
    }
  }
  return out.slice(0, 20);
}

function parseLangs(lines) {
  const out = [];
  for (const { text } of lines) {
    for (const part of text.split(/\s*[,;|•·]\s*|\s{2,}(?=\p{Lu})/u)) {
      const lv = part.match(LEVEL);
      const idioma = tidy(lv ? part.replace(lv[0], '') : part).replace(/\b(nivel|level)\b/i, '').trim();
      if (!idioma) {
        // Nivel suelto ("Español   Nativo"): pertenece al idioma anterior.
        if (lv && out.length && !out.at(-1).nivel) out.at(-1).nivel = levelName(lv[0]);
        continue;
      }
      if (idioma.length > 30) continue;
      out.push({ idioma: idioma.charAt(0).toUpperCase() + idioma.slice(1), nivel: lv ? levelName(lv[0]) : '' });
    }
  }
  return out.slice(0, 8);
}

function levelName(raw) {
  const s = norm(raw);
  if (/^[abc][12]$/.test(s)) return s.toUpperCase();
  if (/nativ|materna|native|mother/.test(s)) return 'Nativo';
  if (/biling/.test(s)) return 'Nativo';
  if (/basic|elemental/.test(s)) return 'Básico';
  if (/intermed|medio|conversacional/.test(s)) return 'Intermedio';
  if (/avanzado|advanced|alto|fluido|fluent/.test(s)) return 'Avanzado';
  return '';
}

export function parseCV(rawLines) {
  const result = { nombre: '', puesto: '', email: '', telefono: '', ciudad: '', web: '', perfil: '', experiencia: [], formacion: [], habilidades: [], idiomas: [], otros: '' };
  const buckets = { header: [], perfil: [], experiencia: [], formacion: [], habilidades: [], idiomas: [], otros: [], ignorar: [] };
  let section = 'header';
  let found = 0;

  for (const raw of rawLines) {
    if (!raw || !raw.trim()) continue;
    const bullet = BULLET.test(raw) && !/^\s*-?\d/.test(raw);
    let text = cleanLine(raw.replace(BULLET, ''));
    if (!text) continue;

    // Datos de contacto: en cualquier parte del documento.
    const email = text.match(EMAIL);
    if (email) { result.email ||= email[0]; text = tidy(text.replace(email[0], '')); }
    const web = text.match(WEB);
    if (web && !email) { result.web ||= web[0]; text = tidy(text.replace(web[0], '')); }
    const phone = text.match(PHONE);
    if (phone && phone[1].replace(/\D/g, '').length >= 9 && !RANGE.test(text)) { result.telefono ||= phone[1].trim(); text = tidy(text.replace(phone[1], '')); }
    if (!text) continue;

    const key = norm(text);
    if (text.length <= 45 && SECTION_OF.has(key)) {
      section = SECTION_OF.get(key);
      found++;
      continue;
    }
    buckets[section].push({ text, bullet });
  }

  // Une las líneas partidas por el ancho de la columna (empiezan en minúscula).
  for (const key of ['perfil', 'experiencia', 'formacion', 'otros', 'habilidades']) {
    const merged = [];
    for (const l of buckets[key]) {
      const prev = merged.at(-1);
      if (prev && !l.bullet && /^[\p{Ll}(]/u.test(l.text) && !/[.:]$/.test(prev.text)) prev.text += ` ${l.text}`;
      else merged.push({ ...l });
    }
    buckets[key] = merged;
  }

  // Cabecera: nombre, puesto y ciudad.
  const nameLike = (t) => /^[\p{L}][\p{L}'’.\s-]+$/u.test(t) && t.split(/\s+/).length >= 2 && t.split(/\s+/).length <= 5 && t.length <= 45;
  const header = buckets.header.map((l) => l.text);
  const nameIdx = header.findIndex(nameLike);
  if (nameIdx >= 0) {
    result.nombre = header[nameIdx].replace(/\b(\p{L})(\p{L}*)/gu, (m, a, b) => (m === m.toUpperCase() && m.length > 1 ? a + b.toLowerCase() : m));
    header.splice(nameIdx, 1);
  }
  const rest = header.filter((t) => t.length <= 60);
  if (rest.length && rest[0].split(/\s+/).length <= 7 && !/\d/.test(rest[0])) result.puesto = rest.shift();
  const cityLike = (t) => t.split(/\s+/).length <= 4 && !/\d/.test(t) && t.length <= 40;
  const city = rest.find(cityLike) || buckets.ignorar.map((l) => l.text).find(cityLike);
  if (city) result.ciudad = city;
  // Texto suelto en la cabecera sin sección "Perfil": suele ser la presentación.
  const loose = header.filter((t) => t !== result.puesto && t !== result.ciudad && t.length > 60);
  if (!buckets.perfil.length && loose.length) buckets.perfil.push(...loose.map((text) => ({ text })));

  result.perfil = buckets.perfil.map((l) => l.text).join(' ').slice(0, 700);
  result.experiencia = parseEntries(buckets.experiencia, 'experiencia');
  result.formacion = parseEntries(buckets.formacion, 'formacion');
  result.habilidades = parseSkills(buckets.habilidades);
  result.idiomas = parseLangs(buckets.idiomas);
  result.otros = buckets.otros.map((l) => l.text).join('\n');
  result._secciones = found;
  return result;
}
