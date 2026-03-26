/**
 * Worker base para la fase 1 del bot.
 * Guarda tu API key de OpenAI como secret llamado OPENAI_API_KEY.
 * Opcional: define OPENAI_MODEL, por ejemplo gpt-5.4-mini.
 *
 * Este Worker expone POST /api/chat
 * y usa function calling para consultar catálogo y zonas.
 */

const SYSTEM_PROMPT = `
Eres un asistente comercial para un catálogo con dos categorías:
1) detergentes líquidos
2) varios y desechables

Objetivos:
- orientar al cliente
- responder preguntas sobre productos, precios y presentaciones
- ayudar con una cotización preliminar
- dar estimados de entrega por zona usando la información disponible
- pedir datos faltantes de forma breve y clara

Reglas:
- no inventes precios ni productos
- no inventes stock
- no inventes tiempos exactos de entrega
- no menciones marcas proveedoras de manera espontánea
- si preguntan por una marca o fabricante, responde de forma neutra y comercial
- si la pregunta no tiene suficientes datos, pide una aclaración corta
- responde en español latino, con tono amable, concreto y vendedor
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const result = await handleChat(body, request, env);
        return json(result, 200);
      } catch (error) {
        return json(
          { error: "No fue posible procesar la solicitud.", detail: String(error?.message || error) },
          500
        );
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

async function handleChat(body, request, env) {
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  if (!message) {
    return { reply: "Cuéntame qué necesitas y te ayudo con productos, precios o una cotización preliminar." };
  }

  // Si tu Worker vive en un dominio distinto al sitio, reemplaza request.url por el origin del catálogo.
  const catalogUrl = new URL("/products.json", request.url).toString();
  const zonesUrl = new URL("/zones.json", request.url).toString();

  const [products, zones] = await Promise.all([
    fetch(catalogUrl).then((r) => r.json()),
    fetch(zonesUrl).then((r) => r.json())
  ]);

  const tools = [
    {
      type: "function",
      name: "search_catalog",
      description: "Busca productos por nombre, categoría o presentación.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: {
            type: "string",
            enum: ["detergentes-liquidos", "varios-desechables", ""]
          },
          limit: { type: "integer", minimum: 1, maximum: 12 }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "estimate_delivery",
      description: "Da un estimado de entrega según zona o barrio.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" }
        },
        required: ["location"]
      }
    }
  ];

  let input = [
    { role: "system", content: SYSTEM_PROMPT },
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
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.4-mini",
        input,
        tools
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI error");
    }

    const output = data.output || [];
    const functionCalls = output.filter((item) => item.type === "function_call");

    if (!functionCalls.length) {
      const reply = extractText(data);
      return { reply: reply || "No pude generar una respuesta útil en este momento." };
    }

    const toolOutputs = [];

    for (const call of functionCalls) {
      const args = safeJson(call.arguments);

      if (call.name === "search_catalog") {
        const result = searchCatalog(products, args?.query || "", args?.category || "", args?.limit || 8);
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result)
        });
      }

      if (call.name === "estimate_delivery") {
        const result = estimateDelivery(zones, args?.location || "");
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result)
        });
      }
    }

    input = [{ type: "response", id: data.id }, ...toolOutputs];
  }

  return { reply: "Puedo ayudarte con productos, precios y entregas. Intenta con una pregunta más concreta." };
}

function searchCatalog(products, query, category = "", limit = 8) {
  const q = normalize(query);
  const filtered = products
    .filter((product) => !category || product.category === category)
    .map((product) => {
      const haystack = normalize([product.name, product.presentation, product.category].join(" "));
      const score =
        (haystack.includes(q) ? 3 : 0) +
        (haystack.startsWith(q) ? 2 : 0) +
        q.split(" ").filter(Boolean).reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);

  return {
    query,
    category,
    count: filtered.length,
    items: filtered
  };
}

function estimateDelivery(zones, location) {
  const q = normalize(location);
  const zone =
    zones.find((item) =>
      item.areas.some((area) => q.includes(normalize(area))) || q.includes(normalize(item.label))
    ) || null;

  if (!zone) {
    return {
      matched: false,
      message: "No pude ubicar esa zona con precisión. Pide barrio, localidad o ciudad para un estimado."
    };
  }

  return {
    matched: true,
    zone: zone.label,
    estimate: zone.estimate,
    delivery_fee_note: zone.delivery_fee_note
  };
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function extractText(data) {
  try {
    const textParts = [];
    for (const item of data.output || []) {
      if (item.type === "message") {
        for (const piece of item.content || []) {
          if (piece.type === "output_text" && piece.text) textParts.push(piece.text);
        }
      }
    }
    return textParts.join("\n").trim();
  } catch {
    return "";
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}
