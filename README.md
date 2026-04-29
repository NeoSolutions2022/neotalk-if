# NeoTalk IF - Chat/Avatar

## Desenvolvimento local

```sh
npm i
npm run dev
```

## Rotas

- App principal: `/`
- Widget isolado: `/widget`

A rota `/widget` renderiza apenas o chat/avatar e foi preparada para embed em iframe com política de segurança dedicada.

## Embed seguro (iframe)

Exemplo recomendado (troque os domínios pelos seus):

```html
<iframe
  src="https://SEU_DOMINIO/widget?allowedOrigins=https://portal.externo.com&autoOpen=true&initialState=start"
  title="Assistente virtual IFCE"
  referrerpolicy="no-referrer"
  sandbox="allow-scripts allow-same-origin"
  allow="autoplay"
  loading="lazy"
  style="width: 100%; max-width: 420px; height: 720px; border: 0;"
></iframe>
```

## postMessage opcional com allowlist

O widget aceita configuração opcional via `postMessage` apenas de `origins` que estejam na query string `allowedOrigins`.

Mensagem aceita:

```js
iframe.contentWindow.postMessage(
  {
    type: 'NEOTALK_WIDGET_CONFIG',
    payload: {
      autoOpen: true,
      initialState: 'start'
    }
  },
  'https://SEU_DOMINIO_DO_WIDGET'


## Manual de integração em outro website

Consulte o guia completo em `docs/WIDGET_EMBED_GUIDE.md`.
- Implementação pronta para site host: `docs/WIDGET_HOST_IMPLEMENTATION.md` e `embeds/widget-loader.js`.

);
```

Mensagem emitida pelo widget quando pronto:

```js
window.addEventListener('message', (event) => {
  if (event.data?.type === 'NEOTALK_WIDGET_READY') {
    console.log('Widget pronto', event.data.payload);
  }
});
```

## Segurança implementada no widget

- CSP restritiva para `/widget`.
- `Referrer-Policy: no-referrer`.
- `Permissions-Policy` mínima.
- `frame-ancestors` com allowlist por variável `WIDGET_FRAME_ANCESTORS`.
- Links externos abertos com `noopener,noreferrer`.
- Sanitização de parâmetros externos (query string e `postMessage`).
- Logs de erro sem campos sensíveis (cookie/session/token/password).

## Qualidade

- Teste básico de render da rota `/widget`: `npm run test`.
- Script SAST (equivalente via lint com regras estáticas): `npm run sast`.
