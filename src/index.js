// ═══════════════════════════════════════════════════════════════════════════════
//  OSINT NEWS AGGREGATOR - Cloudflare Worker
//  Agrega noticias de RSS, GDELT, Web Search y genera resumen con Gemini AI
//  Envía por email a múltiples destinatarios 3 veces al día (7am, 1pm, 7pm UTC-4)
// ═══════════════════════════════════════════════════════════════════════════════

// ===================== CONFIGURACIÓN =====================
// Las API keys se leen SIEMPRE desde env/secrets. Aliases soportados:
//   Gemini: GEMINI_API_KEY | GEMINI_KEY | GOOGLE_AI_API_KEY
//   Email:  EMAIL_API_KEY | RESEND_API_KEY
function obtenerApiKey(env, nombres) {
  if (!env) return undefined;
  for (const n of nombres) {
    if (env[n]) return env[n];
  }
  return undefined;
}

const CONFIG = {
  GEMINI_MODEL: 'gemini-2.0-flash',
  GEMINI_URL:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

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
  FETCH_TIMEOUT_MS: 8000,
  MAX_FETCH_RETRIES: 1,
  MAX_CONCURRENCIA: 8,
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
  'https://news.google.com/rss/search?q=EEUU+elecciones+campanas&hl=es&gl=US&ceid=US:es',
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
  ...FEEDS_CUBA_TEMATICOS,
];

// ===================== UTILIDADES =====================

const USER_AGENT_BROWSER =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

function normalizarUrl(url) {
  try {
    return new URL(url).toString();
  } catch {
    // Si tiene caracteres no-ASCII sin codificar, hacemos una codificación best-effort
    return encodeURI(url);
  }
}

async function fetchRobusto(url, options, retries) {
  options = options || {};
  if (retries === undefined) retries = CONFIG.MAX_FETCH_RETRIES;
  const urlFinal = normalizarUrl(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, CONFIG.FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(urlFinal, {
      method: options.method || 'GET',
      body: options.body || undefined,
      signal: controller.signal,
      headers: Object.assign(
        {
          'User-Agent': USER_AGENT_BROWSER,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        },
        options.headers || {}
      ),
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
      console.log('[REINTENTO] ' + urlFinal.substring(0, 80) + ' (' + retries + ' restantes)');
      await sleep(800 * (CONFIG.MAX_FETCH_RETRIES - retries + 1));
      return fetchRobusto(urlFinal, options, retries - 1);
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function mapConcurrente(arr, limite, fn) {
  const resultados = new Array(arr.length);
  let i = 0;
  const n = Math.min(limite, arr.length);
  const workers = new Array(n).fill(0).map(async function () {
    while (true) {
      const idx = i++;
      if (idx >= arr.length) return;
      try {
        resultados[idx] = { status: 'fulfilled', value: await fn(arr[idx], idx) };
      } catch (e) {
        resultados[idx] = { status: 'rejected', reason: e };
      }
    }
  });
  await Promise.all(workers);
  return resultados;
}

function limpiarTexto(texto) {
  if (!texto) return '';
  return String(texto)
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
  try { return new URL(url).hostname; } catch { return url; }
}

function generarIdUnico() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===================== PARSER XML =====================
// Usa DOMParser nativo si está disponible; si no, un extractor por regex.

let _domParserDisponible = null;

function domParserDisponible() {
  if (_domParserDisponible !== null) return _domParserDisponible;
  // @ts-ignore
  if (typeof DOMParser === 'undefined') {
    _domParserDisponible = false;
    return false;
  }
  try {
    // @ts-ignore
    const p = new DOMParser();
    const d = p.parseFromString('<a><b>x</b></a>', 'application/xml');
    if (d.querySelector('parsererror')) throw new Error('pe');
    _domParserDisponible = true;
    return true;
  } catch {
    _domParserDisponible = false;
    return false;
  }
}

function parseXML(xmlText) {
  if (!domParserDisponible()) {
    return { _fallback: true, raw: xmlText };
  }
  try {
    // @ts-ignore
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return { _fallback: true, raw: xmlText };
    }
    return doc;
  } catch {
    return { _fallback: true, raw: xmlText };
  }
}

// Regex reutilizables (construidos una sola vez, evita problemas de escape en templates)
var RE_ITEM_RSS = /<item[\s>][\s\S]*?<\/item>/gi;
var RE_ITEM_ATOM = /<entry[\s>][\s\S]*?<\/entry>/gi;
var RE_IS_ATOM = /<feed[\s>]/i;

function _campo(blk, tag) {
  // <tag>texto</tag> o <tag><![CDATA[texto]]></tag>
  var re = new RegExp(
    '<' + tag + '(?:[\\s][^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>',
    'i'
  );
  var m = blk.match(re);
  if (m) return m[1].trim();
  // <link href="..."/>
  var reAttr = new RegExp('<' + tag + '[^>]*href=["\']([^"\']+)["\']', 'i');
  var ma = blk.match(reAttr);
  return ma ? ma[1].trim() : '';
}

function extraerItemsRSS(doc, maxItems) {
  var items = [];

  if (doc && doc._fallback) {
    var raw = doc.raw;
    var esAtom = RE_IS_ATOM.test(raw);
    var reItems = esAtom ? RE_ITEM_ATOM : RE_ITEM_RSS;
    var matches = raw.match(reItems) || [];
    var limit = Math.min(matches.length, maxItems);
    for (var i = 0; i < limit; i++) {
      var blk = matches[i];
      var titulo = _campo(blk, 'title');
      var link = _campo(blk, 'link');
      var fecha = _campo(blk, esAtom ? 'published' : 'pubDate') || _campo(blk, 'updated');
      var fuente = _campo(blk, 'source') || _campo(blk, 'dc:creator');
      if (esAtom && !fuente) fuente = _campo(blk, 'name');
      if (titulo && titulo.trim().length > 0) {
        items.push({
          titulo: limpiarTexto(titulo),
          link: (link || '').trim(),
          fecha: (fecha || '').trim(),
          fuente: (fuente || 'N/D').trim(),
        });
      }
    }
    return items;
  }

  var entries = doc.querySelectorAll('item');
  if (entries.length === 0) entries = doc.querySelectorAll('entry');
  var l = Math.min(entries.length, maxItems);
  for (var j = 0; j < l; j++) {
    var entry = entries[j];
    try {
      var t, lk, fe, fu;
      var tag = entry.tagName ? entry.tagName.toLowerCase() : '';
      if (tag === 'entry') {
        t = entry.querySelector('title') ? entry.querySelector('title').textContent : '';
        var linkEl = entry.querySelector('link');
        lk = linkEl ? linkEl.getAttribute('href') || linkEl.textContent : '';
        fe =
          (entry.querySelector('published') && entry.querySelector('published').textContent) ||
          (entry.querySelector('updated') && entry.querySelector('updated').textContent) ||
          '';
        var authorName = entry.querySelector('author > name');
        fu =
          (authorName && authorName.textContent) ||
          (entry.querySelector('author') && entry.querySelector('author').textContent) ||
          '';
      } else {
        t = entry.querySelector('title') ? entry.querySelector('title').textContent : '';
        lk = entry.querySelector('link') ? entry.querySelector('link').textContent : '';
        fe = entry.querySelector('pubDate') ? entry.querySelector('pubDate').textContent : '';
        fu = entry.querySelector('source') ? entry.querySelector('source').textContent : '';
      }
      if (t && t.trim().length > 0) {
        items.push({
          titulo: limpiarTexto(t),
          link: (lk || '').trim(),
          fecha: (fe || '').trim(),
          fuente: (fu || 'N/D').trim(),
        });
      }
    } catch (e) {
      console.log('[WARN] Error procesando item RSS: ' + e.message);
    }
  }
  return items;
}

// ===================== OBTENER NOTICIAS RSS =====================
async function obtenerNoticiasRSS() {
  var items = [];
  var feedsExitosos = 0;
  var feedsFallidos = 0;

  var resultados = await mapConcurrente(TODOS_LOS_FEEDS, CONFIG.MAX_CONCURRENCIA, async function (
    url
  ) {
    var response = await fetchRobusto(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var contentText = await response.text();
    if (!contentText || contentText.length < 50) {
      throw new Error('Contenido vacío o demasiado corto');
    }
    var doc = parseXML(contentText);
    var feedItems = extraerItemsRSS(doc, CONFIG.MAX_ITEMS_POR_FEED);
    if (feedItems.length === 0) throw new Error('Sin entradas RSS/Atom');
    feedItems.forEach(function (item) {
      if (!item.fuente || item.fuente === 'N/D') item.fuente = extraerDominio(url);
    });
    return { url: url, feedItems: feedItems };
  });

  for (var i = 0; i < resultados.length; i++) {
    var r = resultados[i];
    var url = TODOS_LOS_FEEDS[i];
    if (r.status === 'fulfilled') {
      items.push.apply(items, r.value.feedItems);
      feedsExitosos++;
      console.log(
        '✅ Feed #' +
          (i + 1) +
          ' OK: ' +
          r.value.feedItems.length +
          ' noticias | ' +
          url.substring(0, 60) +
          '...'
      );
    } else {
      feedsFallidos++;
      console.log(
        '❌ Feed #' +
          (i + 1) +
          ' FALLÓ: ' +
          url.substring(0, 70) +
          '... -> ' +
          r.reason.message
      );
    }
  }

  console.log(
    '📊 RSS: ' + feedsExitosos + ' exitosos, ' + feedsFallidos + ' fallidos, ' + items.length + ' noticias'
  );
  return items;
}

// ===================== GDELT =====================
async function obtenerNoticiasGDELT() {
  var items = [];
  var temas = [
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
    'artificial intelligence',
  ];

  var resultados = await mapConcurrente(temas, 6, async function (tema) {
    var q = encodeURIComponent('"' + tema + '" sourcelang:english');
    var url =
      'https://api.gdeltproject.org/api/v2/doc/doc?query=' +
      q +
      '&mode=ArtList&maxrecords=10&format=json&timespan=12h';
    var response = await fetchRobusto(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var text = await response.text();
    var data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Respuesta no es JSON (posible rate-limit HTML)');
    }
    var articulos = data.articles && Array.isArray(data.articles) ? data.articles : [];
    return { tema: tema, articulos: articulos };
  });

  for (var i = 0; i < resultados.length; i++) {
    var r = resultados[i];
    var tema = temas[i];
    if (r.status === 'fulfilled') {
      r.value.articulos.forEach(function (article) {
        if (article.title) {
          items.push({
            titulo: limpiarTexto(article.title),
            link: article.url || '',
            fecha: article.seendate || '',
            fuente: article.domain || 'GDELT',
          });
        }
      });
      console.log('✅ GDELT tema #' + (i + 1) + ' (' + tema + '): ' + r.value.articulos.length + ' artículos');
    } else {
      console.log('❌ GDELT tema #' + (i + 1) + ' (' + tema + ') FALLÓ: ' + r.reason.message);
    }
  }

  console.log('📊 GDELT total: ' + items.length + ' noticias');
  return items;
}

// ===================== WEB SEARCH =====================
async function obtenerNoticiasBusquedaWeb() {
  var items = [];
  var busquedas = [
    'Cuba news',
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
    'site:periodicocubano.com',
    'site:granma.cu',
    'site:cubadebate.cu',
    'Marco Rubio Cuba',
    'Donald Trump Cuba policy',
    'Cuba migration Florida',
    'Cuban exile diaspora',
    'Epstein files',
    'Ukraine Russia war latest',
    'Iran Israel conflict latest',
    'OSINT tools news',
    'cybersecurity news',
    'artificial intelligence news',
  ];

  var resultados = await mapConcurrente(busquedas, 8, async function (query) {
    var url =
      'https://news.google.com/rss/search?q=' +
      encodeURIComponent(query) +
      '&hl=es&gl=US&ceid=US:es';
    var response = await fetchRobusto(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var text = await response.text();
    var doc = parseXML(text);
    if (!doc._fallback) {
      var channel = doc.querySelector('channel');
      if (!channel) throw new Error('Sin canal RSS');
    }
    var encontrados = extraerItemsRSS(doc, 3).map(function (it) {
      return {
        titulo: it.titulo,
        link: it.link,
        fecha: it.fecha,
        fuente: it.fuente === 'N/D' ? 'Google News' : it.fuente,
      };
    });
    if (encontrados.length === 0) throw new Error('Sin items parseables en RSS de búsqueda');
    return { query: query, encontrados: encontrados };
  });

  for (var i = 0; i < resultados.length; i++) {
    var r = resultados[i];
    var query = busquedas[i];
    if (r.status === 'fulfilled') {
      items.push.apply(items, r.value.encontrados);
      console.log(
        '✅ Web #' +
          (i + 1) +
          ' (' +
          query.substring(0, 40) +
          '...): ' +
          r.value.encontrados.length +
          ' noticias'
      );
    } else {
      console.log(
        '❌ Web #' + (i + 1) + ' (' + query.substring(0, 40) + '...) FALLÓ: ' + r.reason.message
      );
    }
  }

  console.log('📊 Web Search total: ' + items.length + ' noticias');
  return items;
}

// ===================== FUNCIÓN COMBINADA =====================
async function obtenerTodasLasNoticias() {
  console.log('🚀 Iniciando recolección de noticias...');

  var res = await Promise.allSettled([
    obtenerNoticiasRSS(),
    obtenerNoticiasGDELT(),
    obtenerNoticiasBusquedaWeb(),
  ]);
  var resRSS = res[0];
  var resGDELT = res[1];
  var resWeb = res[2];

  var diagnostico = {
    rss: resRSS.status === 'fulfilled' ? resRSS.value.length : 'FAIL: ' + (resRSS.reason && resRSS.reason.message ? resRSS.reason.message : ''),
    gdelt: resGDELT.status === 'fulfilled' ? resGDELT.value.length : 'FAIL: ' + (resGDELT.reason && resGDELT.reason.message ? resGDELT.reason.message : ''),
    web: resWeb.status === 'fulfilled' ? resWeb.value.length : 'FAIL: ' + (resWeb.reason && resWeb.reason.message ? resWeb.reason.message : ''),
    domparser: domParserDisponible() ? 'disponible' : 'NO disponible (usa fallback regex)',
  };

  var todas = [];
  if (resRSS.status === 'fulfilled') todas.push.apply(todas, resRSS.value);
  else console.log('❌ RSS falló completamente: ' + resRSS.reason);
  if (resGDELT.status === 'fulfilled') todas.push.apply(todas, resGDELT.value);
  else console.log('❌ GDELT falló completamente: ' + resGDELT.reason);
  if (resWeb.status === 'fulfilled') todas.push.apply(todas, resWeb.value);
  else console.log('❌ Web Search falló completamente: ' + resWeb.reason);

  var vistos = new Set();
  var unicos = [];
  todas.forEach(function (item) {
    var key = item.titulo.toLowerCase().trim().substring(0, 80);
    if (!vistos.has(key)) {
      vistos.add(key);
      unicos.push(item);
    }
  });

  console.log('📊 TOTAL ÚNICAS: ' + unicos.length + ' noticias | detalle=', diagnostico);
  return { noticias: unicos.slice(0, CONFIG.MAX_NOTICIAS_TOTAL), diagnostico: diagnostico };
}

// ===================== GEMINI =====================
async function generarResumenConIA(noticias, env) {
  var apiKey = obtenerApiKey(env, ['GEMINI_API_KEY', 'GEMINI_KEY', 'GOOGLE_AI_API_KEY']);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada. Usa: wrangler secret put GEMINI_API_KEY');
  }

  var listaTexto = noticias
    .map(function (n, i) {
      return i + 1 + '. ' + n.titulo + ' (Fuente: ' + n.fuente + ') - ' + n.link;
    })
    .join('\n');

  var fechaHora = new Date().toLocaleString('es-ES', {
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  var prompt =
    '\nEres un analista OSINT senior especializado en inteligencia geopolítica, análisis de medios y vigilancia de narrativas.\n\n' +
    'A partir de este listado de titulares de noticias del día, genera un resumen ejecutivo en español con este formato exacto:\n\n' +
    '═══════════════════════════════════════════════════════════════\n' +
    '📰 RESUMEN EJECUTIVO DE NOTICIAS - ' +
    fechaHora +
    ' (UTC-4)\n' +
    '═══════════════════════════════════════════════════════════════\n\n' +
    '1️⃣ PANORAMA GENERAL DEL DÍA (máximo 8 líneas)\n' +
    '   - Síntesis de los eventos más relevantes\n' +
    '   - Tendencias detectadas en los medios\n' +
    '   - Cambios significativos en narrativas\n\n' +
    '2️⃣ CUBA Y RELACIONES BILATERALES\n' +
    '   📌 Noticias sobre política cubana, relaciones Cuba-EEUU, negociaciones, sanciones\n' +
    '   📌 Tema migratorio, campañas contra el estado cubano, figuras del estado\n' +
    '   📌 Marco Rubio, Donald Trump y política hacia Cuba\n' +
    '   📌 Empresas que buscan invertir o negociar en Cuba\n' +
    '   📌 Accidentes o eventos de desastre en Cuba\n\n' +
    '3️⃣ POLÍTICA INTERNA Y EXTERNA DE EEUU\n' +
    '   📌 Escándalos políticos, archivos Epstein, elecciones\n' +
    '   📌 Conflictos, problemas sociales, campañas políticas\n' +
    '   📌 Inmigración y política de Florida\n' +
    '   📌 Diáspora/exilio cubano en Florida, Texas, New Jersey\n\n' +
    '4️⃣ AMÉRICA LATINA\n' +
    '   📌 Conflictos políticos, crisis, elecciones, movimientos sociales\n' +
    '   📌 Relaciones intergubernamentales\n\n' +
    '5️⃣ CONFLICTOS GLOBALES\n' +
    '   📌 Ucrania-Rusia: avances, negociaciones, impacto global\n' +
    '   📌 Irán-EEUU-Israel: escaladas, diplomacia, operaciones militares\n' +
    '   📌 Oriente Medio: tensiones, acuerdos, desestabilización\n\n' +
    '6️⃣ TECNOLOGÍA, OSINT, IA Y CIBERSEGURIDAD\n' +
    '   📌 Nuevas herramientas OSINT y técnicas de investigación\n' +
    '   📌 Avances en IA, regulaciones, aplicaciones\n' +
    '   📌 Incidentes de ciberseguridad, amenazas, vulnerabilidades\n' +
    '   📌 Big Data en inteligencia y análisis\n\n' +
    '7️⃣ NOTICIAS DESTACADAS POR TEMA (agrupadas, máximo 10 puntos)\n' +
    '   - Cada punto con 2-3 líneas de contexto y el link\n\n' +
    '8️⃣ 🔍 SUGERENCIAS DE INVESTIGACIÓN OSINT (5-8 líneas)\n' +
    '   - Temas que merecen profundización\n' +
    '   - Justificación de por qué son relevantes\n' +
    '   - Posibles fuentes o ángulos de investigación\n' +
    '   - Conexiones entre noticias que sugieren patrones\n\n' +
    '9️⃣ 📊 MÉTRICAS DEL DÍA\n' +
    '   - Total de fuentes consultadas\n' +
    '   - Medios más activos\n' +
    '   - Temas dominantes\n\n' +
    'REGLAS:\n' +
    '- Sé objetivo, no tomes partido político\n' +
    '- Destaca información verificada vs. especulación\n' +
    '- Identifica posibles desinformación o narrativas coordinadas\n' +
    '- Señala lagunas informativas que podrían ser intencionales\n' +
    '- Usa emojis para mejorar legibilidad\n' +
    '- Incluye los links completos de cada noticia destacada\n\n' +
    'Titulares de hoy:\n' +
    listaTexto +
    '\n';

  var url = CONFIG.GEMINI_URL + '?key=' + apiKey;
  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192, topP: 0.8, topK: 40 },
  };

  var response = await fetchRobusto(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    3
  );

  if (!response.ok) {
    var errText = await response.text();
    throw new Error('Gemini API error ' + response.status + ': ' + errText);
  }
  var json = await response.json();
  if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text) {
    return json.candidates[0].content.parts[0].text;
  } else if (json.error) {
    throw new Error('Gemini API error: ' + JSON.stringify(json.error));
  } else {
    throw new Error('Respuesta inesperada de Gemini: ' + JSON.stringify(json));
  }
}

// ===================== ENVIAR EMAIL (RESEND) =====================
async function enviarEmail(contenido, env) {
  var emailApiKey = obtenerApiKey(env, ['EMAIL_API_KEY', 'RESEND_API_KEY']);
  if (!emailApiKey) {
    console.log('⚠️ EMAIL_API_KEY / RESEND_API_KEY no configurada.');
    console.log('   Configura con: wrangler secret put EMAIL_API_KEY');
    return {
      enviados: 0,
      fallidos: CONFIG.EMAILS_DESTINO.length,
      error:
        'EMAIL_API_KEY no configurada. Crea cuenta en resend.com (free tier) y ejecuta: wrangler secret put EMAIL_API_KEY',
    };
  }

  var fecha = new Date().toLocaleString('es-ES', {
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  var subject = '📰 Resumen OSINT - ' + fecha + ' (UTC-4)';
  var fromEmail = (env && env.FROM_EMAIL) || 'osint-resumen@resend.dev';

  var resultados = { enviados: 0, fallidos: 0, detalles: [] };

  for (var k = 0; k < CONFIG.EMAILS_DESTINO.length; k++) {
    var email = CONFIG.EMAILS_DESTINO[k];
    try {
      var resp = await fetchRobusto(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + emailApiKey,
          },
          body: JSON.stringify({
            from: 'Sistema OSINT <' + fromEmail + '>',
            to: [email],
            subject: subject,
            text: contenido,
          }),
        },
        2
      );
      if (resp.ok) {
        var data = await resp.json();
        console.log('✅ Email enviado a: ' + email + ' (ID: ' + data.id + ')');
        resultados.enviados++;
        resultados.detalles.push({ email: email, status: 'ok', id: data.id });
      } else {
        var et = await resp.text();
        console.log('❌ Error enviando a ' + email + ': HTTP ' + resp.status + ' - ' + et);
        resultados.fallidos++;
        resultados.detalles.push({ email: email, status: 'error', error: et });
      }
    } catch (e) {
      console.log('❌ Error enviando a ' + email + ': ' + e.message);
      resultados.fallidos++;
      resultados.detalles.push({ email: email, status: 'error', error: e.message });
    }
  }
  return resultados;
}

// ===================== FUNCIÓN PRINCIPAL =====================
async function ejecutarResumenCompleto(env) {
  var inicio = Date.now();
  var executionId = generarIdUnico();
  console.log('[' + executionId + '] 🚀 INICIANDO EJECUCIÓN COMPLETA');

  try {
    var recolectado = await obtenerTodasLasNoticias();
    var noticias = recolectado.noticias;
    var diagnostico = recolectado.diagnostico;

    if (noticias.length === 0) {
      console.log('[' + executionId + '] ⚠️ No se encontraron noticias. Detalle:', diagnostico);
      return {
        success: false,
        error: 'Sin noticias',
        executionId: executionId,
        detalle_fuentes: diagnostico,
        tip:
          'Prueba /test para revisar conectividad, /run/rss /run/gdelt /run/web por separado, y /status para ver API keys.',
      };
    }

    console.log('[' + executionId + '] 📰 ' + noticias.length + ' noticias obtenidas');
    console.log('[' + executionId + '] 🤖 Generando resumen con Gemini...');
    var resumen = await generarResumenConIA(noticias, env);
    console.log('[' + executionId + '] ✅ Resumen generado (' + resumen.length + ' caracteres)');

    console.log('[' + executionId + '] 📧 Enviando emails...');
    var emailResult = await enviarEmail(resumen, env);
    console.log(
      '[' +
        executionId +
        '] 📧 Emails: ' +
        emailResult.enviados +
        ' enviados, ' +
        emailResult.fallidos +
        ' fallidos'
    );

    var duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log('[' + executionId + '] ✅ COMPLETADO en ' + duracion + 's');

    return {
      success: true,
      executionId: executionId,
      duracionSegundos: parseFloat(duracion),
      noticias: noticias.length,
      emailsEnviados: emailResult.enviados,
      emailsFallidos: emailResult.fallidos,
      resumenPreview: resumen.substring(0, 200) + '...',
    };
  } catch (e) {
    var dur = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log('[' + executionId + '] ❌ ERROR en ejecución: ' + e.message);
    console.log('[' + executionId + '] Stack: ' + e.stack);
    return {
      success: false,
      executionId: executionId,
      duracionSegundos: parseFloat(dur),
      error: e.message,
      stack: e.stack,
    };
  }
}

// ===================== DASHBOARD HTML =====================
function generarDashboardHTML() {
  var mails = CONFIG.EMAILS_DESTINO.map(function (e) {
    return '<span class="destinatario">' + e + '</span>';
  }).join('');
  var feeds = TODOS_LOS_FEEDS.map(function (f, i) {
    return i + 1 + '. ' + f;
  }).join('<br>');

  return (
    '<!DOCTYPE html>\n<html lang="es"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>🎯 OSINT News Aggregator</title>' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);min-height:100vh;color:#e0e0e0;padding:20px}' +
    '.container{max-width:900px;margin:0 auto}h1{text-align:center;margin-bottom:10px;font-size:2.2em}' +
    '.subtitle{text-align:center;color:#8892b0;margin-bottom:30px}' +
    '.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:24px;margin-bottom:20px;backdrop-filter:blur(10px)}' +
    '.card h2{color:#64ffda;margin-bottom:16px;font-size:1.3em}' +
    '.btn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}' +
    '.btn{display:flex;align-items:center;gap:10px;padding:14px 20px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;color:white}' +
    '.btn-primary{background:linear-gradient(135deg,#667eea,#764ba2)}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(102,126,234,.4)}' +
    '.btn-success{background:linear-gradient(135deg,#11998e,#38ef7d)}.btn-success:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(17,153,142,.4)}' +
    '.btn-warning{background:linear-gradient(135deg,#f093fb,#f5576c)}.btn-warning:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(240,147,251,.4)}' +
    '.btn-info{background:linear-gradient(135deg,#4facfe,#00f2fe)}.btn-info:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(79,172,254,.4)}' +
    '.destinatarios{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.destinatario{background:rgba(100,255,218,.1);border:1px solid rgba(100,255,218,.3);padding:6px 14px;border-radius:20px;font-size:13px}' +
    '.cron-info{background:rgba(255,214,0,.1);border:1px solid rgba(255,214,0,.3);padding:16px;border-radius:12px;margin-top:16px}.cron-info h3{color:#ffd600;margin-bottom:8px}' +
    '.feeds-list{max-height:200px;overflow-y:auto;background:rgba(0,0,0,.2);padding:12px;border-radius:8px;font-family:monospace;font-size:12px;line-height:1.6}' +
    '.feeds-list::-webkit-scrollbar{width:6px}.feeds-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}' +
    '.loading{display:none;text-align:center;padding:20px}.loading.active{display:block}' +
    '.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:#64ffda;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px}' +
    '@keyframes spin{to{transform:rotate(360deg)}}' +
    '#resultado{margin-top:16px;padding:16px;border-radius:12px;background:rgba(0,0,0,.3);font-family:monospace;font-size:13px;white-space:pre-wrap;display:none;max-height:400px;overflow-y:auto}' +
    '#resultado.active{display:block}' +
    '.footer{text-align:center;margin-top:30px;color:#8892b0;font-size:13px}' +
    '</style></head><body>' +
    '<div class="container"><h1>🎯 OSINT News Aggregator</h1>' +
    '<p class="subtitle">Inteligencia automatizada con Gemini AI | Cloudflare Worker</p>' +
    '<div class="card"><h2>🚀 Ejecutar desde Navegador</h2>' +
    '<div class="btn-grid">' +
    '<a href="/run" class="btn btn-primary" onclick="return ejecutar(this)">📰 Resumen Completo</a>' +
    '<a href="/run/rss" class="btn btn-success" onclick="return ejecutar(this)">📡 Solo RSS</a>' +
    '<a href="/run/gdelt" class="btn btn-success" onclick="return ejecutar(this)">🌍 Solo GDELT</a>' +
    '<a href="/run/web" class="btn btn-success" onclick="return ejecutar(this)">🔍 Solo Web Search</a>' +
    '<a href="/status" class="btn btn-info">📊 Estado del Sistema</a>' +
    '<a href="/test" class="btn btn-warning">🧪 Test de Conectividad</a>' +
    '</div>' +
    '<div class="loading" id="loading"><div class="spinner"></div><p>Ejecutando... esto puede tomar 30-60 segundos</p></div>' +
    '<pre id="resultado"></pre></div>' +
    '<div class="card"><h2>📧 Destinatarios Configurados (' +
    CONFIG.EMAILS_DESTINO.length +
    ')</h2><div class="destinatarios">' +
    mails +
    '</div></div>' +
    '<div class="card"><h2>⏰ Programación Automática (Cron)</h2>' +
    '<div class="cron-info"><h3>🕐 7:00 AM | 🕐 1:00 PM | 🕐 7:00 PM (UTC-4)</h3>' +
    '<p>Se ejecuta automáticamente sin intervención. También puedes disparar manualmente con los botones de arriba.</p>' +
    '<p><strong>Cron expressions:</strong> <code>0 11 * * *</code>, <code>0 17 * * *</code>, <code>0 23 * * *</code> (UTC)</p>' +
    '</div></div>' +
    '<div class="card"><h2>📡 Fuentes RSS Configuradas (' +
    TODOS_LOS_FEEDS.length +
    ')</h2><div class="feeds-list">' +
    feeds +
    '</div></div>' +
    '<div class="footer"><p>OSINT News Aggregator v1.0 | Cloudflare Workers | Gemini AI | Resend Email</p>' +
    '<p>Desarrollado para análisis de inteligencia geopolítica</p></div></div>' +
    '<script>async function ejecutar(link){const l=document.getElementById("loading"),r=document.getElementById("resultado");l.classList.add("active");r.classList.remove("active");r.textContent="";try{const res=await fetch(link.href);const data=await res.json();r.textContent=JSON.stringify(data,null,2);r.classList.add("active")}catch(e){r.textContent="Error: "+e.message;r.classList.add("active")}finally{l.classList.remove("active")}return false}</script>' +
    '</body></html>'
  );
}

// ===================== HANDLER PRINCIPAL =====================
var CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS),
  });
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    try {
      if (path === '/' || path === '/index.html') {
        return new Response(generarDashboardHTML(), {
          headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, CORS),
        });
      }

      if (path === '/run') {
        var rFull = await ejecutarResumenCompleto(env);
        return jsonResponse(rFull, rFull.success ? 200 : 500);
      }

      if (path === '/run/rss') {
        var nRss = await obtenerNoticiasRSS();
        return jsonResponse({ success: true, fuente: 'RSS', total: nRss.length, noticias: nRss });
      }

      if (path === '/run/gdelt') {
        var nG = await obtenerNoticiasGDELT();
        return jsonResponse({ success: true, fuente: 'GDELT', total: nG.length, noticias: nG });
      }

      if (path === '/run/web') {
        var nW = await obtenerNoticiasBusquedaWeb();
        return jsonResponse({ success: true, fuente: 'Web Search', total: nW.length, noticias: nW });
      }

      if (path === '/status') {
        var gk = !!obtenerApiKey(env, ['GEMINI_API_KEY', 'GEMINI_KEY', 'GOOGLE_AI_API_KEY']);
        var ek = !!obtenerApiKey(env, ['EMAIL_API_KEY', 'RESEND_API_KEY']);
        return jsonResponse({
          success: true,
          worker: 'osint-news-aggregator',
          version: '1.0.1',
          timestamp: new Date().toISOString(),
          configuracion: {
            gemini_api: gk ? '✅ Configurada' : '❌ No configurada (wrangler secret put GEMINI_API_KEY)',
            email_api: ek ? '✅ Configurada' : '❌ No configurada (wrangler secret put EMAIL_API_KEY)',
            destinatarios: CONFIG.EMAILS_DESTINO.length,
            feeds_rss: TODOS_LOS_FEEDS.length,
            cron_triggers: ['7:00 AM', '1:00 PM', '7:00 PM (UTC-4)'],
            domparser: domParserDisponible() ? 'disponible' : 'fallback regex',
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
        });
      }

      if (path === '/test') {
        var tests = [];

        var geminiKey = obtenerApiKey(env, ['GEMINI_API_KEY', 'GEMINI_KEY', 'GOOGLE_AI_API_KEY']);
        try {
          if (!geminiKey) throw new Error('API key no configurada');
          var tG = await fetchRobusto(
            'https://generativelanguage.googleapis.com/v1beta/models?key=' + geminiKey,
            {},
            1
          );
          tests.push({ servicio: 'Gemini API', status: tG.ok ? '✅ OK' : '⚠️ Respuesta ' + tG.status });
        } catch (e) {
          tests.push({ servicio: 'Gemini API', status: '❌ Error: ' + e.message });
        }

        try {
          var tR = await fetchRobusto('https://feeds.bbci.co.uk/news/world/rss.xml', {}, 1);
          tests.push({ servicio: 'RSS (BBC)', status: tR.ok ? '✅ OK' : '⚠️ ' + tR.status });
        } catch (e) {
          tests.push({ servicio: 'RSS (BBC)', status: '❌ Error: ' + e.message });
        }

        try {
          var tGD = await fetchRobusto(
            'https://api.gdeltproject.org/api/v2/doc/doc?query=Cuba&mode=ArtList&maxrecords=1&format=json',
            {},
            1
          );
          tests.push({ servicio: 'GDELT API', status: tGD.ok ? '✅ OK' : '⚠️ ' + tGD.status });
        } catch (e) {
          tests.push({ servicio: 'GDELT API', status: '❌ Error: ' + e.message });
        }

        var emailKey = obtenerApiKey(env, ['EMAIL_API_KEY', 'RESEND_API_KEY']);
        try {
          if (!emailKey) throw new Error('API key no configurada');
          var tE = await fetchRobusto(
            'https://api.resend.com/emails',
            {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + emailKey },
              body: JSON.stringify({}),
            },
            1
          );
          tests.push({
            servicio: 'Resend Email',
            status: tE.ok ? '✅ OK' : '⚠️ Auth requerida (' + tE.status + ')',
          });
        } catch (e) {
          tests.push({ servicio: 'Resend Email', status: '❌ Error: ' + e.message });
        }

        return jsonResponse({ success: true, timestamp: new Date().toISOString(), tests: tests });
      }

      return jsonResponse(
        {
          success: false,
          error: 'Endpoint no encontrado',
          endpoints_disponibles: ['/', '/run', '/run/rss', '/run/gdelt', '/run/web', '/status', '/test'],
        },
        404
      );
    } catch (e) {
      console.error('Error en handler:', e);
      return jsonResponse({ success: false, error: e.message, stack: e.stack }, 500);
    }
  },

  async scheduled(event, env) {
    console.log('⏰ Cron trigger ejecutado: ' + event.cron + ' (' + new Date().toISOString() + ')');
    var resultado = await ejecutarResumenCompleto(env);
    console.log('⏰ Cron finalizado: ' + JSON.stringify(resultado));
    if (env.OSINT_LOGS) {
      try {
        await env.OSINT_LOGS.put(
          'log-' + Date.now(),
          JSON.stringify(
            Object.assign({ cron: event.cron, timestamp: new Date().toISOString() }, resultado)
          )
        );
      } catch (e) {
        console.log('No se pudo guardar log en KV: ' + e.message);
      }
    }
  },
};
