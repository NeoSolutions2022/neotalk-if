# RUNTIME WIDGET HEADERS FIX — 2026-04-30

## Causa provável

O `/widget` seguia retornando política de framing equivalente à rota global por uma combinação de fatores operacionais:

1. Necessidade de **templating seguro** para `WIDGET_FRAME_ANCESTORS` no runtime Nginx (container em produção/homologação).
2. Possível **sobrescrita de headers no EasyPanel/proxy/edge** (ex.: reinjeção de X-Frame-Options ou CSP global).
3. Dependência de configuração final aplicada no ambiente (não apenas no repositório).

## Arquivos alterados

- `nginx.conf.template` (novo template runtime)
- `docker-entrypoint.sh` (novo entrypoint com envsubst seguro)
- `Dockerfile` (passa a usar template + entrypoint)
- `nginx.conf` (fallback/example local consistente com allowlist homolog)

## Estratégia usada para aplicar env no Nginx/runtime

Foi implementado templating explícito em startup do container:

1. `WIDGET_FRAME_ANCESTORS` é lida no entrypoint.
2. É aplicado `envsubst` em `nginx.conf.template` para gerar `/etc/nginx/conf.d/default.conf`.
3. Nginx sobe com a configuração já interpolada.

Fallback seguro definido no entrypoint:

- `'self' https://infra-neotalk-if-demo.k3p3ex.easypanel.host`

Sem wildcard (`*`) e sem embed universal.

## Evidência antes/depois

### Antes
- Risco de `/widget` herdar política não esperada em runtime (ou política conflitando com embed autorizado), especialmente quando a camada de deploy não aplicava variável de ambiente como esperado.

### Depois
- `/` continua com:
  - `X-Frame-Options: SAMEORIGIN`
  - CSP com `frame-ancestors 'self'`
- `/widget` fica com:
  - ausência de X-Frame-Options
  - CSP `frame-ancestors` derivada de `WIDGET_FRAME_ANCESTORS`
  - demais headers de segurança mantidos

## Comandos de validação executados

```bash
python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/widget
npm run build
```

### Resultado nesta execução
- `npm run build`: sucesso.
- `check.py` e `curl -I` no endpoint publicado: **não conclusivos** no runner atual por bloqueio de túnel/proxy (`403`, `server: envoy`).

## Riscos residuais

1. EasyPanel/proxy/edge pode continuar sobrescrevendo CSP/XFO.
2. Sem acesso de rede efetivo do runner ao endpoint publicado, não há comprovação runtime final nesta sessão.
3. Divergência entre configuração local e configuração aplicada no proxy externo ainda precisa de evidência direta no ambiente alvo.

## Observações sobre EasyPanel/proxy

- Validar no painel/proxy se existe policy global de headers aplicando:
  - `X-Frame-Options: SAMEORIGIN` para todas as rotas (o que quebraria `/widget`)
  - CSP global com `frame-ancestors 'self'`
- Se existir, criar exceção explícita para `/widget` no edge/proxy.
- Confirmar que `WIDGET_FRAME_ANCESTORS` está realmente definida no container e consumida no startup.

## Próximo passo recomendado

Executar os comandos de validação a partir de runner com conectividade ao domínio de homologação (ou diretamente no host EasyPanel) e anexar saída HTTP completa das rotas `/` e `/widget`.
