#!/bin/sh
set -eu

: "${WIDGET_FRAME_ANCESTORS:='self' https://infra-neotalk-if-demo.k3p3ex.easypanel.host}"

export WIDGET_FRAME_ANCESTORS

envsubst '$WIDGET_FRAME_ANCESTORS' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
