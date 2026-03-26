const state = {
  products: [],
  zones: [],
  currentCategory: null,
  chatHistory: [],
  apiEndpoint: "/api/chat"
};

const categoryInfo = {
  "detergentes-liquidos": {
    title: "Detergentes líquidos",
    tag: "Línea principal",
    badge: "🧴",
    description: "Blanqueadores, limpiadores, desengrasantes, aromatizantes y más."
  },
  "varios-desechables": {
    title: "Varios y desechables",
    tag: "Línea principal",
    badge: "📦",
    description: "Empaques, icopor, vasos, servilletas y otras referencias."
  }
};

const homeSections = document.querySelectorAll(".home-section");
const categoryView = document.getElementById("categoryView");
const productsList = document.getElementById("productsList");
const categoryTitle = document.getElementById("categoryTitle");
const categoryTag = document.getElementById("categoryTag");
const categoryDescription = document.getElementById("categoryDescription");
const categoryBadge = document.getElementById("categoryBadge");
const categoryCount = document.getElementById("categoryCount");
const categorySearch = document.getElementById("categorySearch");
const backHomeBtn = document.getElementById("backHomeBtn");
const categoryButtons = document.querySelectorAll("[data-category]");
const homeLinkButtons = document.querySelectorAll("[data-home-link]");
const goHomeBtn = document.getElementById("goHomeBtn");

const assistantLauncher = document.getElementById("assistantLauncher");
const chatPanel = document.getElementById("chatPanel");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const quickButtons = document.querySelectorAll("[data-question]");
const openBotBtnHero = document.getElementById("openBotBtnHero");
const openBotBtnCta = document.getElementById("openBotBtnCta");

function formatCop(value) {
  const parts = String(value).split(".");
  if (parts.length === 1) return `$${parts[0]}`;
  return `$${parts[0]}.${parts[1].padEnd(3, "0").slice(0, 3)}`;
}

async function loadCatalog() {
  const [productsRes, zonesRes] = await Promise.all([
    fetch("./products.json"),
    fetch("./zones.json")
  ]);
  state.products = await productsRes.json();
  state.zones = await zonesRes.json();
}

function renderCategory(categoryKey, search = "") {
  state.currentCategory = categoryKey;
  const info = categoryInfo[categoryKey];
  const normalizedSearch = normalize(search);

  categoryTitle.textContent = info.title;
  categoryTag.textContent = info.tag;
  categoryDescription.textContent = info.description;
  categoryBadge.textContent = info.badge;

  const list = state.products.filter((product) => {
    if (product.category !== categoryKey) return false;
    const haystack = normalize([product.name, product.presentation].join(" "));
    return !normalizedSearch || haystack.includes(normalizedSearch);
  });

  productsList.innerHTML = "";
  categoryCount.textContent = `${list.length} producto(s)`;

  if (!list.length) {
    const empty = document.createElement("article");
    empty.className = "product-row";
    empty.innerHTML = `<div class="product-copy"><h3>No encontramos coincidencias</h3><p>Prueba otra palabra o limpia la búsqueda.</p></div>`;
    productsList.appendChild(empty);
  } else {
    list.slice(0, 200).forEach((product) => {
      const article = document.createElement("article");
      article.className = "product-row";
      article.innerHTML = `
        <div class="product-copy">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.presentation || "Presentación por confirmar")}</p>
        </div>
        <strong>${formatCop(product.price_cop_thousands)}</strong>
      `;
      productsList.appendChild(article);
    });
  }

  homeSections.forEach((section) => section.classList.add("hidden"));
  categoryView.classList.remove("hidden");
  categoryView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showHome(targetId = "inicio") {
  categoryView.classList.add("hidden");
  homeSections.forEach((section) => section.classList.remove("hidden"));
  requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toggleChat(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : chatPanel.classList.contains("hidden");
  chatPanel.classList.toggle("hidden", !shouldOpen);
  if (shouldOpen) {
    setTimeout(() => chatInput.focus(), 60);
    if (!state.chatHistory.length) {
      addAssistantMessage("Hola. Soy tu asistente virtual.\nPuedo ayudarte con productos, precios y un estimado de entrega por zona.");
    }
  }
}

function addMessage(role, content, isTyping = false) {
  const box = document.createElement("div");
  box.className = `message ${role}`;
  box.innerHTML = isTyping
    ? `<span class="typing"><span></span><span></span><span></span></span>`
    : escapeHtml(content);
  chatMessages.appendChild(box);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return box;
}

function addAssistantMessage(text) {
  state.chatHistory.push({ role: "assistant", content: text });
  return addMessage("assistant", text);
}

function addUserMessage(text) {
  state.chatHistory.push({ role: "user", content: text });
  return addMessage("user", text);
}

function findProducts(query, limit = 6) {
  const q = normalize(query);
  if (!q) return [];
  return state.products
    .map((product) => {
      const haystack = normalize([product.name, product.presentation, product.category].join(" "));
      const score =
        (haystack.includes(q) ? 3 : 0) +
        (haystack.startsWith(q) ? 2 : 0) +
        [...q.split(" ")].filter(Boolean).reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);
}

function matchZone(message) {
  const msg = normalize(message);
  return state.zones.find((zone) => zone.areas.some((area) => msg.includes(normalize(area))) || msg.includes(normalize(zone.label)));
}

function localAssistantFallback(message) {
  const msg = normalize(message);

  if (!msg) {
    return "Cuéntame qué necesitas y te ayudo a ubicar el producto o la categoría.";
  }

  if (/(hola|buenas|buenos dias|buenas tardes|buenas noches)/.test(msg)) {
    return "Hola. Puedes preguntarme por detergentes líquidos, varios y desechables, precios o estimados de entrega.";
  }

  if (msg.includes("detergente") || msg.includes("blanqueador") || msg.includes("limpiador")) {
    const matches = state.products.filter((p) => p.category === "detergentes-liquidos").slice(0, 5);
    const lines = matches.map((p) => `• ${p.name}${p.presentation ? " — " + p.presentation : ""} — ${formatCop(p.price_cop_thousands)}`);
    return `En detergentes líquidos manejamos referencias como estas:\n${lines.join("\n")}\n\nSi quieres, dime el nombre o la presentación y te busco algo más preciso.`;
  }

  if (msg.includes("desechable") || msg.includes("vaso") || msg.includes("icopor") || msg.includes("servilleta") || msg.includes("empaque")) {
    const matches = state.products.filter((p) => p.category === "varios-desechables").slice(0, 5);
    const lines = matches.map((p) => `• ${p.name} — ${formatCop(p.price_cop_thousands)}`);
    return `En varios y desechables tengo estas referencias como ejemplo:\n${lines.join("\n")}\n\nSi buscas algo puntual, escríbeme el nombre o una palabra clave.`;
  }

  if (msg.includes("precio") || msg.includes("valor") || msg.includes("cuanto")) {
    const matches = findProducts(message);
    if (matches.length) {
      const lines = matches.map((p) => `• ${p.name}${p.presentation ? " — " + p.presentation : ""} — ${formatCop(p.price_cop_thousands)}`);
      return `Encontré estas coincidencias:\n${lines.join("\n")}\n\nSi quieres, dime cuál te interesa y seguimos.`;
    }
  }

  if (msg.includes("entrega") || msg.includes("domicilio") || msg.includes("barrio") || msg.includes("zona")) {
    const zone = matchZone(message);
    if (zone) {
      return `${zone.label}: ${zone.estimate} ${zone.delivery_fee_note}`;
    }
    return "Puedo darte un estimado de entrega. Dime tu barrio, localidad o ciudad para orientarte mejor.";
  }

  if (msg.includes("cotizar") || msg.includes("cotizacion") || msg.includes("pedido")) {
    return "Claro. Para una cotización preliminar necesito:\n• producto o productos\n• cantidad\n• zona o barrio\n\nEnvíame eso y te ayudo a organizarlo.";
  }

  const matches = findProducts(message);
  if (matches.length) {
    const lines = matches.slice(0, 5).map((p) => `• ${p.name}${p.presentation ? " — " + p.presentation : ""} — ${formatCop(p.price_cop_thousands)}`);
    return `Estas son las coincidencias más cercanas que encontré:\n${lines.join("\n")}`;
  }

  return "Puedo ayudarte con productos, precios y entrega. Prueba algo como:\n• ¿Qué manejan en detergentes líquidos?\n• ¿Cuánto vale cierto producto?\n• Quiero cotizar un pedido.\n• Estoy en Kennedy, ¿qué tiempo de entrega hay?";
}

async function askAssistant(message) {
  const typing = addMessage("assistant", "", true);
  try {
    const response = await fetch(state.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: state.chatHistory.slice(-8),
        channel: "web"
      })
    });

    if (!response.ok) throw new Error("API unavailable");
    const data = await response.json();
    typing.remove();
    addAssistantMessage(data.reply || "No pude responder en este momento.");
  } catch (error) {
    typing.remove();
    addAssistantMessage(localAssistantFallback(message));
  }
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => renderCategory(button.dataset.category));
});

categorySearch.addEventListener("input", (event) => {
  if (state.currentCategory) renderCategory(state.currentCategory, event.target.value);
});

backHomeBtn.addEventListener("click", () => {
  categorySearch.value = "";
  showHome("categorias");
});

homeLinkButtons.forEach((button) => {
  button.addEventListener("click", () => showHome(button.dataset.homeLink));
});

goHomeBtn.addEventListener("click", () => showHome("inicio"));

assistantLauncher.addEventListener("click", () => toggleChat());
chatCloseBtn.addEventListener("click", () => toggleChat(false));
openBotBtnHero.addEventListener("click", () => toggleChat(true));
openBotBtnCta.addEventListener("click", () => toggleChat(true));

quickButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const question = button.dataset.question;
    toggleChat(true);
    addUserMessage(question);
    await askAssistant(question);
  });
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  toggleChat(true);
  addUserMessage(text);
  await askAssistant(text);
});

loadCatalog().catch((error) => {
  console.error("No se pudo cargar el catálogo", error);
  addAssistantMessage("No pude cargar el catálogo inicial. Revisa los archivos products.json y zones.json.");
});
