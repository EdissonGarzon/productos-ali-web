
const DEFAULT_MODEL = "gpt-5.4-nano";
const HARD_FALLBACK_CATALOG_BASE_URL = "https://productos-ali-web.aliedpuenteslozano.workers.dev";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

const EMBEDDED_BUSINESS_RULES = {
  company: {
    name: "Productos Ali",
    assistant_name: "Asistente virtual",
    currency: "COP",
    timezone: "America/Bogota",
    country: "Colombia",
    language: "es-CO"
  },
  quote_rules: {
    quote_intro: "Claro. Para cotizarte mejor necesito producto, cantidad y zona de entrega.",
    quote_missing_data_reply: "Para darte una cotización preliminar necesito producto, cantidad y zona de entrega."
  },
  delivery_rules: {
    must_always_acknowledge_delivery_intent: true,
    delivery_intent_keywords: [
      "entrega", "entregan", "domicilio", "envio", "envío", "llevan", "llevar", "despacho", "reparto",
      "barrio", "localidad", "zona", "municipio", "ciudad", "se demora", "tiempo de entrega", "cuanto tarda", "cuánto tarda"
    ],
    missing_location_reply: "Sí hacemos entregas. Dime tu barrio o localidad de Bogotá y te doy un estimado.",
    unknown_location_reply: "Sí hacemos entregas en Bogotá. Si me confirmas localidad o un barrio conocido, te doy un estimado más preciso."
  },
  pricing_rules: {
    must_not_invent_prices: true,
    price_unknown_reply: "No tengo un precio confirmado para esa referencia en este momento."
  },
  payment_methods: {
    configured: false,
    methods: [],
    default_reply: "Aún no tengo los medios de pago configurados aquí. Te los confirmamos al cerrar el pedido."
  },
  brand_policy: {
    neutral_brand_reply: "Puedo orientarte con referencia, presentación y precio. Si necesitas confirmar fabricante o marca exacta, te lo validamos."
  }
};

const EMBEDDED_SCHEDULE = {
  timezone: "America/Bogota",
  weekly_schedule: {
    monday: { open: true, from: "08:00", to: "18:00" },
    tuesday: { open: true, from: "08:00", to: "18:00" },
    wednesday: { open: true, from: "08:00", to: "18:00" },
    thursday: { open: true, from: "08:00", to: "18:00" },
    friday: { open: true, from: "08:00", to: "18:00" },
    saturday: { open: true, from: "08:00", to: "13:00" },
    sunday: { open: false, from: null, to: null }
  },
  after_hours_behavior: {
    reply: "En este momento estamos fuera de horario. Déjame producto, cantidad y localidad y te dejamos la solicitud lista.",
    accept_leads: true
  }
};

const EMBEDDED_FAQ = [
  {
    key: "delivery_general",
    triggers: ["hacen domicilios", "hacen entregas", "si lo llevan", "entregan", "envian", "envio", "envío"],
    answer: "Sí hacemos entregas en Bogotá. Dime tu barrio o localidad y te doy un estimado."
  },
  {
    key: "business_hours",
    triggers: ["horario", "que horario manejan", "qué horario manejan", "a que hora atienden", "a qué hora atienden"],
    answer: "Atendemos de lunes a viernes de 8:00 a 18:00 y sábado de 8:00 a 13:00."
  },
  {
    key: "payment_methods",
    triggers: ["como se paga", "cómo se paga", "medios de pago", "formas de pago"],
    answer: "Aún no tengo los medios de pago configurados aquí. Te los confirmamos al cerrar el pedido."
  }
];

const EMBEDDED_CONVERSATION_POLICY = {
  version: "2.0",
  language: "es-CO",
  human_handoff_reply: "No quiero darte un dato inventado. Te ayudo a dejar la solicitud clara y la validamos por asesor.",
  api_failure_reply: "Estoy teniendo una falla temporal para procesar toda la conversación. Déjame producto, cantidad y localidad para dejar la solicitud lista."
};

const EMBEDDED_BOGOTA_POLICY = {
  city: "Bogotá",
  country: "Colombia",
  only_bogota_initially: true,
  outside_city_reply: "Por ahora las entregas se manejan solo dentro de Bogotá.",
  ask_locality_reply: "Para darte un estimado más preciso, dime la localidad de Bogotá.",
  localities: [
    { name: "Usaquén", aliases: ["usaquen"] },
    { name: "Chapinero", aliases: [] },
    { name: "Santa Fe", aliases: ["santafe"] },
    { name: "San Cristóbal", aliases: ["san cristobal"] },
    { name: "Usme", aliases: [] },
    { name: "Tunjuelito", aliases: [] },
    { name: "Bosa", aliases: [] },
    { name: "Kennedy", aliases: [] },
    { name: "Fontibón", aliases: ["fontibon"] },
    { name: "Engativá", aliases: ["engativa"] },
    { name: "Suba", aliases: [] },
    { name: "Barrios Unidos", aliases: ["barrios unidos"] },
    { name: "Teusaquillo", aliases: [] },
    { name: "Los Mártires", aliases: ["los martires", "martires"] },
    { name: "Antonio Nariño", aliases: ["antonio narino"] },
    { name: "Puente Aranda", aliases: ["puente aranda"] },
    { name: "La Candelaria", aliases: ["la candelaria", "candelaria"] },
    { name: "Rafael Uribe Uribe", aliases: ["rafael uribe"] },
    { name: "Ciudad Bolívar", aliases: ["ciudad bolivar"] },
    { name: "Sumapaz", aliases: [] }
  ],
  known_neighborhood_aliases: [
    { name: "Lucero Bajo", aliases: ["lucero bajo", "el lucero bajo"], suggested_locality: "Ciudad Bolívar" },
    { name: "Yomasa", aliases: ["yomasa"], suggested_locality: "Usme" },
    { name: "Danubio", aliases: ["danubio", "nuevo danubio"], suggested_locality: "Usme" }
  ]
};

const EMBEDDED_DELIVERY_POLICY = {
  timezone: "America/Bogota",
  payment_cutoff: {
    monday_to_friday: "13:00",
    saturday: "10:00",
    sunday: null
  },
  zone_classes: {
    A: {
      label: "Bogotá zona A",
      before_cutoff_business_days: 1,
      after_cutoff_business_days: 2,
      provisional_delivery_fee_cop: 6000,
      localities: ["Usaquén", "Chapinero", "Teusaquillo", "Barrios Unidos", "Engativá", "Suba", "Fontibón", "Puente Aranda", "Santa Fe", "Los Mártires", "La Candelaria", "Antonio Nariño"]
    },
    B: {
      label: "Bogotá zona B",
      before_cutoff_business_days: 2,
      after_cutoff_business_days: 3,
      provisional_delivery_fee_cop: 8000,
      localities: ["Kennedy", "Bosa", "Tunjuelito", "Rafael Uribe Uribe", "San Cristóbal"]
    },
    C: {
      label: "Bogotá zona C",
      before_cutoff_business_days: 3,
      after_cutoff_business_days: 4,
      provisional_delivery_fee_cop: 10000,
      localities: ["Usme", "Ciudad Bolívar", "Sumapaz"]
    }
  },
  fallback_zone_class: "B",
  fee_note: "La entrega se maneja con valor provisional mientras definimos la tabla real del transportador.",
  unknown_locality_reply: "Sí hacemos entregas en Bogotá. Si me confirmas la localidad te doy una fecha estimada más precisa.",
  outside_bogota_reply: "Por ahora la cobertura está enfocada solo en Bogotá."
};

const SYSTEM_PROMPT = `
Eres un asistente comercial para Productos Ali.

Prioridades:
1) contestar de forma útil sin inventar
2) guiar la venta paso a paso
3) pedir la localidad solo cuando ya tenga sentido comercial hacerlo

Reglas fuertes:
- si el usuario solo saluda, responde breve y pregunta en qué puedes ayudar
- primero ayuda a identificar producto y cantidad
- luego pides la localidad o barrio de Bogotá para estimar entrega
- si el usuario pregunta por entrega o tiempo, responde esa parte primero
- no inventes precios, stock, marcas ni tiempos exactos fuera de las reglas cargadas
- usa los cálculos disponibles y explica cuando algo es provisional
- responde en español latino, tono amable, claro y comercial
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/") {
      return json({ ok: true, service: "productos-ali-bot", status: "active", endpoints: ["/health", "/api/chat"] });
    }

    if (url.pathname === "/health") {
      const diagnostics = await diagnoseKnowledge(env);
      return json({
        ok: true,
        status: "active",
        model: env.OPENAI_MODEL || DEFAULT_MODEL,
        has_openai_key: Boolean(env.OPENAI_API_KEY),
        catalog_diagnostics: diagnostics,
        using_catalog_base_url: diagnostics.working_base_url || null
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const result = await handleChat(body, env);
        return json({ ...result, source: "api" }, 200);
      } catch (error) {
        return json({
          reply: `[API] ${EMBEDDED_CONVERSATION_POLICY.api_failure_reply}`,
          error: "request_failed",
          detail: String(error?.message || error)
        }, 500);
      }
    }

    return json({ ok: false, error: "not_found" }, 404);
  }
};

async function handleChat(body, env) {
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-12) : [];
  if (!message) {
    return { reply: "[API] Cuéntame qué necesitas y te ayudo con productos, precios o entrega en Bogotá." };
  }

  const knowledge = await loadKnowledge(env);
  const context = extractConversationState(history, knowledge.products);
  const direct = await resolveRuleBased({ message, history, context, knowledge, env });
  if (direct) return { reply: direct.startsWith("[API]") ? direct : `[API] ${direct}` };

  if (!env.OPENAI_API_KEY) {
    return { reply: `[API] ${knowledge.conversationPolicy.api_failure_reply || EMBEDDED_CONVERSATION_POLICY.api_failure_reply}` };
  }

  const tools = [
    {
      type: "function",
      name: "search_catalog",
      description: "Busca productos por nombre, tipo o presentación.",
      parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } }, required: ["query"] }
    },
    {
      type: "function",
      name: "estimate_delivery",
      description: "Calcula una entrega estimada en Bogotá según barrio o localidad y día de pago.",
      parameters: { type: "object", properties: { location: { type: "string" }, payment_reference: { type: "string" } }, required: ["location"] }
    },
    {
      type: "function",
      name: "calculate_quote",
      description: "Calcula subtotal o total estimado usando producto, cantidad y opcionalmente ubicación.",
      parameters: { type: "object", properties: { product_query: { type: "string" }, quantity: { type: "integer" }, location: { type: "string" }, payment_reference: { type: "string" } }, required: ["product_query", "quantity"] }
    },
    {
      type: "function",
      name: "get_schedule_status",
      description: "Informa horario actual o de atención.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  ];

  let input = [
    {
      role: "system",
      content: [
        SYSTEM_PROMPT,
        `Reglas de negocio: ${JSON.stringify(knowledge.businessRules)}`,
        `Horario: ${JSON.stringify(knowledge.schedule)}`,
        `Política conversación: ${JSON.stringify(knowledge.conversationPolicy)}`,
        `Política Bogotá: ${JSON.stringify(knowledge.bogotaPolicy)}`,
        `Política entrega: ${JSON.stringify(knowledge.deliveryPolicy)}`
      ].join("\n\n")
    },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: message }
  ];

  for (let step = 0; step < 4; step++) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: env.OPENAI_MODEL || DEFAULT_MODEL, input, tools })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "OpenAI error");

    const output = Array.isArray(data.output) ? data.output : [];
    const calls = output.filter((item) => item.type === "function_call");
    if (!calls.length) {
      const reply = extractText(data) || knowledge.conversationPolicy.human_handoff_reply || EMBEDDED_CONVERSATION_POLICY.human_handoff_reply;
      return { reply: reply.startsWith("[API]") ? reply : `[API] ${reply}` };
    }

    const toolOutputs = [];
    for (const call of calls) {
      const args = safeJson(call.arguments);
      if (call.name === "search_catalog") {
        const result = searchCatalog(knowledge.products, args?.query || "", "", args?.limit || 6);
        toolOutputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
      if (call.name === "estimate_delivery") {
        const result = await estimateDeliverySmart(knowledge, args?.location || "", args?.payment_reference || message, env);
        toolOutputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
      if (call.name === "calculate_quote") {
        const result = await calculateQuote(knowledge, args?.product_query || context.productName || "", args?.quantity || context.quantity || 1, args?.location || context.locationText || "", args?.payment_reference || message, env);
        toolOutputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
      if (call.name === "get_schedule_status") {
        const result = buildScheduleStatus(knowledge.schedule);
        toolOutputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
    }

    input = [{ type: "response", id: data.id }, ...toolOutputs];
  }

  return { reply: `[API] ${knowledge.conversationPolicy.human_handoff_reply || EMBEDDED_CONVERSATION_POLICY.human_handoff_reply}` };
}

function getCatalogBaseCandidates(env) {
  const raw = [env?.CATALOG_BASE_URL, HARD_FALLBACK_CATALOG_BASE_URL]
    .map((value) => String(value || "").trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...new Set(raw)];
}

async function diagnoseKnowledge(env) {
  const candidates = getCatalogBaseCandidates(env);
  const attempts = [];
  let working_base_url = null;
  const files = [
    "products.json", "zones.json", "business_rules.json", "schedule.json", "faq.json", "conversation_policy.json", "bogota_policy.json", "delivery_policy.json"
  ];
  for (const base of candidates) {
    try {
      const responses = await Promise.all(files.map((file) => fetch(`${base}/${file}`)));
      const item = { base, ok: responses[0].ok && responses[1].ok, products_status: responses[0].status, zones_status: responses[1].status };
      item.extra = responses.slice(2).map((r, i) => ({ file: files[i + 2], status: r.status }));
      attempts.push(item);
      if (!working_base_url && item.ok) working_base_url = base;
    } catch (error) {
      attempts.push({ base, ok: false, error: String(error?.message || error) });
    }
  }
  return {
    configured_catalog_base_url: String(env?.CATALOG_BASE_URL || "").trim() || null,
    hard_fallback_catalog_base_url: HARD_FALLBACK_CATALOG_BASE_URL,
    working_base_url,
    attempts
  };
}

async function loadKnowledge(env) {
  const candidates = getCatalogBaseCandidates(env);
  const errors = [];
  for (const base of candidates) {
    try {
      const mandatory = ["products.json", "zones.json"];
      const optional = ["business_rules.json", "schedule.json", "faq.json", "conversation_policy.json", "bogota_policy.json", "delivery_policy.json"];
      const mandatoryResponses = await Promise.all(mandatory.map((file) => fetch(`${base}/${file}`)));
      if (!mandatoryResponses[0].ok || !mandatoryResponses[1].ok) {
        errors.push(`${base} -> products:${mandatoryResponses[0].status} zones:${mandatoryResponses[1].status}`);
        continue;
      }
      const [products, zones] = await Promise.all(mandatoryResponses.map((r) => r.json()));
      const optionalResponses = await Promise.all(optional.map((file) => fetch(`${base}/${file}`).catch(() => null)));
      const businessRules = optionalResponses[0] && optionalResponses[0].ok ? await optionalResponses[0].json() : EMBEDDED_BUSINESS_RULES;
      const schedule = optionalResponses[1] && optionalResponses[1].ok ? await optionalResponses[1].json() : EMBEDDED_SCHEDULE;
      const faq = optionalResponses[2] && optionalResponses[2].ok ? await optionalResponses[2].json() : EMBEDDED_FAQ;
      const conversationPolicy = optionalResponses[3] && optionalResponses[3].ok ? await optionalResponses[3].json() : EMBEDDED_CONVERSATION_POLICY;
      const bogotaPolicy = optionalResponses[4] && optionalResponses[4].ok ? await optionalResponses[4].json() : EMBEDDED_BOGOTA_POLICY;
      const deliveryPolicy = optionalResponses[5] && optionalResponses[5].ok ? await optionalResponses[5].json() : EMBEDDED_DELIVERY_POLICY;

      return {
        products,
        zones,
        businessRules: deepMerge(EMBEDDED_BUSINESS_RULES, businessRules),
        schedule: deepMerge(EMBEDDED_SCHEDULE, schedule),
        faq: Array.isArray(faq) ? faq : EMBEDDED_FAQ,
        conversationPolicy: deepMerge(EMBEDDED_CONVERSATION_POLICY, conversationPolicy),
        bogotaPolicy: deepMerge(EMBEDDED_BOGOTA_POLICY, bogotaPolicy),
        deliveryPolicy: deepMerge(EMBEDDED_DELIVERY_POLICY, deliveryPolicy),
        baseUrlUsed: base
      };
    } catch (error) {
      errors.push(`${base} -> ${String(error?.message || error)}`);
    }
  }
  throw new Error(`No se pudo cargar el conocimiento desde ninguna ruta. Intentos: ${errors.join(" | ")}`);
}

async function resolveRuleBased({ message, history, context, knowledge, env }) {
  const msg = normalize(message);
  const substantiveHistory = hasSubstantiveHistory(history);

  if (isGreetingOnly(msg)) {
    return randomGreeting(substantiveHistory);
  }

  const faqResult = matchFaq(knowledge.faq, msg);
  if (faqResult && faqResult.key !== "delivery_general") {
    if (faqResult.key === "business_hours") return buildScheduleReply(knowledge.schedule);
    return faqResult.answer;
  }

  if (asksForSchedule(msg)) {
    return buildScheduleReply(knowledge.schedule);
  }

  if (asksForPayment(msg)) {
    return knowledge.businessRules.payment_methods?.default_reply || EMBEDDED_BUSINESS_RULES.payment_methods.default_reply;
  }

  if (asksForBrand(msg)) {
    return knowledge.businessRules.brand_policy?.neutral_brand_reply || EMBEDDED_BUSINESS_RULES.brand_policy.neutral_brand_reply;
  }

  if (hasDeliveryIntent(msg, knowledge.businessRules) || asksForTotal(msg) || asksForDeliveryDate(msg)) {
    const locationText = extractLocationCandidate(message, context.locationText || "");
    const productQuery = inferProductQuery(message, context);
    const quantity = extractQuantity(message) || context.quantity || 0;

    if (asksForTotal(msg) && productQuery && quantity) {
      const quote = await calculateQuote(knowledge, productQuery, quantity, locationText || context.locationText || "", message, env);
      return quote.reply;
    }

    if (!locationText) {
      if (productQuery && quantity) {
        return `Perfecto. Ya tengo ${quantity} unidad(es) de ${productLabel(productQuery)}. Ahora dime tu barrio o localidad de Bogotá para estimarte la entrega.`;
      }
      return knowledge.businessRules.delivery_rules?.missing_location_reply || EMBEDDED_BUSINESS_RULES.delivery_rules.missing_location_reply;
    }

    const delivery = await estimateDeliverySmart(knowledge, locationText, message, env);
    if (!delivery.matched) return delivery.reply;

    if (productQuery && quantity) {
      const quote = await calculateQuote(knowledge, productQuery, quantity, locationText, message, env);
      return quote.reply;
    }

    return delivery.reply;
  }

  if (asksForQuote(msg)) {
    const productQuery = inferProductQuery(message, context);
    const quantity = extractQuantity(message) || context.quantity || 0;
    if (productQuery && quantity) {
      return `Perfecto. Tengo ${quantity} unidad(es) de ${productLabel(productQuery)}. Ahora dime tu barrio o localidad de Bogotá para estimarte entrega y total.`;
    }
    return knowledge.businessRules.quote_rules?.quote_intro || EMBEDDED_BUSINESS_RULES.quote_rules.quote_intro;
  }

  if (looksLikeProductSearch(msg) || asksForPrice(msg)) {
    const result = searchCatalog(knowledge.products, message, "", 6);
    if (result.count > 0) {
      return buildCatalogReply(result.items, msg);
    }
    if (asksForPrice(msg)) {
      return knowledge.businessRules.pricing_rules?.price_unknown_reply || EMBEDDED_BUSINESS_RULES.pricing_rules.price_unknown_reply;
    }
  }

  const quantity = extractQuantity(message);
  if (quantity && context.productName) {
    return `Perfecto. Entonces serían ${quantity} unidad(es) de ${context.productName}. Ahora dime tu barrio o localidad de Bogotá para estimarte entrega y total.`;
  }

  return "";
}

function extractConversationState(history, products) {
  const state = { productName: "", quantity: 0, locationText: "" };
  const recent = Array.isArray(history) ? history.slice(-12) : [];
  for (const item of recent) {
    const text = String(item?.content || "");
    const product = bestProductMatch(products, text);
    if (product && product.score >= 4) {
      state.productName = fullProductName(product.item);
    }
    const qty = extractQuantity(text);
    if (qty) state.quantity = qty;
    const loc = extractLocationCandidate(text, "");
    if (loc) state.locationText = loc;
  }
  return state;
}

function hasSubstantiveHistory(history) {
  return (Array.isArray(history) ? history : []).some((item) => {
    const text = normalize(item?.content || "");
    return text && !isGreetingOnly(text);
  });
}

function randomGreeting(hasContext) {
  const options = hasContext
    ? [
        "Hola de nuevo. ¿En qué más te puedo ayudar?",
        "¡Claro! ¿Qué más necesitas revisar?",
        "Con gusto. ¿Qué quieres consultar ahora?"
      ]
    : [
        "¡Hola! ¿En qué te puedo ayudar hoy?",
        "Buen día. ¿Qué te gustaría consultar hoy?",
        "Hola. Con gusto te ayudo. ¿Qué necesitas revisar?"
      ];
  return options[Math.floor(Math.random() * options.length)];
}

function buildCatalogReply(items, normalizedMessage) {
  const intro = /aseo|hogar|limpieza/.test(normalizedMessage)
    ? "Tengo estas opciones de aseo/hogar en el catálogo:"
    : "Encontré estas opciones:";
  const lines = items.slice(0, 6).map((item) => {
    const price = isFiniteNumber(item.price_cop_thousands) ? formatCop(item.price_cop_thousands) : "Precio por confirmar";
    return `• ${item.name}${item.presentation ? ` — ${item.presentation}` : ""} — ${price}`;
  });
  return `${intro}\n${lines.join("\n")}\n\nSi quieres, dime cuál te interesa y cuántas unidades necesitas.`;
}

function inferProductQuery(message, context) {
  const direct = message && !/(barrio|localidad|ciudad|usme|suba|kennedy|bogota|bogotá|lucero|pago hoy|pago manana|pago mañana)/i.test(message)
    ? message
    : "";
  return direct || context.productName || "";
}

async function calculateQuote(knowledge, productQuery, quantity, location, paymentReference, env) {
  const qty = Math.max(1, Number(quantity || 1));
  const match = bestProductMatch(knowledge.products, productQuery);
  if (!match || match.score < 3) {
    return { ok: false, reply: knowledge.businessRules.pricing_rules?.price_unknown_reply || EMBEDDED_BUSINESS_RULES.pricing_rules.price_unknown_reply };
  }
  const product = match.item;
  const subtotal = Number(product.price_cop_thousands || 0) * qty;
  const subtotalText = formatCop(subtotal);

  if (!location) {
    return {
      ok: true,
      reply: `Perfecto. ${qty} unidad(es) de ${fullProductName(product)} dan un subtotal estimado de ${subtotalText}. Ahora dime tu barrio o localidad de Bogotá para estimarte entrega y total.`
    };
  }

  const delivery = await estimateDeliverySmart(knowledge, location, paymentReference, env);
  if (!delivery.matched) {
    return { ok: false, reply: delivery.reply };
  }

  const fee = Number(delivery.provisional_delivery_fee_cop || 0);
  const total = subtotal + fee / 1000;
  const feeText = fee ? formatCop(fee / 1000) : "por confirmar";
  const totalText = fee ? formatCop(total) : `${subtotalText} + entrega por confirmar`;

  return {
    ok: true,
    subtotal_cop_thousands: subtotal,
    total_estimated_cop_thousands: fee ? total : null,
    reply: `Perfecto. Para ${qty} unidad(es) de ${fullProductName(product)}, el subtotal estimado es ${subtotalText}.\n\nEntrega estimada: ${delivery.estimate_line}\nEntrega provisional: ${feeText}\nTotal estimado: ${totalText}\n\n${delivery.assumption_line}`
  };
}

async function estimateDeliverySmart(knowledge, rawLocation, paymentReference, env) {
  const location = await resolveBogotaLocation(rawLocation, knowledge.bogotaPolicy, env);
  if (!location.found) {
    return { matched: false, reply: knowledge.deliveryPolicy.unknown_locality_reply || EMBEDDED_DELIVERY_POLICY.unknown_locality_reply };
  }
  if (!location.isBogota) {
    return { matched: false, reply: knowledge.deliveryPolicy.outside_bogota_reply || EMBEDDED_DELIVERY_POLICY.outside_bogota_reply };
  }

  const zoneInfo = classifyZone(location.locality, knowledge.deliveryPolicy);
  const now = getTimeParts(knowledge.schedule?.timezone || knowledge.deliveryPolicy?.timezone || "America/Bogota");
  const payment = parsePaymentReference(paymentReference, now);
  const scheduleDay = knowledge.schedule?.weekly_schedule?.[payment.dayKey] || null;
  const cutoff = getCutoffForDay(payment.dayKey, knowledge.deliveryPolicy);
  const beforeCutoff = payment.referenceType === "same-day" && scheduleDay?.open && cutoff && payment.time <= cutoff;
  const businessDays = beforeCutoff ? zoneInfo.before_cutoff_business_days : zoneInfo.after_cutoff_business_days;
  const estimatedDate = addBusinessDays(payment.date, businessDays, knowledge.schedule);
  const estimateLine = `${zoneInfo.label}: entrega estimada para ${formatDateEs(estimatedDate)}.`;
  const assumptionLine = buildPaymentAssumptionLine(payment, beforeCutoff, cutoff);
  const deliveryFee = Number(zoneInfo.provisional_delivery_fee_cop || 0);

  let reply = `Sí hacemos entregas en Bogotá. Para ${location.displayLabel}, ${estimateLine} ${knowledge.deliveryPolicy.fee_note}`;
  return {
    matched: true,
    locality: location.locality,
    displayLabel: location.displayLabel,
    zone_class: zoneInfo.key,
    estimate_line: estimateLine,
    provisional_delivery_fee_cop: deliveryFee,
    assumption_line: assumptionLine,
    reply
  };
}

async function resolveBogotaLocation(text, bogotaPolicy, env) {
  const raw = String(text || "").trim();
  const q = normalize(raw);
  if (!q) return { found: false, isBogota: true };

  for (const alias of bogotaPolicy.known_neighborhood_aliases || []) {
    const names = [alias.name, ...(alias.aliases || [])].map(normalize);
    if (names.some((name) => q.includes(name))) {
      return {
        found: true,
        isBogota: true,
        locality: alias.suggested_locality || "",
        displayLabel: alias.name + (alias.suggested_locality ? ` (${alias.suggested_locality})` : ""),
        source: "alias"
      };
    }
  }

  for (const loc of bogotaPolicy.localities || []) {
    const names = [loc.name, ...(loc.aliases || [])].map(normalize);
    if (names.some((name) => q.includes(name))) {
      return { found: true, isBogota: true, locality: loc.name, displayLabel: loc.name, source: "locality" };
    }
  }

  if (bogotaPolicy.only_bogota_initially && /(medellin|medellín|cali|soacha|chia|chía|mosquera|funza|madrid|cota)/.test(q)) {
    return { found: true, isBogota: false, locality: "", displayLabel: raw, source: "text-outside" };
  }

  // Intento externo controlado para no depender de un listado completo de barrios.
  try {
    const params = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "co", addressdetails: "1", q: `${raw}, Bogotá, Colombia` });
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: { "Accept": "application/json", "User-Agent": "ProductosAliBot/1.0 (Cloudflare Worker)" }
    });
    if (response.ok) {
      const data = await response.json();
      const first = Array.isArray(data) ? data[0] : null;
      if (first) {
        const display = String(first.display_name || raw);
        const address = first.address || {};
        const localityText = [address.city_district, address.suburb, address.borough, address.quarter, address.neighbourhood].filter(Boolean).join(' ');
        const locality = matchLocalityFromText(localityText, bogotaPolicy) || matchLocalityFromText(display, bogotaPolicy) || "";
        const isBogota = /bogota|bogotá/.test(normalize(display));
        return {
          found: isBogota,
          isBogota,
          locality,
          displayLabel: locality || raw,
          source: "geocode"
        };
      }
    }
  } catch (error) {
    // silencio: si falla la geocodificación, el bot pide precisión.
  }

  return { found: false, isBogota: true, locality: "", displayLabel: raw };
}

function classifyZone(locality, deliveryPolicy) {
  const loc = normalize(locality || "");
  const entries = Object.entries(deliveryPolicy.zone_classes || {});
  for (const [key, item] of entries) {
    const list = Array.isArray(item.localities) ? item.localities : [];
    if (list.some((x) => normalize(x) === loc)) {
      return { key, ...item };
    }
  }
  const fallbackKey = deliveryPolicy.fallback_zone_class || "B";
  return { key: fallbackKey, ...(deliveryPolicy.zone_classes?.[fallbackKey] || EMBEDDED_DELIVERY_POLICY.zone_classes.B) };
}

function parsePaymentReference(text, now) {
  const q = normalize(text || "");
  if (/pago manana|pago mañana|mañana pago|manana pago/.test(q)) {
    const date = addCalendarDays(now.date, 1);
    return { date, dayKey: getDayKeyFromDate(date, now.timezone), referenceType: "future-day", label: "mañana", time: "09:00" };
  }
  const weekdays = [
    ["lunes", 1], ["martes", 2], ["miercoles", 3], ["miércoles", 3], ["jueves", 4], ["viernes", 5], ["sabado", 6], ["sábado", 6], ["domingo", 0]
  ];
  for (const [name, idx] of weekdays) {
    if (q.includes(`pago ${name}`) || q.includes(`si pago ${name}`)) {
      const date = nextWeekdayDate(now.date, idx);
      return { date, dayKey: getDayKeyFromDate(date, now.timezone), referenceType: "future-day", label: name, time: "09:00" };
    }
  }
  return { date: now.date, dayKey: now.dayKey, referenceType: "same-day", label: "hoy", time: now.time, timezone: now.timezone };
}

function buildPaymentAssumptionLine(payment, beforeCutoff, cutoff) {
  if (payment.referenceType !== "same-day") {
    return `Tomé el pago confirmado para ${payment.label} como referencia.`;
  }
  if (!cutoff) return "Tomé el pago confirmado hoy como referencia.";
  return beforeCutoff
    ? `Tomé el pago confirmado hoy antes del corte de ${cutoff} como referencia.`
    : `Tomé el pago confirmado hoy después del corte de ${cutoff} como referencia.`;
}

function buildScheduleReply(schedule) {
  const status = buildScheduleStatus(schedule);
  return status.reply;
}

function buildScheduleStatus(schedule) {
  const now = getTimeParts(schedule?.timezone || EMBEDDED_SCHEDULE.timezone);
  const dayConfig = schedule?.weekly_schedule?.[now.dayKey];
  const currentHours = now.time;
  const open = dayConfig?.open && dayConfig.from <= currentHours && currentHours <= dayConfig.to;
  if (open) {
    return { open: true, reply: `Estamos en horario hábil. Hoy atendemos hasta las ${dayConfig.to}.` };
  }
  if (dayConfig?.open) {
    return { open: false, reply: `Hoy nuestro horario es de ${dayConfig.from} a ${dayConfig.to}. ${schedule?.after_hours_behavior?.reply || EMBEDDED_SCHEDULE.after_hours_behavior.reply}` };
  }
  return { open: false, reply: schedule?.after_hours_behavior?.reply || EMBEDDED_SCHEDULE.after_hours_behavior.reply };
}

function searchCatalog(products, query, category = "", limit = 8) {
  const q = normalize(query);
  if (!q) return { query, category, count: 0, items: [] };

  const genericHome = /(aseo|hogar|limpieza)/.test(q);
  const list = products
    .filter((product) => !category || product.category === category)
    .map((product) => {
      const haystack = normalize([
        product.name,
        product.presentation,
        product.category,
        product.brand,
        product.sku,
        product.search_name
      ].join(" "));
      const terms = q.split(/\s+/).filter(Boolean);
      const numberTerms = terms.filter((t) => /^\d+$/.test(t));
      let score = 0;
      if (haystack.includes(q)) score += 8;
      if (genericHome && product.category === "detergentes-liquidos") score += 4;
      for (const term of terms) {
        if (haystack.includes(term)) score += 2;
      }
      for (const num of numberTerms) {
        if (haystack.includes(num)) score += 3;
      }
      return { item: product, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { query, category, count: list.length, items: list.map((x) => x.item) };
}

function bestProductMatch(products, text) {
  const q = normalize(text || "");
  const result = searchCatalog(products, q, "", 1);
  if (result.count > 0) {
    const item = result.items[0];
    const haystack = normalize([item.name, item.presentation, item.search_name].join(' '));
    const score = q.split(/\s+/).filter(Boolean).reduce((acc, term) => acc + (haystack.includes(term) ? 2 : 0), haystack.includes(q) ? 6 : 0);
    return { item, score };
  }
  return null;
}

function matchFaq(faq, normalizedMessage) {
  const list = Array.isArray(faq) ? faq : [];
  let best = null;
  for (const item of list) {
    const triggers = Array.isArray(item?.triggers) ? item.triggers : [];
    let score = 0;
    for (const trigger of triggers) {
      const t = normalize(trigger);
      if (t && normalizedMessage.includes(t)) score += Math.max(2, t.split(' ').length);
    }
    if (score > 0 && (!best || score > best.score)) best = { ...item, score };
  }
  return best;
}

function hasDeliveryIntent(msg, businessRules) {
  const keywords = (businessRules?.delivery_rules?.delivery_intent_keywords || EMBEDDED_BUSINESS_RULES.delivery_rules.delivery_intent_keywords).map(normalize);
  return keywords.some((word) => msg.includes(word));
}
function asksForSchedule(msg) { return /(horario|atienden|abren|cierran|hoy atienden|manana atienden|mañana atienden)/.test(msg); }
function asksForQuote(msg) { return /(cotiz|pedido|cantidad|quiero\s+\d+|serian\s+\d+|serían\s+\d+)/.test(msg); }
function asksForPayment(msg) { return /(medios de pago|formas de pago|como se paga|cómo se paga)/.test(msg); }
function asksForBrand(msg) { return /(que marca|qué marca|quien lo fabrica|quién lo fabrica|fabricante)/.test(msg); }
function asksForPrice(msg) { return /(precio|valor|cuanto vale|cuánto vale|cuanto cuesta|cuánto cuesta)/.test(msg); }
function asksForTotal(msg) { return /(cuanto tendria que pagar|cuánto tendría que pagar|total|subtotal|cuanto seria|cuánto sería)/.test(msg); }
function asksForDeliveryDate(msg) { return /(cuanto se demora|cuánto se demora|cuando llega|cuándo llega|para cuando|para cuándo|entrega)/.test(msg); }
function looksLikeProductSearch(msg) { return /(detergente|blanqueador|limpiador|desengrasante|aromatizante|servilleta|vaso|icopor|bolsa|empaque|lavaloza|jabon|jabón|aseo|hogar|hipoclorito)/.test(msg); }
function isGreetingOnly(msg) { return /^(hola|buen dia|buenos dias|buenas|buenas tardes|buenas noches|hey|holi|ola)$/.test(msg.trim()); }

function extractLocationCandidate(text, fallback = "") {
  const raw = String(text || "").trim();
  if (!raw) return fallback || "";
  const patterns = [
    /barrio\s+([^,.;\n]+)/i,
    /localidad\s+([^,.;\n]+)/i,
    /en\s+bogota\s+([^,.;\n]+)/i,
    /en\s+bogotá\s+([^,.;\n]+)/i,
    /seria para\s+([^,.;\n]+)/i,
    /sería para\s+([^,.;\n]+)/i
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return `${match[1]} ${raw}`.trim();
  }
  if (/(suba|kennedy|bosa|usme|chapinero|engativa|engativá|fontibon|fontibón|teusaquillo|ciudad bolivar|ciudad bolívar|rafael uribe|san cristobal|san cristóbal|usaquen|usaquén|lucero)/i.test(raw)) return raw;
  return fallback || "";
}

function extractQuantity(text) {
  const q = normalize(text || "");
  const digit = q.match(/(?:quiero|quisiera|necesito|serian|serían|x|por|llevaria|llevaría)?\s*(\d{1,3})\s*(?:unidad|unidades|und|unds|caja|cajas|galon|galones|litro|litros)?/);
  if (digit) return Math.max(1, Number(digit[1]));
  const words = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  for (const [word, value] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(q)) return value;
  }
  return 0;
}

function matchLocalityFromText(text, bogotaPolicy) {
  const q = normalize(text || "");
  for (const loc of bogotaPolicy.localities || []) {
    const names = [loc.name, ...(loc.aliases || [])].map(normalize);
    if (names.some((name) => q.includes(name))) return loc.name;
  }
  return "";
}

function getCutoffForDay(dayKey, deliveryPolicy) {
  if (dayKey === 'saturday') return deliveryPolicy?.payment_cutoff?.saturday || null;
  if (dayKey === 'sunday') return deliveryPolicy?.payment_cutoff?.sunday || null;
  return deliveryPolicy?.payment_cutoff?.monday_to_friday || null;
}

function getTimeParts(timezone) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const weekdayMap = {
    Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday', Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday', Sunday: 'sunday'
  };
  const date = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
  return {
    timezone,
    date,
    dayKey: weekdayMap[parts.weekday] || 'monday',
    time: `${parts.hour}:${parts.minute}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
}

function getDayKeyFromDate(date, timezone) {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
  const map = { Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday', Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday', Sunday: 'sunday' };
  return map[fmt.format(date)] || 'monday';
}

function addCalendarDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function nextWeekdayDate(date, targetDay) {
  const d = new Date(date.getTime());
  for (let i = 0; i < 8; i++) {
    d.setUTCDate(d.getUTCDate() + (i === 0 ? 0 : 1));
    if (d.getUTCDay() === targetDay && i > 0) return d;
  }
  return d;
}

function addBusinessDays(date, businessDays, schedule) {
  let current = new Date(date.getTime());
  let added = 0;
  while (added < businessDays) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayKey = getDayKeyFromDate(current, schedule?.timezone || EMBEDDED_SCHEDULE.timezone);
    if (schedule?.weekly_schedule?.[dayKey]?.open) {
      added += 1;
    }
  }
  return current;
}

function formatDateEs(date) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function formatCop(valueInThousands) {
  const amount = Math.round(Number(valueInThousands || 0) * 1000);
  return `$${amount.toLocaleString('es-CO')}`;
}

function fullProductName(product) {
  if (!product) return '';
  return `${product.name}${product.presentation ? ` - ${product.presentation}` : ''}`;
}
function productLabel(productQuery) { return String(productQuery || '').replace(/\*+/g, '').trim(); }
function normalize(text) { return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function safeJson(text) { try { return JSON.parse(text); } catch { return {}; } }
function isFiniteNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const items = Array.isArray(data?.output) ? data.output : [];
  const texts = [];
  for (const item of items) {
    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const content of item.content) {
        if (content?.type === 'output_text' && content.text) texts.push(content.text);
      }
    }
  }
  return texts.join('\n').trim();
}
function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  const out = { ...(base || {}) };
  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && !Array.isArray(base[key])) out[key] = deepMerge(base[key], value);
    else out[key] = value;
  }
  return out;
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() } });
}
