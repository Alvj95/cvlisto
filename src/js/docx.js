// Genera el currículum en Word (.docx) en el navegador, sin librerías: un .docx es un
// ZIP con varios XML. Se escribe sin comprimir, que Word abre sin problemas.
import { label, tr, level } from './i18n.js';

/* ---------- ZIP (método "store") ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    const nameBytes = enc.encode(name);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, bytes);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, bytes.length, true);
    cen.setUint32(24, bytes.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nameBytes);
    offset += 30 + nameBytes.length + bytes.length;
  }
  const cenSize = central.reduce((s, b) => s + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/* ---------- Contenido ---------- */
const x = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const lines = (s) =>
  String(s ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);

const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c.slice(1).toUpperCase() : '5B4BFF');

// Un tramo de texto con formato opcional.
function run(text, { b, i, color, size, caps } = {}) {
  const pr = [b && '<w:b/>', i && '<w:i/>', caps && '<w:caps/>', color && `<w:color w:val="${color}"/>`, size && `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`]
    .filter(Boolean)
    .join('');
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
}

function para(runs, { style, align, after, before, tabRight, keepNext, bullet } = {}) {
  const pr = [
    style && `<w:pStyle w:val="${style}"/>`,
    keepNext && '<w:keepNext/>',
    bullet && '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>',
    tabRight && `<w:tabs><w:tab w:val="right" w:pos="${tabRight}"/></w:tabs>`,
    (after != null || before != null) && `<w:spacing${before != null ? ` w:before="${before}"` : ''}${after != null ? ` w:after="${after}"` : ''}/>`,
    align && `<w:jc w:val="${align}"/>`,
  ]
    .filter(Boolean)
    .join('');
  return `<w:p>${pr ? `<w:pPr>${pr}</w:pPr>` : ''}${Array.isArray(runs) ? runs.join('') : runs}</w:p>`;
}

const TAB = '<w:r><w:tab/></w:r>';
// Ancho útil de la página en twips (A4 menos márgenes de 1,8 cm).
const WIDTH = 11906 - 2 * 1020;

function buildDocument(d, L, accent, hasPhoto) {
  const rangeOf = (a, b, actual) => {
    const fin = actual ? label(L, 'actualidad') : b;
    return a && fin ? `${a} – ${fin}` : a || fin || '';
  };
  const heading = (k) => para(run(label(L, k), { b: true, caps: true, color: accent, size: 22 }), { style: 'Seccion', keepNext: true });
  const body = [];

  // Cabecera: nombre, puesto y contacto (con la foto a la derecha si la hay).
  const contact = [d.telefono, d.email, d.ciudad, d.web].filter(Boolean).join('   ·   ');
  const headParas = [
    para(run(d.nombre || label(L, 'nombre'), { b: true, size: 44 }), { after: 40 }),
    d.puesto ? para(run(tr(d.puesto, L), { b: true, color: accent, size: 26 }), { after: 80 }) : '',
    contact ? para(run(contact, { color: '5B6475', size: 18 }), { after: 0 }) : '',
  ].join('');
  if (hasPhoto) {
    const photoW = 1440; // 2,54 cm
    const emu = photoW * 635;
    body.push(`<w:tbl><w:tblPr><w:tblW w:w="${WIDTH}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="${WIDTH - photoW - 200}"/><w:gridCol w:w="${photoW + 200}"/></w:tblGrid>
<w:tr><w:tc><w:tcPr><w:tcW w:w="${WIDTH - photoW - 200}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${headParas}</w:tc>
<w:tc><w:tcPr><w:tcW w:w="${photoW + 200}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${emu}" cy="${emu}"/><wp:docPr id="1" name="Foto"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="foto.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdFoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu}" cy="${emu}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:tc></w:tr></w:tbl>`);
  } else {
    body.push(headParas);
  }
  // Línea de color bajo la cabecera.
  body.push(`<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="${accent}"/></w:pBdr><w:spacing w:after="120"/></w:pPr></w:p>`);

  if (String(d.perfil || '').trim()) {
    body.push(heading('perfil'), para(run(tr(d.perfil, L))));
  }

  const entry = (title, sub, dates, tasks = []) => {
    body.push(para([run(title, { b: true, size: 22 }), dates ? TAB + run(dates, { color: '5B6475', size: 18 }) : ''], { tabRight: WIDTH, keepNext: true, after: 0, before: 120 }));
    if (sub) body.push(para(run(sub, { i: true, color: '5B6475', size: 19 }), { after: tasks.length ? 40 : 60, keepNext: tasks.length > 0 }));
    tasks.forEach((t) => body.push(para(run(t), { bullet: true, after: 20 })));
  };

  const exp = (d.experiencia || []).filter((e) => e.puesto || e.empresa);
  if (exp.length) {
    body.push(heading('experiencia'));
    exp.forEach((e) =>
      entry(tr(e.puesto, L), [e.empresa, e.lugar].filter(Boolean).join(' · '), rangeOf(e.inicio, e.fin, e.actual), lines(e.tareas).map((t) => tr(t, L))),
    );
  }

  const edu = (d.formacion || []).filter((f) => f.titulo || f.centro);
  if (edu.length) {
    body.push(heading('formacion'));
    edu.forEach((f) => entry(f.titulo, f.centro, rangeOf(f.inicio, f.fin, false)));
  }

  if ((d.habilidades || []).length) {
    body.push(heading('habilidades'), para(run(d.habilidades.map((h) => tr(h, L)).join('  ·  '))));
  }

  const langs = (d.idiomas || []).filter((i) => i.idioma);
  if (langs.length) {
    body.push(heading('idiomas'));
    langs.forEach((i) => body.push(para([run(tr(i.idioma, L), { b: true }), i.nivel ? run(`: ${level(i.nivel, L)}`) : ''], { after: 40 })));
  }

  const otros = lines(d.otros).map((t) => tr(t, L));
  if (otros.length) {
    body.push(heading('otros'));
    otros.forEach((t) => body.push(para(run(t), { bullet: true, after: 20 })));
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1020" w:right="1020" w:bottom="1020" w:left="1020" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const STYLES = (accent) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="1D2433"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Seccion"><w:name w:val="Sección"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="${accent}"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="${accent}"/><w:spacing w:val="10"/></w:rPr></w:style>
</w:styles>`;

const NUMBERING = (accent) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr><w:rPr><w:color w:val="${accent}"/></w:rPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

// d: datos del currículum. Devuelve un Blob .docx.
export function cvToDocx(d) {
  const L = d.lang || 'es';
  const accent = hex(d.accent);
  let photo = null;
  const m = /^data:image\/(jpeg|jpg|png);base64,(.+)$/.exec(d.foto || '');
  if (m) {
    const bin = atob(m[2]);
    photo = { ext: m[1] === 'png' ? 'png' : 'jpeg', bytes: Uint8Array.from(bin, (c) => c.charCodeAt(0)) };
  }
  const files = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    },
    {
      name: 'docProps/core.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x(`CV ${d.nombre || ''}`.trim())}</dc:title><dc:creator>${x(d.nombre || 'Tu CV Gratis')}</dc:creator></cp:coreProperties>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${
        photo ? `<Relationship Id="rIdFoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/foto.${photo.ext}"/>` : ''
      }</Relationships>`,
    },
    { name: 'word/document.xml', data: buildDocument(d, L, accent, Boolean(photo)) },
    { name: 'word/styles.xml', data: STYLES(accent) },
    { name: 'word/numbering.xml', data: NUMBERING(accent) },
  ];
  if (photo) files.push({ name: `word/media/foto.${photo.ext}`, data: photo.bytes });
  return zip(files);
}
