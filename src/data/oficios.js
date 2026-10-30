// Datos de cada oficio: alimentan las páginas de ejemplo y las sugerencias del editor.
// Los nombres de los ejemplos son inventados.

export const OFICIOS = [
  {
    slug: 'camarero',
    icono: '🍽️',
    nombre: 'Camarero/a',
    titulo: 'Currículum de camarero/a: ejemplo y plantilla gratis',
    descripcion:
      'Ejemplo de currículum de camarero o camarera listo para copiar, con las tareas y habilidades que piden los bares y restaurantes. Descarga en PDF gratis.',
    intro:
      'La hostelería contrata todo el año y mira sobre todo dos cosas: que sepas trabajar con rapidez y que trates bien al cliente. Un buen currículum de camarero es corto, va al grano y deja claro tu disponibilidad.',
    perfiles: [
      'Camarero con 3 años de experiencia en sala y barra en restaurantes con alta afluencia. Rápido, ordenado y con trato cercano al cliente. Acostumbrado a trabajar en equipo y bajo presión en servicios de fin de semana.',
      'Persona responsable y con ganas de aprender, con experiencia en atención al público. Busco mi primer empleo en hostelería, con disponibilidad total de horarios, fines de semana incluidos.',
    ],
    tareas: [
      'Atención y servicio en sala a mesas de hasta 60 comensales',
      'Toma de comandas y recomendación de platos y vinos',
      'Preparación de cafés, refrescos y cócteles básicos en barra',
      'Montaje y desmontaje de sala y terraza',
      'Cobro en caja y cierre de TPV al final del turno',
      'Gestión de reservas por teléfono y en plataforma online',
      'Limpieza y reposición de barra según normas de higiene (APPCC)',
      'Atención a clientes con alergias e intolerancias',
      'Coordinación con cocina para agilizar los pases',
    ],
    habilidades: [
      'Atención al cliente', 'Servicio en sala', 'Barra y cafetería', 'Manejo de bandeja', 'TPV y caja',
      'Trabajo bajo presión', 'Trabajo en equipo', 'Carnet de manipulador de alimentos', 'Coctelería básica', 'Alérgenos',
    ],
    consejos: [
      'Pon tu disponibilidad (fines de semana, noches, temporada) en un lugar visible. Es lo primero que miran.',
      'Si tienes el carnet de manipulador de alimentos, menciónalo: muchos locales lo exigen.',
      'Cuenta el volumen: "sala de 60 comensales" dice más que "atención en sala".',
      'Los idiomas suman mucho en zonas turísticas, aunque sea un nivel básico.',
    ],
    ejemplo: {
      nombre: 'Lucía Fernández Ruiz',
      puesto: 'Camarera de sala y barra',
      email: 'lucia.fernandez@email.com',
      telefono: '612 345 678',
      ciudad: 'Valencia',
      experiencia: [
        { puesto: 'Camarera de sala', empresa: 'Restaurante La Albufera', lugar: 'Valencia', inicio: '2023', fin: '', actual: true, n: [0, 1, 4, 7] },
        { puesto: 'Camarera de barra', empresa: 'Cafetería Central', lugar: 'Valencia', inicio: '2021', fin: '2023', actual: false, n: [2, 3, 6] },
      ],
      formacion: [{ titulo: 'Curso de Servicios de Restaurante y Bar', centro: 'Centro de Formación Profesional', inicio: '2020', fin: '2021' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }, { idioma: 'Inglés', nivel: 'B1' }],
      otros: 'Carnet de manipulador de alimentos\nDisponibilidad para fines de semana y noches',
    },
  },
  {
    slug: 'ayudante-de-cocina',
    icono: '🍳',
    nombre: 'Ayudante de cocina',
    titulo: 'Currículum de ayudante de cocina: ejemplo gratis para descargar',
    descripcion:
      'Ejemplo de currículum de ayudante de cocina con tareas, habilidades y consejos. Rellénalo en minutos y descárgalo en PDF sin pagar.',
    intro:
      'En cocina se valora la limpieza, la rapidez y saber seguir instrucciones. Tu currículum tiene que demostrar que conoces las normas de higiene y que aguantas el ritmo de un servicio.',
    perfiles: [
      'Ayudante de cocina con experiencia en preparación de mise en place, cocina fría y apoyo en línea caliente. Muy organizado, limpio y acostumbrado a servicios de más de 150 cubiertos.',
      'Persona trabajadora y con interés por la cocina, con formación en manipulación de alimentos. Aprendo rápido y me adapto a cualquier puesto del equipo.',
    ],
    tareas: [
      'Preparación de mise en place: corte de verduras, carnes y pescados',
      'Elaboración de ensaladas, entrantes y postres sencillos',
      'Apoyo al cocinero en la línea caliente durante el servicio',
      'Recepción y control de mercancía y temperaturas',
      'Etiquetado y rotación de productos (FIFO)',
      'Limpieza de cámaras, utensilios y zona de trabajo según APPCC',
      'Control de alérgenos en las elaboraciones',
      'Friegue y orden de cocina al cierre',
    ],
    habilidades: [
      'Mise en place', 'Técnicas de corte', 'Cocina fría', 'Normativa APPCC', 'Control de alérgenos',
      'Manipulador de alimentos', 'Rapidez', 'Limpieza y orden', 'Trabajo en equipo', 'Resistencia física',
    ],
    consejos: [
      'Indica el tipo de cocina en la que has trabajado (menú del día, carta, colectividades, catering).',
      'El número de cubiertos por servicio ayuda a entender tu ritmo de trabajo.',
      'Menciona el carnet de manipulador de alimentos y cualquier curso de cocina.',
      'Si no tienes experiencia, destaca tu limpieza, puntualidad y ganas de aprender.',
    ],
    ejemplo: {
      nombre: 'Andrés Molina Castro',
      puesto: 'Ayudante de cocina',
      email: 'andres.molina@email.com',
      telefono: '623 456 789',
      ciudad: 'Málaga',
      experiencia: [
        { puesto: 'Ayudante de cocina', empresa: 'Hotel Costa del Sol', lugar: 'Torremolinos', inicio: '2022', fin: '', actual: true, n: [0, 2, 3, 6] },
        { puesto: 'Auxiliar de cocina', empresa: 'Comedor escolar', lugar: 'Málaga', inicio: '2020', fin: '2022', actual: false, n: [1, 5, 7] },
      ],
      formacion: [{ titulo: 'Certificado de Profesionalidad en Operaciones Básicas de Cocina', centro: 'Escuela de Hostelería', inicio: '2019', fin: '2020' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
      otros: 'Carnet de manipulador de alimentos\nDisponibilidad inmediata',
    },
  },
  {
    slug: 'dependiente',
    icono: '🛍️',
    nombre: 'Dependiente/a',
    titulo: 'Currículum de dependiente/a de tienda: ejemplo y plantilla',
    descripcion:
      'Ejemplo de currículum de dependiente o dependienta de comercio: tareas, habilidades y consejos para conseguir trabajo en tiendas y supermercados.',
    intro:
      'Las tiendas buscan personas con buena presencia, trato amable y que sepan vender sin agobiar. Destaca tu experiencia con clientes, con la caja y con la reposición.',
    perfiles: [
      'Dependienta con 4 años de experiencia en moda y gran superficie. Orientada a la venta y a la atención personalizada, con buen manejo de caja y del almacén de tienda.',
      'Persona comunicativa, amable y con buena presencia, con ganas de empezar en el sector del comercio. Disponibilidad para trabajar en turnos rotativos y fines de semana.',
    ],
    tareas: [
      'Atención y asesoramiento personalizado al cliente',
      'Cobro en caja, devoluciones y cierre diario',
      'Reposición de producto y control de stock',
      'Montaje de escaparates y mantenimiento del visual de tienda',
      'Recepción de mercancía y etiquetado',
      'Consecución de objetivos de venta semanales',
      'Gestión de pedidos online con recogida en tienda',
      'Resolución de reclamaciones de forma amable',
    ],
    habilidades: [
      'Atención al cliente', 'Técnicas de venta', 'Manejo de caja', 'Reposición', 'Control de stock',
      'Visual merchandising', 'Comunicación', 'Resolución de problemas', 'Trabajo por objetivos', 'Office básico',
    ],
    consejos: [
      'Si cumpliste objetivos de venta, dilo con números ("superé el objetivo mensual un 15 %").',
      'Nombra el tipo de tienda: moda, alimentación, electrónica… Ayuda a encajar en la oferta.',
      'Adapta el perfil a la tienda a la que te presentas: no es lo mismo una perfumería que un supermercado.',
      'Lleva el currículum en mano a las tiendas además de enviarlo online: en comercio todavía funciona.',
    ],
    ejemplo: {
      nombre: 'Carmen Ortega Gil',
      puesto: 'Dependienta de comercio',
      email: 'carmen.ortega@email.com',
      telefono: '634 567 890',
      ciudad: 'Madrid',
      experiencia: [
        { puesto: 'Dependienta', empresa: 'Tienda de moda (centro comercial)', lugar: 'Madrid', inicio: '2022', fin: '', actual: true, n: [0, 1, 3, 5] },
        { puesto: 'Cajera-reponedora', empresa: 'Supermercado de barrio', lugar: 'Madrid', inicio: '2020', fin: '2022', actual: false, n: [1, 2, 4] },
      ],
      formacion: [{ titulo: 'Técnico en Actividades Comerciales (FP Grado Medio)', centro: 'IES de Madrid', inicio: '2018', fin: '2020' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }, { idioma: 'Inglés', nivel: 'A2' }],
      otros: 'Disponibilidad para turnos rotativos y fines de semana',
    },
  },
  {
    slug: 'repartidor',
    icono: '🛵',
    nombre: 'Repartidor/a',
    titulo: 'Currículum de repartidor/a: ejemplo gratis y consejos',
    descripcion:
      'Ejemplo de currículum de repartidor, conductor de reparto o rider. Qué carnets poner, qué tareas destacar y plantilla gratis en PDF.',
    intro:
      'Para reparto lo más importante son el carnet de conducir, que conozcas la zona y que seas puntual. Ponlo todo bien visible y no te alargues: una página es suficiente.',
    perfiles: [
      'Repartidor con 3 años de experiencia en paquetería urbana y última milla. Carnet B, buen conocimiento de la ciudad y acostumbrado a rutas de más de 100 entregas diarias.',
      'Persona puntual, responsable y con carnet de conducir B. Busco empleo como repartidor, con disponibilidad inmediata y vehículo propio.',
    ],
    tareas: [
      'Reparto de paquetería en rutas urbanas de 100-120 entregas diarias',
      'Carga y organización de la furgoneta por orden de ruta',
      'Uso de PDA y aplicación de rutas para confirmar entregas',
      'Gestión de incidencias, ausencias y devoluciones',
      'Cobro de envíos contra reembolso',
      'Revisión básica del vehículo y control del combustible',
      'Atención amable al cliente en la entrega',
    ],
    habilidades: [
      'Carnet de conducir B', 'Conocimiento de la ciudad', 'Planificación de rutas', 'Manejo de PDA', 'Puntualidad',
      'Atención al cliente', 'Resistencia física', 'Autonomía', 'Organización', 'Conducción segura',
    ],
    consejos: [
      'Pon tus carnets (B, C, moto) y si tienes vehículo propio al principio, junto a tus datos.',
      'Indica el volumen de entregas: demuestra que aguantas el ritmo.',
      'Menciona las zonas o ciudades que conoces bien.',
      'Si no tienes multas ni accidentes, puedes decir que tienes "historial de conducción limpio".',
    ],
    ejemplo: {
      nombre: 'Javier Romero Díaz',
      puesto: 'Repartidor de paquetería',
      email: 'javier.romero@email.com',
      telefono: '645 678 901',
      ciudad: 'Sevilla',
      experiencia: [
        { puesto: 'Repartidor de última milla', empresa: 'Empresa de mensajería', lugar: 'Sevilla', inicio: '2022', fin: '', actual: true, n: [0, 1, 2, 3] },
        { puesto: 'Repartidor de comida a domicilio', empresa: 'Restaurante local', lugar: 'Sevilla', inicio: '2020', fin: '2022', actual: false, n: [4, 6] },
      ],
      formacion: [{ titulo: 'Educación Secundaria Obligatoria (ESO)', centro: 'IES de Sevilla', inicio: '', fin: '2016' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
      otros: 'Carnet de conducir B\nVehículo propio\nDisponibilidad inmediata',
    },
  },
  {
    slug: 'limpieza',
    icono: '🧽',
    nombre: 'Personal de limpieza',
    titulo: 'Currículum de limpieza: ejemplo para limpiadora o limpiador',
    descripcion:
      'Ejemplo de currículum para trabajos de limpieza en oficinas, hoteles, casas y comunidades. Tareas, habilidades y descarga gratis en PDF.',
    intro:
      'En limpieza se valora la confianza, la constancia y el cuidado por los detalles. Indica dónde has limpiado (hoteles, oficinas, casas) y qué productos y máquinas sabes usar.',
    perfiles: [
      'Limpiadora con 5 años de experiencia en hoteles y oficinas. Meticulosa, rápida y de total confianza. Conozco el uso seguro de productos químicos y maquinaria de limpieza.',
      'Persona responsable, ordenada y discreta, con experiencia en limpieza de hogares. Busco empleo estable, con disponibilidad de mañana o tarde.',
    ],
    tareas: [
      'Limpieza y preparación de habitaciones de hotel según estándares de calidad',
      'Limpieza de oficinas, baños y zonas comunes',
      'Uso de fregadora, barredora y aspiradora industrial',
      'Manipulación segura de productos químicos de limpieza',
      'Reposición de material de aseo y control de consumibles',
      'Limpieza de cristales y superficies delicadas',
      'Limpieza a fondo de viviendas y fin de obra',
      'Lavandería: lavado, planchado y doblado de ropa',
    ],
    habilidades: [
      'Limpieza de hoteles', 'Limpieza de oficinas', 'Maquinaria de limpieza', 'Productos químicos', 'Atención al detalle',
      'Confianza y discreción', 'Rapidez', 'Organización', 'Planchado', 'Trabajo autónomo',
    ],
    consejos: [
      'Diferencia los tipos de limpieza que has hecho: hogar, oficinas, hoteles, hospitales, fin de obra.',
      'Si sabes usar maquinaria (fregadora, rotativa), dilo: no todo el mundo sabe.',
      'Las referencias de antiguos empleadores pesan mucho en este sector; indica que puedes darlas.',
      'Pon claramente tu disponibilidad de horario y zona en la que puedes trabajar.',
    ],
    ejemplo: {
      nombre: 'Rosa Martínez Vargas',
      puesto: 'Limpiadora',
      email: 'rosa.martinez@email.com',
      telefono: '656 789 012',
      ciudad: 'Barcelona',
      experiencia: [
        { puesto: 'Camarera de pisos', empresa: 'Hotel 4 estrellas', lugar: 'Barcelona', inicio: '2021', fin: '', actual: true, n: [0, 3, 4, 7] },
        { puesto: 'Limpiadora', empresa: 'Empresa de limpieza de oficinas', lugar: 'Barcelona', inicio: '2018', fin: '2021', actual: false, n: [1, 2, 5] },
      ],
      formacion: [{ titulo: 'Curso de Limpieza de Superficies y Mobiliario', centro: 'Centro de formación', inicio: '', fin: '2018' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }, { idioma: 'Catalán', nivel: 'Básico' }],
      otros: 'Referencias disponibles\nDisponibilidad de mañanas',
    },
  },
  {
    slug: 'cuidador-de-personas-mayores',
    icono: '🤝',
    nombre: 'Cuidador/a de personas mayores',
    titulo: 'Currículum de cuidadora de personas mayores: ejemplo gratis',
    descripcion:
      'Ejemplo de currículum para cuidador o cuidadora de personas mayores y dependientes, a domicilio o en residencia. Plantilla gratis en PDF.',
    intro:
      'Las familias y residencias buscan, ante todo, a alguien de confianza, con paciencia y experiencia real. Explica con qué tipo de personas has trabajado y qué cuidados sabes hacer.',
    perfiles: [
      'Cuidadora con 6 años de experiencia en atención a personas mayores y dependientes, a domicilio y en residencia. Paciente, cariñosa y responsable, con formación sociosanitaria.',
      'Persona empática y de confianza, con experiencia cuidando a familiares mayores. Busco empleo como cuidadora interna o externa.',
    ],
    tareas: [
      'Aseo personal, higiene y ayuda en el vestido',
      'Movilizaciones y transferencias (cama, silla de ruedas)',
      'Control y administración de la medicación pautada',
      'Preparación de comidas adaptadas a dietas específicas',
      'Acompañamiento a citas médicas y paseos',
      'Atención a personas con Alzheimer y demencias',
      'Tareas del hogar: limpieza, lavado y compras',
      'Estimulación cognitiva y actividades de ocio',
    ],
    habilidades: [
      'Atención sociosanitaria', 'Movilizaciones', 'Higiene personal', 'Control de medicación', 'Alzheimer y demencias',
      'Paciencia', 'Empatía', 'Primeros auxilios', 'Cocina adaptada', 'Confianza',
    ],
    consejos: [
      'Indica si buscas trabajo como interna o externa, y tu disponibilidad.',
      'Los certificados de atención sociosanitaria (a domicilio o en instituciones) son muy valorados: ponlos en formación.',
      'Describe casos concretos: "persona con Alzheimer en fase moderada", "persona en silla de ruedas".',
      'Las referencias de familias anteriores son clave; indica que puedes darlas.',
    ],
    ejemplo: {
      nombre: 'María José Pérez León',
      puesto: 'Cuidadora de personas mayores',
      email: 'mariajose.perez@email.com',
      telefono: '667 890 123',
      ciudad: 'Zaragoza',
      experiencia: [
        { puesto: 'Cuidadora a domicilio', empresa: 'Familia particular', lugar: 'Zaragoza', inicio: '2021', fin: '', actual: true, n: [0, 1, 2, 5] },
        { puesto: 'Auxiliar de geriatría', empresa: 'Residencia de mayores', lugar: 'Zaragoza', inicio: '2018', fin: '2021', actual: false, n: [3, 4, 7] },
      ],
      formacion: [{ titulo: 'Certificado de Atención Sociosanitaria a Personas Dependientes en Instituciones', centro: 'Centro de formación acreditado', inicio: '2017', fin: '2018' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
      otros: 'Curso de primeros auxilios\nReferencias disponibles\nDisponibilidad como externa',
    },
  },
  {
    slug: 'mozo-de-almacen',
    icono: '📦',
    nombre: 'Mozo/a de almacén',
    titulo: 'Currículum de mozo de almacén: ejemplo y plantilla gratis',
    descripcion:
      'Ejemplo de currículum de mozo de almacén, preparador de pedidos o carretillero. Tareas, habilidades, carnet de carretillero y descarga en PDF.',
    intro:
      'En logística buscan personas rápidas, cuidadosas y que sepan manejar maquinaria. Si tienes carnet de carretillero, es lo primero que tienen que ver.',
    perfiles: [
      'Mozo de almacén con 4 años de experiencia en preparación de pedidos y carga y descarga. Carnet de carretillero en vigor y experiencia con radiofrecuencia y SGA.',
      'Persona trabajadora, rápida y con buena condición física. Busco empleo como mozo de almacén, con disponibilidad para turnos de mañana, tarde y noche.',
    ],
    tareas: [
      'Preparación de pedidos (picking) con radiofrecuencia',
      'Carga y descarga de camiones',
      'Manejo de carretilla elevadora y transpaleta eléctrica',
      'Ubicación de mercancía y control de inventario',
      'Embalaje, etiquetado y expedición de pedidos',
      'Revisión de albaranes y control de calidad',
      'Orden y limpieza del almacén',
    ],
    habilidades: [
      'Picking', 'Carnet de carretillero', 'Transpaleta eléctrica', 'Radiofrecuencia (RF)', 'Control de inventario',
      'Carga y descarga', 'Rapidez', 'Prevención de riesgos', 'Trabajo en equipo', 'Turnos rotativos',
    ],
    consejos: [
      'Pon el carnet de carretillero y las máquinas que manejas en un apartado visible.',
      'Si conoces algún programa de gestión de almacén (SGA), nómbralo.',
      'Indica tus productividades si las sabes ("150 líneas/hora de picking").',
      'Deja clara tu disponibilidad para turnos y noches: es muy demandada.',
    ],
    ejemplo: {
      nombre: 'Daniel Herrera Soto',
      puesto: 'Mozo de almacén y carretillero',
      email: 'daniel.herrera@email.com',
      telefono: '678 901 234',
      ciudad: 'Getafe (Madrid)',
      experiencia: [
        { puesto: 'Mozo de almacén', empresa: 'Centro logístico', lugar: 'Getafe', inicio: '2022', fin: '', actual: true, n: [0, 2, 3, 4] },
        { puesto: 'Peón de carga y descarga', empresa: 'Empresa de transportes', lugar: 'Madrid', inicio: '2020', fin: '2022', actual: false, n: [1, 5, 6] },
      ],
      formacion: [{ titulo: 'Curso de Carretillero y Prevención de Riesgos Laborales', centro: 'Centro de formación', inicio: '', fin: '2020' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
      otros: 'Carnet de carretillero\nCarnet de conducir B\nDisponibilidad para turnos de noche',
    },
  },
  {
    slug: 'recepcionista',
    icono: '🛎️',
    nombre: 'Recepcionista',
    titulo: 'Currículum de recepcionista: ejemplo para hotel y oficina',
    descripcion:
      'Ejemplo de currículum de recepcionista de hotel, clínica u oficina. Funciones, habilidades, idiomas y plantilla gratis en PDF.',
    intro:
      'La recepción es la cara de la empresa: se valora la buena presencia, la organización y, en hoteles, los idiomas. Pon los programas que sabes usar.',
    perfiles: [
      'Recepcionista de hotel con 3 años de experiencia en check-in, check-out y gestión de reservas. Inglés fluido y manejo de programas de gestión hotelera.',
      'Persona organizada, amable y resolutiva, con experiencia en atención al público y buen manejo de ordenador. Busco empleo como recepcionista en oficina o clínica.',
    ],
    tareas: [
      'Check-in y check-out de clientes',
      'Gestión de reservas por teléfono, email y plataformas online',
      'Atención telefónica y gestión de la centralita',
      'Resolución de incidencias y reclamaciones',
      'Facturación y cobro, cierre de caja',
      'Gestión de agenda y citas',
      'Recepción de visitas, correo y paquetería',
      'Información turística y recomendaciones a huéspedes',
    ],
    habilidades: [
      'Atención al cliente', 'Gestión de reservas', 'Programas de gestión hotelera', 'Centralita', 'Office (Word, Excel)',
      'Inglés', 'Organización', 'Resolución de problemas', 'Buena presencia', 'Facturación',
    ],
    consejos: [
      'Los idiomas van arriba del todo si te presentas a hoteles. Indica el nivel con honestidad.',
      'Nombra los programas que dominas (Opera, Booking, programas de citas).',
      'Destaca tu capacidad para resolver problemas con calma.',
      'Una foto profesional y cuidada suma en este puesto.',
    ],
    ejemplo: {
      nombre: 'Laura Sánchez Moreno',
      puesto: 'Recepcionista de hotel',
      email: 'laura.sanchez@email.com',
      telefono: '689 012 345',
      ciudad: 'Palma de Mallorca',
      experiencia: [
        { puesto: 'Recepcionista', empresa: 'Hotel urbano', lugar: 'Palma', inicio: '2022', fin: '', actual: true, n: [0, 1, 3, 7] },
        { puesto: 'Recepcionista', empresa: 'Clínica dental', lugar: 'Palma', inicio: '2020', fin: '2022', actual: false, n: [2, 5, 6] },
      ],
      formacion: [{ titulo: 'Técnico Superior en Gestión de Alojamientos Turísticos', centro: 'CIFP de Turismo', inicio: '2018', fin: '2020' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }, { idioma: 'Inglés', nivel: 'C1' }, { idioma: 'Alemán', nivel: 'A2' }],
      otros: 'Disponibilidad para turnos rotativos',
    },
  },
  {
    slug: 'peon-de-construccion',
    icono: '🏗️',
    nombre: 'Peón de construcción',
    titulo: 'Currículum de peón de construcción: ejemplo gratis',
    descripcion:
      'Ejemplo de currículum de peón de obra o albañil: tareas, cursos de PRL, tarjeta TPC y plantilla gratis para descargar en PDF.',
    intro:
      'En la obra cuentan la experiencia práctica y la formación en prevención de riesgos. La Tarjeta Profesional de la Construcción (TPC) y el curso de 20 horas de PRL abren muchas puertas.',
    perfiles: [
      'Peón de construcción con 5 años de experiencia en obra nueva y reformas. Experiencia en albañilería, encofrado y demoliciones. Formación en PRL y TPC en vigor.',
      'Persona fuerte, trabajadora y con ganas de aprender un oficio. Busco empleo como peón de obra con disponibilidad inmediata.',
    ],
    tareas: [
      'Preparación de mortero y hormigón',
      'Apoyo a oficiales de albañilería en levantamiento de muros',
      'Montaje y desmontaje de andamios',
      'Demolición y desescombro',
      'Carga y descarga de materiales en obra',
      'Encofrado y desencofrado',
      'Limpieza y orden de la obra',
      'Alicatado y solado básico en reformas',
    ],
    habilidades: [
      'Albañilería', 'Encofrado', 'Demoliciones', 'Andamios', 'Prevención de riesgos laborales',
      'Tarjeta TPC', 'Herramientas manuales y eléctricas', 'Resistencia física', 'Trabajo en equipo', 'Reformas',
    ],
    consejos: [
      'Pon la TPC y los cursos de PRL (20 h, 60 h) en formación: son casi obligatorios.',
      'Distingue entre obra nueva, reformas y obra civil.',
      'Indica las herramientas y máquinas que manejas (radial, martillo percutor, hormigonera).',
      'Si tienes carnet de conducir, añádelo: a menudo hay que moverse entre obras.',
    ],
    ejemplo: {
      nombre: 'Miguel Ángel Torres Ramos',
      puesto: 'Peón de construcción',
      email: 'miguel.torres@email.com',
      telefono: '690 123 456',
      ciudad: 'Murcia',
      experiencia: [
        { puesto: 'Peón de albañilería', empresa: 'Constructora local', lugar: 'Murcia', inicio: '2021', fin: '', actual: true, n: [0, 1, 2, 5] },
        { puesto: 'Peón de reformas', empresa: 'Empresa de reformas', lugar: 'Murcia', inicio: '2019', fin: '2021', actual: false, n: [3, 6, 7] },
      ],
      formacion: [{ titulo: 'Curso de Prevención de Riesgos Laborales (20 h)', centro: 'Fundación Laboral de la Construcción', inicio: '', fin: '2019' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
      otros: 'Tarjeta Profesional de la Construcción (TPC)\nCarnet de conducir B',
    },
  },
  {
    slug: 'teleoperador',
    icono: '🎧',
    nombre: 'Teleoperador/a',
    titulo: 'Currículum de teleoperador/a: ejemplo de atención al cliente',
    descripcion:
      'Ejemplo de currículum de teleoperador, agente de atención al cliente o call center. Funciones, habilidades y plantilla gratis en PDF.',
    intro:
      'En los call center se busca buena comunicación, paciencia y soltura con el ordenador. Si has trabajado con objetivos (ventas, tiempos de llamada), dilo con números.',
    perfiles: [
      'Teleoperadora con 3 años de experiencia en atención al cliente y ventas telefónicas. Buena dicción, paciencia y manejo ágil de CRM. Acostumbrada a trabajar por objetivos.',
      'Persona comunicativa, paciente y con buen manejo del ordenador. Busco mi primer empleo como teleoperadora, con disponibilidad de mañana o tarde.',
    ],
    tareas: [
      'Atención de llamadas entrantes de clientes (más de 80 diarias)',
      'Resolución de incidencias y gestión de reclamaciones',
      'Venta telefónica de productos y servicios',
      'Registro de interacciones en el CRM',
      'Atención por chat y correo electrónico',
      'Cumplimiento de objetivos de calidad y tiempo medio de llamada',
      'Fidelización y retención de clientes',
    ],
    habilidades: [
      'Atención telefónica', 'Venta telefónica', 'CRM', 'Comunicación', 'Paciencia',
      'Escucha activa', 'Mecanografía rápida', 'Office', 'Resolución de conflictos', 'Trabajo por objetivos',
    ],
    consejos: [
      'Indica el sector de las campañas (telefonía, seguros, banca, energía).',
      'Usa cifras: llamadas al día, porcentaje de ventas, nota de calidad.',
      'Si hablas otros idiomas, destácalos: las campañas internacionales pagan más.',
      'Menciona la velocidad de escritura si es buena: muchos procesos la miden.',
    ],
    ejemplo: {
      nombre: 'Sara Delgado Núñez',
      puesto: 'Teleoperadora de atención al cliente',
      email: 'sara.delgado@email.com',
      telefono: '601 234 567',
      ciudad: 'Bilbao',
      experiencia: [
        { puesto: 'Agente de atención al cliente', empresa: 'Call center (campaña de telefonía)', lugar: 'Bilbao', inicio: '2022', fin: '', actual: true, n: [0, 1, 3, 5] },
        { puesto: 'Teleoperadora de ventas', empresa: 'Call center (campaña de energía)', lugar: 'Bilbao', inicio: '2021', fin: '2022', actual: false, n: [2, 6] },
      ],
      formacion: [{ titulo: 'Bachillerato', centro: 'IES de Bilbao', inicio: '', fin: '2019' }],
      idiomas: [{ idioma: 'Español', nivel: 'Nativo' }, { idioma: 'Inglés', nivel: 'B2' }],
      otros: 'Disponibilidad de tardes',
    },
  },
];

// Convierte el ejemplo compacto de un oficio en un currículum completo para el editor.
export function ejemploCV(oficio) {
  const e = oficio.ejemplo;
  return {
    nombre: e.nombre,
    puesto: e.puesto,
    email: e.email,
    telefono: e.telefono,
    ciudad: e.ciudad,
    web: '',
    foto: '',
    perfil: oficio.perfiles[0],
    experiencia: e.experiencia.map(({ n, ...x }) => ({ ...x, tareas: n.map((i) => oficio.tareas[i]).join('\n') })),
    formacion: e.formacion,
    habilidades: oficio.habilidades.slice(0, 7),
    idiomas: e.idiomas,
    otros: e.otros,
  };
}
