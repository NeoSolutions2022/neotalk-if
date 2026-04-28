# Implementação direta em outro website (host)

Este documento é a implementação do **lado do site externo** para consumir o widget já pronto.

## 1) Copie o loader

Copie `embeds/widget-loader.js` para os assets do site host.

## 2) Inclua no HTML do host

```html
<script
  src="/assets/widget-loader.js"
  data-widget-url="https://widget.seudominio.com/widget"
  data-widget-origin="https://widget.seudominio.com"
  data-right="16px"
  data-bottom="16px"
  defer
></script>
```

Isso cria automaticamente:
- botão flutuante;
- abertura em modal com overlay;
- iframe seguro com `sandbox`, `allow`, `referrerpolicy`;
- handshake `postMessage` com validação de origin.

## 3) Requisitos no serviço do widget

- `WIDGET_FRAME_ANCESTORS` deve incluir o domínio do host.
- O endpoint `/widget` deve estar ativo.

## 4) Checklist rápido

- [ ] botão aparece no canto inferior direito
- [ ] ao clicar, abre modal com iframe
- [ ] ao clicar fora, fecha
- [ ] não há erro de host bloqueado
