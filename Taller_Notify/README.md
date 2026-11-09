# Taller_Notify

Microservicio **Notify** del proyecto final (Serverless Framework v4 + TypeScript + AWS Lambda).
Se cuelga del API Gateway de `Taller_Gateway` y reutiliza su authorizer JWT.

## Endpoints (`serverless.yml` propio)

| Método | Ruta                   | Qué hace                                             | Quién |
|--------|------------------------|------------------------------------------------------|-------|
| POST   | `/notify/purchase`     | Notifica al comprador por su compra                  | Cualquier usuario autenticado (a sí mismo) / Orders (interno) |
| POST   | `/notify/promotion`    | Manda una promoción a usuarios (`userIds` / `emails`)| Vendedores / interno |
| POST   | `/notify/out-of-stock` | Avisa que un producto se agotó                       | Vendedores / Products (interno) |

## Conexión con el sistema

- **Gateway:** importa `MainRestApiId`, `MainRestApiRootResourceId` y `MainAuthorizerId`.
- **Users → Notify:** consulta el correo del usuario con Lambda invoke a `taller-users-{stage}-getUser`.
- **Orders → Notify:** `createOrder` invoca `taller-notify-{stage}-notifyPurchase` al crear la orden.
- **Products → Notify:** `updateStock` invoca `taller-notify-{stage}-alertOutOfStock` cuando el stock llega a 0.
- Cada notificación queda registrada (`SENT`/`FAILED`) en la tabla DynamoDB `taller-notify-{stage}-notifications`.

## Despliegue en LocalStack

Orden: Gateway → Users → Products → Orders → Notify (ver `deploy-local.sh` en la raíz).

```bash
npm install
npm run deploy      # serverless deploy --stage local --aws-profile localstack
```
