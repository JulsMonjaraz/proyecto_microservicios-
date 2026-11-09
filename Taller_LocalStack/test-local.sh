#!/bin/bash
# Prueba de punta a punta: registro -> login -> producto -> orden -> notificaciones
set -e
EP="--endpoint-url=http://localhost:4566 --profile localstack --region us-east-1"
API=$(aws $EP cloudformation list-exports --query "Exports[?Name=='MainRestApiId'].Value" --output text)
BASE="http://localhost:4566/restapis/$API/local/_user_request_"
echo "API: $BASE"

jget() { node -pe "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); $1"; }
post() { curl -s -X POST "$BASE$1" -H "Content-Type: application/json" ${3:+-H "Authorization: $3"} -d "$2"; }

SUF=$RANDOM
echo "--- Verificando remitente/destinatarios en SES"
for m in notificaciones@amazonlite.com admin@amazonlite.com; do aws $EP ses verify-email-identity --email-address $m; done

echo "--- Registro"
post /users/register "{\"email\":\"vendedor$SUF@test.com\",\"password\":\"123456\",\"name\":\"Vendedor\",\"role\":\"seller\"}"; echo
post /users/register "{\"email\":\"comprador$SUF@test.com\",\"password\":\"123456\",\"name\":\"Comprador\",\"role\":\"buyer\"}"; echo

echo "--- Login"
SELLER=$(post /users/login "{\"email\":\"vendedor$SUF@test.com\",\"password\":\"123456\"}" | jget "j.accessToken")
BUYER=$(post /users/login "{\"email\":\"comprador$SUF@test.com\",\"password\":\"123456\"}" | jget "j.accessToken")

echo "--- Producto con stock 1"
PID=$(post /products '{"name":"Audifonos","description":"Bluetooth","price":350,"stock":1}' "$SELLER" | jget "(j.product||j).productId")
echo "productId: $PID"

echo "--- Orden (dispara notifyPurchase y, al llegar el stock a 0, alertOutOfStock)"
post /orders "{\"items\":[{\"productId\":\"$PID\",\"quantity\":1}]}" "$BUYER"; echo

echo "--- Promoción (solo vendedores)"
post /notify/promotion '{"title":"20% de descuento","message":"Solo este fin de semana","emails":["cliente@test.com"]}' "$SELLER"; echo

sleep 2
echo "--- Correos capturados por LocalStack SES"
curl -s http://localhost:4566/_aws/ses | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).messages.map(m=>m.Destination.ToAddresses[0]+' | '+m.Subject).join('\n')"

echo "--- Registro en DynamoDB"
aws $EP dynamodb scan --table-name taller-notify-local-notifications --query 'Items[].{tipo:type.S,para:recipient.S,estado:status.S}' --output table
