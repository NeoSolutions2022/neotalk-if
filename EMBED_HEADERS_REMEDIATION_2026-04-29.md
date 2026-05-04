# EMBED HEADERS REMEDIATION — 2026-04-29

## Objetivo da mudança

Remediar o risco residual de embed no `nginx.conf`, garantindo:
- proteção anti-clickjacking para rotas gerais;
- embed permitido **somente** para `/widget` com allowlist explícita de domínios via `CSP frame-ancestors`;
- compatibilidade com terceiros autorizados (sem bloqueio indevido por `X-Frame-Options: SAMEORIGIN` na rota do widget).

## O que foi alterado

1. Mantida proteção global para rotas gerais (`location /`):
   - `X-Frame-Options: SAMEORIGIN`
   - `Content-Security-Policy` com `frame-ancestors 'self'`

2. Ajuste específico em `/widget` (`location = /widget`):
   - removido `X-Frame-Options` para evitar bloqueio de embed externo autorizado;
   - aplicado `CSP` dedicada com `frame-ancestors $widget_frame_ancestors`.

3. Preparação para parametrização por ambiente:
   - variável `set $widget_frame_ancestors "'self'";` com comentários de exemplos DEV/IFCE/BrasilSeg para substituição em deploy.

## Headers finais esperados

## 1) Para `/widget`

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: accelerometer=(), autoplay=(self), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()`
- **Sem `X-Frame-Options`** (intencional)
- `Content-Security-Policy` contendo, entre outros:
  - `default-src 'none'`
  - `script-src 'self'`
  - `style-src 'self' 'unsafe-inline'`
  - `media-src/frame-src` restritos ao Vimeo previsto
  - `frame-ancestors $widget_frame_ancestors` (allowlist explícita)

## 2) Para demais rotas (`/` e fallback SPA)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: accelerometer=(), autoplay=(self), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy` com:
  - `default-src 'self'`
  - `base-uri 'self'`
  - `form-action 'self'`
  - `frame-ancestors 'self'`

## Exemplos de allowlist por ambiente

Use estes valores na substituição de `$widget_frame_ancestors` em deploy:

- **DEV (localhost):**
  - `'self' http://localhost:3000 http://127.0.0.1:3000`

- **IFCE:**
  - `'self' https://portal.ifce.edu.br https://www.ifce.edu.br`

- **BrasilSeg:**
  - `'self' https://app.brasilseg.com.br https://www.brasilseg.com.br`

## Riscos residuais

1. Se a variável/templating de deploy não for aplicada, `/widget` ficará restrito a `'self'` (seguro, porém pode quebrar embed em terceiros).
2. Caso a allowlist inclua domínios indevidos, haverá ampliação indevida da superfície de embed.
3. `style-src 'unsafe-inline'` foi mantido por compatibilidade do frontend atual; ideal reduzir quando possível.

## Como validar manualmente

## Com `curl`

1. Verificar rota principal:
```bash
curl -I https://SEU_DOMINIO/
```
Esperado: `X-Frame-Options: SAMEORIGIN` e CSP com `frame-ancestors 'self'`.

2. Verificar rota do widget:
```bash
curl -I https://SEU_DOMINIO/widget
```
Esperado: **sem `X-Frame-Options`** e CSP com `frame-ancestors ...` contendo allowlist do ambiente.

## No browser

1. Abra DevTools > Network e inspecione headers de resposta de `/` e `/widget`.
2. Teste embed do `/widget` em um domínio autorizado (deve carregar).
3. Teste embed em domínio não autorizado (deve ser bloqueado por CSP `frame-ancestors`).
