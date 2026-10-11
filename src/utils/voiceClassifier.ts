import { IdeaType } from '../types';

export interface VoiceClassificationResult {
  categoryId: string;
  type: IdeaType;
  title: string;
  description: string;
  rawTranscript: string;
  confidenceReason: string;
}

// Normalizes text by removing accents, converting to lowercase, and trimming
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Capitalizes the first letter of each major word in a title
export function formatTitle(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/^[,.\s-]+|[,.\s-]+$/g, '');
  if (!trimmed) return '';

  const minorWords = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'por', 'con', 'del', 'los', 'las', 'un', 'una', 'unos', 'unas', 'para', 'al']);
  const words = trimmed.split(/\s+/);

  return words
    .map((w, idx) => {
      const lower = w.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function classifyVoiceIdea(rawTranscript: string, defaultCategoryId?: string): VoiceClassificationResult {
  const norm = normalizeText(rawTranscript);
  let title = rawTranscript.trim();
  let description = '';
  let categoryId = defaultCategoryId || 'salud_deporte';
  let type: IdeaType = 'idea';
  let confidenceReason = 'Clasificación automática general';

  // ----------------------------------------------------
  // 1. OCIO & ENTRETENIMIENTO (Series, Películas, Videojuegos, Streaming, Cine, Música)
  // ----------------------------------------------------
  if (
    norm.includes('serie') ||
    norm.includes('series') ||
    norm.includes('capitulo') ||
    norm.includes('capítulo') ||
    norm.includes('temporada') ||
    norm.includes('episodio') ||
    norm.includes('anime') ||
    norm.includes('manga') ||
    norm.includes('apple tv') ||
    norm.includes('netflix') ||
    norm.includes('prime video') ||
    norm.includes('disney') ||
    norm.includes('hbo') ||
    norm.includes('max') ||
    norm.includes('crunchyroll') ||
    norm.includes('paramount') ||
    norm.includes('pelicula') ||
    norm.includes('película') ||
    norm.includes('peliculas') ||
    norm.includes('películas') ||
    norm.includes('cine') ||
    norm.includes('film') ||
    norm.includes('videojuego') ||
    norm.includes('video juego') ||
    norm.includes('video juegos') ||
    norm.includes('jugar a') ||
    norm.includes('jugar al') ||
    norm.includes('playstation') ||
    norm.includes('ps5') ||
    norm.includes('ps4') ||
    norm.includes('nintendo') ||
    norm.includes('switch') ||
    norm.includes('xbox') ||
    norm.includes('steam') ||
    norm.includes('consola')
  ) {
    categoryId = 'ocio_entretenimiento';

    if (norm.includes('serie') || norm.includes('temporada') || norm.includes('capitulo') || norm.includes('capítulo') || norm.includes('episodio') || norm.includes('anime') || norm.includes('apple tv') || norm.includes('netflix') || norm.includes('hbo')) {
      type = 'serie';
      confidenceReason = 'Detectado contenido de Serie / Streaming';

      // Example: "ver la serie hoy a las 3 de la tarde"
      const match = rawTranscript.match(/(?:quiero ver la serie|ver la serie|la serie|serie|ver el anime|anime)\s+([^,.]+?)(?:\s+(?:la dan en|esta en|en|temporada|los fines|con)\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        title = `Ver serie: ${match[1].trim()}`;
        if (match[2]) {
          description = `Plataforma / Notas: ${match[2].trim()}`;
        }
      } else {
        title = 'Ver la serie';
      }
    } else if (norm.includes('pelicula') || norm.includes('película') || norm.includes('cine') || norm.includes('film')) {
      type = 'pelicula';
      confidenceReason = 'Detectado contenido de Película / Cine';

      const match = rawTranscript.match(/(?:quiero ver la pelicula|ver la pelicula|la pelicula|pelicula|ver la peli|ir al cine a ver)\s+([^,.]+?)(?:\s+(?:en|con|el|este)\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        title = `Película: ${match[1].trim()}`;
        if (match[2]) {
          description = `Notas: ${match[2].trim()}`;
        }
      } else {
        title = 'Ver película';
      }
    } else if (norm.includes('videojuego') || norm.includes('jugar') || norm.includes('game') || norm.includes('ps5') || norm.includes('nintendo') || norm.includes('steam') || norm.includes('xbox') || norm.includes('playstation')) {
      type = 'videojuego';
      confidenceReason = 'Detectado Videojuego / Gaming';

      const match = rawTranscript.match(/(?:jugar al videojuego|jugar videojuego|jugar a|jugar al|videojuego|comprar el juego|juego)\s+([^,.]+?)(?:\s+(?:en|para|con)\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        title = `Jugar: ${match[1].trim()}`;
        if (match[2]) {
          description = `Plataforma: ${match[2].trim()}`;
        }
      } else {
        title = 'Jugar videojuego';
      }
    } else if (norm.includes('musica') || norm.includes('concierto') || norm.includes('album') || norm.includes('cancion') || norm.includes('recital')) {
      type = 'musica';
      confidenceReason = 'Detectada Música / Evento musical';
    } else {
      type = 'evento';
      confidenceReason = 'Detectado Plan de Ocio';
    }
  }

  // ----------------------------------------------------
  // 2. ACTIVIDADES PENDIENTES & HOGAR (Pintar casa, Organizar estudio, Comprar pinceles, Mantenimiento, Trámites)
  // ----------------------------------------------------
  else if (
    norm.includes('pintar') ||
    norm.includes('pintura') ||
    norm.includes('pincel') ||
    norm.includes('pinceles') ||
    norm.includes('brocha') ||
    norm.includes('brochas') ||
    norm.includes('rodillo') ||
    norm.includes('lijar') ||
    norm.includes('organizar estudio') ||
    norm.includes('organizar el estudio') ||
    norm.includes('ordenar estudio') ||
    norm.includes('organizar cuarto') ||
    norm.includes('ordenar closet') ||
    norm.includes('ordenar escritorio') ||
    norm.includes('organizar cables') ||
    norm.includes('despejar garaje') ||
    norm.includes('ferreteria') ||
    norm.includes('comprar herramientas') ||
    norm.includes('comprar materiales') ||
    norm.includes('reparar') ||
    norm.includes('arreglar gotera') ||
    norm.includes('arreglar la puerta') ||
    norm.includes('cambiar bombillo') ||
    norm.includes('limpieza profunda') ||
    norm.includes('lavar persianas') ||
    norm.includes('tramite') ||
    norm.includes('diligencia') ||
    norm.includes('renovar licencia') ||
    norm.includes('renovar pasaporte') ||
    norm.includes('notaria') ||
    norm.includes('actividad pendiente') ||
    norm.includes('actividades pendientes') ||
    norm.includes('tarea pendiente') ||
    norm.includes('tareas pendientes')
  ) {
    categoryId = 'actividades_pendientes';

    if (norm.includes('pintar') || norm.includes('pintura') || norm.includes('brocha') || norm.includes('rodillo') || norm.includes('lijar') || norm.includes('fachada')) {
      type = 'pintura_mejora';
      confidenceReason = 'Detectada actividad de Pintura & Reparación';

      const match = rawTranscript.match(/(?:pintar la casa|pintar las paredes|pintar|lijar|aplicar pintura en)\s+([^,.]+?)(?:\s+(?:con|en|para|los)\s+(.+))?$/i);
      if (match) {
        title = `Pintura: ${match[1]?.trim() || rawTranscript}`;
        if (match[2]) description = `Detalles: ${match[2].trim()}`;
      }
    } else if (norm.includes('pincel') || norm.includes('pinceles') || norm.includes('ferreteria') || norm.includes('comprar materiales') || norm.includes('comprar herramientas') || norm.includes('comprar pintura') || norm.includes('comprar')) {
      type = 'compra_materiales';
      confidenceReason = 'Detectada Compra de Materiales & Herramientas';

      const match = rawTranscript.match(/(?:comprar pinceles|comprar herramientas|comprar materiales|comprar en ferreteria|comprar)\s+([^,.]+?)(?:\s+(?:para|en|de)\s+(.+))?$/i);
      if (match) {
        title = `Compra: ${match[1]?.trim() || rawTranscript}`;
        if (match[2]) description = `Uso / Notas: ${match[2].trim()}`;
      }
    } else if (norm.includes('organizar') || norm.includes('ordenar') || norm.includes('estudio') || norm.includes('closet') || norm.includes('escritorio') || norm.includes('despejar') || norm.includes('cables')) {
      type = 'organizacion_espacio';
      confidenceReason = 'Detectada Organización & Orden de Espacio';

      const match = rawTranscript.match(/(?:organizar el estudio|organizar estudio|organizar|ordenar el estudio|ordenar escritorio|ordenar|despejar)\s+([^,.]+?)(?:\s+(?:y|para|en)\s+(.+))?$/i);
      if (match) {
        title = `Organizar: ${match[1]?.trim() || rawTranscript}`;
        if (match[2]) description = `Área / Tareas: ${match[2].trim()}`;
      }
    } else if (norm.includes('tramite') || norm.includes('diligencia') || norm.includes('licencia') || norm.includes('pasaporte') || norm.includes('notaria')) {
      type = 'diligencia_tramite';
      confidenceReason = 'Detectada Diligencia / Trámite Administrativo';
    } else {
      type = 'mantenimiento_hogar';
      confidenceReason = 'Detectado Mantenimiento & Limpieza del Hogar';
    }
  }

  // ----------------------------------------------------
  // 2. SALUD & DEPORTE (Cardio, Pesas, Deporte, Rutinas, Nutrición)
  // ----------------------------------------------------
  else if (
    norm.includes('correr') ||
    norm.includes('running') ||
    norm.includes('trote') ||
    norm.includes('bicicleta') ||
    norm.includes('ciclismo') ||
    norm.includes('spinning') ||
    norm.includes('cardio') ||
    norm.includes('pesas') ||
    norm.includes('gimnasio') ||
    norm.includes('gym') ||
    norm.includes('fuerza') ||
    norm.includes('sentadilla') ||
    norm.includes('peso muerto') ||
    norm.includes('pecho') ||
    norm.includes('biceps') ||
    norm.includes('triceps') ||
    norm.includes('mancuernas') ||
    norm.includes('futbol') ||
    norm.includes('padel') ||
    norm.includes('natacion') ||
    norm.includes('nadar') ||
    norm.includes('entrenar') ||
    norm.includes('ejercicio') ||
    norm.includes('rutina de') ||
    norm.includes('estiramiento') ||
    norm.includes('movilidad') ||
    norm.includes('meal prep') ||
    norm.includes('nutricion') ||
    norm.includes('proteina') ||
    norm.includes('calistenia')
  ) {
    categoryId = 'salud_deporte';

    if (norm.includes('correr') || norm.includes('running') || norm.includes('cardio') || norm.includes('bicicleta') || norm.includes('ciclismo') || norm.includes('trotar') || norm.includes('hiit')) {
      type = 'cardio';
      confidenceReason = 'Detectada actividad de Cardio / Resistencia';

      const match = rawTranscript.match(/(?:hacer cardio|salir a correr|correr|rutina de running|entrenar running|salir en bicicleta|ciclismo)\s+([^,.]+?)(?:\s+(?:los|el|en|para)\s+(.+))?$/i);
      if (match) {
        title = `Cardio: ${match[1]?.trim() || rawTranscript}`;
        if (match[2]) description = match[2].trim();
      }
    } else if (norm.includes('pesas') || norm.includes('gimnasio') || norm.includes('gym') || norm.includes('fuerza') || norm.includes('hipertrofia') || norm.includes('mancuerna') || norm.includes('calistenia') || norm.includes('biceps') || norm.includes('sentadilla')) {
      type = 'pesas';
      confidenceReason = 'Detectada actividad de Pesas & Fuerza';

      const match = rawTranscript.match(/(?:rutina de pesas|pesas|entrenamiento de pesas|ir al gym para|entrenar en el gimnasio|hacer pesas de)\s+([^,.]+?)(?:\s+(?:en|los|el|para)\s+(.+))?$/i);
      if (match) {
        title = `Rutina de Pesas (${match[1]?.trim()})`;
        if (match[2]) description = match[2].trim();
      }
    } else if (norm.includes('futbol') || norm.includes('padel') || norm.includes('tenis') || norm.includes('natacion') || norm.includes('nadar') || norm.includes('partido') || norm.includes('artes marciales') || norm.includes('boxeo') || norm.includes('escalada')) {
      type = 'deporte';
      confidenceReason = 'Detectado Deporte / Disciplina deportiva';
    } else if (norm.includes('meal prep') || norm.includes('nutricion') || norm.includes('dieta') || norm.includes('receta saludable') || norm.includes('proteina') || norm.includes('hidratacion') || norm.includes('agua')) {
      type = 'nutricion';
      confidenceReason = 'Detectada Meta de Nutrición Saludable';
    } else {
      type = 'rutina';
      confidenceReason = 'Detectada Rutina de Salud / Movilidad';
    }
  }

  // ----------------------------------------------------
  // 3. FINANZAS & HOGAR (Ahorro, Inversión, Compras, Presupuesto)
  // ----------------------------------------------------
  else if (
    norm.includes('ahorrar') ||
    norm.includes('ahorro') ||
    norm.includes('fondo de emergencia') ||
    norm.includes('invertir') ||
    norm.includes('inversion') ||
    norm.includes('fondos indexados') ||
    norm.includes('s&p') ||
    norm.includes('acciones') ||
    norm.includes('patrimonio') ||
    norm.includes('comprar para la casa') ||
    norm.includes('remodelacion') ||
    norm.includes('iluminacion') ||
    norm.includes('presupuesto') ||
    norm.includes('gasto') ||
    norm.includes('dolares') ||
    norm.includes('pesos') ||
    norm.includes('euros')
  ) {
    categoryId = 'finanzas_hogar';

    if (norm.includes('ahorrar') || norm.includes('ahorro') || norm.includes('fondo de emergencia')) {
      type = 'ahorro';
      confidenceReason = 'Detectado Plan de Ahorro';

      const match = rawTranscript.match(/(?:ahorrar|plan de ahorro para|meta de ahorro para|guardar dinero para)\s+([^,.]+?)(?:\s+(?:para|en|por)\s+(.+))?$/i);
      if (match) {
        title = `Ahorro: ${match[1]?.trim()}`;
        if (match[2]) description = match[2].trim();
      }
    } else if (norm.includes('invertir') || norm.includes('inversion') || norm.includes('acciones') || norm.includes('etf') || norm.includes('s&p') || norm.includes('patrimonio')) {
      type = 'inversion';
      confidenceReason = 'Detectada Meta de Inversión';
    } else if (norm.includes('comprar') || norm.includes('remodelar') || norm.includes('compra') || norm.includes('mueble')) {
      type = 'compra';
      confidenceReason = 'Detectada Compra / Mejora del Hogar';
    } else {
      type = 'presupuesto';
      confidenceReason = 'Detectada Optimización de Presupuesto';
    }
  }

  // ----------------------------------------------------
  // 4. APRENDIZAJE (Habilidades, Cursos, Libros Técnicos, Idiomas, Proyectos)
  // ----------------------------------------------------
  else if (
    norm.includes('aprender') ||
    norm.includes('curso') ||
    norm.includes('taller') ||
    norm.includes('certificacion') ||
    norm.includes('idioma') ||
    norm.includes('ingles') ||
    norm.includes('italiano') ||
    norm.includes('frances') ||
    norm.includes('duolingo') ||
    norm.includes('arduino') ||
    norm.includes('cameo') ||
    norm.includes('programar') ||
    norm.includes('programacion') ||
    norm.includes('typescript') ||
    norm.includes('python') ||
    norm.includes('davinci') ||
    norm.includes('diseño') ||
    norm.includes('fotografia') ||
    norm.includes('udemy') ||
    norm.includes('coursera')
  ) {
    categoryId = 'aprendizaje';

    if (norm.includes('curso') || norm.includes('taller') || norm.includes('certificacion') || norm.includes('udemy') || norm.includes('coursera')) {
      type = 'curso';
      confidenceReason = 'Detectado Curso / Taller de Aprendizaje';

      const match = rawTranscript.match(/(?:hacer curso de|curso de|tomar curso de|taller de|certificacion en)\s+([^,.]+?)(?:\s+(?:en|con|para)\s+(.+))?$/i);
      if (match) {
        title = `Curso de ${match[1]?.trim()}`;
        if (match[2]) description = `Plataforma / Notas: ${match[2].trim()}`;
      }
    } else if (norm.includes('idioma') || norm.includes('ingles') || norm.includes('italiano') || norm.includes('frances') || norm.includes('duolingo') || norm.includes('aleman')) {
      type = 'idioma';
      confidenceReason = 'Detectado Aprendizaje de Idioma';
    } else if (norm.includes('arduino') || norm.includes('cameo') || norm.includes('habilidad') || norm.includes('aprender a')) {
      type = 'habilidad';
      confidenceReason = 'Detectada Nueva Habilidad Técnica / Manual';
    } else {
      type = 'proyecto';
      confidenceReason = 'Detectado Proyecto Práctico';
    }
  }

  // ----------------------------------------------------
  // 5. FAMILIA & RELACIONES (Planes Familiares, Citas, Viajes)
  // ----------------------------------------------------
  else if (
    norm.includes('familia') ||
    norm.includes('hijos') ||
    norm.includes('niños') ||
    norm.includes('padres') ||
    norm.includes('papa') ||
    norm.includes('mama') ||
    norm.includes('abuelos') ||
    norm.includes('cita') ||
    norm.includes('pareja') ||
    norm.includes('esposa') ||
    norm.includes('esposo') ||
    norm.includes('novia') ||
    norm.includes('novio') ||
    norm.includes('romantica') ||
    norm.includes('romantico') ||
    norm.includes('camping') ||
    norm.includes('fogata') ||
    norm.includes('viaje familiar') ||
    norm.includes('paseo con la familia') ||
    norm.includes('noche de pizza') ||
    norm.includes('juegos de mesa en familia')
  ) {
    categoryId = 'familia_relaciones';

    if (norm.includes('cita') || norm.includes('cena romantica') || norm.includes('pareja') || norm.includes('aniversario') || norm.includes('esposa') || norm.includes('esposo')) {
      type = 'cita';
      confidenceReason = 'Detectada Cita en Pareja';
    } else if (norm.includes('camping') || norm.includes('viaje') || norm.includes('paseo') || norm.includes('vacaciones') || norm.includes('playa')) {
      type = 'viaje';
      confidenceReason = 'Detectado Viaje / Paseo Familiar';
    } else if (norm.includes('huerto') || norm.includes('jardin') || norm.includes('remodelar juntos')) {
      type = 'proyecto_hogar';
      confidenceReason = 'Detectado Proyecto de Hogar en Familia';
    } else {
      type = 'plan_familiar';
      confidenceReason = 'Detectado Plan Familiar';
    }
  }

  // ----------------------------------------------------
  // 6. BIENESTAR & MENTE (Meditación, Lectura reflexiva, Sueño, Gratitud)
  // ----------------------------------------------------
  else if (
    norm.includes('meditar') ||
    norm.includes('meditacion') ||
    norm.includes('mindfulness') ||
    norm.includes('respiracion') ||
    norm.includes('habitos atomicos') ||
    norm.includes('el poder del ahora') ||
    norm.includes('leer libro') ||
    norm.includes('libro de') ||
    norm.includes('gratitud') ||
    norm.includes('diario') ||
    norm.includes('dormir mejor') ||
    norm.includes('sueño') ||
    norm.includes('desconexion') ||
    norm.includes('caminar en el bosque') ||
    norm.includes('naturaleza')
  ) {
    categoryId = 'bienestar_mente';

    if (norm.includes('meditar') || norm.includes('meditacion') || norm.includes('respiracion') || norm.includes('mindfulness')) {
      type = 'meditacion';
      confidenceReason = 'Detectada Meditación & Respiración';
    } else if (norm.includes('libro') || norm.includes('leer') || norm.includes('habitos atomicos') || norm.includes('poder del ahora')) {
      type = 'lectura_reflexiva';
      confidenceReason = 'Detectada Lectura Reflexiva & Crecimiento';
    } else if (norm.includes('dormir') || norm.includes('sueño') || norm.includes('desconexion') || norm.includes('pantallas')) {
      type = 'descanso';
      confidenceReason = 'Detectado Hábito de Descanso / Sueño';
    } else if (norm.includes('naturaleza') || norm.includes('bosque') || norm.includes('parque')) {
      type = 'paseo_naturaleza';
      confidenceReason = 'Detectado Paseo en la Naturaleza';
    } else {
      type = 'habito_saludable';
      confidenceReason = 'Detectado Hábito de Gratitud & Diario';
    }
  }

  // Clean conversational filler words from title if the regex didn't explicitly extract it
  let cleanedTitle = title;
  const prefixesToRemove = [
    /^(?:quiero|me gustaría|quisiera|anotar|recordar|guardar|tengo que|voy a|debo|plan de|idea de)\s+/i,
    /^(?:ver la serie|ver la película|ver el anime|ver|jugar a|jugar al|jugar|leer el libro|leer)\s+/i,
    /^(?:hacer|entrenar|practicar|comenzar|iniciar|comprar|ahorrar)\s+/i,
  ];

  prefixesToRemove.forEach((regex) => {
    cleanedTitle = cleanedTitle.replace(regex, '');
  });

  cleanedTitle = formatTitle(cleanedTitle);

  // If title was stripped down too much, fallback to formatted raw text
  if (!cleanedTitle || cleanedTitle.length < 2) {
    cleanedTitle = formatTitle(rawTranscript);
  }

  // If description is empty and user gave a detailed sentence, include full original transcript as reference
  if (!description && rawTranscript.length > cleanedTitle.length + 10) {
    description = rawTranscript;
  }

  return {
    categoryId,
    type,
    title: cleanedTitle,
    description,
    rawTranscript,
    confidenceReason,
  };
}
