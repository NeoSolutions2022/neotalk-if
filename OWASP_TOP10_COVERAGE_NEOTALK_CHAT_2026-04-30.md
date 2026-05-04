# OWASP TOP 10 2021 — Cobertura complementar NeoTalk Chat (2026-04-30)

## 1) Resumo executivo

Foi executada revisão complementar baseada no OWASP Top 10 2021 para o NeoTalk Chat (widget público sem login).  
Resultado geral:
- controles de embed e headers por rota estão ativos para `/` e `/widget` (com evidência positiva em múltiplas respostas);
- não foram observados sinais diretos de injeção refletida nos testes simples de query string;
- dependências de produção estão sem vulnerabilidades no `npm audit --omit=dev`;
- `npm audit` completo ainda aponta vulnerabilidades em dev/toolchain;
- há instabilidade/intermitência em algumas respostas do edge (`502`) que precisa de investigação operacional antes de produção.

## 2) Escopo

- BASE_URL: `https://infra-neotalkif.k3p3ex.easypanel.host/`
- Rotas: `/`, `/widget`, `/embeds/widget-loader.js`, endpoints públicos do mesmo domínio
- Análise estática complementar do repositório

## 3) Metodologia

1. Verificação ativa de headers por rota (`check.py`, `curl -I`).
2. Testes simples de superfície pública (rotas sensíveis e query params em `/widget`).
3. Checagens estáticas de CSP, embed config e segredos.
4. Auditoria de componentes (`npm audit --omit=dev` e `npm audit` completo).
5. Classificação de achados por severidade e mapeamento OWASP.

## 4) Matriz OWASP Top 10 x NeoTalk Chat

### A01 Broken Access Control
- **Cobertura:** parcial.
- **Teste:** acesso a `/admin`, `/api`, `/src`, `/dist`, `/build`, `/.git/config`, etc.
- **Resultado:** várias rotas retornam `200`, porém com padrão de SPA fallback (index), não evidência direta de recurso interno exposto.
- **Risco:** médio (é necessário confirmar no corpo/resposta e no origin que não há arquivos sensíveis reais sendo servidos).

### A02 Cryptographic Failures
- **Cobertura:** parcial.
- **Teste:** HTTPS em uso; scan estático de segredos; observação de query/logs.
- **Resultado:** sem segredos óbvios no repositório (heurístico); sem evidência de token/cookie sensível nos testes executados.
- **Risco:** baixo/médio (falta validar política de cookies/telemetria no edge completo).

### A03 Injection
- **Cobertura:** parcial.
- **Teste:** payloads simples em query params de `/widget`.
- **Resultado:** sem reflexão explícita de payload em HTML de resposta; CSP restritiva de `/widget` aplicada quando resposta 200.
- **Risco:** baixo (com base nos testes simples realizados).

### A04 Insecure Design
- **Cobertura:** boa (revisão arquitetural + controles).
- **Resultado:** modelo de iframe com allowlist, validação de `postMessage`, fail-closed no loader.
- **Risco:** médio residual por dependência de configuração operacional correta (allowlist + proxy/edge).

### A05 Security Misconfiguration
- **Cobertura:** boa.
- **Teste:** headers em `/` e `/widget`, CSP/frame-ancestors, arquivos sensíveis.
- **Resultado:** `/` com XFO+ CSP self; `/widget` sem XFO e CSP de allowlist quando rota responde corretamente; porém respostas 502 intermitentes indicam risco operacional de misconfig/edge.
- **Risco:** médio.

### A06 Vulnerable and Outdated Components
- **Cobertura:** boa.
- **Teste:** `npm audit --omit=dev` e `npm audit` completo.
- **Resultado:** produção sem vulnerabilidades; dev/toolchain com achados (inclui high/moderate).
- **Risco:** médio.

### A07 Identification and Authentication Failures
- **Aplicabilidade:** baixa/não aplicável ao widget público sem login.
- **Observação:** não houve descoberta de endpoint de auth real no escopo testado.

### A08 Software and Data Integrity Failures
- **Cobertura:** parcial.
- **Resultado:** lockfile presente; pipeline/scripts existem; dependência de scripts externos (loader embed) sugere recomendação de governança e SRI quando aplicável no host.
- **Risco:** médio.

### A09 Security Logging and Monitoring Failures
- **Cobertura:** parcial.
- **Resultado:** há logging defensivo no código do widget, mas observabilidade enterprise no runtime (SIEM/monitoring/alertas) não é comprovada por este teste.
- **Risco:** médio.

### A10 SSRF
- **Aplicabilidade:** baixa (sem backend fetcher no escopo atual).
- **Risco atual:** informativo; risco futuro caso backend/API passe a buscar URLs externas.

## 5) Testes executados

- `python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"`
- `npm audit --omit=dev`
- `npm audit`
- `python security-tests/check_csp.py`
- `python security-tests/check_embed_config.py`
- `python security-tests/check_secrets_static.py`
- `curl -I /`, `/widget`, `/embeds/widget-loader.js`
- testes simples de rotas sensíveis
- testes simples de query params em `/widget`
- detecção de ZAP (`ZAP_NOT_FOUND`)

## 6) Achados por severidade

### Alto
1. `npm audit` completo reporta vulnerabilidades em dev/toolchain (inclui severidade alta).

### Médio
1. Respostas intermitentes `502` em algumas requisições de `/widget` e `/embeds/widget-loader.js` no edge.
2. Rotas sensíveis retornando `200` (provável SPA fallback) exigem validação manual para garantir ausência de exposição real.
3. Dependência de configuração correta no edge/proxy para manter política de segurança consistente.

### Baixo
1. Itens de hardening operacional pendentes (monitoramento/alertas/gate CI fully green).

### Informativo
1. `/` e `/widget` mostraram headers esperados em parte das validações (incluindo `x-neotalk-policy` distinto e CSP específica em `/widget`).

## 7) Itens não aplicáveis e justificativa

- **A07 (Auth Failures):** widget público sem login no escopo atual.
- **A10 (SSRF):** sem backend no escopo buscando URL externa.

## 8) Correções recomendadas antes de produção

1. Estabilizar o edge/proxy para eliminar `502` intermitente em `/widget` e `/embeds/widget-loader.js`.
2. Confirmar que rotas sensíveis (`/admin`, `/api`, `/src`, etc.) não expõem conteúdo real (retorno 404/deny desejável quando apropriado).
3. Tratar vulnerabilidades de dev/toolchain (`npm audit`) com plano controlado de atualização.
4. Tornar `validate:security` gate obrigatório após saneamento de lint legado.
5. Executar baseline DAST (ZAP) em runner com ferramenta disponível e conectividade estável.

## 9) Riscos residuais

- instabilidade do edge/proxy (502) pode mascarar falhas e prejudicar disponibilidade;
- possível divergência entre comportamento do origin e da borda;
- débitos de devDependencies em audit completo;
- cobertura DAST limitada por ausência de ZAP no ambiente atual.

## 10) Conclusão

A cobertura OWASP Top 10 para o NeoTalk Chat mostra boa evolução de segurança no modelo de embed/runtime, com controles importantes ativos.  
Antes do go-live corporativo, o principal foco deve ser: estabilidade de borda, verificação final de rotas sensíveis, fechamento de riscos de toolchain e execução de DAST em ambiente com ferramentas disponíveis.
