# EMBED SECURITY REMEDIATION — 2026-04-29

## Achados corrigidos (P0/P1)

1. **Handshake `postMessage` reforçado no loader (P0)**
   - Validação de `event.origin`.
   - Validação de `event.source === iframe.contentWindow`.
   - Validação de schema mínimo (`event.data` objeto + `type` esperado).
   - Rejeição por padrão de mensagens inesperadas.

2. **Integração dos utilitários de segurança no runtime do widget (P0)**
   - Parsing seguro de query params com `getWidgetConfigFromQuery`.
   - Sanitização de allowlist de origins com `sanitizeOrigins`.
   - Validação de mensagens com `parseWidgetMessage` e aplicação de patch com `sanitizeWidgetConfigPatch`.
   - Logging defensivo com redaction via `logWidgetError`.

3. **Fail-closed explícito no loader (P1)**
   - Validação de `data-widget-url`.
   - Validação de `data-widget-origin`.
   - Abort da inicialização em configuração inválida.
   - Registro de erro não sensível com código e timestamp.

## Arquivos alterados

- `embeds/widget-loader.js`
- `src/pages/Widget.tsx`
- `EMBED_SECURITY_REMEDIATION_2026-04-29.md`

## Evidência da correção

- Loader:
  - existência de `toOrigin` + validações de URL/origin e abort em falha.
  - validação de `origin`, `source` e schema mínimo no listener de `message`.
- Widget runtime:
  - uso efetivo de `src/lib/widget-security.ts` para parsing/sanitização/validação.
  - validação de `event.source` e `event.origin` no recebimento de mensagens.
- Build:
  - `npm run build` executado com sucesso.

## Riscos residuais

1. **Dependência operacional de allowlist correta** (`allowedOrigins` e `frame-ancestors`) por ambiente.
2. **Falhas por reescrita de headers no caminho CDN/WAF/proxy** podem quebrar embed mesmo com app correto.
3. **`allow-same-origin` no sandbox** continua sendo tradeoff arquitetural aceito para compatibilidade atual.
4. **Lint preexistente** fora do escopo pode impedir gate estrito de qualidade.

## Recomendações para validação em ambiente real (CDN/WAF)

1. Verificar headers finais no edge (não apenas no origin):
   - `/` com XFO + CSP anti-frame;
   - `/widget` com CSP `frame-ancestors` esperado e sem XFO.
2. Confirmar que CDN/WAF não remove/altera:
   - `Content-Security-Policy`
   - `Referrer-Policy`
   - `Permissions-Policy`
   - `X-Content-Type-Options`
3. Testar embed em host autorizado e não autorizado:
   - autorizado deve carregar;
   - não autorizado deve ser bloqueado por CSP.
4. Validar handshake de mensagens em browser devtools:
   - aceitar apenas origin/source esperados;
   - rejeitar tipos inesperados.
5. Validar logs de erro sem dados sensíveis (token/cookie/session/password).
