// Estado de la versión Pro en este dispositivo. La activación con clave de
// licencia se añadirá al conectar la pasarela de pago.
const KEY = 'cvlisto:pro:v1';

export function proInfo() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export const isPro = () => Boolean(proInfo()?.key);
