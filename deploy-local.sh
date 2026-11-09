#!/bin/bash
# Despliega todo el sistema en LocalStack (stage local).
# Uso: en la carpeta que contiene Taller_Gateway, Taller_Users, Taller_Products,
#      Taller_Orders y Taller_Notify:   bash deploy-local.sh
set -e

EP="--endpoint-url=http://localhost:4566 --profile localstack --region us-east-1"

# Perfil "localstack" que usan los scripts npm run deploy
aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region us-east-1 --profile localstack

echo "Comprobando que LocalStack esté arriba..."
if ! curl -sf http://localhost:4566/_localstack/health >/dev/null; then
  echo "LocalStack no responde en :4566. Corre primero:  docker compose up -d"
  echo "(y revisa que .env tenga LOCALSTACK_AUTH_TOKEN)"; exit 1
fi

ROOT="$(pwd)"
# Orden importa: el Gateway exporta el API/authorizer que usan los demás,
# y Notify va al final porque Orders/Products lo invocan.
for name in Gateway Users Products Orders Notify; do
  # Ignora la carpeta cambios/ (son solo parches) y node_modules
  dir=$(find "$ROOT" -maxdepth 2 -name serverless.yml -path "*Taller_${name}/*" \
        -not -path "*/cambios/*" -not -path "*/node_modules/*" | head -1 | xargs -r dirname)
  if [ -z "$dir" ]; then echo "No encontré Taller_${name}"; exit 1; fi

  echo "=================== Desplegando Taller_${name} ($dir)"
  cd "$dir"

  # serverless.yml lee config/config-local.json; si falta, lo crea
  if [ ! -f config/config-local.json ]; then
    mkdir -p config
    echo '{ "CORS_ORIGINS": "*" }' > config/config-local.json
  fi

  npm install
  npm run deploy      # <- al final imprime los endpoints: ESA es la captura que piden
  cd "$ROOT"
done

# SES en LocalStack rechaza remitentes no verificados
for m in "${SENDER_EMAIL:-notificaciones@amazonlite.com}" "${ADMIN_EMAIL:-admin@amazonlite.com}"; do
  aws $EP ses verify-email-identity --email-address "$m"
done

echo "Listo. Revisa los exports con:"
echo "  aws $EP cloudformation list-exports"
