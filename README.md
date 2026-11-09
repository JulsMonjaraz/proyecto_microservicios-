# Proyecto Final – Microservicios Serverless en LocalStack

Arquitectura de microservicios serverless ejecutada **100% en local** con LocalStack, sin necesidad de una cuenta de AWS real.

**Flujo:** Gateway → Users → Products → Orders → Notify

Stack: **Serverless Framework v4 · Node 22 · TypeScript · LocalStack**

---

## 📁 Contenido del repositorio

| Carpeta / archivo | Qué es |
|---|---|
| `Taller_Notify/` | Proyecto completo, ya corregido para LocalStack |
| `cambios/Taller_Gateway`, `Taller_Products`, `Taller_Orders` | Archivos corregidos que se copian **ENCIMA** de tus proyectos (`bash aplicar-cambios.sh`) |
| `docker-compose.yml` + `.env.example` | LocalStack (requiere token gratis) |
| `deploy-local.sh` | Despliega los 5 servicios en orden |
| `test-local.sh` | Prueba de punta a punta (registro → login → producto → orden → correos) |

---
