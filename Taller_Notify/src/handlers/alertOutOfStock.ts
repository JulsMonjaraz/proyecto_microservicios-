import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badGateway, badRequest, forbidden, internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";
import { getUser } from "../lib/users";
import { escapeHtml, notify } from "../lib/notifier";

// Body: { productId, productName, sellerId? }
// - Llamada interna (Products): avisa al vendedor (sellerId); si no se encuentra, al ADMIN_EMAIL.
// - Llamada HTTP: solo vendedores, y el aviso llega al propio vendedor autenticado.
async function alertOutOfStockHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const caller = getCaller(event);
    if (!caller.isInternal && caller.role !== "seller") {
      return forbidden("Only sellers can trigger out-of-stock alerts");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { productId, productName } = body as { productId?: string; productName?: string };
    const sellerId: string | undefined = caller.isInternal ? body.sellerId : caller.userId;

    if (!productId || !productName) return badRequest("productId and productName are required");

    const seller = sellerId ? await getUser(sellerId) : null;
    const recipient = seller?.email ?? process.env.ADMIN_EMAIL!;

    const html = `<h2>Producto agotado</h2>
      <p>Tu producto <b>${escapeHtml(productName)}</b> (ID: ${escapeHtml(productId)}) se ha agotado.</p>
      <p>Actualiza el stock para seguir vendiéndolo.</p>`;

    const sent = await notify("OUT_OF_STOCK", recipient, `Alerta: ${productName} agotado`, html);
    if (!sent) return badGateway("Could not send the alert");

    return ok({ message: "Out-of-stock alert sent", to: recipient });
  } catch (err) {
    console.error("alertOutOfStock error:", err);
    return internalError();
  }
}

export const alertOutOfStock = withCors(alertOutOfStockHandler);
