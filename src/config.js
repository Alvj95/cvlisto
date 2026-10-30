// Ajustes del sitio. Rellena los campos marcados antes de publicar en tu dominio
// y antes de pedir la aprobación de AdSense.

export const CONFIG = {
  nombreSitio: 'Tu CV Gratis',
  // URL pública final, sin barra al final. Se usa en el sitemap y en las etiquetas canonical.
  url: process.env.SITE_URL || 'https://tucvgratis.es',
  // Carpeta base: "/" con dominio propio, "/cvlisto/" en GitHub Pages sin dominio.
  base: process.env.BASE_PATH || '/',

  // ID de editor de AdSense, p. ej. "ca-pub-1234567890123456". Vacío = sin anuncios.
  adsenseClient: process.env.ADSENSE_CLIENT || 'ca-pub-8590744942912233',

  // Enlace de pago de la versión Pro (Lemon Squeezy, Paddle…). Vacío = "Próximamente".
  proCheckoutUrl: process.env.PRO_CHECKOUT_URL || '',

  // Datos del titular para el aviso legal (obligatorios por la LSSI en España).
  titular: process.env.OWNER_NAME || 'Jose Alejandro Alvarado Rodriguez',
  nif: process.env.OWNER_NIF || '60692576S',
  domicilio: process.env.OWNER_ADDRESS || 'El Prat de Llobregat, 08820 Barcelona, España',
  email: process.env.CONTACT_EMAIL || 'alvj321@gmail.com',
};
