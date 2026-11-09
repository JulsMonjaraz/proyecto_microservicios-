#!/bin/bash
# Sube cada módulo del proyecto a su propio repositorio de GitHub.
#
# Uso (desde la carpeta que contiene todos los Taller_*):
#   bash Taller_LocalStack/subir-a-github.sh TU_USUARIO_GITHUB
#
# Requiere: git y GitHub CLI (brew install gh) con sesión iniciada (gh auth login).
set -e

USER_GH="$1"
if [ -z "$USER_GH" ]; then echo "Uso: bash Taller_LocalStack/subir-a-github.sh TU_USUARIO_GITHUB"; exit 1; fi
command -v git >/dev/null || { echo "Falta git: brew install git"; exit 1; }
command -v gh  >/dev/null || { echo "Falta GitHub CLI: brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Inicia sesión primero con: gh auth login"; exit 1; }

REPOS="Taller_Gateway Taller_Users Taller_Products Taller_Orders Taller_Notify Taller_Frontend Taller_LocalStack"
BACKENDS="Taller_Gateway Taller_Users Taller_Products Taller_Orders Taller_Notify"
ROOT="$(pwd)"
LINKS=""

for name in $REPOS; do
  [ -d "$ROOT/$name" ] || { echo "No existe $name/ aquí. Ejecuta el script desde la carpeta que contiene los proyectos."; exit 1; }
done

for name in $REPOS; do
  echo "=================== $name"
  cd "$ROOT/$name"

  # 1) .gitignore: nunca subir dependencias, builds ni secretos...
  touch .gitignore
  for line in "node_modules/" ".serverless/" ".esbuild/" ".next/" ".env" ".env.local" "*.tsbuildinfo" ".DS_Store" "volume/"; do
    grep -qxF "$line" .gitignore || echo "$line" >> .gitignore
  done
  # ...pero SÍ subir config/ (ahí vive CORS_ORIGINS de cada stage, necesario para desplegar)
  sed -i.bak -E '/^\/?config(\/\*?)?\/?$/d' .gitignore && rm -f .gitignore.bak

  # 2) Ajuste de producción: cada backend necesita config/config-<stage>.json con CORS_ORIGINS
  case " $BACKENDS " in *" $name "*)
    mkdir -p config
    [ -f config/config-local.json ]   || echo '{ "CORS_ORIGINS": "*" }' > config/config-local.json
    [ -f config/config-develop.json ] || echo '{ "CORS_ORIGINS": "http://localhost:3000" }' > config/config-develop.json
    grep -q "https://" config/config-develop.json || \
      echo "  AVISO: config/config-develop.json solo permite localhost. Para producción agrega el dominio real de tu frontend (https://...)."
    # Verificaciones del backend para LocalStack
    if grep -rn "localhost:4566" src --include=*.ts 2>/dev/null | grep -v awsConfig.ts | grep -q .; then
      echo "  AVISO: hay 'localhost:4566' fijo en src/. Dentro de una Lambda debe usarse awsClientConfig() (src/lib/awsConfig.ts)."
    fi
  ;; esac
  if [ "$name" = "Taller_Gateway" ] && ! grep -q "allowAllMethods" src/handlers/authorizer.ts 2>/dev/null; then
    echo "  AVISO: el authorizer no tiene la política con comodín (allowAllMethods): un mismo token daría 403 en otros endpoints."
  fi

  # 3) README mínimo si no existe
  [ -f README.md ] || printf '# %s\n\nProyecto final del taller de Serverless (Amazon Lite).\n\nDespliegue local: ver el repositorio Taller_LocalStack.\n' "$name" > README.md

  # 4) Git: inicializar, revisar que no se cuele ningún secreto, commit
  [ -d .git ] || git init -q
  git branch -M main
  git add -A
  if git diff --cached --name-only | grep -E '(^|/)\.env($|\.)' | grep -vE '\.example$' | grep -q .; then
    echo "  ERROR: se iba a subir un archivo .env. Revísalo antes de continuar."; exit 1
  fi
  git diff --cached --quiet || git commit -q -m "Proyecto final: $name"

  # 5) Crear el repo en GitHub (o reutilizarlo) y subir
  if gh repo view "$USER_GH/$name" >/dev/null 2>&1; then
    git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$USER_GH/$name.git"
    git push -u origin main
  else
    gh repo create "$USER_GH/$name" --public --source=. --remote=origin --push
  fi
  LINKS="$LINKS\nhttps://github.com/$USER_GH/$name"
done

cd "$ROOT"
echo
echo "Listo. Estos son los enlaces para tu PDF:"
printf "$LINKS\n"
