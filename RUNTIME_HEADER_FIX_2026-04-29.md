# RUNTIME HEADER FIX — 2026-04-29

## Contexto

O comportamento observado em homologação indicou `/widget` retornando `frame-ancestors 'self'`, igual à rota principal, o que inviabiliza o modelo de embed autorizado em domínios externos permitidos.

## Causa provável

1. **Configuração de runtime não refletindo a allowlist esperada para `/widget`**.
2. **Possível sobrescrita de headers por proxy reverso/EasyPanel/edge** após o Nginx da aplicação.
3. **Ordem/precedência de regra específica vs fallback** precisando ser explícita no arquivo de configuração.

## Arquivos alterados

- `nginx.conf`
- `check.py` (wrapper para execução padronizada do check de headers)

## Correção aplicada

1. Definida allowlist explícita para `/widget`:
   - `frame-ancestors 'self' https://infra-neotalkif.k3p3ex.easypanel.host https://portal.ifce.edu.br https://www.ifce.edu.br`
2. Mantido `/` com:
   - `X-Frame-Options: SAMEORIGIN`
   - CSP com `frame-ancestors 'self'`
3. Mantido `/widget` sem `X-Frame-Options`.
4. Bloco `location = /widget` posicionado antes do bloco genérico `location /` para deixar a intenção explícita.

## Evidência antes/depois

### Antes (reportado)
- `/widget` com `frame-ancestors 'self'` (igual à rota principal), bloqueando embed autorizado externo.

### Depois (configuração aplicada)
- `nginx.conf` agora define:
  - variável `set $widget_frame_ancestors` com allowlist homologada;
  - CSP dedicada de `/widget` com `frame-ancestors $widget_frame_ancestors`;
  - ausência de `X-Frame-Options` em `/widget`;
  - `/` preservado com XFO SAMEORIGIN e CSP self.

## Verificação executada

Comando solicitado:

```bash
python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"
```

Resultado nesta execução:
- não conclusivo por bloqueio de conectividade do runner (`Tunnel connection failed: 403 Forbidden`).

## Validação esperada em homologação (quando acessível)

- `/`:
  - `X-Frame-Options: SAMEORIGIN`
  - `Content-Security-Policy` com `frame-ancestors 'self'`
- `/widget`:
  - **sem** `X-Frame-Options`
  - `Content-Security-Policy` com `frame-ancestors 'self' https://infra-neotalkif.k3p3ex.easypanel.host https://portal.ifce.edu.br https://www.ifce.edu.br`

## Riscos residuais

1. Proxy/edge (EasyPanel/CDN/WAF) ainda pode sobrescrever headers.
2. Sem conectividade do runner, não houve evidência HTTP final do ambiente publicado nesta sessão.
3. Divergência entre config de origin e config aplicada no edge precisa ser validada com `curl -I` no ambiente com acesso real.

## Próximo passo recomendado imediato

Executar no próprio ambiente de homologação (ou runner com acesso direto):

```bash
python check.py --base-url "https://infra-neotalkif.k3p3ex.easypanel.host/"
curl -I "https://infra-neotalkif.k3p3ex.easypanel.host/"
curl -I "https://infra-neotalkif.k3p3ex.easypanel.host/widget"
```

Se `/widget` continuar com `frame-ancestors 'self'`, revisar política de headers no EasyPanel/proxy e remover sobrescrita conflitante.

## Atualização de alinhamento com variável de ambiente

Para deixar explícito, o `nginx.conf` agora usa diretamente `"${WIDGET_FRAME_ANCESTORS}"` na variável interna de CSP do `/widget`.  
Isso exige que o deploy (EasyPanel/container entrypoint) faça substituição de variável de ambiente no template antes de iniciar o Nginx (ex.: `envsubst`).
