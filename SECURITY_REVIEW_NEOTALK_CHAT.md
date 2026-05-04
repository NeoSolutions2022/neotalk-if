# SECURITY REVIEW — NeoTalk Chat

Data da revisão: 2026-04-29  
Escopo: revisão defensiva autorizada do repositório `/workspace/neotalk-if` (front-end React/Vite + deploy estático Nginx).  
Método: revisão manual de código/configuração + análise de dependências com `npm audit --omit=dev --json`.  

## 1) Stack identificada

- **Frontend:** React 18 + TypeScript + Vite 5.  
- **Roteamento:** `react-router-dom` (SPA com rota `/` e `/widget`).  
- **UI:** Radix UI/shadcn, TailwindCSS.  
- **Build/Runtime:** build estático em Node (builder) e serving via Nginx Alpine.  
- **Integração de widget:** iframe + `postMessage` + script loader (`embeds/widget-loader.js`).

## 2) Dependências principais (segurança/arquitetura)

- `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zod`, `vite`, `typescript`, `tailwindcss`, `@vitejs/plugin-react-swc`.
- Resultado de auditoria: **12 vulnerabilidades reportadas** (7 high, 5 moderate) no lock atual (incluindo `react-router-dom`, `@remix-run/router`, `postcss` e transitivas).

## 3) Achados com severidade

## [ALTA] A1 — Headers de segurança anunciados, mas não aplicados em produção (Nginx)

**Risco:** Em produção (Nginx), o app não injeta CSP/Referrer-Policy/Permissions-Policy/X-Content-Type-Options; hoje isso existe só no plugin do servidor Vite (dev/preview). Pode expor a rota `/widget` a superfície maior de clickjacking/composição indevida e falta de hardening HTTP.  

**Evidência:**
- O plugin que seta headers roda somente em `configureServer`/`configurePreviewServer` do Vite.  
- O `nginx.conf` não define `add_header` para nenhuma política.

**Correção recomendada:**
1. Replicar os headers de segurança no `nginx.conf` de produção (ao menos para `/widget`, idealmente baseline para todo site).  
2. Configurar explicitamente `Content-Security-Policy`, `X-Frame-Options` (ou CSP `frame-ancestors`), `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.  
3. Validar via scanner de headers após deploy.

---

## [ALTA] A2 — Dependência com advisory de segurança alto em roteamento

**Risco:** `react-router-dom` versão em uso está dentro de faixa afetada por advisories de open redirect/XSS relacionadas ao ecossistema router. Mesmo se o app atual não usar todas features vulneráveis, manter versão afetada aumenta risco futuro/regressão.  

**Evidência:**
- `package.json` fixa `react-router-dom` em faixa `^6.26.2`.  
- `npm audit` aponta `react-router-dom`/`react-router`/`@remix-run/router` com severidade high e `fixAvailable`.

**Correção recomendada:**
1. Atualizar `react-router-dom` para versão corrigida (>= faixa corrigida indicada pelo advisory atual).  
2. Rodar suíte de testes + smoke de navegação `/` e `/widget`.  
3. Congelar lock atualizado e reexecutar `npm audit` no CI.

---

## [MÉDIA] M1 — Inconsistência de código em `App.tsx` (linha solta/import duplicado)

**Risco:** quebra de build ou comportamento inesperado. Problema de integridade do código pode impedir correções de segurança de irem a produção e afeta confiabilidade do pipeline.  

**Evidência:** há uma linha de JSX (`<Route path="/widget" ...`) fora do componente e import duplicado de `Widget`.

**Correção recomendada:** corrigir `src/App.tsx` removendo linha solta e duplicação; manter lint/build bloqueando merge.

---

## [MÉDIA] M2 — Ausência de backend de autenticação/autorização/tenant no escopo atual

**Risco:** não existe camada de authN/authZ/tenant enforcement neste repositório; se o produto real exigir áreas privadas/admin/multitenant, estes controles estão fora do código atual. Isso não é “vuln” por si, mas é **lacuna arquitetural de segurança** se houver expectativa de controle de acesso.  

**Evidência:** app é estático, sem endpoints server-side, sem sessão/JWT no código analisado.

**Correção recomendada:**
1. Documentar claramente que este repo é apenas camada de apresentação/widget público.  
2. Se houver APIs privadas, implementar gateway/backend com autenticação forte, autorização por escopo/tenant e auditoria.

---

## [MÉDIA] M3 — Falta de rate limiting e proteção anti-abuso no perímetro

**Risco:** como conteúdo é público, bots podem abusar da rota/widget (scraping/carga). Em cenários com backend futuro, ausência de limite vira risco direto de DoS/custos.  

**Evidência:** não há configuração de rate limit no Nginx nem middleware equivalente no escopo.

**Correção recomendada:** configurar rate limiting no reverse proxy e WAF/CDN (por IP + burst control), além de telemetria de abuso.

---

## [BAIXA] L1 — Loader do widget depende de `dataset` sem validação operacional adicional

**Risco:** `data-widget-url`/`data-widget-origin` mal configurados pelo integrador podem quebrar handshake e criar risco de integração incorreta (não necessariamente exploração direta).  

**Evidência:** `embeds/widget-loader.js` constrói URL/origin a partir de `data-*` e aplica `postMessage` com origin esperado.

**Correção recomendada:** adicionar validações/guards no loader (falhar fechado em URL inválida, logs explícitos de mismatch de origin).

## 4) Evidência por arquivo (resumo)

- `package.json`: stack, versões de libs principais.  
- `vite.config.mjs`: headers de segurança aplicados somente em dev/preview via plugin.  
- `nginx.conf`: ausência de headers de segurança/rate limit.  
- `Dockerfile`: build estático + runtime Nginx.  
- `embeds/widget-loader.js`: iframe sandbox + handshake `postMessage` com origin.  
- `src/lib/widget-security.ts`: sanitização de query, parsing de mensagens e redaction básica de logs sensíveis.  
- `src/App.tsx`: inconsistência estrutural (linha rota fora do componente/import duplicado).  
- `README.md` e `docs/*`: afirmam práticas de segurança que precisam refletir runtime real.

## 5) Correções recomendadas (priorizadas)

1. **P0 (imediato):** aplicar headers de segurança no Nginx de produção para `/widget` e baseline global.  
2. **P0:** atualizar dependências com advisories high (`react-router-dom` e transitivas críticas apontadas pelo audit).  
3. **P1:** corrigir integridade de `src/App.tsx` e bloquear CI em lint/build/test/audit.  
4. **P1:** definir política de atualização contínua de dependências (ex.: Renovate/Dependabot + janela mensal).  
5. **P2:** reforçar loader com validações de configuração e observabilidade de falhas de integração.  
6. **P2:** hardening de proxy: rate limit, logs estruturados sem dados sensíveis, TLS e headers adicionais.

## 6) Quick wins

- Adicionar `add_header` no `nginx.conf` para CSP/Referrer/Permissions/X-Content-Type-Options já no próximo deploy.  
- Rodar `npm audit fix` controlado + atualização manual de pacotes com severidade alta.  
- Corrigir `App.tsx` e ativar checks obrigatórios no CI: `npm run lint`, `npm run test`, `npm run build`, `npm audit --omit=dev`.  
- Criar checklist de release de segurança para widget embed (origins permitidas, sandbox mínimo, no `targetOrigin='*'`).

## 7) Itens que exigem validação manual

1. **Infra real de produção:** confirmar quais headers o proxy/CDN final injeta hoje (não visível no repo).  
2. **Domínios permitidos (`frame-ancestors`):** validar lista real por ambiente (dev/hml/prod).  
3. **Existência de APIs privadas/admin externas:** revisar backend(s) não presentes neste repositório para authN/authZ/tenant isolation.  
4. **Gestão de segredos:** confirmar se CI/CD e ambientes não expõem variáveis sensíveis (não há `.env` no repo, mas isso não prova ausência em runtime).  
5. **Telemetria e retenção de logs:** garantir mascaramento centralizado e política LGPD.

## Cobertura dos tópicos solicitados

- **Autenticação/autorização:** não implementadas neste repo (frontend estático); requer validação em backend externo.  
- **Segregação por tenant/cliente:** não há lógica multi-tenant no código atual.  
- **Rotas administrativas:** não encontradas neste repositório.  
- **APIs públicas/privadas:** não há API server-side aqui; somente app/widget cliente.  
- **Middleware de segurança:** presente apenas no dev/preview Vite, ausente no Nginx final.  
- **CORS/CSP/headers:** CSP/headers apenas no plugin Vite; CORS não aplicável sem backend aqui.  
- **Sessões/cookies/JWT/tokens:** não há auth/session do app; cookie observado apenas em componente UI genérico de sidebar.  
- **Uploads:** não identificados.  
- **Callbacks/webhooks/integrações externas:** integração com Vimeo e postMessage iframe/host.  
- **Logs sensíveis:** há tentativa de redaction em `logWidgetError`, porém limitada a regex de chaves.  
- **Tratamento de erros:** básico, sem pipeline centralizado de observabilidade no repo.  
- **Rate limiting:** não identificado no runtime Nginx deste repo.  
- **Segredos hardcoded/.env/config/CI-CD:** sem `.env` versionado; CI/CD não encontrado no material analisado.  
- **Docker/proxy reverso:** Dockerfile simples; Nginx sem hardening explícito.  
- **Bibliotecas com risco conhecido/desatualizadas:** auditoria detectou múltiplos advisories com severidades alta/moderada.

---

### Comandos executados nesta revisão

- `rg --files | head -n 200`  
- `find . -maxdepth 2 -type f (...)`  
- `cat package.json`  
- `cat Dockerfile`  
- `cat nginx.conf`  
- `sed -n ...` em arquivos de código/docs relevantes  
- `rg -n "..." src embeds docs ...`  
- `npm audit --omit=dev --json`
