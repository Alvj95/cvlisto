// Ajustes del sitio. Rellena los campos marcados antes de publicar en tu dominio
// y antes de pedir la aprobación de AdSense.

export const CONFIG = {
  nombreSitio: 'Tu CV Gratis',
  // URL pública final, sin barra al final. Se usa en el sitemap y en las etiquetas canonical.
  url: process.env.SITE_URL || 'https://tucvgratis.es',
  // Carpeta base: "/" con dominio propio, "/cvlisto/" en GitHub Pages sin dominio.
  base: process.env.BASE_PATH || '/',

  // Estadísticas de visitas (Cloudflare Web Analytics: sin cookies). Vacío = desactivado.
  cfAnalyticsToken: process.env.CF_ANALYTICS_TOKEN || '7a85f77966bb4848a1f5351abb9536b0',

  // ID de editor de AdSense, p. ej. "ca-pub-1234567890123456". Vacío = sin anuncios.
  adsenseClient: process.env.ADSENSE_CLIENT || 'ca-pub-8590744942912233',

  // Enlace de pago de la versión Pro (Lemon Squeezy, Paddle…). Vacío = "Próximamente".
  // Desactivado hasta que Lemon Squeezy active la tienda (en modo de prueba se podría "comprar" con tarjetas de prueba).
  // Enlace de compra: https://tucvgratis.lemonsqueezy.com/checkout/buy/a19b2ce1-f5eb-43b7-9202-e3d8d8be025b
  proCheckoutUrl: process.env.PRO_CHECKOUT_URL || '',
  // Precio de la versión Pro (pago único). "proPrecioAntes" se muestra tachado: quítalo si no hay oferta.
  proPrecio: '4,99 €',
  proPrecioAntes: '9,99 €',
  // Oferta con código de descuento de Lemon Squeezy. Se oculta sola al pasar la fecha "hasta".
  // Para quitarla antes, deja "codigo" vacío.
  promo: { codigo: 'G2NDK3OQ', descuento: '50 %', precio: '2,50 €', hasta: '2026-12-31', hastaTexto: '31 de diciembre' },

  // Datos del titular para el aviso legal (obligatorios por la LSSI en España).
  titular: process.env.OWNER_NAME || 'Jose Alejandro Alvarado Rodriguez',
  nif: process.env.OWNER_NIF || '60692576S',
  domicilio: process.env.OWNER_ADDRESS || 'El Prat de Llobregat, 08820 Barcelona, España',
  email: process.env.CONTACT_EMAIL || 'alvj321@gmail.com',
};
