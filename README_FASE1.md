# Fase 1 - Web + bot base

## Qué trae este paquete
- `public/index.html` → página base responsive
- `public/style.css` → estilos mobile-first
- `public/app.js` → interacción de la web + chat
- `public/products.json` → productos cargados desde tu Excel
- `public/zones.json` → zonas ejemplo para entrega
- `worker/bot-worker.js` → backend base para conectar OpenAI

## Qué hace ya mismo
- La web funciona en celular y escritorio.
- El bot aparece como un robot con forma de botella/producto.
- Si el endpoint `/api/chat` no está configurado, usa un modo local de respaldo.
- Si montas el Worker, el chat ya puede hablar con OpenAI.

## Pasos sugeridos
1. Reemplaza los archivos de `public` en tu repo.
2. Verifica que la página se vea bien en Cloudflare.
3. Despliega el Worker del archivo `worker/bot-worker.js`.
4. Crea el secret `OPENAI_API_KEY` en Cloudflare.
5. Si usas otro dominio o ruta para el Worker, cambia `state.apiEndpoint` en `public/app.js`.

## Nota importante
El bot está configurado para no mencionar marcas proveedoras de forma espontánea.
