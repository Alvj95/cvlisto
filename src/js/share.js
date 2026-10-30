// Genera el PDF en el navegador (sin pasar por "Imprimir") para poder compartirlo
// con la hoja de compartir del móvil: WhatsApp, Gmail, Telegram…
// Las librerías solo se cargan la primera vez que alguien pulsa "Enviar".

const A4_W_MM = 210;
const A4_H_MM = 297;

const loaded = {};
function loadScript(src) {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
  }
  return loaded[src];
}

async function libs() {
  const base = new URL('../vendor/', import.meta.url);
  await Promise.all([
    loadScript(new URL('html2canvas/html2canvas.min.js', base).href),
    loadScript(new URL('jspdf/jspdf.umd.min.js', base).href),
  ]);
  return { html2canvas: window.html2canvas, jsPDF: window.jspdf.jsPDF };
}

// html es el HTML de una hoja A4 (currículum o carta) tal como se ve en la vista previa.
export async function htmlToPdf(html) {
  const { html2canvas, jsPDF } = await libs();
  // Se pinta fuera de la pantalla, a tamaño real y sin escalar.
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1';
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    await document.fonts?.ready;
    const sheet = host.firstElementChild;
    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    // Alto de una página A4 en píxeles del lienzo.
    const pagePx = Math.floor((canvas.width * A4_H_MM) / A4_W_MM);
    const pages = Math.max(1, Math.ceil((canvas.height - 4) / pagePx));
    for (let i = 0; i < pages; i++) {
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.min(pagePx, canvas.height - i * pagePx);
      const ctx = slice.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -i * pagePx);
      if (i > 0) pdf.addPage();
      const h = (slice.height * A4_W_MM) / slice.width;
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4_W_MM, h);
    }
    return pdf.output('blob');
  } finally {
    host.remove();
  }
}

export const fileName = (prefix, nombre) =>
  `${prefix} ${nombre || ''}`
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_') + '.pdf';

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Devuelve 'shared' si se abrió la hoja de compartir, 'cancelled' si la cerró,
// o 'downloaded' si el dispositivo no permite compartir archivos (ordenador).
export async function shareOrDownload(blob, name, text) {
  const file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name.replace(/\.pdf$/, ''), text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Algunos navegadores fallan al compartir: descargamos como alternativa.
    }
  }
  download(blob, name);
  return 'downloaded';
}
