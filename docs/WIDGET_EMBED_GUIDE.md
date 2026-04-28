# Manual de implementação do Widget em outro website (limpo e seguro)

Este guia descreve como integrar o widget flutuante (que expande para modal) em um site externo, seguindo boas práticas de segurança e as normas deste projeto.

## 1) Pré-requisitos

- URL pública do widget (ex.: `https://widget.seudominio.com/widget`).
- Domínio(s) do site que irá embutir o widget (host parent).
- HTTPS obrigatório em ambos os lados.

## 2) Arquitetura recomendada

- O widget deve existir em uma rota dedicada (`/widget`) e isolada do restante da aplicação.
- O site host deve apenas embutir o widget via `<iframe>`.
- O widget controla seu próprio estado visual (flutuante + expansão modal) internamente.

## 3) Configuração de segurança (obrigatória)

### 3.1 `frame-ancestors` (CSP)
No serviço do widget, configure a variável com os domínios autorizados a embutir o iframe:

```bash
WIDGET_FRAME_ANCESTORS="'self' https://site-host.com https://www.site-host.com"
```

### 3.2 `allowedOrigins` para `postMessage`
No `src` do iframe, passe a allowlist de origins que poderão conversar com o widget:

```text
.../widget?allowedOrigins=https://site-host.com
```

### 3.3 `allowedHosts` (somente dev/preview Vite)
Para ambientes com Vite dev/preview, opcionalmente configure:

```bash
WIDGET_PREVIEW_ALLOWED_HOSTS="site-host.com,www.site-host.com"
```

> Em produção com Nginx estático, este controle não é usado pelo runtime final.

## 4) Snippet de embed seguro (site host)

Use este padrão no site externo:

```html
<iframe
  id="ifce-widget"
  src="https://widget.seudominio.com/widget?allowedOrigins=https://site-host.com&autoOpen=true&initialState=start"
  title="Assistente virtual"
  referrerpolicy="no-referrer"
  sandbox="allow-scripts allow-same-origin"
  allow="autoplay"
  loading="lazy"
  style="position:fixed;right:16px;bottom:16px;width:380px;height:680px;border:0;z-index:9999;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2)"
></iframe>
```

## 5) Comunicação opcional com `postMessage`

### 5.1 Widget pronto
O widget emite `NEOTALK_WIDGET_READY` quando inicializa.

### 5.2 Envio de configuração do host para o widget
No host:

```html
<script>
  const iframe = document.getElementById('ifce-widget');

  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://widget.seudominio.com') return;
    if (event.data?.type === 'NEOTALK_WIDGET_READY') {
      iframe.contentWindow.postMessage(
        {
          type: 'NEOTALK_WIDGET_CONFIG',
          payload: {
            autoOpen: true,
            initialState: 'start'
          }
        },
        'https://widget.seudominio.com'
      );
    }
  });
</script>
```

## 6) Regras de hardening no host

- Nunca use `targetOrigin='*'` em `postMessage`.
- Sempre valide `event.origin`.
- Não passe tokens/sessão/cookies via query string ou `postMessage`.
- Evite permissões excessivas no `sandbox` do iframe.

## 7) Comportamento UX esperado

- Widget inicia flutuante no canto inferior direito.
- Ao clicar, expande para modo modal (full overlay) dentro do iframe.
- Fecha/minimiza sem navegação de página no host.

## 8) Checklist de validação

### Segurança
- [ ] `/widget` responde com CSP/Referrer-Policy/Permissions-Policy/X-Content-Type-Options.
- [ ] `frame-ancestors` restrito aos hosts aprovados.
- [ ] Links externos com `noopener,noreferrer`.
- [ ] `postMessage` restrito por allowlist.

### Funcional
- [ ] Rota `/widget` abre direto sem 404.
- [ ] Embed funciona em página host real.
- [ ] Fluxo de chat, TTS, legendas dinâmicas e referências funcionando.

## 9) Troubleshooting

### Erro: `This host is not allowed`
- Isso é do Vite dev/preview. Verifique `WIDGET_PREVIEW_ALLOWED_HOSTS`.
- Em produção Nginx, esse erro não deve ocorrer.

### Erro: `/widget` 404
- Verifique fallback SPA no Nginx (`try_files $uri $uri/ /index.html;`).
- Verifique se a rota `/widget` está registrada no React Router.

## 10) Deploy recomendado

- Build estático (`npm run build`) + Nginx.
- Nunca expor preview do Vite como runtime final de produção.
- Revisar periodicamente CSP e allowlists.
