# DIAGNÓSTICO RUNTIME HEADERS — 2026-04-30

## 1) Hipótese inicial

O comportamento observado (`/widget` retornando `X-Frame-Options: SAMEORIGIN` e `frame-ancestors 'self'`) indicava uma destas causas:

1. regra de `/widget` não casando a URL real (ex.: `/widget/` com barra final);
2. configuração de runtime não sendo a esperada (template/env não aplicado);
3. sobrescrita de headers no EasyPanel/proxy/edge;
4. deploy usando imagem antiga/cacheada.

## 2) Fontes de headers encontradas no repositório

Foram encontradas fontes de headers/CSP em:

- `nginx.conf`
- `nginx.conf.template`
- `vite.config.mjs` (somente dev/preview)

Não foram encontrados:

- `more_set_headers`
- configs explícitas de EasyPanel/proxy neste repositório.

## 3) Arquivo Nginx/template realmente usado no build

Pelo `Dockerfile` atual:

- a imagem final copia **`nginx.conf.template`** para `/etc/nginx/templates/default.conf.template`;
- o container inicia por `docker-entrypoint.sh`;
- o entrypoint usa `envsubst` para gerar `/etc/nginx/conf.d/default.conf`.

Logo, no runtime do container deste repositório, a fonte efetiva é o `nginx.conf.template` + `docker-entrypoint.sh`.

## 4) Evidência de variáveis de ambiente disponíveis ou ausentes

No repositório:
- `docker-entrypoint.sh` consome `WIDGET_FRAME_ANCESTORS`.
- fallback seguro definido quando a variável não existir.

No ambiente de homologação em execução:
- não foi possível confirmar `printenv` por ausência de acesso ao container remoto.

## 5) Evidência de config em runtime (quando possível)

Tentativas de diagnóstico runtime sugeridas (`docker exec ... nginx -T`, `printenv`, `cat /etc/nginx/...`) não puderam ser executadas aqui porque Docker/containers remotos não estão acessíveis neste runner.

Execução realizada:

- `docker ps` -> `DOCKER_UNAVAILABLE`
- `python check.py --base-url ...` -> `Network is unreachable` / `Tunnel connection failed`
- `curl -I` no domínio público -> sem conectividade útil neste runner

## 6) Causa raiz encontrada (ou hipótese mais provável)

**Hipótese mais provável identificada no código:**

- havia regra apenas `location = /widget` (match exato). Se o cliente acessa `/widget/` (com barra final) ou rota derivada sob prefixo, a requisição cai em `location /`, herdando XFO/CSP global.

**Hipótese operacional concorrente:**

- EasyPanel/proxy/edge pode estar reescrevendo/injetando headers globais.

## 7) Correção aplicada

Aplicada correção **pontual e não regressiva**:

1. mantido `/widget` exato com headers próprios;
2. adicionada regra `location ^~ /widget/` com **mesmos headers do widget** para cobrir barra final/prefixo;
3. mantidas rotas gerais (`location /`) com XFO `SAMEORIGIN` e CSP global `frame-ancestors 'self'`.

Também mantida estratégia de templating por env no runtime:

- `nginx.conf.template` + `docker-entrypoint.sh` + `envsubst` para `WIDGET_FRAME_ANCESTORS`.

## 8) Evidência antes/depois

### Antes
- possibilidade de `/widget/` cair em `location /` e retornar headers globais (XFO + CSP self).

### Depois
- `/widget` e `/widget/` possuem política dedicada de widget:
  - sem XFO;
  - CSP com `frame-ancestors $widget_frame_ancestors`;
  - `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` mantidos.

## 9) Riscos residuais

1. Proxy/edge pode continuar sobrescrevendo headers após o Nginx do app.
2. Sem acesso de rede ao endpoint neste runner, não foi possível comprovar o estado final online.
3. Deploy pode estar em imagem antiga/cacheada no EasyPanel.

## 10) Comandos de validação

Executados nesta sessão:

```bash
rg -n "X-Frame-Options|Content-Security-Policy|frame-ancestors|add_header|more_set_headers|SAMEORIGIN|WIDGET_FRAME_ANCESTORS|WIDGET_PREVIEW_ALLOWED_HOSTS" . -g '!node_modules/**'
cat Dockerfile
cat docker-entrypoint.sh
cat nginx.conf.template
cat nginx.conf
docker ps
python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/widget
```

Comandos recomendados no host de homologação (com acesso ao container):

```bash
docker exec <container> nginx -T
docker exec <container> printenv | grep WIDGET
docker exec <container> cat /etc/nginx/nginx.conf
docker exec <container> find /etc/nginx -maxdepth 3 -type f -print
docker exec <container> grep -R "X-Frame-Options\|Content-Security-Policy\|frame-ancestors" /etc/nginx

curl -I https://infra-neotalkif.k3p3ex.easypanel.host/
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/widget
curl -I https://infra-neotalkif.k3p3ex.easypanel.host/widget/
python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"
```

Se `/widget` continuar vindo com XFO/CSP global, a causa provável passa a ser sobrescrita no EasyPanel/proxy/edge ou deploy desatualizado.

## Atualização para diagnóstico de bloqueio externo

Foi adicionado header de diagnóstico de rota no Nginx para diferenciar origem vs sobrescrita no proxy:

- `X-Neotalk-Policy: app` em `location /`
- `X-Neotalk-Policy: widget` em `location = /widget` e `location ^~ /widget/`

Se no domínio público `/widget` não retornar `X-Neotalk-Policy: widget`, o tráfego não está chegando com a política do origin (ou está sendo sobrescrito no edge).

## Evidência recebida do ambiente de homologação (30/04/2026)

Os `curl -I` fornecidos para `/`, `/widget` e `/widget/` retornam exatamente o mesmo conjunto de headers, incluindo:

- `Content-Security-Policy: ... frame-ancestors 'self'`
- `X-Frame-Options: SAMEORIGIN`
- mesmo `Content-Length`, `Etag` e `Last-Modified`

Isso reforça que **a política específica de `/widget` não está ativa no runtime publicado**.  
A causa mais provável passa a ser:

1. imagem/config antiga ainda em execução; ou
2. config de Nginx final sem os blocos `location = /widget` e `location ^~ /widget/`; ou
3. proxy/edge sobrescrevendo para política global.

Como prova adicional, após novo deploy, validar presença de:

- `X-Neotalk-Policy: app` em `/`
- `X-Neotalk-Policy: widget` em `/widget` e `/widget/`

Se esse header não aparecer, o tráfego/headers não estão vindo da config nova do origin.

## Causa técnica confirmada (com base no comportamento reportado)

O padrão observado (`/widget` retornando `X-Neotalk-Policy: app`) confirma que a resposta final estava sendo servida pelo fallback da rota global.  
Isso ocorre porque `try_files ... /index.html` na location do widget gera redirect interno para `/index.html`, e os headers finais passam a refletir a location que serve esse recurso (global), não a location inicial.

## Ajuste definitivo aplicado

Foi alterado o fallback de widget para usar location nomeada interna:

- `try_files $uri $uri/ @widget_spa;`
- `location @widget_spa { ... headers do widget ...; try_files /index.html =404; }`

Assim, `/widget` e `/widget/` preservam headers específicos do widget na resposta final (sem XFO e com `frame-ancestors` de allowlist).
