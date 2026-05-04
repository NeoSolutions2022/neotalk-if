# ACTIVE SCAN HOMOLOGAÇÃO — NeoTalk Chat (2026-04-29)

## Resumo executivo

Foi executada uma varredura ativa controlada, com escopo estrito ao domínio autorizado. A execução encontrou **limitação de conectividade de rede no runner** para o `BASE_URL` (falha de conexão em HTTPS), impedindo validação remota completa de headers, CSP e comportamento runtime no ambiente publicado.  

Apesar disso, foram executados testes locais/estáticos e auditorias de dependência, com evidências de hardening no código. Não houve ação destrutiva, brute force, DoS, exfiltração ou ataque a terceiros.

## Escopo e autorização

- Autorização explícita do proprietário para homologação.
- Escopo: `https://infra-neotalkif.k3p3ex.easypanel.host` e rotas públicas no mesmo domínio.
- Fora de escopo respeitado: Vimeo, terceiros, domínios externos, DoS, brute force, persistência e exfiltração.

## URL testada

- `https://infra-neotalkif.k3p3ex.easypanel.host`

## Metodologia

1. Validação ativa de headers e endpoints com `check_headers.py` e `curl`.
2. Tentativa de enumeração controlada de exposição de arquivos sensíveis (lista pré-definida, baixa agressividade).
3. Testes controlados de query params em `/widget`.
4. Preparação de páginas locais para validação manual de embed e `postMessage`.
5. DAST tooling discovery (ZAP/Nuclei).
6. Verificações de supply chain e segurança estática local.

## Ferramentas usadas

- Python scripts em `security-tests/`
- `curl`
- `npm audit`, `npm run build`, `npm run validate:security`
- Verificação de binários: `which`

## Comandos executados

```bash
NO_PROXY='*' no_proxy='*' python security-tests/check_headers.py --base-url https://infra-neotalkif.k3p3ex.easypanel.host

for p in / /widget /embeds/widget-loader.js; do
  NO_PROXY='*' no_proxy='*' curl -i -sS "https://infra-neotalkif.k3p3ex.easypanel.host$p"
done

for p in /.env /.git/config /package.json /package-lock.json /pnpm-lock.yaml /yarn.lock /docker-compose.yml /Dockerfile /nginx.conf /src/ /dist/ /build/ /api/ /admin/ /.well-known/security.txt; do
  NO_PROXY='*' no_proxy='*' curl -s -o /tmp/resp.txt -w "%{http_code}" "https://infra-neotalkif.k3p3ex.easypanel.host$p"
done

for q in "allowedOrigins=*" "allowedOrigins=https://evil.example" "initialState=%3Cscript%3Ealert(1)%3C/script%3E" "autoOpen=%3Cscript%3Ealert(1)%3C/script%3E" "unexpectedParam=test" "long=<512A>"; do
  NO_PROXY='*' no_proxy='*' curl -i -sS "https://infra-neotalkif.k3p3ex.easypanel.host/widget?$q"
done

which zap-baseline.py || which zap.sh || echo ZAP_NOT_FOUND
which nuclei || echo NUCLEI_NOT_FOUND

python security-tests/check_secrets_static.py
python security-tests/check_csp.py
python security-tests/check_embed_config.py
npm audit --omit=dev
npm audit
npm run build
npm run validate:security
```

## Evidências

### Conectividade ativa (remota)
- `check_headers.py`: `/` e `/widget` -> `unreachable` (`[Errno 101] Network is unreachable`).
- `curl` para `/`, `/widget`, `/embeds/widget-loader.js`: `Failed to connect ... Couldn't connect to server`.
- Testes de arquivos sensíveis e query params: não concluídos por mesma indisponibilidade de rede.

### DAST tools
- `ZAP_NOT_FOUND`
- `NUCLEI_NOT_FOUND`

### Segurança estática e supply chain local
- `python security-tests/check_csp.py` -> **OK**
- `python security-tests/check_embed_config.py` -> **OK**
- `python security-tests/check_secrets_static.py` -> **OK**
- `npm audit --omit=dev` -> **0 vulnerabilities**
- `npm audit` (completo) -> **10 vulnerabilities** (dev/toolchain: 3 high, 5 moderate, 2 low)
- `npm run build` -> **sucesso**
- `npm run validate:security` -> **falha** devido a lint preexistente

## Achados por severidade

### Crítico
- Nenhum achado crítico confirmado nesta execução.

### Alto
1. **Vulnerabilidades em dependências de desenvolvimento/toolchain** detectadas no `npm audit` completo (ex.: rollup, minimatch, flatted), com potencial impacto no ciclo de build/CI se não tratadas.

### Médio
1. **Impossibilidade de validação ativa remota** no endpoint de homologação a partir deste runner (network unreachable), deixando sem comprovação prática neste teste para:
   - headers reais de `/`, `/widget`, `/embeds/widget-loader.js`
   - política efetiva de `frame-ancestors` no ambiente publicado
   - comportamento ativo de query params

### Baixo
1. **Gate `validate:security` não passa** por erros de lint preexistentes, reduzindo maturidade do pipeline de segurança contínua.

### Informativo
1. Hardening de embed presente no código (checagem estática passou: CSP local, loader defensive controls, secrets scan heurístico).

## Impacto

- Sem conectividade, a verificação ativa em homologação não gera evidência conclusiva de runtime/edge.
- Risco de divergência entre configuração local e configuração efetiva publicada permanece até execução em runner com acesso real.

## Recomendações

1. Reexecutar este plano a partir de runner com acesso de rede ao `BASE_URL`.
2. Instalar ZAP Baseline e Nuclei (com escopo restrito e templates seguros) no ambiente de homologação.
3. Tratar vulnerabilidades de devDependencies com `npm audit fix` controlado + validação de compatibilidade.
4. Corrigir erros de lint para tornar `validate:security` gate obrigatório no CI.
5. Executar os HTMLs de teste local em navegador:
   - `security-tests/embed-test.html`
   - `security-tests/postmessage-test.html`

## Riscos residuais

1. Sem evidência ativa de headers/CSP publicados por conta da indisponibilidade de rede no runner.
2. Ferramentas DAST não disponíveis nesta execução.
3. Dependências dev com alertas ainda abertas no audit completo.

## O que precisa ser corrigido antes de produção

1. Garantir execução de active scan em ambiente com acesso real ao endpoint de homologação.
2. Fechar findings de dev/toolchain de maior severidade ou registrar risco aceito com compensações.
3. Fechar débitos de lint para viabilizar gate de segurança obrigatório.
4. Anexar relatório de DAST (ZAP/Nuclei) e evidências de headers reais por rota no pacote de go-live.

## Conclusão objetiva

A varredura ativa planejada foi iniciada e executada dentro dos limites autorizados, porém **não conclusiva para runtime remoto** devido a bloqueio de conectividade deste ambiente de execução. Os controles estáticos locais estão consistentes, mas a validação final em homologação publicada ainda requer rerun em infraestrutura com acesso ao `BASE_URL` e ferramentas DAST disponíveis.
