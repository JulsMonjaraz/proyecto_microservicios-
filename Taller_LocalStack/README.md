# Taller_LocalStack

Infraestructura local y scripts del proyecto **Amazon Lite** (AWS Serverless en LocalStack).

| Archivo | Para qué sirve |
|---|---|
| `docker-compose.yml` | Levanta LocalStack (requiere token gratis en `.env`) |
| `deploy-local.sh` | Despliega Gateway → Users → Products → Orders → Notify |
| `test-local.sh` | Prueba de punta a punta: registro, login, producto, orden y correos |
| `subir-a-github.sh` | Sube cada módulo a su propio repositorio |

## Uso

Con los proyectos `Taller_*` en la misma carpeta:

```bash
cp Taller_LocalStack/.env.example Taller_LocalStack/.env   # pega tu token
(cd Taller_LocalStack && docker compose up -d)
bash Taller_LocalStack/deploy-local.sh
bash Taller_LocalStack/test-local.sh
```

## Repositorios

- Taller_Gateway: API Gateway compartido y authorizer JWT
- Taller_Users: registro, login y perfil
- Taller_Products: catálogo
- Taller_Orders: órdenes
- Taller_Notify: correos con SES
- Taller_Frontend: sitio en Next.js

## Conexión con el frontend (CORS)

Cada Lambda responde con `Access-Control-Allow-Origin` según `CORS_ORIGINS`, que se lee de
`config/config-<stage>.json` de cada servicio. Las rutas tienen `cors` habilitado para el preflight
(`OPTIONS`) y el Gateway devuelve esos headers también en errores 401/403/4xx/5xx.

## Producción

- En `config/config-develop.json` de **cada** backend, `CORS_ORIGINS` debe incluir el dominio real del frontend.
- El secreto JWT debe ser el mismo en Gateway (`ssm:/taller/<stage>/jwt-secret`) y Users (`JWT_SECRET`).
- Los scripts `deploy:dev` usan un perfil de AWS propio (`--aws-profile`).
