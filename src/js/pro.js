// Estado de la versión Pro en este dispositivo. Las claves las emite Lemon Squeezy
// al comprar; se comprueban con su API pública de licencias (no necesita clave de API).
const KEY = 'cvlisto:pro:v1';
const API = 'https://api.lemonsqueezy.com/v1/licenses/';
// Solo se aceptan claves de nuestra tienda de Lemon Squeezy (evita claves de otras tiendas).
const STORE_ID = 511301;
// Si la respuesta no trae tienda, se comprueba el nombre del producto (sin mayúsculas, tildes ni espacios).
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const isOurProduct = (name) => norm(name).includes('cvgratis');
const RECHECK_DAYS = 7;

export function proInfo() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export const isPro = () => Boolean(proInfo()?.key);

function store(info) {
  try {
    if (info) localStorage.setItem(KEY, JSON.stringify(info));
    else localStorage.removeItem(KEY);
  } catch {}
}

// Petición "simple" (formulario) para que el navegador no necesite permiso previo (CORS).
async function call(action, params) {
  const res = await fetch(API + action, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams(params),
  });
  return res.json();
}

function deviceName() {
  const ua = navigator.userAgent;
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad/i.test(ua) ? 'iPhone/iPad' : /mac/i.test(ua) ? 'Mac' : /windows/i.test(ua) ? 'Windows' : 'Otro';
  const br = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Navegador';
  return `${os} · ${br}`;
}

const ERRORS = [
  [/not found|invalid/i, 'Esa clave no existe. Revisa que la hayas copiado entera.'],
  [/activation limit/i, 'Esta clave ya está activada en 3 dispositivos. Desactívala en alguno de ellos o escríbenos.'],
  [/disabled|expired|refunded/i, 'Esta clave está desactivada (por ejemplo, por un reembolso).'],
];
const friendly = (msg) => (ERRORS.find(([re]) => re.test(msg || ''))?.[1]) || 'No hemos podido activar la clave. Inténtalo de nuevo o escríbenos.';

// Devuelve { ok: true } o { ok: false, error }.
export async function activate(rawKey) {
  const key = rawKey.trim();
  if (!key) return { ok: false, error: 'Pega tu clave de licencia.' };
  let data;
  try {
    data = await call('activate', { license_key: key, instance_name: deviceName() });
  } catch {
    return { ok: false, error: 'No hay conexión con el servidor de licencias. Comprueba tu internet e inténtalo de nuevo.' };
  }
  if (!data?.activated) return { ok: false, error: friendly(data?.error) };
  const foreign = data.meta?.store_id ? Number(data.meta.store_id) !== STORE_ID : data.meta?.product_name && !isOurProduct(data.meta.product_name);
  if (foreign) {
    // Clave válida de otro producto: se libera la activación y se rechaza.
    call('deactivate', { license_key: key, instance_id: data.instance.id }).catch(() => {});
    return { ok: false, error: 'Esta clave no es de Tu CV Gratis Pro.' };
  }
  store({
    key,
    instanceId: data.instance?.id,
    email: data.meta?.customer_email || '',
    storeId: data.meta?.store_id || null,
    activatedAt: Date.now(),
    checkedAt: Date.now(),
  });
  return { ok: true };
}

export async function deactivate() {
  const info = proInfo();
  if (!info) return;
  try {
    await call('deactivate', { license_key: info.key, instance_id: info.instanceId });
  } catch {}
  store(null);
}

// Comprobación periódica: si la clave se ha desactivado (p. ej. por un reembolso), se quita Pro.
// Sin conexión no se hace nada: Pro sigue funcionando.
export async function recheck() {
  const info = proInfo();
  if (!info || Date.now() - (info.checkedAt || 0) < RECHECK_DAYS * 864e5) return;
  try {
    const data = await call('validate', { license_key: info.key, instance_id: info.instanceId });
    if (data && data.valid === false && /disabled|expired|not found|instance/i.test(`${data.error} ${data.license_key?.status}`)) store(null);
    else store({ ...info, checkedAt: Date.now() });
  } catch {}
}
