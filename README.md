# Proyecto final – Microservicios Serverless en LocalStack

Gateway → Users → Products → Orders → Notify (Serverless Framework v4, Node 22, TypeScript).

## Contenido de este paquete
| Carpeta / archivo | Qué es |
|---|---|
| `Taller_Notify/` | Proyecto completo, ya corregido para LocalStack |
| `cambios/Taller_Gateway`, `Taller_Products`, `Taller_Orders` | Archivos corregidos que se copian ENCIMA de tus proyectos (`bash aplicar-cambios.sh`) |
| `docker-compose.yml` + `.env.example` | LocalStack (requiere token gratis) |
| `deploy-local.sh` | Despliega los 5 servicios en orden |
| `test-local.sh` | Prueba de punta a punta (registro → login → producto → orden → correos) |

## Qué se corrigió
1. **Endpoint de LocalStack dentro de las Lambdas.** Estaba fijo en `http://localhost:4566`; dentro de una Lambda eso apunta al propio contenedor y fallaba todo acceso a DynamoDB, SES y a otras Lambdas. Ahora `src/lib/awsConfig.ts` usa `AWS_ENDPOINT_URL` (la variable oficial que LocalStack inyecta).
2. **Authorizer del Gateway.** La política solo permitía el endpoint de la primera petición y, con caché de 300 s, el mismo token recibía 403 en cualquier otro endpoint. Ahora autoriza `…/stage/*/*`.
3. **`iamRoleStatements` → `iam.role.statements`** (forma vigente en Serverless v4).
4. **`docker-compose.yml`**: LocalStack ya exige `LOCALSTACK_AUTH_TOKEN`.
5. **`deploy-local.sh`**: verifica que LocalStack esté arriba, ignora `cambios/`, y verifica los correos de SES.

## Pasos
```bash
cp .env.example .env            # pega tu LOCALSTACK_AUTH_TOKEN
docker compose up -d
serverless login                # Serverless v4 pide cuenta gratuita (o exporta SERVERLESS_ACCESS_KEY)
bash aplicar-cambios.sh         # una sola vez
bash deploy-local.sh
bash test-local.sh
```

## Pendiente en Taller_Users (no venía en el zip)
- `src/lib/dynamodb.ts`: copia `src/lib/awsConfig.ts` de Taller_Notify y crea el cliente con `new DynamoDBClient(awsClientConfig())`.
- Debe llamarse `taller-users` con una función `getUser` que reciba `pathParameters.id` y devuelva `{ user: { userId, email, name, role } }` (Notify la invoca así).
- Debe firmar el JWT con el mismo `JWT_SECRET` que el Gateway (`${ssm:/taller/${stage}/jwt-secret, 'local-dev-secret'}`).
- Para GitHub: **no ignores `config/`** (ahí está `config-local.json` y `config-develop.json`); sin esos archivos el deploy falla.
- `deploy:dev` usa el perfil `charlie-personal-taller` (del profesor): cámbialo por tu propio perfil de AWS.
# proyecto_microservicios-
