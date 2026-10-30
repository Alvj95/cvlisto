# Tu CV Gratis

Web para **crear currículums gratis** y descargarlos en PDF, con ejemplos por oficio, frases ya escritas y plantillas profesionales. Preparada para Google AdSense y para una futura versión Pro de pago único.

- Sin registro: el currículum se guarda solo en el navegador del usuario.
- PDF con texto real (seleccionable y legible por los filtros automáticos de selección), generado con la impresión del navegador.
- Sitio estático: sin servidor, sin base de datos y sin dependencias. Solo hace falta Node 18 o superior para generarlo.

## Qué incluye

| Página | Ruta |
| --- | --- |
| Portada (con FAQ y datos estructurados) | `/` |
| Editor de currículum | `/crear/` |
| Ejemplos por oficio (10) | `/ejemplos/<oficio>/` |
| Consejos (3 artículos) | `/consejos/<artículo>/` |
| Versión Pro (próximamente) | `/pro/` |
| Quiénes somos, contacto, aviso legal, privacidad, cookies | `/sobre-nosotros/`… |

Además se generan `sitemap.xml`, `robots.txt`, `404.html` y, si hay ID de AdSense, `ads.txt`.

## Probar en local

```bash
npm run dev        # genera dist/ y lo sirve en http://localhost:4321
```

## Dónde se cambia cada cosa

- `src/data/oficios.js`: oficios, frases, tareas, habilidades y ejemplos. Añadir un oficio crea su página automáticamente.
- `src/data/articulos.js`: artículos de consejos.
- `src/js/cv-render.js` y `src/css/cv.css`: plantillas del currículum.
- `src/js/editor.js`: el editor.
- `src/config.js`: nombre, dominio, AdSense, enlace de pago y datos legales.
- `scripts/build.mjs`: estructura de las páginas.

## Publicar

Cada push a `main` publica la web en GitHub Pages (`.github/workflows/deploy.yml`).

1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. En **Settings → Secrets and variables → Actions → Variables**, crea:

| Variable | Ejemplo | Para qué |
| --- | --- | --- |
| `CUSTOM_DOMAIN` | `tucvgratis.es` | Tu dominio. Sin ella se publica en `usuario.github.io/cvlisto`. |
| `OWNER_NAME`, `OWNER_NIF`, `OWNER_ADDRESS`, `CONTACT_EMAIL` | valores de `src/config.js` | Aviso legal y privacidad (obligatorios en España). |
| `ADSENSE_CLIENT` | `ca-pub-1234567890123456` | Activa los anuncios y genera `ads.txt`. |
| `PRO_CHECKOUT_URL` | enlace de Lemon Squeezy | Activa el botón de compra de la versión Pro. |

3. Con dominio propio: en tu registrador, apunta el dominio a GitHub Pages (registros A a `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` y CNAME `www` a `usuario.github.io`) y activa **Enforce HTTPS** en Settings → Pages.

## Checklist para AdSense

1. Dominio propio publicado y con HTTPS.
2. Datos reales en aviso legal, privacidad y contacto (no dejes los `[CORCHETES]`).
3. Solicitar la web en AdSense con el dominio principal.
4. Añadir `ADSENSE_CLIENT` y volver a publicar: así se insertan el código de verificación y `ads.txt`.
5. En AdSense, **Privacidad y mensajes → Europa**: crea el mensaje de consentimiento de cookies (CMP certificada de Google). Es obligatorio para mostrar anuncios en el Espacio Económico Europeo.
6. Activar **anuncios automáticos**. El editor (`/crear/`) no carga anuncios, para no molestar a quien está escribiendo.
7. Dar de alta el sitemap en Google Search Console.
