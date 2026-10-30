// Banco de preguntas del simulador de entrevista (Pro). Cada pregunta trae qué
// buscan con ella, un consejo y una respuesta modelo para adaptar.

export const GENERALES = [
  {
    q: 'Háblame de ti.',
    busca: 'Ver si sabes resumir quién eres en un minuto y si encajas con el puesto.',
    consejo: 'No cuentes tu vida: experiencia, puntos fuertes y por qué te interesa este trabajo. Un minuto como máximo.',
    r: 'Llevo dos años trabajando de cara al público, sobre todo en hostelería. Me gusta el trato con la gente y trabajar con ritmo, y soy muy constante. Ahora busco un sitio estable donde seguir aprendiendo, y vuestra empresa tiene muy buena fama por cómo trata a sus clientes.',
  },
  {
    q: '¿Por qué quieres trabajar aquí?',
    busca: 'Saber si te has informado sobre la empresa o si envías el CV a todo.',
    consejo: 'Une algo concreto de la empresa con algo tuyo: su producto, su forma de trabajar, el horario, la cercanía…',
    r: 'He visto que tenéis varias tiendas y que cuidáis mucho la atención al cliente, que es lo que más me gusta de mi trabajo. Además, el horario encaja con mi disponibilidad y vivo cerca, así que puedo llegar siempre puntual.',
  },
  {
    q: '¿Cuál es tu mayor virtud?',
    busca: 'Una cualidad útil para el puesto, con un ejemplo que la demuestre.',
    consejo: 'Elige una sola y demuéstrala con un hecho real. Un ejemplo vale más que tres adjetivos.',
    r: 'Soy muy responsable. En mi último trabajo nunca falté a un turno en dos años, y cuando un compañero se ponía enfermo era de los primeros en ofrecerme a cubrirle.',
  },
  {
    q: '¿Y tu mayor defecto?',
    busca: 'Sinceridad y capacidad de mejorar. No quieren un defecto grave para el puesto.',
    consejo: 'Di uno real, que no sea crítico para el trabajo, y explica qué haces para mejorarlo. Evita el "soy demasiado perfeccionista".',
    r: 'A veces me cuesta pedir ayuda porque quiero resolverlo todo yo. He aprendido que preguntar a tiempo evita errores, y ahora, si tengo una duda, lo consulto antes de seguir.',
  },
  {
    q: '¿Por qué dejaste tu último trabajo?',
    busca: 'Que no haya un conflicto detrás y que no hables mal de nadie.',
    consejo: 'Sé sincero y positivo. Nunca critiques a una empresa ni a un jefe anterior.',
    r: 'Era un contrato de temporada que terminó en septiembre. Aprendí mucho allí y me fui con buena relación con el equipo, pero ahora busco algo más estable.',
  },
  {
    q: '¿Qué sabes de nuestra empresa?',
    busca: 'Interés real. Comprueban si te has preparado la entrevista.',
    consejo: 'Dedica 10 minutos antes a su web y redes: a qué se dedican, tamaño, clientes, valores. Di dos o tres datos concretos.',
    r: 'Sé que empezasteis como un negocio familiar y que ahora tenéis cinco locales en la zona. He visto que dais mucha importancia al producto de calidad y al trato cercano, y eso encaja con mi forma de trabajar.',
  },
  {
    q: 'Cuéntame una situación difícil en el trabajo y cómo la resolviste.',
    busca: 'Cómo reaccionas bajo presión y si sabes resolver problemas.',
    consejo: 'Usa el orden situación → qué hiciste → resultado. Termina con lo que aprendiste.',
    r: 'Un sábado se cayó el sistema de cobro con el local lleno. Avisé a mi responsable, organizamos los cobros en efectivo y apunté los pagos con tarjeta para hacerlos después. No perdimos ninguna venta y los clientes lo entendieron. Aprendí a mantener la calma y a comunicar rápido.',
  },
  {
    q: '¿Cómo trabajas en equipo?',
    busca: 'Que colabores, ayudes y sepas comunicarte.',
    consejo: 'Da un ejemplo concreto de colaboración: cubrir a alguien, repartir tareas, ayudar a uno nuevo.',
    r: 'Me gusta que todo el equipo vaya a una. Cuando entra alguien nuevo, suelo explicarle cómo funcionamos, y si termino mis tareas antes, pregunto en qué puedo ayudar.',
  },
  {
    q: '¿Dónde te ves dentro de cinco años?',
    busca: 'Si piensas quedarte y si tienes ganas de crecer.',
    consejo: 'Muestra ambición realista dentro de la empresa. No digas que quieres montar tu propio negocio de la competencia.',
    r: 'Me gustaría seguir en esta empresa, haber aprendido bien el oficio y, si es posible, asumir más responsabilidad, por ejemplo como encargado de turno.',
  },
  {
    q: '¿Qué disponibilidad tienes?',
    busca: 'Si encajas con los horarios del puesto. En muchos empleos es decisivo.',
    consejo: 'Tenlo claro antes de entrar: días, horarios, fines de semana, turnos y desde cuándo puedes empezar.',
    r: 'Tengo disponibilidad inmediata y puedo trabajar en turnos de mañana o tarde, incluidos fines de semana y festivos.',
  },
  {
    q: '¿Cuánto quieres cobrar?',
    busca: 'Si tus expectativas encajan con lo que ofrecen.',
    consejo: 'Infórmate del salario habitual (convenio del sector). Da una cifra o un rango razonable, o pregunta qué ofrecen.',
    r: 'Según el convenio del sector, para este puesto suele estar alrededor de [cifra] brutos al año. Me parece una buena referencia, aunque estoy abierto a hablarlo según las condiciones.',
  },
  {
    q: '¿Tienes alguna pregunta?',
    busca: 'Interés por el puesto. Decir "no" da mala impresión.',
    consejo: 'Lleva siempre una o dos preguntas preparadas sobre el día a día o el equipo, no sobre vacaciones.',
    r: '¿Cómo es un día normal en este puesto? ¿Y cuándo sabré algo del proceso de selección?',
  },
];

export const POR_SECTOR = {
  hosteleria: [
    { q: '¿Has trabajado alguna vez bajo mucha presión, con el local lleno?', busca: 'Rapidez y calma en horas punta.', consejo: 'Da cifras: mesas, comensales, cafés por hora.', r: 'Sí, los fines de semana atendíamos más de 60 comensales con dos camareros. Me organizo por prioridades: primero bebidas y comandas, luego cobros, y siempre coordinado con cocina.' },
    { q: '¿Qué harías si un cliente se queja de su plato?', busca: 'Trato al cliente y resolución de problemas.', consejo: 'Escuchar, disculparse, solucionar y avisar al responsable si hace falta.', r: 'Le escucharía sin interrumpir, me disculparía y le ofrecería cambiarlo o una alternativa. Lo comunicaría a cocina y a mi responsable, y después volvería a la mesa para comprobar que todo está bien.' },
    { q: '¿Cómo actúas con un cliente que tiene alergias?', busca: 'Conocimiento de alérgenos y seguridad alimentaria.', consejo: 'Menciona la carta de alérgenos y la comunicación con cocina.', r: 'Consulto la carta de alérgenos, le explico qué platos son seguros y lo comunico claramente a cocina en la comanda para evitar contaminación cruzada. Si tengo una duda, pregunto antes de servir.' },
    { q: '¿Tienes el carnet de manipulador de alimentos?', busca: 'Requisito habitual en hostelería.', consejo: 'Si no lo tienes, di que puedes sacarlo en pocos días (hay cursos online).', r: 'Sí, lo tengo en vigor. Además conozco las normas de higiene y el sistema APPCC por mi trabajo anterior.' },
    { q: '¿Te importa trabajar fines de semana, noches o festivos?', busca: 'Disponibilidad, clave en hostelería.', consejo: 'Sé claro y honesto. Si tienes alguna limitación, dila desde el principio.', r: 'No, sé que en hostelería es lo normal. Tengo disponibilidad para fines de semana y festivos, y también para turnos de noche.' },
  ],
  comercio: [
    { q: '¿Cómo venderías este producto a un cliente que solo está mirando?', busca: 'Iniciativa y técnica de venta sin agobiar.', consejo: 'Saluda, pregunta qué necesita y recomienda según lo que te diga.', r: 'Le saludaría con una sonrisa y le dejaría mirar unos segundos. Después le preguntaría si busca algo en concreto o para qué ocasión, y le enseñaría dos o tres opciones que encajen, explicando lo que más le puede interesar.' },
    { q: '¿Qué haces si se forma cola en caja y estás reponiendo?', busca: 'Prioridades: el cliente primero.', consejo: 'La atención al cliente va antes que las tareas internas.', r: 'Dejo la reposición en un punto seguro y voy a caja o aviso a un compañero. El cliente que espera es la prioridad; la reposición la termino después.' },
    { q: '¿Cómo gestionas una devolución con un cliente enfadado?', busca: 'Calma y conocimiento de la política de la tienda.', consejo: 'Empatía, aplicar la norma de la tienda y ofrecer alternativas.', r: 'Mantengo la calma, le escucho y reviso el ticket y el estado del producto según la política de la tienda. Si no es posible devolver el dinero, le ofrezco un cambio o un vale, y si hace falta aviso al encargado.' },
    { q: '¿Has trabajado con objetivos de venta?', busca: 'Orientación a resultados.', consejo: 'Da un dato si lo tienes: objetivo cumplido, ventas por día, ticket medio.', r: 'Sí, teníamos objetivos semanales por tienda y los cumplíamos casi siempre. Lo que mejor me funcionaba era recomendar complementos al producto principal.' },
    { q: '¿Tienes experiencia con caja y cierre?', busca: 'Manejo de dinero y responsabilidad.', consejo: 'Menciona el TPV, el arqueo y que nunca tuviste descuadres, si es verdad.', r: 'Sí, cobraba en efectivo y tarjeta y hacía el arqueo y cierre de caja al final del día. Nunca tuve descuadres importantes.' },
  ],
  logistica: [
    { q: '¿Has trabajado con lector de radiofrecuencia o preparando pedidos?', busca: 'Experiencia práctica en almacén.', consejo: 'Di qué sistemas usaste y cuántos pedidos o líneas preparabas.', r: 'Sí, preparaba pedidos con lector de radiofrecuencia, unas 150 líneas por turno, y revisaba que todo estuviera correcto antes de enviarlo a muelle.' },
    { q: '¿Tienes carnet de carretillero? ¿Qué máquinas manejas?', busca: 'Formación y seguridad.', consejo: 'Indica el tipo de carretilla y si tienes experiencia real con ella.', r: 'Sí, tengo el carnet en vigor y he manejado carretilla frontal, retráctil y transpaleta eléctrica durante dos años.' },
    { q: '¿Cómo garantizas la seguridad en el almacén?', busca: 'Prevención de riesgos laborales.', consejo: 'Habla de EPIs, normas de circulación y orden.', r: 'Uso siempre los equipos de protección, respeto las zonas de paso y la velocidad, no levanto cargas sin la técnica adecuada y mantengo mi zona ordenada. Si veo algo peligroso, lo aviso.' },
    { q: 'Si vas con retraso en la ruta de reparto, ¿qué haces?', busca: 'Organización y comunicación.', consejo: 'Prioriza entregas urgentes y avisa a tiempo.', r: 'Reorganizo la ruta para priorizar las entregas con hora, aviso a la central y, si hace falta, al cliente. Prefiero avisar antes que dejar a alguien esperando sin saber nada.' },
    { q: '¿Puedes trabajar a turnos rotativos?', busca: 'Disponibilidad, muy habitual en logística.', consejo: 'Responde con claridad.', r: 'Sí, he trabajado a turnos de mañana, tarde y noche y me adapto sin problema.' },
  ],
  limpieza: [
    { q: '¿Qué productos y máquinas sabes usar?', busca: 'Conocimiento técnico y seguridad.', consejo: 'Menciona máquinas concretas y que respetas las fichas de seguridad.', r: 'Uso fregadora, rotativa y aspiradores industriales, y conozco los productos habituales y sus diluciones. Siempre leo las etiquetas y nunca mezclo productos.' },
    { q: '¿Cómo organizas tu trabajo para que te dé tiempo a todo?', busca: 'Método y eficiencia.', consejo: 'Explica tu orden: de arriba abajo, de dentro afuera, zonas críticas primero.', r: 'Sigo un orden fijo: primero las zonas más usadas y los baños, después oficinas y al final suelos, siempre de arriba abajo y de dentro hacia fuera. Así no repito trabajo.' },
    { q: '¿Qué harías si encuentras un objeto de valor mientras limpias?', busca: 'Honradez y discreción.', consejo: 'Respuesta corta y clara.', r: 'No lo tocaría más de lo necesario y lo entregaría enseguida a mi responsable o al cliente, dejando constancia.' },
    { q: '¿Has limpiado en hospitales, hoteles u oficinas?', busca: 'Experiencia en el tipo de centro.', consejo: 'Adapta la respuesta al centro de la oferta.', r: 'Sí, he trabajado en oficinas y comunidades, y una temporada en un hotel haciendo habitaciones, unas 15 por turno.' },
    { q: '¿Te importa trabajar de madrugada o en horario partido?', busca: 'Disponibilidad.', consejo: 'Sé sincero con tu disponibilidad.', r: 'No, tengo disponibilidad para horario de mañana temprano y también partido.' },
  ],
  salud: [
    { q: '¿Cómo tratas a una persona mayor que no quiere asearse?', busca: 'Paciencia, respeto y técnica.', consejo: 'Habla de respeto a su dignidad y de buscar el momento adecuado.', r: 'Nunca le obligaría. Le hablaría con calma, intentaría entender el motivo y buscaría otro momento o una forma que le resulte más cómoda, respetando siempre su intimidad.' },
    { q: '¿Qué experiencia tienes con movilizaciones y transferencias?', busca: 'Técnica y seguridad del paciente y tuya.', consejo: 'Menciona grúas, cambios posturales y la higiene postural.', r: 'He hecho transferencias cama-silla y cambios posturales, con y sin grúa, siguiendo la técnica correcta para proteger al usuario y mi espalda.' },
    { q: '¿Cómo te comunicas con la familia del usuario?', busca: 'Empatía y profesionalidad.', consejo: 'Información clara, respeto y límites.', r: 'Con cercanía y respeto. Les informo de lo que me corresponde, escucho sus preocupaciones y, si hay algo médico, les dirijo al profesional adecuado.' },
    { q: '¿Cómo gestionas la carga emocional de este trabajo?', busca: 'Resiliencia.', consejo: 'Muestra que lo tienes en cuenta y que te cuidas.', r: 'Es un trabajo que me llena, pero también exige. Intento separar el trabajo de la vida personal, hablar con el equipo cuando algo me afecta y cuidar mi descanso.' },
    { q: '¿Qué harías si notas un cambio en el estado de un usuario?', busca: 'Observación y protocolo.', consejo: 'Observar, registrar y avisar al responsable o al personal sanitario.', r: 'Lo comunicaría enseguida a enfermería o a mi responsable, lo anotaría en el registro y seguiría el protocolo del centro.' },
  ],
  construccion: [
    { q: '¿Qué medidas de seguridad sigues en obra?', busca: 'Prevención de riesgos, clave en el sector.', consejo: 'EPIs, curso de PRL y orden en la obra.', r: 'Llevo siempre casco, botas, guantes y arnés cuando trabajo en altura. Tengo el curso de PRL de 20 horas y mantengo mi zona limpia y señalizada.' },
    { q: '¿Qué tareas sabes hacer sin supervisión?', busca: 'Nivel de autonomía.', consejo: 'Sé concreto y honesto con tu nivel.', r: 'Puedo levantar tabiques, enlucir y hacer solados por mi cuenta. En trabajos más técnicos prefiero seguir las indicaciones del encargado.' },
    { q: '¿Sabes leer planos?', busca: 'Conocimiento técnico.', consejo: 'Si es básico, dilo, y muestra ganas de aprender.', r: 'Sí, a nivel de obra: cotas, distribución y replanteo básico. Si hay algo que no entiendo, lo consulto antes de empezar.' },
    { q: '¿Tienes herramientas propias o vehículo?', busca: 'Requisito frecuente.', consejo: 'Responde lo que tengas.', r: 'Tengo mi herramienta básica de mano y carnet B con vehículo propio para desplazarme a las obras.' },
    { q: '¿Qué haces si ves a un compañero trabajando sin protección?', busca: 'Compromiso con la seguridad.', consejo: 'Avisar con respeto y, si sigue, al encargado.', r: 'Se lo diría con respeto, porque es por su seguridad. Si sigue igual, lo comunicaría al encargado.' },
  ],
  oficios: [
    { q: 'Cuéntame una avería difícil que hayas resuelto.', busca: 'Capacidad de diagnóstico.', consejo: 'Explica cómo encontraste el fallo paso a paso.', r: 'En una comunidad saltaba el diferencial cada pocas horas. Fui descartando circuitos uno a uno hasta encontrar una derivación en un punto de luz del garaje con humedad. Lo reparé y no volvió a fallar.' },
    { q: '¿Cómo tratas con el cliente en su casa?', busca: 'Educación y confianza.', consejo: 'Puntualidad, explicar lo que harás y dejar todo limpio.', r: 'Llego puntual, le explico qué voy a hacer y cuánto puede costar antes de empezar, y al terminar dejo todo limpio y le enseño cómo ha quedado.' },
    { q: '¿Qué titulación o carnés profesionales tienes?', busca: 'Habilitaciones necesarias.', consejo: 'Menciona carnés oficiales (instalador, gas, etc.) si los tienes.', r: 'Tengo el FP de instalaciones eléctricas y el carnet de instalador autorizado en baja tensión.' },
    { q: '¿Cómo organizas tus avisos del día?', busca: 'Planificación.', consejo: 'Habla de rutas, urgencias y material.', r: 'Reviso los avisos a primera hora, priorizo las urgencias, organizo la ruta por zonas y compruebo que llevo el material necesario para no tener que volver.' },
    { q: '¿Qué haces si no sabes cómo resolver algo?', busca: 'Humildad y seguridad.', consejo: 'Nunca improvisar en algo peligroso.', r: 'No improviso. Consulto la documentación o a un compañero con más experiencia y, si hace falta, vuelvo con la solución adecuada.' },
  ],
  industria: [
    { q: '¿Has trabajado en cadena o con objetivos de producción?', busca: 'Ritmo y constancia.', consejo: 'Da cifras de producción si las tienes.', r: 'Sí, trabajé en una línea de envasado con objetivos por turno. Me adapto bien al ritmo y cumplo los estándares de calidad.' },
    { q: '¿Qué haces si detectas una pieza defectuosa?', busca: 'Control de calidad.', consejo: 'Apartar, registrar y avisar.', r: 'La aparto, lo registro según el procedimiento y aviso al jefe de línea para que se revise si es un fallo puntual o de la máquina.' },
    { q: '¿Qué máquinas has manejado?', busca: 'Experiencia técnica.', consejo: 'Nombra máquinas concretas.', r: 'He manejado envasadoras, etiquetadoras y paletizadoras, y hacía el ajuste básico y la limpieza al cambiar de formato.' },
    { q: '¿Cómo cumples las normas de seguridad e higiene?', busca: 'Compromiso con normas.', consejo: 'EPIs, procedimientos y orden.', r: 'Sigo siempre los procedimientos, uso los EPIs y nunca quito una protección de la máquina. Mantengo mi puesto limpio y ordenado.' },
    { q: '¿Puedes trabajar a tres turnos?', busca: 'Disponibilidad.', consejo: 'Responde con claridad.', r: 'Sí, he trabajado a tres turnos rotativos y no tengo problema.' },
  ],
  oficina: [
    { q: '¿Qué nivel de Excel tienes?', busca: 'Competencia real con herramientas.', consejo: 'Di qué sabes hacer en concreto: tablas dinámicas, BUSCARV, gráficos…', r: 'Nivel medio-avanzado: uso fórmulas como BUSCARV y SUMAR.SI, tablas dinámicas y gráficos. Llevaba con Excel el control de facturas de la empresa.' },
    { q: '¿Cómo atiendes una llamada de un cliente enfadado?', busca: 'Calma y resolución.', consejo: 'Escuchar, empatizar, solucionar o derivar, y hacer seguimiento.', r: 'Le dejo explicarse, le muestro que entiendo el problema y le doy una solución o un plazo concreto. Si no depende de mí, lo derivo a quien corresponda y le llamo después para confirmar que está resuelto.' },
    { q: '¿Cómo organizas tus tareas cuando todo es urgente?', busca: 'Priorización.', consejo: 'Habla de listas, plazos y comunicar a tiempo.', r: 'Hago una lista y priorizo por plazo e impacto. Si veo que no llego a todo, lo comento con mi responsable para decidir qué va primero.' },
    { q: '¿Qué programas de gestión has usado?', busca: 'Experiencia con software.', consejo: 'Nombra los que conozcas y destaca que aprendes rápido.', r: 'He usado A3 y Holded para facturación, y el paquete Office a diario. Me adapto rápido a programas nuevos.' },
    { q: '¿Cómo tratas la información confidencial?', busca: 'Discreción.', consejo: 'Respuesta corta y firme.', r: 'Con total discreción: no la comento fuera del trabajo, bloqueo el ordenador al levantarme y solo la comparto con quien tiene que conocerla.' },
  ],
  servicios: [
    { q: '¿Cómo actuarías ante una situación de conflicto con una persona?', busca: 'Calma y protocolo.', consejo: 'Diálogo primero, seguir el protocolo y pedir apoyo.', r: 'Mantendría la calma y trataría de reconducirlo hablando con respeto. Si la situación se complica, seguiría el protocolo y pediría apoyo, sin ponerme en riesgo ni ponerla en riesgo.' },
    { q: '¿Tienes la habilitación necesaria para el puesto?', busca: 'Requisitos legales (TIP, licencias, etc.).', consejo: 'Indica la habilitación y su vigencia.', r: 'Sí, tengo la TIP de vigilante de seguridad en vigor y los reciclajes al día.' },
    { q: '¿Cómo mantienes la atención en turnos largos?', busca: 'Constancia y responsabilidad.', consejo: 'Rutinas, rondas y descanso.', r: 'Hago rondas con regularidad, anoto las incidencias y llego descansado a cada turno. Para mí la rutina es clave para no bajar la guardia.' },
    { q: '¿Qué harías si un cliente te pide algo que no está permitido?', busca: 'Respeto a las normas con buen trato.', consejo: 'Explicar con educación y ofrecer alternativa.', r: 'Le explicaría con educación por qué no es posible y le ofrecería una alternativa o le indicaría a quién puede dirigirse.' },
    { q: '¿Por qué crees que eres buena persona para este servicio?', busca: 'Vocación y actitud.', consejo: 'Une tu carácter con lo que pide el puesto.', r: 'Soy una persona tranquila, responsable y con mucha paciencia, y me gusta ayudar a la gente. Creo que son justo las cualidades que necesita este trabajo.' },
  ],
};
