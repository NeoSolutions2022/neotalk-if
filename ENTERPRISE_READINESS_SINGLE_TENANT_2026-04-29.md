# ENTERPRISE READINESS — NeoTalk Chat (Single-Tenant por Implantação)

Data: 2026-04-29  
Escopo: prontidão corporativa para implantação institucional dedicada por cliente (instância separada por contratante).

## 1) Resumo executivo

O repositório está **bem posicionado para modelo single-tenant por deploy** (uma instância por cliente), especialmente no eixo de embed seguro (`/widget`) e hardening HTTP em runtime Nginx.  

Principais sinais positivos:
- política de framing por rota (rotas gerais protegidas; `/widget` controlado por `frame-ancestors`);
- handshake `postMessage` com validações de `origin`/`source` e schema mínimo;
- utilitários de sanitização integrados ao runtime do widget;
- build reproduzível com Docker (Node build + Nginx runtime);
- `npm audit --omit=dev` sem vulnerabilidades de produção no momento da revisão.

Principais gaps para prontidão corporativa plena:
- governança operacional (SLA/SRE/ITSM) ainda depende de implantação real;
- observabilidade corporativa (Azure Monitor/App Insights/Log Analytics) não está codificada neste repo;
- gates de qualidade/segurança no CI não estão maduros (lint falha por erros preexistentes);
- rate limiting/WAF/CDN e política de retenção LGPD dependem da arquitetura final.

Conclusão: **apto para evoluir para produção institucional dedicada**, desde que os gaps de operação e evidência formal sejam tratados no ambiente Azure final.

---

## 2) Escopo analisado

- Código e configuração local do repositório (frontend/widget + Nginx + Docker).
- Documentação técnica e de segurança gerada no projeto.
- Dependências NPM e scripts de validação.

Não inclui:
- validação de Azure subscription/landing zone real;
- validação de WAF/CDN em produção;
- pentest independente.

---

## 3) Premissa arquitetural: single-tenant por implantação

Premissa adotada e considerada **válida**: cada cliente recebe uma instância/deploy dedicado (domínio/subdomínio, configuração, allowlists, assets e operação segregados).  

A ausência de `tenant_id`/RBAC multiempresa no código **não é falha crítica** neste modelo, desde que haja segregação por ambiente/deploy e controles operacionais adequados.

---

## 4) Pontos fortes atuais

1. **Separabilidade de configuração por cliente**
   - `widget-loader` aceita `data-widget-url` e `data-widget-origin` por host integrador.
   - `/widget` usa `allowedOrigins` parametrizável na query.
   - Nginx prevê `frame-ancestors` por variável para allowlist por ambiente/cliente.

2. **Segurança de embed**
   - `postMessage` com `targetOrigin` explícito no envio de config do host para widget.
   - validação de `event.origin` e `event.source` no loader e no widget.
   - validação de schema mínimo da mensagem e rejeição por padrão.
   - `iframe` com `sandbox` e permissões reduzidas (`allow=autoplay`).

3. **Hardening de runtime**
   - headers de segurança no Nginx (XCTO, Referrer, Permissions, CSP por rota).
   - estratégia correta de clickjacking: XFO nas rotas gerais e exceção controlada em `/widget` via CSP `frame-ancestors`.

4. **Supply chain (produção)**
   - lockfile atualizado e `npm audit --omit=dev` sem vulnerabilidades de produção no momento.

---

## 5) Gaps críticos

1. **Evidência operacional corporativa ausente no repositório**
   - Não há configuração concreta de observabilidade enterprise (App Insights/Log Analytics), alertas, runbooks, SLO/SLA e ITSM.

2. **Governança de deploy por cliente depende de infraestrutura externa**
   - Separação por cliente é viável, mas precisa ser formalizada em pipeline/IaC (ambientes, domínios, certificados, allowlists, rollback).

3. **Gates de qualidade incompletos**
   - `validate:security` depende de lint que atualmente falha por issues preexistentes, limitando confiabilidade de gate automático.

---

## 6) Gaps médios

1. **Rate limiting/WAF não implementado no código Nginx local** (esperado em edge/proxy corporativo).
2. **Política formal de retenção/expurgo de logs LGPD** não está descrita de ponta a ponta.
3. **Gestão de assets/vídeos por cliente** precisa de padrão corporativo (versionamento, ownership, expurgo, continuidade).
4. **Threat model documentado** para tradeoff de `allow-same-origin` no iframe pode ser aprofundado.

---

## 7) Quick wins

1. Tornar `npm run validate:security` gate obrigatório no CI após corrigir lint preexistente.
2. Criar matriz padrão por cliente/ambiente:
   - domínio/subdomínio,
   - `frame-ancestors`, `allowedOrigins`,
   - origem de assets/vídeos,
   - certificados.
3. Adotar checklist de release com validação de headers no edge (não apenas origin).
4. Definir baseline de logs técnicos + retenção + mascaramento LGPD por cliente.

---

## 8) Arquitetura Azure de referência

Para cada cliente (single-tenant por deploy):

- **Borda/entrega:** Azure Front Door (ou CDN) + WAF policy dedicada por cliente.
- **Runtime app:**
  - opção A: Container Apps/App Service com Nginx + build estático;
  - opção B: Static Web Apps (se aderir aos headers/políticas necessárias via edge).
- **Assets/vídeos:** Azure Blob Storage + CDN por cliente (ou integração externa governada).
- **Segredos/certs:** Azure Key Vault (certificados, segredos de integração, chaves).
- **Observabilidade:** Azure Monitor + Application Insights + Log Analytics.
- **Governança:** ambientes DEV/HML/PROD separados por cliente; IaC; versionamento e rollback.
- **Região:** preferência por região Brasil, com avaliação de continuidade/DR conforme contrato.

---

## 9) Como o código atual se conecta à arquitetura Azure

- `nginx.conf` já suporta estratégia de segurança por rota e allowlist de embedding, alinhável ao edge/WAF.
- `embeds/widget-loader.js` e `src/pages/Widget.tsx` permitem parametrização por domínio/origem do cliente.
- `Dockerfile` facilita empacotamento para App Service for Containers / Container Apps.
- Falta transformar práticas em **artefatos de operação** (IaC, políticas de segurança, alertas, dashboards, runbooks).

---

## 10) Itens que podem ser afirmados em reunião com cliente

1. O produto suporta modelo **single-tenant por implantação** com configuração segregável por cliente.
2. O widget possui controles de segurança para embed (`origin/source/schema`, sandbox, CSP com allowlist).
3. Rotas gerais têm proteção anti-clickjacking; `/widget` usa exceção controlada para embed autorizado.
4. Dependências de produção estão sem vulnerabilidades conhecidas no audit atual (`npm audit --omit=dev`).

---

## 11) Itens que ainda precisam de evidência formal

1. Evidência de operação Azure (dashboards, alertas, SLO/SLA, on-call, runbooks).
2. Evidência de segregação por cliente no pipeline (IaC, variáveis, certificados, segredos, rollback).
3. Evidência de retenção e descarte de logs/dados conforme LGPD e contrato.
4. Evidência de testes de carga/estabilidade para SLA alvo (ex.: 99,7%).

---

## 12) Itens que dependem de pentest independente

1. Validação black-box de superfície de embed em ambiente final (host + widget + edge).
2. Tentativas de bypass de CSP/frame-ancestors em cadeia real (browser + CDN/WAF).
3. Robustez contra abuso no canal `postMessage` em cenários adversariais reais.
4. Avaliação de segurança da supply chain e headers sob comportamento real de proxies intermediários.

---

## 13) Checklist pré-go-live corporativo

- [ ] Matriz por cliente aprovada (domínios, origins, frame-ancestors, assets, contatos).
- [ ] Segredos/certificados no Key Vault com rotação definida.
- [ ] WAF policy ativa e testada (regras gerenciadas + custom quando necessário).
- [ ] Headers de segurança validados no edge (`/` e `/widget`).
- [ ] Observabilidade ativa (App Insights + Log Analytics + alertas).
- [ ] Runbook de incidente + rollback versionado testado.
- [ ] Política de logs e retenção LGPD validada com jurídico/compliance.
- [ ] Evidência de build/audit e qualidade anexada à release.
- [ ] Pentest independente concluído e remediações críticas fechadas.

---

## 14) Recomendações finais

1. **Consolidar IaC por cliente** (single-tenant factory) para garantir repetibilidade e segregação operacional.
2. **Formalizar DevSecOps gates** (lint/build/audit/sast) como bloqueio de promoção após corrigir débitos atuais.
3. **Fechar ciclo de observabilidade e SLA** com indicadores objetivos (disponibilidade, erro, latência, MTTR).
4. **Executar pentest independente** antes de contratos de alta criticidade.
5. **Instituir governança LGPD operacional** (minimização, retenção, acesso, descarte, evidências).

---

## Evidências principais desta análise

- `nginx.conf` (headers/CSP/XFO/frame-ancestors por rota)
- `embeds/widget-loader.js` (handshake + fail-closed)
- `src/pages/Widget.tsx` (integração runtime dos utilitários de segurança)
- `src/lib/widget-security.ts` (parsing/sanitização/redaction)
- `Dockerfile` (modelo de build/runtime)
- `package.json` + `npm audit --omit=dev` (supply chain e scripts)
