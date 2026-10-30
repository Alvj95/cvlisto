import { FRASES } from '../data/traducciones.js';

// Idiomas en los que se puede generar el currículum (orden = columnas de FRASES).
export const LANGS = [
  { id: 'es', name: 'Español', es: 'español', flag: '🇪🇸' },
  { id: 'en', name: 'English', es: 'inglés', flag: '🇬🇧' },
  { id: 'fr', name: 'Français', es: 'francés', flag: '🇫🇷' },
  { id: 'pt', name: 'Português', es: 'portugués', flag: '🇵🇹' },
  { id: 'it', name: 'Italiano', es: 'italiano', flag: '🇮🇹' },
];
const COL = Object.fromEntries(LANGS.map((l, i) => [l.id, i]));

const LABELS = {
  es: { perfil: 'Perfil', experiencia: 'Experiencia', formacion: 'Formación', habilidades: 'Habilidades', idiomas: 'Idiomas', otros: 'Otros datos', contacto: 'Contacto', actualidad: 'Actualidad', nombre: 'Tu nombre' },
  en: { perfil: 'Profile', experiencia: 'Work experience', formacion: 'Education', habilidades: 'Skills', idiomas: 'Languages', otros: 'Additional information', contacto: 'Contact', actualidad: 'Present', nombre: 'Your name' },
  fr: { perfil: 'Profil', experiencia: 'Expérience professionnelle', formacion: 'Formation', habilidades: 'Compétences', idiomas: 'Langues', otros: 'Informations complémentaires', contacto: 'Contact', actualidad: 'Aujourd’hui', nombre: 'Votre nom' },
  pt: { perfil: 'Perfil', experiencia: 'Experiência profissional', formacion: 'Formação', habilidades: 'Competências', idiomas: 'Línguas', otros: 'Outras informações', contacto: 'Contacto', actualidad: 'Atualmente', nombre: 'O seu nome' },
  it: { perfil: 'Profilo', experiencia: 'Esperienza lavorativa', formacion: 'Istruzione e formazione', habilidades: 'Competenze', idiomas: 'Lingue', otros: 'Altre informazioni', contacto: 'Contatti', actualidad: 'In corso', nombre: 'Il tuo nome' },
};

// Niveles que ofrece el editor (se guardan en español).
const LEVELS = {
  Nativo: ['Nativo', 'Native', 'Langue maternelle', 'Nativo', 'Madrelingua'],
  Básico: ['Básico', 'Basic', 'Notions', 'Básico', 'Base'],
  Intermedio: ['Intermedio', 'Intermediate', 'Intermédiaire', 'Intermédio', 'Intermedio'],
  Avanzado: ['Avanzado', 'Advanced', 'Courant', 'Avançado', 'Avanzato'],
};

const key = (s) => String(s ?? '').trim().toLowerCase();
const INDEX = new Map();
for (const row of FRASES) for (const text of row) if (!INDEX.has(key(text))) INDEX.set(key(text), row);

export const label = (lang, k) => (LABELS[lang] || LABELS.es)[k];

// Devuelve la frase en el idioma pedido si la conocemos; si no, el texto tal cual.
export function tr(text, lang = 'es') {
  if (!text) return text;
  const row = INDEX.get(key(text));
  return row ? row[COL[lang] ?? 0] : text;
}

export const known = (text) => !text || INDEX.has(key(text));

export function level(nivel, lang = 'es') {
  const row = LEVELS[nivel];
  return row ? row[COL[lang] ?? 0] : nivel;
}
