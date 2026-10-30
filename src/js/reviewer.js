// Revisor de currículum: reglas sencillas que detectan los fallos más habituales.
// Devuelve una nota de 0 a 100 y una lista de consejos ordenados por importancia.
import { known } from './i18n.js';

const PESO = { alta: 15, media: 7, baja: 2 };

// Palabras frecuentes en un CV que suelen escribirse sin tilde.
const TILDES = {
  atencion: 'atención', gestion: 'gestión', informatica: 'informática', ingles: 'inglés', frances: 'francés', aleman: 'alemán',
  educacion: 'educación', formacion: 'formación', telefono: 'teléfono', administracion: 'administración', comunicacion: 'comunicación',
  organizacion: 'organización', resolucion: 'resolución', facturacion: 'facturación', recepcion: 'recepción', construccion: 'construcción',
  ingenieria: 'ingeniería', tecnico: 'técnico', tecnica: 'técnica', basico: 'básico', basica: 'básica', practicas: 'prácticas',
  electronica: 'electrónica', mecanica: 'mecánica', logistica: 'logística', reposicion: 'reposición', preparacion: 'preparación',
  manipulacion: 'manipulación', conduccion: 'conducción', planificacion: 'planificación', programacion: 'programación',
  economia: 'economía', camion: 'camión', almacen: 'almacén', dinamico: 'dinámico', dinamica: 'dinámica', rapido: 'rápido',
  rapida: 'rápida', publico: 'público', calculo: 'cálculo', analisis: 'análisis', titulo: 'título', ultimo: 'último',
  tambien: 'también',
};

const CLICHES = ['proactivo', 'proactiva', 'dinámico', 'dinámica', 'dinamico', 'dinamica', 'polivalente', 'perfeccionista', 'trabajador nato'];
const EMAIL_FEO = /(sexy|guap[oa]|bombon|princes|lov(e|er)|kiss|baby|nen[ae]|chul[oa]|loc[oa]|xx|666|69)/i;

const year = (s) => Number(String(s ?? '').match(/(19|20)\d{2}/)?.[0]) || 0;
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean);

export function reviewCV(cv, { pages = 1 } = {}) {
  const out = [];
  const add = (nivel, seccion, titulo, detalle, campo = '') => out.push({ nivel, seccion, titulo, detalle, campo });

  /* Datos personales */
  if (!cv.nombre.trim()) add('alta', 'datos', 'Falta tu nombre', 'Es lo primero que mira quien lee tu currículum.', 'f-nombre');
  if (!cv.telefono.trim()) add('alta', 'datos', 'Falta un teléfono', 'La mayoría de empresas llaman por teléfono para la entrevista.', 'f-tel');
  else if (cv.telefono.replace(/\D/g, '').length < 9) add('media', 'datos', 'Revisa tu teléfono', 'Parece que le faltan números. Un número mal escrito y no te pueden llamar.', 'f-tel');
  if (!cv.email.trim()) add('media', 'datos', 'Falta un email', 'Muchas empresas responden por correo.', 'f-email');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cv.email.trim())) add('alta', 'datos', 'El email no es válido', 'Revisa que esté bien escrito (ejemplo: nombre.apellido@gmail.com).', 'f-email');
  else if (EMAIL_FEO.test(cv.email) || (cv.email.split('@')[0].match(/\d/g) || []).length > 4)
    add('media', 'datos', 'Usa un email más profesional', 'Crea uno sencillo con tu nombre y apellido. Es gratis y da mejor imagen.', 'f-email');
  if (!cv.ciudad.trim()) add('baja', 'datos', 'Indica tu ciudad', 'Ayuda a saber si te pilla cerca del trabajo.', 'f-ciudad');
  if (!cv.puesto.trim()) add('media', 'datos', 'Indica el puesto que buscas', 'Debajo de tu nombre, para que se sepa a qué te presentas.', 'f-puesto');

  /* Perfil */
  const perfil = cv.perfil.trim();
  if (!perfil) add('media', 'perfil', 'Añade un perfil', '2 o 3 líneas que resuman quién eres y qué ofreces. Puedes tocar una sugerencia.', 'f-perfil');
  else {
    if (perfil.length < 120) add('baja', 'perfil', 'Tu perfil es muy corto', 'Añade tu experiencia, en qué destacas y tu disponibilidad.', 'f-perfil');
    if (perfil.length > 600) add('media', 'perfil', 'Tu perfil es demasiado largo', 'Déjalo en 2-3 líneas. Lo demás ya se ve en la experiencia.', 'f-perfil');
    const cl = CLICHES.filter((c) => perfil.toLowerCase().includes(c));
    if (cl.length) add('baja', 'perfil', 'Evita frases hechas', `Palabras como "${cl[0]}" las pone todo el mundo. Mejor algo concreto: años de experiencia, qué sabes hacer.`);
  }

  /* Experiencia */
  const exp = cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim() || e.tareas.trim());
  if (!exp.length) {
    if (!cv.formacion.some((f) => f.titulo.trim())) add('alta', 'experiencia', 'Tu currículum está casi vacío', 'Añade experiencia o formación. ¿Sin experiencia? Pon prácticas, voluntariado o trabajos informales.');
    else add('baja', 'experiencia', 'No tienes experiencia añadida', 'Si has hecho prácticas, voluntariado o has ayudado en un negocio familiar, cuenta como experiencia.');
  }
  exp.forEach((e, i) => {
    const nombre = e.puesto.trim() || `Experiencia ${i + 1}`;
    if (!e.puesto.trim()) add('media', 'experiencia', `Falta el puesto en "${e.empresa || nombre}"`, 'Indica qué puesto tenías.');
    if (!e.empresa.trim()) add('media', 'experiencia', `Falta la empresa en "${nombre}"`, 'Pon el nombre de la empresa o el tipo de negocio (por ejemplo, "Restaurante del centro").');
    if (!e.inicio.trim() && !e.fin.trim() && !e.actual) add('media', 'experiencia', `Faltan las fechas en "${nombre}"`, 'Basta con los años (por ejemplo, 2021 – 2023).');
    const tareas = e.tareas.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!tareas.length) add('media', 'experiencia', `Describe qué hacías en "${nombre}"`, 'Añade 2-4 tareas. Si elegiste tu oficio arriba, puedes tocarlas en las sugerencias.');
    else if (tareas.length === 1) add('baja', 'experiencia', `Añade alguna tarea más en "${nombre}"`, 'Con 2-4 tareas queda más completo.');
    if (tareas.some((t) => t.length > 170)) add('baja', 'experiencia', `Hay tareas muy largas en "${nombre}"`, 'Mejor frases cortas, de una línea cada una.');
    if (tareas.some((t) => /^\p{Ll}/u.test(t))) add('baja', 'experiencia', `Empieza las tareas con mayúscula en "${nombre}"`, 'Da una imagen más cuidada.');
  });
  const conCifras = exp.some((e) => /\d/.test(e.tareas)) || /\d/.test(perfil);
  if (exp.length && !conCifras) add('baja', 'experiencia', 'Añade alguna cifra', '"Atención a más de 80 clientes al día" se recuerda mucho más que "atención al cliente".');

  // Orden: la más reciente primero.
  const anios = exp.map((e) => (e.actual ? 9999 : year(e.fin) || year(e.inicio)));
  if (anios.some((a, i) => i > 0 && a && anios[i - 1] && a > anios[i - 1]))
    add('media', 'experiencia', 'Ordena la experiencia de más reciente a más antigua', 'Usa las flechas ↑ ↓ de cada experiencia.');

  // Huecos de más de un año entre trabajos.
  const tramos = exp
    .map((e) => ({ ini: year(e.inicio), fin: e.actual ? new Date().getFullYear() : year(e.fin) }))
    .filter((t) => t.ini && t.fin)
    .sort((a, b) => b.ini - a.ini);
  for (let i = 1; i < tramos.length; i++) {
    if (tramos[i - 1].ini - tramos[i].fin > 1) {
      add('baja', 'experiencia', `Hay un hueco entre ${tramos[i].fin} y ${tramos[i - 1].ini}`, 'Si estudiaste, cuidaste de un familiar o cambiaste de país, puedes indicarlo. Es mejor que dejarlo sin explicar.');
      break;
    }
  }

  /* Formación */
  if (!cv.formacion.some((f) => f.titulo.trim())) add('media', 'formacion', 'Añade tu formación', 'Tus estudios y también cursos cortos: manipulador de alimentos, PRL, informática…');

  /* Habilidades e idiomas */
  if (cv.habilidades.length < 4) add('media', 'habilidades', 'Añade más habilidades', 'Entre 5 y 10 está bien. Toca las sugerencias de tu oficio.');
  if (cv.habilidades.length > 15) add('baja', 'habilidades', 'Demasiadas habilidades', 'Quédate con las 8-12 más importantes para el puesto.');
  if (!cv.idiomas.some((i) => i.idioma.trim())) add('baja', 'idiomas', 'Indica qué idiomas hablas', 'Aunque sea solo tu idioma materno. Si hablas otro, aunque sea un poco, suma mucho.');

  /* Escritura */
  const todo = [cv.puesto, cv.perfil, ...exp.flatMap((e) => [e.puesto, e.tareas]), ...cv.formacion.map((f) => f.titulo), ...cv.habilidades, cv.otros].join(' ');
  const sinTilde = [...new Set(words(todo).map((w) => w.toLowerCase().replace(/[^a-zñü]/g, '')))].filter((w) => TILDES[w]);
  if (sinTilde.length)
    add('media', 'escritura', 'Revisa las tildes', sinTilde.slice(0, 4).map((w) => `${w} → ${TILDES[w]}`).join(', ') + (sinTilde.length > 4 ? '…' : ''));
  const gritos = words(todo).filter((w) => w.length > 4 && /^\p{Lu}+$/u.test(w) && !/^(APPCC|HACCP|FIFO|PRL|TPC|CRM|SAP|CAP)$/.test(w));
  if (gritos.length > 2) add('baja', 'escritura', 'Evita escribir en MAYÚSCULAS', 'Se lee peor y parece que gritas. Usa mayúscula solo al principio.');

  /* Formato */
  if (pages > 1) add('media', 'diseno', `Ocupa ${pages} páginas`, 'Para la mayoría de empleos, una página es suficiente. Resume tareas o prueba la plantilla "Compacta".');

  /* Idioma */
  if ((cv.lang || 'es') !== 'es') {
    const pend = [cv.perfil, ...exp.flatMap((e) => e.tareas.split('\n')), ...cv.habilidades].map((t) => t.trim()).filter((t) => t && !known(t));
    if (pend.length) add('media', 'diseno', 'Hay textos sin traducir', `${pend.length} textos escritos por ti siguen en español. Escríbelos en el idioma del currículum.`);
  }

  const orden = { alta: 0, media: 1, baja: 2 };
  out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  const nota = Math.max(0, 100 - out.reduce((n, x) => n + PESO[x.nivel], 0));
  return { nota, consejos: out };
}

export function notaTexto(n) {
  if (n >= 90) return { label: '¡Excelente!', color: '#10a37f' };
  if (n >= 75) return { label: 'Muy bien', color: '#19c39c' };
  if (n >= 50) return { label: 'Mejorable', color: '#f59e0b' };
  return { label: 'Necesita trabajo', color: '#e0457b' };
}
