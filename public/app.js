const BOT_API_URL = 'https://productos-ali-bot.aliedpuenteslozano.workers.dev/api/chat';
const DATA_BASE_URL = 'https://productos-ali-web.aliedpuenteslozano.workers.dev';

const state = {
  products: [],
  zones: [],
  currentCategory: null,
  history: []
};

const ui = {
  categoryGrid: null,
  categoryTitle: null,
  productList: null,
  backButton: null,
  homeSection: null,
  categorySection: null,
  chatPanel: null,
  chatToggle: null,
  chatClose: null,
  chatMessages: null,
  chatInput: null,
  chatSend: null,
  chatStatus: null
};

document.addEventListener('DOMContentLoaded', async () => {
  cacheDom();
  bindChatEvents();
  bindCatalogEvents();
  await loadData();
  renderCategories();
  ensureGreeting();
});

function cacheDom() {
  ui.categoryGrid = pick([
    '#categoryGrid',
    '#categoriesGrid',
    '[data-role="category-grid"]'
  ]);
  ui.categoryTitle = pick([
    '#categoryTitle',
    '[data-role="category-title"]'
  ]);
  ui.productList = pick([
    '#productList',
    '#productsList',
    '[data-role="product-list"]'
  ]);
  ui.backButton = pick([
    '#backToHome',
    '#backButton',
    '[data-action="back-home"]'
  ]);
  ui.homeSection = pick([
    '#homeView',
    '#homeSection',
    '[data-view="home"]'
  ]);
  ui.categorySection = pick([
    '#categoryView',
    '#categorySection',
    '[data-view="category"]'
  ]);
  ui.chatPanel = pick([
    '#chatPanel',
    '#chatbotPanel',
    '.chat-panel',
    '[data-role="chat-panel"]'
  ]);
  ui.chatToggle = pick([
    '#chatToggle',
    '#chatOpen',
    '.chat-toggle',
    '[data-action="open-chat"]'
  ]);
  ui.chatClose = pick([
    '#chatClose',
    '.chat-close',
    '[data-action="close-chat"]'
  ]);
  ui.chatMessages = pick([
    '#chatMessages',
    '#messages',
    '.chat-messages',
    '[data-role="chat-messages"]'
  ]);
  ui.chatInput = pick([
    '#chatInput',
    '#userInput',
    '.chat-input textarea',
    '.chat-input input',
    '[data-role="chat-input"]'
  ]);
  ui.chatSend = pick([
    '#chatSend',
    '#sendMessage',
    '.chat-send',
    '[data-action="send-chat"]'
  ]);
  ui.chatStatus = pick([
    '#chatStatus',
    '.chat-status',
    '[data-role="chat-status"]'
  ]);
}

function bindChatEvents() {
  if (ui.chatToggle && ui.chatPanel) {
    ui.chatToggle.addEventListener('click', () => {
      ui.chatPanel.classList.toggle('is-open');
    });
  }

  if (ui.chatClose && ui.chatPanel) {
    ui.chatClose.addEventListener('click', () => {
      ui.chatPanel.classList.remove('is-open');
    });
  }

  if (ui.chatSend) {
    ui.chatSend.addEventListener('click', sendCurrentMessage);
  }

  if (ui.chatInput) {
    ui.chatInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendCurrentMessage();
      }
    });
  }
}

function bindCatalogEvents() {
  if (ui.backButton) {
    ui.backButton.addEventListener('click', goHome);
  }
}

async function loadData() {
  const [products, zones] = await Promise.all([
    getJson(`${DATA_BASE_URL}/products.json`).catch(() => []),
    getJson(`${DATA_BASE_URL}/zones.json`).catch(() => [])
  ]);

  state.products = normalizeProducts(products);
  state.zones = normalizeZones(zones);
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function normalizeProducts(raw) {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.products)
      ? raw.products
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  return source
    .map((item, index) => {
      const name = pickFirst(item, ['name', 'producto', 'Producto', 'product']);
      const reference = pickFirst(item, ['reference', 'referencia', 'Referencia', 'sku', 'SKU']);
      const rawPrice = pickFirst(item, ['price', 'precio', 'Precio', 'valor', 'Valor', 'valor_un', 'Valor Un']);
      const category = pickFirst(item, ['category', 'categoria', 'Categoría', 'section', 'seccion']) || inferCategory(name, reference);
      const description = pickFirst(item, ['description', 'descripcion', 'Descripción']);

      return {
        id: item?.id || index + 1,
        name: String(name || '').trim(),
        reference: String(reference || '').trim(),
        price: formatPrice(rawPrice),
        category: String(category || 'Varios y desechables').trim(),
        description: String(description || '').trim()
      };
    })
    .filter(item => item.name);
}

function normalizeZones(raw) {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.zones)
      ? raw.zones
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  return source
    .map(item => ({
      zone: String(pickFirst(item, ['zone', 'zona', 'Zona', 'name', 'nombre']) || '').trim(),
      eta: String(pickFirst(item, ['eta', 'delivery_time', 'tiempo', 'Tiempo', 'estimado']) || '').trim(),
      details: String(pickFirst(item, ['details', 'detalle', 'detalles', 'notes', 'notas']) || '').trim()
    }))
    .filter(item => item.zone);
}

function renderCategories() {
  if (!ui.categoryGrid) return;

  const categories = ['Detergentes líquidos', 'Varios y desechables'];
  ui.categoryGrid.innerHTML = '';

  for (const category of categories) {
    const total = state.products.filter(item => item.category === category).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-card';
    button.innerHTML = `
      <span class="category-card__title">${escapeHtml(category)}</span>
      <span class="category-card__meta">${total} producto${total === 1 ? '' : 's'}</span>
    `;
    button.addEventListener('click', () => openCategory(category));
    ui.categoryGrid.appendChild(button);
  }
}

function openCategory(category) {
  state.currentCategory = category;

  if (ui.categoryTitle) {
    ui.categoryTitle.textContent = category;
  }

  if (ui.productList) {
    ui.productList.innerHTML = '';
    const items = state.products.filter(item => item.category === category);

    if (!items.length) {
      ui.productList.innerHTML = '<p class="empty-state">No hay productos disponibles en esta categoría por ahora.</p>';
    } else {
      for (const item of items) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
          <h3 class="product-card__title">${escapeHtml(item.name)}</h3>
          ${item.reference ? `<p class="product-card__ref">Ref: ${escapeHtml(item.reference)}</p>` : ''}
          ${item.description ? `<p class="product-card__desc">${escapeHtml(item.description)}</p>` : ''}
          ${item.price ? `<p class="product-card__price">${escapeHtml(item.price)}</p>` : ''}
        `;
        ui.productList.appendChild(card);
      }
    }
  }

  if (ui.homeSection) ui.homeSection.hidden = true;
  if (ui.categorySection) ui.categorySection.hidden = false;
}

function goHome() {
  state.currentCategory = null;
  if (ui.homeSection) ui.homeSection.hidden = false;
  if (ui.categorySection) ui.categorySection.hidden = true;
}

function ensureGreeting() {
  if (!ui.chatMessages) return;
  if (ui.chatMessages.children.length > 0) return;

  const options = [
    'Hola. ¿En qué te puedo ayudar hoy?',
    '¡Hola! ¿Qué te gustaría consultar hoy?',
    'Buen día. ¿Buscas producto, precio o entrega?',
    'Hola. Con gusto te ayudo. ¿Qué necesitas revisar hoy?'
  ];

  const index = Math.floor(Math.random() * options.length);
  addMessage('assistant', options[index]);
}

async function sendCurrentMessage() {
  const raw = ui.chatInput?.value || '';
  const message = raw.trim();
  if (!message) return;

  addMessage('user', message);
  if (ui.chatInput) ui.chatInput.value = '';
  setStatus('Consultando...');

  const zone = extractZoneFromText(message);
  const historyForApi = state.history.slice(-10);

  try {
    const data = await requestBotWithRetry({ message, zone, history: historyForApi }, 2);

    if (data?.reply) {
      addMessage('assistant', data.reply);
      setStatus(data.source === 'api' || String(data.reply).startsWith('[API]') ? 'Conectado con API' : 'Respuesta local');
      return;
    }

    throw new Error('La API no respondió correctamente');
  } catch (error) {
    console.error('Fallo del bot remoto:', error);

    if (canUseLocalFallback(message)) {
      const fallback = localFallback(message, zone);
      addMessage('assistant', `[LOCAL] ${fallback}`);
      setStatus('Respuesta local');
      return;
    }

    addMessage('assistant', 'Estoy teniendo una falla temporal para procesar toda la conversación. Si quieres, déjame producto, cantidad y localidad para dejar la solicitud lista.');
    setStatus('Falla temporal de API');
  }
}

function addMessage(role, text) {
  if (!ui.chatMessages) return;

  const item = document.createElement('div');
  item.className = `chat-message chat-message--${role}`;
  item.textContent = text;
  ui.chatMessages.appendChild(item);
  ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;

  state.history.push({ role, content: text });
  state.history = state.history.slice(-20);
}

function setStatus(text) {
  if (ui.chatStatus) {
    ui.chatStatus.textContent = text;
  }
}

function localFallback(message, zone) {
  const matches = findMatchingProducts(message).slice(0, 5);

  if (matches.length) {
    let reply = `Estas son las coincidencias más cercanas que encontré:
${matches.map(item => {
      const parts = [item.name];
      if (item.presentation) parts.push(item.presentation);
      if (typeof item.price_cop_thousands === 'number') parts.push(formatPriceFromThousands(item.price_cop_thousands));
      else if (item.price) parts.push(item.price);
      return `• ${parts.join(' — ')}`;
    }).join('\n')}`;

    if (/precio|valor|cu[aá]nto vale|cu[aá]nto cuesta/i.test(message)) {
      reply += '\n\nSi quieres, dime cantidad y luego la localidad para orientarte con la entrega.';
    }

    return reply;
  }

  if (/precio|cu[aá]nto vale|valor/i.test(message)) {
    return 'No encontré una coincidencia exacta. Escríbeme el nombre del producto o una palabra clave.';
  }

  if (/envio|envío|entrega|domicilio|zona|barrio|localidad|cu[aá]nto se demora|cu[aá]nto tendr[ií]a que pagar/i.test(message)) {
    return 'Estoy teniendo una falla temporal para revisar entrega o total. Déjame producto, cantidad y localidad para dejar la solicitud lista.';
  }

  return 'Puedo ayudarte a buscar un producto del catálogo. Escríbeme el nombre o una palabra clave.';
}

function findMatchingProducts(message) {
  const tokens = tokenize(message);
  if (!tokens.length) return [];

  return state.products
    .map(item => {
      const haystack = tokenize(`${item.name} ${item.reference} ${item.category} ${item.description}`);
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'es'));
}

function extractZoneFromText(text) {
  const lower = String(text || '').toLowerCase();
  const match = state.zones.find(item => lower.includes(item.zone.toLowerCase()));
  return match?.zone || '';
}

function pick(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node) return node;
  }
  return null;
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }
  return '';
}

function inferCategory(name = '', reference = '') {
  const text = `${name} ${reference}`.toLowerCase();
  const detergentHints = [
    'deterg', 'lavaloza', 'lavaplat', 'suavizante', 'cloro', 'desinfect',
    'limpiador', 'jabon', 'jabón', 'multiusos', 'desengras', 'blanqueador'
  ];

  return detergentHints.some(hint => text.includes(hint))
    ? 'Detergentes líquidos'
    : 'Varios y desechables';
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '';
  const clean = String(value).replace(/[^\d.,-]/g, '').trim();
  if (!clean) return String(value).trim();

  const normalized = clean.includes(',') && clean.includes('.')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean.includes(',') && !clean.includes('.')
      ? clean.replace(',', '.')
      : clean;

  const number = Number(normalized);
  if (!Number.isFinite(number)) return String(value).trim();

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(number);
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
