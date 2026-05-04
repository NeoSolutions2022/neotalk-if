# EMBED SECURITY REVIEW — NeoTalk Chat (2026-04-29)

## Resumo executivo

A arquitetura de embed do NeoTalk Chat já possui controles relevantes (sandbox de iframe, `targetOrigin` explícito, validação de `event.origin`, CSP dedicada em `/widget`, e `frame-ancestors` com allowlist prevista no Nginx).  

Entretanto, a revisão encontrou lacunas importantes de robustez para ambientes institucionais multi-cliente:

1. **Validações incompletas no canal `postMessage` do loader** (não valida `event.source` nem formato de payload) — risco **médio**.
2. **Biblioteca de parsing/sanitização (`src/lib/widget-security.ts`) existe, mas não está integrada ao fluxo do widget** — risco **médio** por falsa sensação de cobertura.
3. **`data-widget-url` e `data-widget-origin` no loader não têm fail-closed explícito com tratamento de erro robusto** — risco **médio**.
4. **Dependência de mídia externa (Vimeo) sem estratégia clara de fallback/telemetria operacional** — risco **baixo/médio** (resiliência e observabilidade).

No estado atual, o modelo está **razoavelmente bom para MVP controlado**, mas ainda **não ideal para postura enterprise/pentest formal** sem reforços no handshake, validações e operação.

---

## Arquitetura de embed identificada

### Fluxo atual (alto nível)
1. Site host injeta `embeds/widget-loader.js` com `data-widget-url` e `data-widget-origin`.
2. Loader cria botão, overlay e iframe em runtime.
3. Loader define query params (`allowedOrigins`, `autoOpen`, `initialState`) no `src` do iframe.
4. Host escuta `message` do widget e, ao receber `NEOTALK_WIDGET_READY`, envia `NEOTALK_WIDGET_CONFIG` com `postMessage` usando `targetOrigin` explícito.
5. No runtime Nginx:
   - rotas gerais: proteção anti-frame (`X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`);
   - `/widget`: sem `X-Frame-Options` (intencional), CSP dedicada com `frame-ancestors $widget_frame_ancestors`.

---

## Achados por severidade

## [MÉDIA] M1 — `postMessage` no loader valida origem, mas não valida `source` nem esquema completo da mensagem

**Impacto:** qualquer janela/frame com a mesma `origin` pode disparar `NEOTALK_WIDGET_READY` e forçar envio de config, aumentando superfície de spoofing lógico do handshake.  

**Evidência:** no listener de `message`, há validação de `event.origin` e tipo, mas não há `event.source === iframe.contentWindow` nem validação estrutural rígida de payload.

**Recomendação:**
- Exigir `event.source === iframe.contentWindow`.
- Validar schema mínimo da mensagem recebida (tipo + estrutura esperada).
- Ignorar mensagens extras/desconhecidas por default (deny-by-default).

---

## [MÉDIA] M2 — Funções de segurança do widget parecem não estar conectadas ao runtime

**Impacto:** o repositório possui utilitários de sanitização/parsing robustos, mas sem uso efetivo no fluxo de página/widget, criando risco de drift entre “segurança pretendida” e “segurança real”.  

**Evidência:** `src/lib/widget-security.ts` define `sanitizeOrigins`, `parseWidgetMessage`, `sanitizeWidgetConfigPatch`, etc., mas não há import/uso no restante de `src/`.

**Recomendação:**
- Integrar esses utilitários no bootstrap da rota `/widget`.
- Centralizar processamento de query/postMessage em único ponto testável.

---

## [MÉDIA] M3 — Loader sem fail-closed explícito para configuração inválida de URL/origin

**Impacto:** erro de configuração em `data-widget-url`/`data-widget-origin` pode causar falhas silenciosas, comportamento inesperado de handshake e diagnósticos difíceis em clientes institucionais.

**Evidência:** loader usa fallback e `new URL(WIDGET_BASE_URL)` sem bloco de tratamento explícito para abortar inicialização com log claro e estado seguro.

**Recomendação:**
- Validar URL/origin no início e abortar criação do widget se inválidas.
- Logar erro não sensível com código de falha.
- Opcional: renderizar estado mínimo de indisponibilidade (sem expor internals).

---

## [BAIXA] L1 — Sandbox do iframe adequado, porém com tradeoff conhecido de `allow-same-origin`

**Impacto:** `sandbox="allow-scripts allow-same-origin"` é comum para apps SPA, mas reduz isolamento comparado ao sandbox estrito.

**Evidência:** iframe usa `allow-scripts allow-same-origin` e `allow="autoplay"`.

**Recomendação:**
- Manter se necessário ao funcionamento, mas registrar threat model da decisão.
- Revisar periodicamente possibilidade de retirar `allow-same-origin` (se arquitetura permitir).

---

## [BAIXA] L2 — Resiliência/observabilidade para mídia externa pode ser melhor definida

**Impacto:** dependência de Vimeo pode afetar UX quando rede/política de cliente bloqueia mídia externa; ausência de telemetria padronizada dificulta operação.

**Evidência:** conteúdo do chat usa URLs Vimeo; CSP libera Vimeo para mídia/frame.

**Recomendação:**
- Definir fallback visual/comportamental quando vídeo não carregar.
- Adotar eventos de telemetria sem dados sensíveis para falhas de mídia/embed.

---

## Evidência por arquivo

- `embeds/widget-loader.js`
  - `targetOrigin` explícito no `postMessage`.
  - validação de `event.origin` presente.
  - ausência de validação `event.source`.
  - sandbox/allow/referrerpolicy do iframe.

- `nginx.conf`
  - rotas gerais com `X-Frame-Options: SAMEORIGIN` + CSP anti-frame.
  - `/widget` com CSP dedicada e `frame-ancestors $widget_frame_ancestors`.
  - ausência intencional de `X-Frame-Options` no `/widget` para embed autorizado.

- `src/lib/widget-security.ts`
  - parser/sanitização de query/message e redaction de logs sensíveis.
  - aparentemente sem integração ativa no runtime.

- `docs/WIDGET_EMBED_GUIDE.md`
  - orientações defensivas corretas (não usar `*`, validar origin, sandbox mínimo).
  - requer garantia de aderência no código final implantado.

---

## Correções recomendadas (priorizadas)

1. **P0:** reforçar handshake `postMessage` no loader com `event.source` + validação de schema + deny-by-default.
2. **P0:** integrar `src/lib/widget-security.ts` no runtime efetivo do widget (`/widget`) para query/postMessage.
3. **P1:** implementar fail-closed explícito do loader para `data-widget-url`/`data-widget-origin` inválidos.
4. **P1:** formalizar matriz por ambiente para `frame-ancestors` (DEV/HML/PROD) no pipeline de deploy.
5. **P2:** adicionar telemetria defensiva padronizada (falhas de iframe, mídia, handshake), com redaction de dados sensíveis.

---

## Riscos residuais

- Erro operacional de allowlist (`frame-ancestors`) em produção pode bloquear embeds legítimos ou abrir escopo indevido.
- Controles de segurança de integração dependem do host terceiro seguir guia (origins, sandbox e não expor dados em query).
- Sem validação de `event.source`, ainda há superfície lógica no canal de mensagens.
- Sem validação final em ambiente real (WAF/CDN/proxy corporativo), parte do risco é desconhecida.

---

## Checklist de validação manual (pré-pentest)

1. **Headers por rota**
   - `/` retorna `X-Frame-Options: SAMEORIGIN` e CSP com `frame-ancestors 'self'`.
   - `/widget` não retorna XFO e retorna CSP com allowlist explícita.

2. **Handshake `postMessage`**
   - confirmar que mensagens só são aceitas de origin permitido.
   - confirmar rejeição de tipos inesperados.
   - confirmar (após correção) validação de `event.source`.

3. **Sandbox/permissões iframe**
   - validar que apenas `allow-scripts allow-same-origin` + `allow=autoplay` estão ativos.
   - validar ausência de permissões extras.

4. **Failover de mídia externa**
   - simular bloqueio de Vimeo e verificar degradação controlada.

5. **Logs e privacidade**
   - verificar que logs de erro não incluem token/cookie/session/password.

6. **Allowlist por ambiente**
   - validar DEV/HML/PROD com domínios corretos e sem curingas indevidos.

---

## O que pode ser afirmado em reunião / RFI

- O produto já adota modelo de embed com rota dedicada (`/widget`) e política de framing restrita por CSP (`frame-ancestors`) no runtime Nginx.
- Rotas gerais são protegidas contra framing/clickjacking por dupla camada (`X-Frame-Options` + CSP).
- O canal `postMessage` usa `targetOrigin` explícito e validação de `origin`.
- Há diretrizes documentadas para hardening de integração em host terceiro.

## O que ainda precisa de validação no ambiente final

- Configuração real de `frame-ancestors` por cliente/ambiente no pipeline de deploy.
- Comportamento real com CDN/WAF/proxy corporativo e eventuais reescritas de header.
- Observabilidade operacional (falha de embed, falha de mídia, bloqueios por CSP).
- Evidência de integração efetiva das funções de sanitização/parsing do widget em produção.

---

## Método e escopo

- Revisão manual defensiva de código e configuração (sem exploração ofensiva, sem PoC ofensiva, sem alteração funcional automática).
- Arquivos principais inspecionados: `embeds/widget-loader.js`, `nginx.conf`, `src/lib/widget-security.ts`, `docs/WIDGET_EMBED_GUIDE.md`.

## Status de correções aplicadas após revisão

- Implementada validação de `event.source` no loader e no widget.
- Implementado fail-closed no loader para URL/origin inválidos.
- Integrado `src/lib/widget-security.ts` no runtime de `/widget` para sanitização/parsing.
