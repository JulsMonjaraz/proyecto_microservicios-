#!/bin/bash
# Copia la carpeta cambios/ encima de tus proyectos reales (Taller_Gateway, Taller_Products, Taller_Orders).
# Ejecutar desde la carpeta que contiene Taller_Users, Taller_Gateway, Taller_Products, Taller_Orders y cambios/
set -e
for d in Taller_Gateway Taller_Products Taller_Orders; do
  [ -d "$d" ] || { echo "No existe $d/ aquí. Pon esta carpeta junto a tus proyectos."; exit 1; }
  cp -R "cambios/$d/." "$d/"
  echo "OK  $d actualizado"
done
echo
echo "Falta Taller_Users: abre su src/lib/dynamodb.ts y reemplaza el endpoint fijo por awsClientConfig()"
echo "(copia src/lib/awsConfig.ts de Taller_Notify). Mira el README.md de la raíz."
