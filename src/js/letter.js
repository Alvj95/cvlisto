// Carta de presentación: genera el texto a partir del currículum y la pinta en A4
// con el mismo color que el CV. Sin DOM, para usarla también al generar el sitio.
import { tr } from './i18n.js';
import { soft, dark } from './cv-render.js';

export const FUENTES = [
  { id: 'portal', label: 'En un portal de empleo' },
  { id: 'web', label: 'En la web de la empresa' },
  { id: 'recomendacion', label: 'Me la recomendaron' },
  { id: 'espontanea', label: 'No hay oferta: candidatura espontánea' },
];

export function emptyLetter() {
  return { empresa: '', puesto: '', contacto: '', fuente: 'portal', portal: '', variante: 0, texto: '', editado: false };
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const low = (s) => (s && !/^[A-Z]{2,}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s || '');
const pick = (arr, v) => arr[v % arr.length];

function listOf(items, and) {
  if (items.length <= 1) return items.join('');
  // Si algún elemento ya lleva "y" dentro, separamos solo con comas para no liarlo.
  if (items.some((x) => x.includes(` ${and} `))) return items.join(', ');
  return `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
}

// Años de experiencia a partir del año de inicio más antiguo.
function yearsOf(cv) {
  const years = cv.experiencia.map((e) => Number(String(e.inicio).match(/(19|20)\d{2}/)?.[0])).filter(Boolean);
  if (!years.length) return 0;
  return new Date().getFullYear() - Math.min(...years);
}

// Frases de cada idioma. Cada clave tiene varias versiones para "Otra versión".
const T = {
  es: {
    and: 'y',
    saludo: (c, e) => (c ? `Estimado/a ${c}:` : e ? `Estimado equipo de ${e}:` : 'Estimado equipo de selección:'),
    fuente: { portal: (p) => (p ? `en ${p}` : 'en un portal de empleo'), web: () => 'en su página web' },
    intro: {
      oferta: [
        (puesto, empresa, donde) => `Me dirijo a ustedes para presentar mi candidatura al puesto de ${puesto}${empresa ? ` en ${empresa}` : ''} que he visto publicado ${donde}.`,
        (puesto, empresa, donde) => `He visto ${donde} su oferta de ${puesto}${empresa ? ` en ${empresa}` : ''} y me gustaría formar parte de su equipo.`,
      ],
      recomendacion: [
        (puesto, empresa) => `Me pongo en contacto con ustedes por recomendación de una persona de su equipo para presentar mi candidatura al puesto de ${puesto}${empresa ? ` en ${empresa}` : ''}.`,
        (puesto, empresa) => `Me han hablado muy bien de ${empresa || 'su empresa'} y me gustaría presentar mi candidatura al puesto de ${puesto}.`,
      ],
      espontanea: [
        (puesto, empresa) => `Me pongo en contacto con ustedes para ofrecerles mi candidatura como ${puesto}${empresa ? ` en ${empresa}` : ''}, por si ahora o en el futuro necesitan incorporar a alguien a su equipo.`,
        (puesto, empresa) => `Me encantaría trabajar como ${puesto}${empresa ? ` en ${empresa}` : ''} y les escribo por si tienen alguna vacante ahora o en los próximos meses.`,
      ],
    },
    exp: [
      (y, last, actual, tareas) => `${y > 0 ? `Cuento con ${y} ${y === 1 ? 'año' : 'años'} de experiencia` : 'Tengo experiencia'} como ${last.puesto}${last.empresa ? `, ${actual ? 'actualmente' : 'más recientemente'} en ${last.empresa}` : ''}${tareas.length ? `, donde mis principales funciones son: ${tareas.join('; ')}` : ''}.`,
      (y, last, actual, tareas) => `${actual ? 'Actualmente trabajo' : 'Mi último empleo ha sido'} como ${last.puesto}${last.empresa ? ` en ${last.empresa}` : ''}${y > 0 ? ` y suman ya ${y} ${y === 1 ? 'año' : 'años'} de experiencia en el sector` : ''}.${tareas.length ? ` En mi día a día me encargo de: ${tareas.join('; ')}.` : ''}`,
    ],
    noexp: [
      (f) => `Aunque estoy empezando mi trayectoria profesional${f ? `, tengo formación en ${f}` : ''} y muchas ganas de aprender y de aportar desde el primer día.`,
      (f) => `Busco mi primera oportunidad laboral${f ? ` y cuento con formación en ${f}` : ''}. Soy una persona responsable, aprendo rápido y me adapto con facilidad.`,
    ],
    skills: [
      (h, e) => `Entre mis puntos fuertes destacan: ${h}, cualidades que creo que encajan con lo que buscan${e ? ` en ${e}` : ''}.`,
      (h) => `Las personas con las que he trabajado destacan de mí: ${h}.`,
    ],
    dispo: (d) => `Además, tengo ${low(d)}.`,
    dispoOk: /^disponib/i,
    dispoDefault: 'Tengo disponibilidad para incorporarme cuando lo necesiten.',
    cierre: [
      (contacto) => `Les adjunto mi currículum y quedo a su disposición para ampliar cualquier información en una entrevista.${contacto ? ` Pueden contactarme ${contacto}.` : ''}`,
      (contacto) => `Me encantaría tener la oportunidad de conocerles en una entrevista.${contacto ? ` Pueden localizarme ${contacto}.` : ''} Adjunto mi currículum.`,
    ],
    contacto: (t, m) => [t && `en el ${t}`, m && `en ${m}`].filter(Boolean).join(' o '),
    despedida: ['Un saludo cordial,', 'Muchas gracias por su tiempo. Un cordial saludo,'],
    destinatario: 'Departamento de Recursos Humanos',
  },
  en: {
    and: 'and',
    saludo: (c, e) => (c ? `Dear ${c},` : e ? `Dear ${e} hiring team,` : 'Dear Sir or Madam,'),
    fuente: { portal: (p) => (p ? `on ${p}` : 'on a job board'), web: () => 'on your website' },
    intro: {
      oferta: [
        (puesto, empresa, donde) => `I am writing to apply for the position of ${puesto}${empresa ? ` at ${empresa}` : ''}, which I saw advertised ${donde}.`,
        (puesto, empresa, donde) => `I saw your vacancy for a ${puesto}${empresa ? ` at ${empresa}` : ''} ${donde} and I would love to join your team.`,
      ],
      recomendacion: [
        (puesto, empresa) => `A member of your team recommended that I apply for the position of ${puesto}${empresa ? ` at ${empresa}` : ''}.`,
        (puesto, empresa) => `I have heard great things about ${empresa || 'your company'} and would like to apply for the position of ${puesto}.`,
      ],
      espontanea: [
        (puesto, empresa) => `I am writing to offer my services as a ${puesto}${empresa ? ` at ${empresa}` : ''}, in case you need to add someone to your team now or in the future.`,
        (puesto, empresa) => `I would love to work as a ${puesto}${empresa ? ` at ${empresa}` : ''} and I am writing in case you have any vacancies now or in the coming months.`,
      ],
    },
    exp: [
      (y, last, actual, tareas) => `${y > 0 ? `I have ${y} ${y === 1 ? 'year' : 'years'} of experience` : 'I have experience'} as a ${last.puesto}${last.empresa ? `, ${actual ? 'currently' : 'most recently'} at ${last.empresa}` : ''}${tareas.length ? `, where my main duties include: ${tareas.join('; ')}` : ''}.`,
      (y, last, actual, tareas) => `${actual ? 'I currently work' : 'My most recent job was'} as a ${last.puesto}${last.empresa ? ` at ${last.empresa}` : ''}${y > 0 ? `, with ${y} ${y === 1 ? 'year' : 'years'} of experience in the sector` : ''}.${tareas.length ? ` My day-to-day work includes: ${tareas.join('; ')}.` : ''}`,
    ],
    noexp: [
      (f) => `Although I am at the start of my career${f ? `, I have trained in ${f}` : ''} and I am eager to learn and contribute from day one.`,
      (f) => `I am looking for my first job${f ? ` and I have trained in ${f}` : ''}. I am responsible, I learn quickly and I adapt easily.`,
    ],
    skills: [
      (h, e) => `My strengths include ${h}, which I believe match what you are looking for${e ? ` at ${e}` : ''}.`,
      (h) => `People I have worked with value my ${h}.`,
    ],
    dispo: (d) => `In addition, I am ${low(d)}.`,
    dispoOk: /^available/i,
    dispoDefault: 'I am available to start whenever you need.',
    cierre: [
      (contacto) => `Please find my CV attached. I would be happy to tell you more in an interview.${contacto ? ` You can reach me ${contacto}.` : ''}`,
      (contacto) => `I would welcome the opportunity to meet you for an interview.${contacto ? ` You can contact me ${contacto}.` : ''} My CV is attached.`,
    ],
    contacto: (t, m) => [t && `on ${t}`, m && `at ${m}`].filter(Boolean).join(' or '),
    despedida: ['Kind regards,', 'Thank you for your time. Best regards,'],
    destinatario: 'Human Resources Department',
  },
  fr: {
    and: 'et',
    saludo: (c, e) => (c ? `${c},` : 'Madame, Monsieur,'),
    fuente: { portal: (p) => (p ? `sur ${p}` : 'sur un site d’emploi'), web: () => 'sur votre site internet' },
    intro: {
      oferta: [
        (puesto, empresa, donde) => `Je vous adresse ma candidature au poste de ${puesto}${empresa ? ` chez ${empresa}` : ''}, que j’ai vu publié ${donde}.`,
        (puesto, empresa, donde) => `J’ai vu ${donde} votre offre pour un poste de ${puesto}${empresa ? ` chez ${empresa}` : ''} et je souhaiterais rejoindre votre équipe.`,
      ],
      recomendacion: [
        (puesto, empresa) => `Sur la recommandation d’un membre de votre équipe, je vous adresse ma candidature au poste de ${puesto}${empresa ? ` chez ${empresa}` : ''}.`,
        (puesto, empresa) => `On m’a beaucoup parlé de ${empresa || 'votre entreprise'} et je souhaiterais postuler au poste de ${puesto}.`,
      ],
      espontanea: [
        (puesto, empresa) => `Je me permets de vous proposer ma candidature spontanée en tant que ${puesto}${empresa ? ` chez ${empresa}` : ''}, au cas où vous auriez besoin de renforcer votre équipe.`,
        (puesto, empresa) => `J’aimerais beaucoup travailler comme ${puesto}${empresa ? ` chez ${empresa}` : ''} et je vous écris au cas où un poste se libérerait.`,
      ],
    },
    exp: [
      (y, last, actual, tareas) => `${y > 0 ? `J’ai ${y} ${y === 1 ? 'an' : 'ans'} d’expérience` : 'J’ai de l’expérience'} en tant que ${last.puesto}${last.empresa ? `, ${actual ? 'actuellement' : 'dernièrement'} chez ${last.empresa}` : ''}${tareas.length ? `, où mes principales missions sont : ${tareas.join(' ; ')}` : ''}.`,
      (y, last, actual, tareas) => `${actual ? 'Je travaille actuellement' : 'Mon dernier emploi était'} comme ${last.puesto}${last.empresa ? ` chez ${last.empresa}` : ''}${y > 0 ? `, avec ${y} ${y === 1 ? 'an' : 'ans'} d’expérience dans le secteur` : ''}.${tareas.length ? ` Au quotidien, je m’occupe de : ${tareas.join(' ; ')}.` : ''}`,
    ],
    noexp: [
      (f) => `Même si je débute ma carrière${f ? `, j’ai suivi une formation en ${f}` : ''} et je suis motivé(e) pour apprendre et m’investir dès le premier jour.`,
      (f) => `Je recherche mon premier emploi${f ? ` et je suis formé(e) en ${f}` : ''}. Je suis responsable, j’apprends vite et je m’adapte facilement.`,
    ],
    skills: [
      (h, e) => `Parmi mes points forts : ${h}, des qualités qui correspondent, je crois, à ce que vous recherchez${e ? ` chez ${e}` : ''}.`,
      (h) => `Les personnes avec qui j’ai travaillé apprécient chez moi : ${h}.`,
    ],
    dispo: (d) => `De plus, je suis ${low(d)}.`,
    dispoOk: /^disponible/i,
    dispoDefault: 'Je suis disponible pour commencer dès que vous le souhaitez.',
    cierre: [
      (contacto) => `Vous trouverez ci-joint mon CV. Je reste à votre disposition pour un entretien.${contacto ? ` Vous pouvez me joindre ${contacto}.` : ''}`,
      (contacto) => `Je serais ravi(e) de vous rencontrer lors d’un entretien.${contacto ? ` Vous pouvez me contacter ${contacto}.` : ''} Mon CV est joint à ce courrier.`,
    ],
    contacto: (t, m) => [t && `au ${t}`, m && `à l’adresse ${m}`].filter(Boolean).join(' ou '),
    despedida: ['Je vous prie d’agréer mes salutations distinguées,', 'Merci pour votre attention. Bien cordialement,'],
    destinatario: 'Service des ressources humaines',
  },
  pt: {
    and: 'e',
    saludo: (c, e) => (c ? `Exmo./Exma. ${c},` : e ? `Caros responsáveis da ${e},` : 'Exmos. Senhores,'),
    fuente: { portal: (p) => (p ? `no ${p}` : 'num portal de emprego'), web: () => 'no vosso website' },
    intro: {
      oferta: [
        (puesto, empresa, donde) => `Venho por este meio apresentar a minha candidatura ao lugar de ${puesto}${empresa ? ` na ${empresa}` : ''}, que vi publicado ${donde}.`,
        (puesto, empresa, donde) => `Vi ${donde} a vossa oferta para ${puesto}${empresa ? ` na ${empresa}` : ''} e gostaria muito de fazer parte da vossa equipa.`,
      ],
      recomendacion: [
        (puesto, empresa) => `Por recomendação de um membro da vossa equipa, apresento a minha candidatura ao lugar de ${puesto}${empresa ? ` na ${empresa}` : ''}.`,
        (puesto, empresa) => `Falaram-me muito bem da ${empresa || 'vossa empresa'} e gostaria de me candidatar ao lugar de ${puesto}.`,
      ],
      espontanea: [
        (puesto, empresa) => `Venho apresentar a minha candidatura espontânea como ${puesto}${empresa ? ` na ${empresa}` : ''}, caso precisem de reforçar a equipa agora ou no futuro.`,
        (puesto, empresa) => `Gostaria muito de trabalhar como ${puesto}${empresa ? ` na ${empresa}` : ''} e escrevo-vos caso surja alguma vaga.`,
      ],
    },
    exp: [
      (y, last, actual, tareas) => `${y > 0 ? `Tenho ${y} ${y === 1 ? 'ano' : 'anos'} de experiência` : 'Tenho experiência'} como ${last.puesto}${last.empresa ? `, ${actual ? 'atualmente' : 'mais recentemente'} na ${last.empresa}` : ''}${tareas.length ? `, onde as minhas principais funções são: ${tareas.join('; ')}` : ''}.`,
      (y, last, actual, tareas) => `${actual ? 'Atualmente trabalho' : 'O meu último emprego foi'} como ${last.puesto}${last.empresa ? ` na ${last.empresa}` : ''}${y > 0 ? `, somando ${y} ${y === 1 ? 'ano' : 'anos'} de experiência no setor` : ''}.${tareas.length ? ` No dia a dia, sou responsável por: ${tareas.join('; ')}.` : ''}`,
    ],
    noexp: [
      (f) => `Embora esteja a iniciar o meu percurso profissional${f ? `, tenho formação em ${f}` : ''} e muita vontade de aprender e contribuir desde o primeiro dia.`,
      (f) => `Procuro a minha primeira oportunidade de emprego${f ? ` e tenho formação em ${f}` : ''}. Sou uma pessoa responsável, aprendo depressa e adapto-me com facilidade.`,
    ],
    skills: [
      (h, e) => `Entre os meus pontos fortes destacam-se: ${h}, qualidades que acredito corresponderem ao que procuram${e ? ` na ${e}` : ''}.`,
      (h) => `As pessoas com quem trabalhei valorizam em mim: ${h}.`,
    ],
    dispo: (d) => `Além disso, tenho ${low(d)}.`,
    dispoOk: /^disponibilidade/i,
    dispoDefault: 'Tenho disponibilidade para começar quando precisarem.',
    cierre: [
      (contacto) => `Envio em anexo o meu currículo e fico ao dispor para uma entrevista.${contacto ? ` Podem contactar-me ${contacto}.` : ''}`,
      (contacto) => `Teria muito gosto em conhecê-los numa entrevista.${contacto ? ` Podem contactar-me ${contacto}.` : ''} Junto o meu currículo.`,
    ],
    contacto: (t, m) => [t && `pelo ${t}`, m && `através de ${m}`].filter(Boolean).join(' ou '),
    despedida: ['Com os melhores cumprimentos,', 'Obrigado/a pelo vosso tempo. Cumprimentos,'],
    destinatario: 'Departamento de Recursos Humanos',
  },
  it: {
    and: 'e',
    saludo: (c, e) => (c ? `Gentile ${c},` : e ? `Spettabile ${e},` : 'Spettabile Azienda,'),
    fuente: { portal: (p) => (p ? `su ${p}` : 'su un portale di lavoro'), web: () => 'sul vostro sito web' },
    intro: {
      oferta: [
        (puesto, empresa, donde) => `Vi scrivo per candidarmi alla posizione di ${puesto}${empresa ? ` presso ${empresa}` : ''}, che ho visto pubblicata ${donde}.`,
        (puesto, empresa, donde) => `Ho visto ${donde} il vostro annuncio per ${puesto}${empresa ? ` presso ${empresa}` : ''} e mi piacerebbe molto entrare a far parte del vostro team.`,
      ],
      recomendacion: [
        (puesto, empresa) => `Su consiglio di un membro del vostro team, vi invio la mia candidatura per la posizione di ${puesto}${empresa ? ` presso ${empresa}` : ''}.`,
        (puesto, empresa) => `Mi hanno parlato molto bene di ${empresa || 'della vostra azienda'} e vorrei candidarmi per la posizione di ${puesto}.`,
      ],
      espontanea: [
        (puesto, empresa) => `Vi invio la mia candidatura spontanea come ${puesto}${empresa ? ` presso ${empresa}` : ''}, nel caso in cui abbiate bisogno di rafforzare il vostro team ora o in futuro.`,
        (puesto, empresa) => `Mi piacerebbe molto lavorare come ${puesto}${empresa ? ` presso ${empresa}` : ''} e vi scrivo nel caso in cui si liberi una posizione.`,
      ],
    },
    exp: [
      (y, last, actual, tareas) => `${y > 0 ? `Ho ${y} ${y === 1 ? 'anno' : 'anni'} di esperienza` : 'Ho esperienza'} come ${last.puesto}${last.empresa ? `, ${actual ? 'attualmente' : 'più di recente'} presso ${last.empresa}` : ''}${tareas.length ? `, dove mi occupo principalmente di: ${tareas.join('; ')}` : ''}.`,
      (y, last, actual, tareas) => `${actual ? 'Attualmente lavoro' : 'Il mio ultimo impiego è stato'} come ${last.puesto}${last.empresa ? ` presso ${last.empresa}` : ''}${y > 0 ? `, con ${y} ${y === 1 ? 'anno' : 'anni'} di esperienza nel settore` : ''}.${tareas.length ? ` Ogni giorno mi occupo di: ${tareas.join('; ')}.` : ''}`,
    ],
    noexp: [
      (f) => `Anche se sono all’inizio del mio percorso professionale${f ? `, ho una formazione in ${f}` : ''} e tanta voglia di imparare e contribuire fin dal primo giorno.`,
      (f) => `Cerco la mia prima opportunità di lavoro${f ? ` e ho una formazione in ${f}` : ''}. Sono una persona responsabile, imparo in fretta e mi adatto facilmente.`,
    ],
    skills: [
      (h, e) => `Tra i miei punti di forza: ${h}, qualità che credo corrispondano a ciò che cercate${e ? ` presso ${e}` : ''}.`,
      (h) => `Le persone con cui ho lavorato apprezzano in me: ${h}.`,
    ],
    dispo: (d) => `Inoltre, ho ${low(d)}.`,
    dispoOk: /^disponibilit/i,
    dispoDefault: 'Sono disponibile a iniziare quando ne avrete bisogno.',
    cierre: [
      (contacto) => `In allegato trovate il mio curriculum. Resto a disposizione per un colloquio.${contacto ? ` Potete contattarmi ${contacto}.` : ''}`,
      (contacto) => `Sarei felice di conoscervi in un colloquio.${contacto ? ` Potete raggiungermi ${contacto}.` : ''} Allego il mio curriculum.`,
    ],
    contacto: (t, m) => [t && `al ${t}`, m && `all’indirizzo ${m}`].filter(Boolean).join(' o '),
    despedida: ['Cordiali saluti,', 'Grazie per l’attenzione. Cordiali saluti,'],
    destinatario: 'Ufficio Risorse Umane',
  },
};

// La línea de disponibilidad de "Otros datos", ya en el idioma de la carta.
function availability(cv, lang) {
  const line = String(cv.otros || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^disponib/i.test(l));
  return line ? tr(line, lang) : '';
}

export function generateLetter(cv, letter, oficio) {
  const lang = T[cv.lang] ? cv.lang : 'es';
  const t = T[lang];
  const v = Number(letter.variante) || 0;
  const puesto = low(tr(letter.puesto || cv.puesto || oficio?.nombre || '', lang)) || '…';
  const empresa = (letter.empresa || '').trim();

  const intro =
    letter.fuente === 'recomendacion' || letter.fuente === 'espontanea'
      ? pick(t.intro[letter.fuente], v)(puesto, empresa)
      : pick(t.intro.oferta, v)(puesto, empresa, t.fuente[letter.fuente === 'web' ? 'web' : 'portal'](letter.portal?.trim()));

  const last = cv.experiencia.find((e) => e.puesto?.trim());
  let body;
  if (last) {
    const tareas = String(last.tareas || '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => low(tr(x, lang)));
    body = pick(t.exp, v)(yearsOf(cv), { puesto: low(tr(last.puesto, lang)), empresa: last.empresa?.trim() }, last.actual, tareas);
  } else {
    body = pick(t.noexp, v)(low(cv.formacion.find((f) => f.titulo?.trim())?.titulo || ''));
  }

  const skills = (cv.habilidades.length ? cv.habilidades : oficio?.habilidades || []).slice(0, 3).map((h) => low(tr(h, lang)));
  const skillsP = skills.length ? pick(t.skills, v)(listOf(skills, t.and), empresa) : '';

  const d = availability(cv, lang);
  // Solo la usamos si encaja en la frase ("tengo disponibilidad…", "I am available…").
  const dispo = d && t.dispoOk.test(d) ? t.dispo(d) : t.dispoDefault;

  const contacto = t.contacto(cv.telefono?.trim(), cv.email?.trim());
  return [
    t.saludo(letter.contacto?.trim(), empresa),
    intro,
    body,
    [skillsP, dispo].filter(Boolean).join(' '),
    pick(t.cierre, v)(contacto),
    `${pick(t.despedida, v)}\n${cv.nombre || ''}`.trim(),
  ].join('\n\n');
}

// Diseños de carta. Los Pro van a juego con las plantillas Pro del currículum.
export const LETTER_DESIGNS = [
  { id: 'sencilla', name: 'Sencilla', pro: false },
  { id: 'impacto', name: 'Impacto', pro: true },
  { id: 'ejecutiva', name: 'Ejecutiva', pro: true },
  { id: 'lateral', name: 'Lateral', pro: true },
  { id: 'elegante', name: 'Elegante', pro: true },
];
const MATCH = { impacto: 'impacto', creativa: 'impacto', geometrica: 'impacto', ejecutiva: 'ejecutiva', nocturna: 'lateral', moderna: 'sencilla', elegante: 'elegante', cronologia: 'elegante', suave: 'impacto' };

// Diseño a usar: el elegido o, si no se ha elegido, el que combina con la plantilla del CV.
export const letterDesign = (cv, letter) =>
  LETTER_DESIGNS.some((d) => d.id === letter.diseno) ? letter.diseno : MATCH[cv.template] || 'sencilla';
export const isProDesign = (id) => Boolean(LETTER_DESIGNS.find((d) => d.id === id)?.pro);

export function renderLetter(cv, letter, texto) {
  const lang = T[cv.lang] ? cv.lang : 'es';
  const accent = /^#[0-9a-f]{6}$/i.test(cv.accent || '') ? cv.accent : '#5b4bff';
  const fecha = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const contacto = [cv.telefono, cv.email, cv.ciudad, cv.web]
    .filter((x) => x && String(x).trim())
    .map((x) => `<span>${esc(x)}</span>`)
    .join('<i> · </i>');
  const paras = String(texto || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const diseno = letterDesign(cv, letter);
  return `<article class="letter letter-d-${diseno}" lang="${lang}" style="--accent:${accent};--accent-soft:${soft(accent)};--accent-dark:${dark(accent)}">
  <header class="letter-head">
    <div><h1>${esc(cv.nombre) || '…'}</h1>${cv.puesto ? `<p class="letter-role">${esc(tr(cv.puesto, lang))}</p>` : ''}</div>
    <p class="letter-contact">${contacto}</p>
  </header>
  <div class="letter-meta">
    <div class="letter-to">${[letter.contacto, letter.empresa || T[lang].destinatario].filter((x) => x && String(x).trim()).map(esc).join('<br>')}</div>
    <div class="letter-date">${cv.ciudad ? `${esc(cv.ciudad)}, ` : ''}${fecha}</div>
  </div>
  <div class="letter-body">${paras}</div>
</article>`;
}
