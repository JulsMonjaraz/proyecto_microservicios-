# Amazon Lite · Frontend

Sitio en Next.js 14 + Tailwind que consume las Lambdas de Amazon Lite (Users, Products y Orders).

## Ejecutar en local

1. Levanta el backend (ver `Taller_LocalStack`) y despliega los servicios.
2. Copia las variables de entorno y pega la URL del Gateway:
   ```bash
   cp .env.local.example .env.local
   ```
   El id del API aparece en el `endpoint:` de `npm run deploy` en `Taller_Gateway`.
3. Instala y arranca:
   ```bash
   npm install
   npm run dev
   ```
   Abre http://localhost:3000

## Conexión con las Lambdas

Todo pasa por `src/lib/api.ts` (`apiFetch`): lee `NEXT_PUBLIC_API_URL`, manda el JWT como
`Authorization: Bearer`, y si el token vence (401) limpia la sesión y manda a `/auth/login`.

| Pantalla | Endpoint |
|---|---|
| Registro / login | `POST /users/register`, `POST /users/login` |
| Perfil | `GET`, `PUT`, `DELETE /users/{id}` |
| Catálogo y detalle | `GET /products`, `GET /products/{id}` |
| Mis productos | `GET /products/users/{sellerId}` |
| Crear, editar, borrar | `POST /products`, `PUT`, `DELETE /products/{id}` |
| Comprar | `POST /orders` |
| Mis órdenes | `GET /orders/users/{userId}`, `POST /orders/{id}/cancel` |
| Órdenes recibidas | `GET /orders/seller/{sellerId}`, `POST /orders/{id}/confirm` |

Estados de una orden: `pending`, `confirmed`, `cancelled`.

## CORS

El navegador solo deja leer la respuesta si el backend devuelve `Access-Control-Allow-Origin` con el
origen de esta página. Si el catálogo muestra "No se pudo cargar", revisa que `http://localhost:3000`
esté en `CORS_ORIGINS` de `config/config-local.json` de cada servicio.

## Producción

Copia `.env.production.example` y usa la URL del stage desplegado. El dominio donde publiques el
frontend debe estar en `CORS_ORIGINS` de `config/config-develop.json` en cada servicio del backend.

## Diseño

Minimalista: papel blanco, tinta oscura y un solo color de énfasis. Los colores, el radio y la tipografía
(Manrope) se cambian en `src/app/globals.css` y `tailwind.config.ts`.
