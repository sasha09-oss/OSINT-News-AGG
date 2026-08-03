// ═══════════════════════════════════════════════════════════════════════════════
//  OSINT NEWS AGGREGATOR - Cloudflare Worker
//  Agrega noticias de RSS, GDELT, Web Search y genera resumen con Gemini AI
//  Envía por email a múltiples destinatarios 3 veces al día (7am, 1pm, 7pm UTC-4)
// ═══════════════════════════════════════════════════════════════════════════════

// ===================== CONFIGURACIÓN =====================
const CONFIG = {
  // API Keys integradas (hardcodeadas para uso directo)
  // Para mayor seguridad en producción, usa wrangler secret put
  GEMINI_API_KEY: 'AQ.Ab8RN6KM0bJ9WzJXu6eqUgrrXeXj6mqnCmsZSDkUXb3ug6dhqA',
  RESEND_API_KEY: 're_W38PTjMF_J5BpfgQ8zrnEPdzeipEQHPUy',

  GEMINI_MODEL: 'gemini-2.0-flash',
  GEMINI_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

  // Correos destino (incluyendo el nuevo)
  EMAILS_DESTINO: [
    'maxrivero783@proton.me',
    'comunicacionestrategica2026@proton.me',
    'hermionewesley@proton.me',
    'amandasuarezcarlota@gmail.com',
    'Rick_Mallor@proton.me',
    'Sashagirl2904@gmail.com',
  ],

  MAX_ITEMS_POR_FEED: 5,
  MAX_NOTICIAS_TOTAL: 150,
  FETCH_TIMEOUT_MS: 12000, // 12 segundos timeout por petición
  MAX_FETCH_RETRIES: 2,
};

// ===================== FEEDS RSS =====================
const FEEDS_EEUU = [
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/Americas.xml',
  'https://feeds.content.dowjones.io/public/rss/RSSWorldNews',
  'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness',
  'https://feeds.washingtonpost.com/rss/world',
  'https://feeds.washingtonpost.com/rss/politics',
  'https://www.theguardian.com/world/rss',
  'https://www.theguardian.com/us-news/rss',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml',
  'https://apnews.com/hub/world-news.rss',
  'https://apnews.com/hub/us-news.rss',
  'https://feeds.foxnews.com/foxnews/latest',
  'https://feeds.foxnews.com/foxnews/world',
  'https://feeds.nbcnews.com/nbcnews/public/news',
  'https://feeds.nbcnews.com/nbcnews/public/world',
  'https://feeds.cnn.com/rss/edition_world.rss',
  'https://feeds.cnn.com/rss/edition_americas.rss',
  'https://feeds.huffpost.com/news/politics',
  'https://feeds.huffpost.com/news/world-news',
  'https://www.breitbart.com/feed/',
  'https://www.newsmax.com/rss/Politics/1.xml',
  'https://www.oann.com/feed/',
  'https://www.theepochtimes.com/feed',
  'https://www.dailymail.co.uk/news/index.rss',
  'https://www.independent.co.uk/news/world/rss',
  'https://www.reuters.com/rssFeed/worldNews',
  'https://www.reuters.com/rssFeed/politicsNews',
  'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
];

const FEEDS_CUBA_INDEPENDIENTES = [
  'https://www.cibercuba.com/rss/noticias',
  'https://diariodecuba.com/rss.xml',
  'https://www.14ymedio.com/rss.xml',
  'https://www.cubanet.org/feed/',
  'https://adncuba.com/rss.xml',
  'https://www.periodicocubano.com/feed/',
  'https://cubademocraciayvida.org/feed/',
  'https://www.cubanoticias360.com/feed/',
  'https://www.cubanosporelmundo.com/feed/',
  'https://www.cubadebate.cu/rss/feed',
  'https://www.granma.cu/rss/feed',
  'https://www.juventudrebelde.cu/rss/feed',
  'https://www.prensa-latina.cu/rss/feed',
  'https://www.acn.cu/rss/feed',
];

const FEEDS_BLOGS_REDES = [
  'https://www.youtube.com/feeds/videos.xml?channel_id=UC7QoKU6bj1QbXQuNIrenXow',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCvSC-NUf5r1fFeqGFG5Fg8A',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCqe0pD8qMX5mW1C4J3v7fVg',
];

const FEEDS_LATAM = [
  'https://news.google.com/rss/search?q=America+Latina+conflictos+politica&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Latinoamerica+noticias&hl=es&gl=US&ceid=US:es',
  'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml',
  'https://www.theguardian.com/world/americas/rss',
  'https://apnews.com/hub/latin-america.rss',
  'https://www.reuters.com/rssFeed/latinAmericaNews',
];

const FEEDS_CONFLICTOS = [
  'https://news.google.com/rss/search?q=Ucrania+Rusia+guerra&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Iran+Israel+EEUU+conflicto&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Oriente+Medio+guerra&hl=es&gl=US&ceid=US:es',
  'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
  'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
  'https://www.theguardian.com/world/middleeast/rss',
  'https://www.theguardian.com/world/europe-news/rss',
  'https://apnews.com/hub/middle-east.rss',
  'https://apnews.com/hub/russia-ukraine-war.rss',
];

const FEEDS_TECNOLOGIA = [
  'https://news.google.com/rss/search?q=OSINT+open+source+intelligence&hl=en&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=artificial+intelligence+AI+news&hl=en&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=big+data+analytics&hl=en&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=cybersecurity+news&hl=en&gl=US&ceid=US:en',
  'https://www.wired.com/feed/category/security/latest/rss',
  'https://feeds.feedburner.com/TheHackersNews',
  'https://krebsonsecurity.com/feed/',
  'https://www.bleepingcomputer.com/feed/',
  'https://feeds.arstechnica.com/arstechnica/technology',
  'https://techcrunch.com/feed/',
  'https://www.technologyreview.com/feed/',
  'https://www.darkreading.com/rss.xml',
  'https://www.schneier.com/blog/atom.xml',
  'https://osintcurious.org/feed/',
  'https://www.bellingcat.com/feed/',
];

const FEEDS_CUBA_TEMATICOS = [
  'https://news.google.com/rss/search?q=Cuba+politica+noticias&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+EEUU+relaciones+bilaterales&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+migracion+exilio&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Marco+Rubio+Cuba&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Donald+Trump+Cuba&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+inversiones+empresas&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+desastre+accidente&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+Florida+exilio+diaspora&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Cuba+Texas+New+Jersey+comunidad&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=politica+interna+EEUU+escandalos&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Epstein+archivos+noticias&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=EEUU+elecciones+campañas&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=Florida+politica+inmigracion&hl=es&gl=US&ceid=US:es',
  'https://news.google.com/rss/search?q=diaspora+cubana+Florida+Texas&hl=es&gl=US&ceid=US:es',
];

const TODOS_LOS_FEEDS = [
  ...FEEDS_EEUU,
  ...FEEDS_CUBA_INDEPENDIENTES,
  ...FEEDS_BLOGS_REDES,
  ...FEEDS_LATAM,
  ...FEEDS_CONFLICTOS,
  ...FEEDS_TECNOLOGIA,
  ...FEEDS_CUBA_TEMATICOS
];

// ===================== UTILIDADES ANTIBUG =====================

/**
 * Fetch con timeout y reintentos automáticos
 * @param {string} url - URL a fetch
 * @param {object} options - Opciones de fetch
 * @param {number} retries - Reintentos restantes
 */
async function fetchRobusto(url, options = {}, retries = CONFIG.MAX_FETCH_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OSINT-Bot/1.0)',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
      console.log(`[REINTENTO] ${url} (${retries} restantes)`);
      await sleep(1000 * (CONFIG.MAX_FETCH_RETRIES - retries + 1)); // Backoff exponencial simple
      return fetchRobusto(url, options, retries - 1);
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function limpiarTexto(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extraerDominio(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function generarIdUnico() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===================== PARSER XML SIN DEPENDENCIAS =====================

/**
 * Parser XML simple y robusto usando DOMParser nativo del Worker
 */
function parseXML(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // Verificar si hay error de parseo
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parse error: ' + parseError.textContent);
    }

    return doc;
  } catch (e) {
    throw new Error('Error parseando XML: ' + e.message);
  }
}

function extraerItemsRSS(doc, maxItems) {
  const items = [];

  // Intentar formato RSS 2.0
  let entries = doc.querySelectorAll('item');

  // Si no hay items, intentar formato Atom
  if (entries.length === 0) {
    entries = doc.querySelectorAll('entry');
  }

  const limit = Math.min(entries.length, maxItems);

  for (let i = 0; i < limit; i++) {
    const entry = entries[i];
    try {
      let titulo = '';
      let link = '';
      let fecha = '';
      let fuente = '';

      if (entry.tagName === 'entry') {
        // Formato Atom
        titulo = entry.querySelector('title')?.textContent || '';
        const linkEl = entry.querySelector('link');
        link = linkEl?.getAttribute('href') || linkEl?.textContent || '';
        fecha = entry.querySelector('published')?.textContent || 
                entry.querySelector('updated')?.textContent || '';
        fuente = entry.querySelector('author name')?.textContent || 
                 entry.querySelector('author')?.textContent || '';
      } else {
        // Formato RSS
        titulo = entry.querySelector('title')?.textContent || '';
        link = entry.querySelector('link')?.textContent || '';
        fecha = entry.querySelector('pubDate')?.textContent || '';
        fuente = entry.querySelector('source')?.textContent || '';
      }

      if (titulo && titulo.trim().length > 0) {
        items.push({
          titulo: limpiarTexto(titulo),
          link: link.trim(),
          fecha: fecha.trim(),
          fuente: fuente.trim() || 'N/D',
        });
      }
    } catch (e) {
      console.log(`[WARN] Error procesando item RSS: ${e.message}`);
      // Continuar con el siguiente item
    }
  }

  return items;
}

// ===================== OBTENER NOTICIAS DE RSS (ROBUSTO) =====================

async function obtenerNoticiasRSS(env) {
  const items = [];
  let feedsExitosos = 0;
  let feedsFallidos = 0;

  for (let i = 0; i < TODOS_LOS_FEEDS.length; i++) {
    const url = TODOS_LOS_FEEDS[i];
    try {
      const response = await fetchRobusto(url);

      if (!response.ok) {
        console.log(`⚠️ HTTP ${response.status} feed #${i + 1}: ${url.substring(0, 80)}...`);
        feedsFallidos++;
        continue; // ← SIGUIENTE FEED
      }

      const contentText = await response.text();
      if (!contentText || contentText.length < 50) {
        console.log(`⚠️ Contenido vacío feed #${i + 1}: ${url.substring(0, 80)}...`);
        feedsFallidos++;
        continue; // ← SIGUIENTE FEED
      }

      let doc;
      try {
        doc = parseXML(contentText);
      } catch (e) {
        console.log(`⚠️ XML inválido feed #${i + 1}: ${url.substring(0, 80)}... -> ${e.message}`);
        feedsFallidos++;
        continue; // ← SIGUIENTE FEED
      }

      const feedItems = extraerItemsRSS(doc, CONFIG.MAX_ITEMS_POR_FEED);

      if (feedItems.length === 0) {
        console.log(`⚠️ Sin entradas feed #${i + 1}: ${url.substring(0, 80)}...`);
        feedsFallidos++;
        continue; // ← SIGUIENTE FEED
      }

      // Agregar fuente si no viene
      feedItems.forEach(item => {
        if (!item.fuente || item.fuente === 'N/D') {
          item.fuente = extraerDominio(url);
        }
        items.push(item);
      });

      feedsExitosos++;
      console.log(`✅ Feed #${i + 1} OK: ${feedItems.length} noticias | ${url.substring(0, 60)}...`);

    } catch (e) {
      console.log(`❌ Feed #${i + 1} FALLÓ: ${url.substring(0, 80)}... -> ${e.message}`);
      feedsFallidos++;
      // ← SIGUIENTE FEED (no throw, no break)
    }
  }

  console.log(`📊 RSS: ${feedsExitosos} exitosos, ${feedsFallidos} fallidos, ${items.length} noticias`);
  return items;
}

// ===================== GDELT API (ROBUSTO) =====================

async function obtenerNoticiasGDELT(env) {
  const items = [];
  const temasGDELT = [
    'Cuba',
    'Marco Rubio',
    'Donald Trump Cuba',
    'US Cuba relations',
    'Cuban migration',
    'Florida politics',
    'Ukraine Russia war',
    'Iran Israel conflict',
    'OSINT',
    'cybersecurity',
    'artificial intelligence'
  ];

  for (let i = 0; i < temasGDELT.length; i++) {
    const tema = temasGDELT[i];
    try {
      const query = encodeURIComponent(tema);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json`;

      const response = await fetchRobusto(url);

      if (!response.ok) {
        console.log(`⚠️ GDELT HTTP ${response.status} para tema: ${tema}`);
        continue; // ← SIGUIENTE TEMA
      }

      const data = await response.json();
      if (data.articles && Array.isArray(data.articles)) {
        data.articles.forEach(article => {
          if (article.title) {
            items.push({
              titulo: limpiarTexto(article.title),
              link: article.url || '',
              fecha: article.seendate || '',
              fuente: article.domain || 'GDELT',
            });
          }
        });
        console.log(`✅ GDELT tema #${i + 1} (${tema}): ${data.articles.length} artículos`);
      }
    } catch (e) {
      console.log(`❌ GDELT tema #${i + 1} (${tema}) FALLÓ: ${e.message}`);
      // ← SIGUIENTE TEMA
    }
  }

  console.log(`📊 GDELT total: ${items.length} noticias`);
  return items;
}

// ===================== BÚSQUEDA WEB (ROBUSTO) =====================

async function obtenerNoticiasBusquedaWeb(env) {
  const items = [];

  const busquedas = [
    'site:nytimes.com Cuba',
    'site:wsj.com Cuba',
    'site:washingtonpost.com Cuba',
    'site:apnews.com Cuba',
    'site:bbc.com Cuba',
    'site:theguardian.com Cuba',
    'site:reuters.com Cuba',
    'site:foxnews.com Cuba',
    'site:cnn.com Cuba',
    'site:nbcnews.com Cuba',
    'site:14ymedio.com',
    'site:cibercuba.com',
    'site:diariodecuba.com',
    'site:cubanet.org',
    'site:adncuba.com',
    'site:granma.cu',
    'site:cubadebate.cu',
    'Marco Rubio Cuba',
    'Donald Trump Cuba policy',
    'Cuba migration Florida',
    'Cuban exile diaspora',
    'Epstein files',
    'Ukraine Russia war',
    'Iran Israel conflict',
    'OSINT tools',
    'cybersecurity news',
    'artificial intelligence news',
  ];

  for (let i = 0; i < busquedas.length; i++) {
    const query = busquedas[i];
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`;

      const response = await fetchRobusto(url);

      if (!response.ok) {
        console.log(`⚠️ Web Search HTTP ${response.status} para: ${query.substring(0, 60)}`);
        continue; // ← SIGUIENTE BÚSQUEDA
      }

      let doc;
      try {
        const text = await response.text();
        doc = parseXML(text);
      } catch (e) {
        console.log(`⚠️ XML inválido en búsqueda: ${query.substring(0, 60)} -> ${e.message}`);
        continue; // ← SIGUIENTE BÚSQUEDA
      }

      const channel = doc.querySelector('channel');
      if (!channel) {
        console.log(`⚠️ Sin canal RSS en búsqueda: ${query.substring(0, 60)}`);
        continue; // ← SIGUIENTE BÚSQUEDA
      }

      const entries = channel.querySelectorAll('item');
      let count = 0;

      for (let j = 0; j < Math.min(entries.length, 3); j++) {
        try {
          const item = entries[j];
          const titulo = item.querySelector('title')?.textContent;
          const link = item.querySelector('link')?.textContent;
          const fecha = item.querySelector('pubDate')?.textContent;
          const fuente = item.querySelector('source')?.textContent;

          if (titulo) {
            items.push({
              titulo: limpiarTexto(titulo),
              link: link || '',
              fecha: fecha || '',
              fuente: fuente || 'Google News',
            });
            count++;
          }
        } catch (e) {
          console.log(`  ⚠️ Error en item de búsqueda: ${e.message}`);
        }
      }

      console.log(`✅ Web #${i + 1} (${query.substring(0, 40)}...): ${count} noticias`);

    } catch (e) {
      console.log(`❌ Web #${i + 1} (${query.substring(0, 40)}...) FALLÓ: ${e.message}`);
      // ← SIGUIENTE BÚSQUEDA
    }
  }

  console.log(`📊 Web Search total: ${items.length} noticias`);
  return items;
}

// ===================== FUNCIÓN COMBINADA =====================

async function obtenerTodasLasNoticias(env) {
  console.log('🚀 Iniciando recolección de noticias...');

  const [noticiasRSS, noticiasGDELT, noticiasWeb] = await Promise.allSettled([
    obtenerNoticiasRSS(env),
    obtenerNoticiasGDELT(env),
    obtenerNoticiasBusquedaWeb(env),
  ]);

  const todas = [];

  if (noticiasRSS.status === 'fulfilled') {
    todas.push(...noticiasRSS.value);
  } else {
    console.log(`❌ RSS falló completamente: ${noticiasRSS.reason}`);
  }

  if (noticiasGDELT.status === 'fulfilled') {
    todas.push(...noticiasGDELT.value);
  } else {
    console.log(`❌ GDELT falló completamente: ${noticiasGDELT.reason}`);
  }

  if (noticiasWeb.status === 'fulfilled') {
    todas.push(...noticiasWeb.value);
  } else {
    console.log(`❌ Web Search falló completamente: ${noticiasWeb.reason}`);
  }

  // Eliminar duplicados
  const vistos = new Set();
  const unicos = [];
  todas.forEach(item => {
    const key = item.titulo.toLowerCase().trim().substring(0, 80);
    if (!vistos.has(key)) {
      vistos.add(key);
      unicos.push(item);
    }
  });

  console.log(`📊 TOTAL ÚNICAS: ${unicos.length} noticias`);
  return unicos.slice(0, CONFIG.MAX_NOTICIAS_TOTAL);
}

// ===================== GENERAR RESUMEN CON GEMINI =====================

async function generarResumenConIA(noticias, env) {
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada. Revisa CONFIG.GEMINI_API_KEY');
  }

  const listaTexto = noticias
    .map((n, i) => `${i + 1}. ${n.titulo} (Fuente: ${n.fuente}) - ${n.link}`)
    .join('\n');

  const fechaHora = new Date().toLocaleString('es-ES', {
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const prompt = `
Eres un analista OSINT senior especializado en inteligencia geopolítica, análisis de medios y vigilancia de narrativas.

A partir de este listado de titulares de noticias del día, genera un resumen ejecutivo en español con este formato exacto:

═══════════════════════════════════════════════════════════════
📰 RESUMEN EJECUTIVO DE NOTICIAS - ${fechaHora} (UTC-4)
═══════════════════════════════════════════════════════════════

1️⃣ PANORAMA GENERAL DEL DÍA (máximo 8 líneas)
   - Síntesis de los eventos más relevantes
   - Tendencias detectadas en los medios
   - Cambios significativos en narrativas

2️⃣ CUBA Y RELACIONES BILATERALES
   📌 Noticias sobre política cubana, relaciones Cuba-EEUU, negociaciones, sanciones
   📌 Tema migratorio, campañas contra el estado cubano, figuras del estado
   📌 Marco Rubio, Donald Trump y política hacia Cuba
   📌 Empresas que buscan invertir o negociar en Cuba
   📌 Accidentes o eventos de desastre en Cuba

3️⃣ POLÍTICA INTERNA Y EXTERNA DE EEUU
   📌 Escándalos políticos, archivos Epstein, elecciones
   📌 Conflictos, problemas sociales, campañas políticas
   📌 Inmigración y política de Florida
   📌 Diáspora/exilio cubano en Florida, Texas, New Jersey

4️⃣ AMÉRICA LATINA
   📌 Conflictos políticos, crisis, elecciones, movimientos sociales
   📌 Relaciones intergubernamentales

5️⃣ CONFLICTOS GLOBALES
   📌 Ucrania-Rusia: avances, negociaciones, impacto global
   📌 Irán-EEUU-Israel: escaladas, diplomacia, operaciones militares
   📌 Oriente Medio: tensiones, acuerdos, desestabilización

6️⃣ TECNOLOGÍA, OSINT, IA Y CIBERSEGURIDAD
   📌 Nuevas herramientas OSINT y técnicas de investigación
   📌 Avances en IA, regulaciones, aplicaciones
   📌 Incidentes de ciberseguridad, amenazas, vulnerabilidades
   📌 Big Data en inteligencia y análisis

7️⃣ NOTICIAS DESTACADAS POR TEMA (agrupadas, máximo 10 puntos)
   - Cada punto con 2-3 líneas de contexto y el link

8️⃣ 🔍 SUGERENCIAS DE INVESTIGACIÓN OSINT (5-8 líneas)
   - Temas que merecen profundización
   - Justificación de por qué son relevantes
   - Posibles fuentes o ángulos de investigación
   - Conexiones entre noticias que sugieren patrones

9️⃣ 📊 MÉTRICAS DEL DÍA
   - Total de fuentes consultadas
   - Medios más activos
   - Temas dominantes

REGLAS:
- Sé objetivo, no tomes partido político
- Destaca información verificada vs. especulación
- Identifica posibles desinformación o narrativas coordinadas
- Señala lagunas informativas que podrían ser intencionales
- Usa emojis para mejorar legibilidad
- Incluye los links completos de cada noticia destacada

Titulares de hoy:
${listaTexto}
`;

  const url = `${CONFIG.GEMINI_URL}?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      topP: 0.8,
      topK: 40,
    },
  };

  const response = await fetchRobusto(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 3); // 3 reintentos para Gemini

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const json = await response.json();

  if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
    return json.candidates[0].content.parts[0].text;
  } else if (json.error) {
    throw new Error('Gemini API error: ' + JSON.stringify(json.error));
  } else {
    throw new Error('Respuesta inesperada de Gemini: ' + JSON.stringify(json));
  }
}

// ===================== ENVIAR EMAIL (RESEND API - FREE TIER) =====================

/**
 * Envía email usando Resend API (free tier: 100 emails/día).
 * 
 * VENTAJAS DEL PLAN FREE:
 * - No requiere Workers Paid ($0/mes)
 * - 100 emails/día gratis (~3,000/mes)
 * - Sin tarjeta de crédito para empezar
 * - SPF/DKIM/DMARC automático
 * - API key simple (Bearer token)
 * 
 * CONFIGURACIÓN:
 * 1. Crear cuenta en https://resend.com
 * 2. Verificar dominio o usar @resend.dev (instantáneo)
 * 3. Copiar API key
 * 4. Ejecutar: wrangler secret put EMAIL_API_KEY
 * 
 * LÍMITES FREE TIER:
 * - 100 emails/día
 * - Sin attachments
 * - Sin analytics avanzadas
 * - Sin custom domains (usa @resend.dev)
 * 
 * Para uso: 18 emails/día (3 envíos × 6 destinatarios) = cómodo en free tier
 */
async function enviarEmail(contenido, env) {
  const emailApiKey = CONFIG.RESEND_API_KEY;

  if (!emailApiKey) {
    console.log('⚠️ RESEND_API_KEY no configurada. Revisa CONFIG.RESEND_API_KEY');
    console.log('   Para configurar:');
    console.log('   API Key ya integrada en el código');
    console.log('   Si necesitas cambiarla, edita CONFIG.RESEND_API_KEY');
    console.log('   O usa: wrangler secret put EMAIL_API_KEY para sobreescribir');
    return { 
      enviados: 0, 
      fallidos: CONFIG.EMAILS_DESTINO.length, 
      error: 'EMAIL_API_KEY no configurada. Crea cuenta en resend.com (free tier)' 
    };
  }

  const fecha = new Date().toLocaleString('es-ES', {
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const subject = `📰 Resumen OSINT - ${fecha} (UTC-4)`;

  // Email de origen - Resend free tier usa @resend.dev
  // Puedes cambiar a tu dominio verificado si tienes uno
  const fromEmail = env.FROM_EMAIL || 'osint-resumen@resend.dev';

  const resultados = { enviados: 0, fallidos: 0, detalles: [] };

  for (const email of CONFIG.EMAILS_DESTINO) {
    try {
      const response = await fetchRobusto('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${emailApiKey}`,
        },
        body: JSON.stringify({
          from: `Sistema OSINT <${fromEmail}>`,
          to: [email],
          subject: subject,
          text: contenido,
        }),
      }, 2); // 2 reintentos para envío de email

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Email enviado a: ${email} (ID: ${data.id})`);
        resultados.enviados++;
        resultados.detalles.push({ email, status: 'ok', id: data.id });
      } else {
        const errorText = await response.text();
        console.log(`❌ Error enviando a ${email}: HTTP ${response.status} - ${errorText}`);
        resultados.fallidos++;
        resultados.detalles.push({ email, status: 'error', error: errorText });
      }
    } catch (e) {
      console.log(`❌ Error enviando a ${email}: ${e.message}`);
      resultados.fallidos++;
      resultados.detalles.push({ email, status: 'error', error: e.message });
    }
  }

  return resultados;
}


// ===================== FUNCIÓN PRINCIPAL =====================

async function ejecutarResumenCompleto(env) {
  const inicio = Date.now();
  const executionId = generarIdUnico();

  console.log(`[${executionId}] 🚀 INICIANDO EJECUCIÓN COMPLETA`);

  try {
    // 1. Obtener noticias
    const noticias = await obtenerTodasLasNoticias(env);

    if (noticias.length === 0) {
      console.log(`[${executionId}] ⚠️ No se encontraron noticias.`);
      return { success: false, error: 'Sin noticias', executionId };
    }

    console.log(`[${executionId}] 📰 ${noticias.length} noticias obtenidas`);

    // 2. Generar resumen con IA
    console.log(`[${executionId}] 🤖 Generando resumen con Gemini...`);
    const resumen = await generarResumenConIA(noticias, env);
    console.log(`[${executionId}] ✅ Resumen generado (${resumen.length} caracteres)`);

    // 3. Enviar email
    console.log(`[${executionId}] 📧 Enviando emails...`);
    const emailResult = await enviarEmail(resumen, env);
    console.log(`[${executionId}] 📧 Emails: ${emailResult.enviados} enviados, ${emailResult.fallidos} fallidos`);

    const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`[${executionId}] ✅ COMPLETADO en ${duracion}s`);

    return {
      success: true,
      executionId,
      duracionSegundos: parseFloat(duracion),
      noticias: noticias.length,
      emailsEnviados: emailResult.enviados,
      emailsFallidos: emailResult.fallidos,
      resumenPreview: resumen.substring(0, 200) + '...',
    };

  } catch (e) {
    const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`[${executionId}] ❌ ERROR en ejecución: ${e.message}`);
    console.log(`[${executionId}] Stack: ${e.stack}`);

    return {
      success: false,
      executionId,
      duracionSegundos: parseFloat(duracion),
      error: e.message,
      stack: e.stack,
    };
  }
}

// ===================== ENDPOINTS HTTP PARA DISPARAR DESDE NAVEGADOR =====================

/**
 * Endpoints disponibles (todos GET para facilitar uso desde navegador):
 * 
 * /              → Dashboard HTML con botones
 * /run           → Ejecutar resumen completo (RSS + GDELT + Web + Gemini + Email)
 * /run/rss       → Solo obtener noticias RSS
 * /run/gdelt     → Solo obtener noticias GDELT
 * /run/web       → Solo obtener noticias Web Search
 * /run/gemini    → Solo generar resumen con Gemini (requiere ?noticias=...)
 * /run/email     → Solo enviar email (requiere ?contenido=...)
 * /status        → Estado del worker y configuración
 * /test          → Test de conectividad
 */

function generarDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎯 OSINT News Aggregator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh; color: #e0e0e0; padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 10px; font-size: 2.2em; }
    .subtitle { text-align: center; color: #8892b0; margin-bottom: 30px; }
    .card { 
      background: rgba(255,255,255,0.05); 
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 24px; margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }
    .card h2 { color: #64ffda; margin-bottom: 16px; font-size: 1.3em; }
    .btn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .btn { 
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border: none; border-radius: 12px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; text-decoration: none; color: white;
    }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }
    .btn-success { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(17,153,142,0.4); }
    .btn-warning { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .btn-warning:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(240,147,251,0.4); }
    .btn-info { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .btn-info:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(79,172,254,0.4); }
    .status-badge { 
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; margin: 2px;
    }
    .status-ok { background: #00c853; color: #000; }
    .status-warn { background: #ffd600; color: #000; }
    .status-info { background: #2962ff; color: #fff; }
    .destinatarios { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .destinatario { 
      background: rgba(100,255,218,0.1); border: 1px solid rgba(100,255,218,0.3);
      padding: 6px 14px; border-radius: 20px; font-size: 13px;
    }
    .cron-info { 
      background: rgba(255,214,0,0.1); border: 1px solid rgba(255,214,0,0.3);
      padding: 16px; border-radius: 12px; margin-top: 16px;
    }
    .cron-info h3 { color: #ffd600; margin-bottom: 8px; }
    .feeds-list { 
      max-height: 200px; overflow-y: auto; 
      background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;
      font-family: monospace; font-size: 12px; line-height: 1.6;
    }
    .feeds-list::-webkit-scrollbar { width: 6px; }
    .feeds-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
    .loading { display: none; text-align: center; padding: 20px; }
    .loading.active { display: block; }
    .spinner { 
      width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #64ffda; border-radius: 50%;
      animation: spin 1s linear infinite; margin: 0 auto 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #resultado { 
      margin-top: 16px; padding: 16px; border-radius: 12px;
      background: rgba(0,0,0,0.3); font-family: monospace; font-size: 13px;
      white-space: pre-wrap; display: none; max-height: 400px; overflow-y: auto;
    }
    #resultado.active { display: block; }
    .footer { text-align: center; margin-top: 30px; color: #8892b0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 OSINT News Aggregator</h1>
    <p class="subtitle">Inteligencia automatizada con Gemini AI | Cloudflare Worker</p>

    <div class="card">
      <h2>🚀 Ejecutar desde Navegador</h2>
      <div class="btn-grid">
        <a href="/run" class="btn btn-primary" onclick="return ejecutar(this)">📰 Resumen Completo</a>
        <a href="/run/rss" class="btn btn-success" onclick="return ejecutar(this)">📡 Solo RSS</a>
        <a href="/run/gdelt" class="btn btn-success" onclick="return ejecutar(this)">🌍 Solo GDELT</a>
        <a href="/run/web" class="btn btn-success" onclick="return ejecutar(this)">🔍 Solo Web Search</a>
        <a href="/status" class="btn btn-info">📊 Estado del Sistema</a>
        <a href="/test" class="btn btn-warning">🧪 Test de Conectividad</a>
      </div>
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Ejecutando... esto puede tomar 30-60 segundos</p>
      </div>
      <pre id="resultado"></pre>
    </div>

    <div class="card">
      <h2>📧 Destinatarios Configurados (${CONFIG.EMAILS_DESTINO.length})</h2>
      <div class="destinatarios">
        ${CONFIG.EMAILS_DESTINO.map(e => `<span class="destinatario">${e}</span>`).join('')}
      </div>
    </div>

    <div class="card">
      <h2>⏰ Programación Automática (Cron)</h2>
      <div class="cron-info">
        <h3>🕐 7:00 AM | 🕐 1:00 PM | 🕐 7:00 PM (UTC-4)</h3>
        <p>Se ejecuta automáticamente sin intervención. También puedes disparar manualmente con los botones de arriba.</p>
        <p><strong>Cron expressions:</strong> <code>0 11 * * *</code>, <code>0 17 * * *</code>, <code>0 23 * * *</code> (UTC)</p>
      </div>
    </div>

    <div class="card">
      <h2>📡 Fuentes RSS Configuradas (${TODOS_LOS_FEEDS.length})</h2>
      <div class="feeds-list">
        ${TODOS_LOS_FEEDS.map((f, i) => `${i + 1}. ${f}`).join('<br>')}
      </div>
    </div>

    <div class="footer">
      <p>OSINT News Aggregator v1.0 | Cloudflare Workers | Gemini AI | Resend Email</p>
      <p>Desarrollado para análisis de inteligencia geopolítica</p>
    </div>
  </div>

  <script>
    async function ejecutar(link) {
      const loading = document.getElementById('loading');
      const resultado = document.getElementById('resultado');
      loading.classList.add('active');
      resultado.classList.remove('active');
      resultado.textContent = '';

      try {
        const response = await fetch(link.href);
        const data = await response.json();
        resultado.textContent = JSON.stringify(data, null, 2);
        resultado.classList.add('active');
      } catch (e) {
        resultado.textContent = 'Error: ' + e.message;
        resultado.classList.add('active');
      } finally {
        loading.classList.remove('active');
      }
      return false;
    }
  </script>
</body>
</html>`;
}

// ===================== HANDLER PRINCIPAL =====================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers para peticiones desde cualquier origen
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ─── DASHBOARD HTML ───
      if (path === '/' || path === '/index.html') {
        return new Response(generarDashboardHTML(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        });
      }

      // ─── EJECUTAR RESUMEN COMPLETO ───
      if (path === '/run') {
        const resultado = await ejecutarResumenCompleto(env);
        return new Response(JSON.stringify(resultado, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: resultado.success ? 200 : 500,
        });
      }

      // ─── SOLO RSS ───
      if (path === '/run/rss') {
        const noticias = await obtenerNoticiasRSS(env);
        return new Response(JSON.stringify({
          success: true,
          fuente: 'RSS',
          total: noticias.length,
          noticias: noticias,
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ─── SOLO GDELT ───
      if (path === '/run/gdelt') {
        const noticias = await obtenerNoticiasGDELT(env);
        return new Response(JSON.stringify({
          success: true,
          fuente: 'GDELT',
          total: noticias.length,
          noticias: noticias,
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ─── SOLO WEB SEARCH ───
      if (path === '/run/web') {
        const noticias = await obtenerNoticiasBusquedaWeb(env);
        return new Response(JSON.stringify({
          success: true,
          fuente: 'Web Search',
          total: noticias.length,
          noticias: noticias,
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ─── ESTADO DEL SISTEMA ───
      if (path === '/status') {
        const geminiConfigured = !!CONFIG.GEMINI_API_KEY;
        const emailConfigured = !!CONFIG.RESEND_API_KEY;

        return new Response(JSON.stringify({
          success: true,
          worker: 'osint-news-aggregator',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          configuracion: {
            gemini_api: geminiConfigured ? '✅ Configurada' : '❌ No configurada (wrangler secret put GEMINI_API_KEY)',
            email_api: emailConfigured ? '✅ Configurada' : '❌ No configurada (wrangler secret put EMAIL_API_KEY)',
            destinatarios: CONFIG.EMAILS_DESTINO.length,
            feeds_rss: TODOS_LOS_FEEDS.length,
            cron_triggers: ['7:00 AM', '1:00 PM', '7:00 PM (UTC-4)'],
          },
          endpoints: {
            '/': 'Dashboard HTML',
            '/run': 'Ejecutar resumen completo',
            '/run/rss': 'Solo obtener RSS',
            '/run/gdelt': 'Solo obtener GDELT',
            '/run/web': 'Solo obtener Web Search',
            '/status': 'Estado del sistema',
            '/test': 'Test de conectividad',
          },
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ─── TEST DE CONECTIVIDAD ───
      if (path === '/test') {
        const tests = [];

        // Test Gemini
        try {
          const geminiTest = await fetchRobusto(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${CONFIG.GEMINI_API_KEY}`,
            {}, 1
          );
          tests.push({ servicio: 'Gemini API', status: geminiTest.ok ? '✅ OK' : '⚠️ Respuesta ' + geminiTest.status });
        } catch (e) {
          tests.push({ servicio: 'Gemini API', status: '❌ Error: ' + e.message });
        }

        // Test RSS
        try {
          const rssTest = await fetchRobusto('https://feeds.bbci.co.uk/news/world/rss.xml', {}, 1);
          tests.push({ servicio: 'RSS (BBC)', status: rssTest.ok ? '✅ OK' : '⚠️ ' + rssTest.status });
        } catch (e) {
          tests.push({ servicio: 'RSS (BBC)', status: '❌ Error: ' + e.message });
        }

        // Test GDELT
        try {
          const gdeltTest = await fetchRobusto(
            'https://api.gdeltproject.org/api/v2/doc/doc?query=Cuba&mode=ArtList&maxrecords=1&format=json',
            {}, 1
          );
          tests.push({ servicio: 'GDELT API', status: gdeltTest.ok ? '✅ OK' : '⚠️ ' + gdeltTest.status });
        } catch (e) {
          tests.push({ servicio: 'GDELT API', status: '❌ Error: ' + e.message });
        }

        // Test Email
        try {
          const emailTest = await fetchRobusto('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}` },
            body: JSON.stringify({}),
          }, 1);
          tests.push({ servicio: 'Resend Email', status: emailTest.ok ? '✅ OK' : '⚠️ Auth requerida (' + emailTest.status + ')' });
        } catch (e) {
          tests.push({ servicio: 'Resend Email', status: '❌ Error: ' + e.message });
        }

        return new Response(JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          tests: tests,
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ─── 404 ───
      return new Response(JSON.stringify({
        success: false,
        error: 'Endpoint no encontrado',
        endpoints_disponibles: ['/', '/run', '/run/rss', '/run/gdelt', '/run/web', '/status', '/test'],
      }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (e) {
      console.error('Error en handler:', e);
      return new Response(JSON.stringify({
        success: false,
        error: e.message,
        stack: e.stack,
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },

  // ===================== CRON TRIGGER =====================
  async scheduled(event, env, ctx) {
    console.log(`⏰ Cron trigger ejecutado: ${event.cron} (${new Date().toISOString()})`);

    // Ejecutar el resumen completo
    const resultado = await ejecutarResumenCompleto(env);

    console.log(`⏰ Cron finalizado: ${JSON.stringify(resultado)}`);

    // Guardar log en KV si está disponible (opcional)
    if (env.OSINT_LOGS) {
      try {
        await env.OSINT_LOGS.put(
          `log-${Date.now()}`,
          JSON.stringify({ cron: event.cron, ...resultado, timestamp: new Date().toISOString() })
        );
      } catch (e) {
        console.log('No se pudo guardar log en KV:', e.message);
      }
    }
  },
};
