#!/bin/bash
set -e

EP=(--endpoint-url=http://localhost:4566 --profile localstack --region us-east-1)

aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region us-east-1 --profile localstack

echo "Comprobando que LocalStack esté arriba..."
if ! curl -sf http://localhost:4566/_localstack/health >/dev/null; then
  echo "LocalStack no responde en :4566. Corre primero:  (cd Taller_LocalStack && docker compose up -d)"
  echo "(y revisa que Taller_LocalStack/.env tenga LOCALSTACK_AUTH_TOKEN)"; exit 1
fi

ROOT="$(pwd)"
for name in Gateway Users Products Orders Notify; do
  dir="$ROOT/Taller_${name}"
  if [ ! -f "$dir/serverless.yml" ]; then
    echo "No encontré $dir/serverless.yml. Ejecuta el script desde la carpeta que contiene los Taller_*."; exit 1
  fi

  echo "=================== Desplegando Taller_${name}"
  cd "$dir"

  if [ ! -f config/config-local.json ]; then
    mkdir -p config
    echo '{ "CORS_ORIGINS": "*" }' > config/config-local.json
  fi

  npm install
  npm run deploy
  cd "$ROOT"
done

for m in "${SENDER_EMAIL:-notificaciones@amazonlite.com}" "${ADMIN_EMAIL:-admin@amazonlite.com}"; do
  aws "${EP[@]}" ses verify-email-identity --email-address "$m"
done

echo "Listo. Revisa los exports con:"
echo "  aws --endpoint-url=http://localhost:4566 --profile localstack --region us-east-1 cloudformation list-exports"
