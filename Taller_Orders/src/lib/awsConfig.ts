/**
 * Configuración de clientes AWS que funciona en LocalStack y en AWS real.
 *
 * Dentro de una Lambda de LocalStack, "localhost" es el propio contenedor de la
 * Lambda, no LocalStack. LocalStack inyecta AWS_ENDPOINT_URL con la dirección
 * correcta, así que se usa esa variable (con LOCALSTACK_HOSTNAME como respaldo).
 * En AWS real (stage != local) no se toca nada.
 */
export function awsClientConfig(): { endpoint?: string; region: string } {
  const region = process.env.AWS_REGION ?? "us-east-1";
  if (process.env.STAGE !== "local") return { region };

  const endpoint =
    process.env.AWS_ENDPOINT_URL ??
    (process.env.LOCALSTACK_HOSTNAME
      ? `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT ?? "4566"}`
      : "http://localhost.localstack.cloud:4566");

  return { endpoint, region };
}
