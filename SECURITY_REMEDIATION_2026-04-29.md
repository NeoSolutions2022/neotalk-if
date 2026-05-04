# SECURITY REMEDIATION — 2026-04-29

## Escopo aplicado (P0/P1)

Correções defensivas implementadas com foco apenas nos itens prioritários de segurança e confiabilidade identificados no review anterior:

1. Headers de segurança no runtime de produção (Nginx).
2. Atualização de dependências vulneráveis de produção (com foco em `react-router-dom` e transitivas).
3. Correção da inconsistência estrutural em `src/App.tsx`.
4. Ajustes de scripts de validação em `package.json`.

## Achados corrigidos

### 1) Headers de segurança no Nginx (P0)
- Incluídos headers globais:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restritiva
  - `X-Frame-Options: SAMEORIGIN`
- Incluída CSP específica para `/widget` no `nginx.conf` de produção.

**Resultado:** hardening aplicado no runtime final (não apenas em dev/preview).

### 2) Dependências vulneráveis de produção (P0)
- Executado `npm audit fix --omit=dev`.
- Atualizada referência de `react-router-dom` no `package.json` para versão corrigida da faixa atual.
- Estado final de produção: `npm audit --omit=dev` retornando **0 vulnerabilities**.

### 3) Integridade de roteamento em `src/App.tsx` (P1)
- Removida linha JSX solta fora do componente.
- Removido import duplicado de `Widget`.
- Mantido comportamento funcional das rotas (`/`, `/widget`, `*`).

### 4) Scripts de validação (P1)
- Corrigido script `sast` para usar arquivo existente `vite.config.mjs`.
- Adicionados scripts:
  - `audit`: `npm audit --omit=dev`
  - `validate:security`: `npm run lint && npm run build && npm run audit`

## Arquivos alterados

- `nginx.conf`
- `src/App.tsx`
- `package.json`
- `package-lock.json`
- `SECURITY_REMEDIATION_2026-04-29.md` (este relatório)

## Evidência da correção

- `npm audit --omit=dev` → `found 0 vulnerabilities`.
- `npm run build` → build concluído com sucesso.
- `npm run lint` → não passou por erros preexistentes fora do escopo desta correção (ver riscos residuais).

## Riscos residuais

1. **Lint global com erros preexistentes** em arquivos UI/base do template (`@typescript-eslint/no-empty-object-type`, `no-require-imports` etc.).
2. **Vulnerabilidades em devDependencies** ainda podem existir quando audit completo (`npm audit`) é executado sem `--omit=dev`.
3. **CSP com `frame-ancestors 'self'`** no Nginx pode precisar de parametrização por ambiente para hosts externos de embed autorizados.

## Próximos passos recomendados

1. Corrigir erros de lint preexistentes e elevar lint para gate obrigatório no CI.
2. Tratar advisories de devDependencies com política de atualização contínua.
3. Parametrizar `frame-ancestors` no Nginx por variável de ambiente/templating de deploy para cenários de embed externo.
4. Incluir validação automatizada de headers de resposta em pipeline (ex.: smoke test HTTP pós-deploy).

## Atualização adicional (embed hardening)

- **Canal postMessage endurecido** no loader e widget:
  - validação de `event.origin` e `event.source`.
  - rejeição de mensagens fora do schema esperado.
- **Fail-closed no loader** para `data-widget-url` e `data-widget-origin` inválidos, com abort seguro da inicialização.
- **Integração efetiva** de `src/lib/widget-security.ts` na rota `/widget` para parsing/sanitização de query e mensagens.
