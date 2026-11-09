import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badGateway, badRequest, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";
import { getUser } from "../lib/users";
import { escapeHtml, notify } from "../lib/notifier";

interface PurchaseItem {
  productId: string;
  name?: string;
  quantity: number;
  price: number;
}

// Body: { userId?, orderId, items: [{ productId, name?, quantity, price }], total }
// - Llamada interna (Orders): userId viene en el body.
// - Llamada HTTP: siempre se notifica al usuario autenticado (no se puede spamear a otros).
async function notifyPurchaseHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const caller = getCaller(event);
    const body = JSON.parse(event.body ?? "{}");
    const { orderId, items, total } = body as {
      orderId?: string;
      items?: PurchaseItem[];
      total?: number;
    };
    const userId: string | undefined = caller.isInternal ? body.userId : caller.userId;

    if (!userId || !orderId || !Array.isArray(items) || items.length === 0 || typeof total !== "number") {
      return badRequest("userId, orderId, items (non-empty) and total are required");
    }

    const user = await getUser(userId);
    if (!user) return notFound("User not found");

    const rows = items
      .map(
        (i) =>
          `<li>${i.quantity} x ${escapeHtml(i.name ?? i.productId)} — $${Number(i.price).toFixed(2)}</li>`
      )
      .join("");

    const html = `<h2>¡Gracias por tu compra, ${escapeHtml(user.name)}!</h2>
      <p>Pedido <b>${escapeHtml(orderId)}</b></p>
      <ul>${rows}</ul>
      <p><b>Total: $${total.toFixed(2)}</b></p>`;

    const sent = await notify("PURCHASE", user.email, `Confirmación de compra #${orderId}`, html);
    if (!sent) return badGateway("Could not send the notification");

    return ok({ message: "Purchase notification sent", to: user.email });
  } catch (err) {
    console.error("notifyPurchase error:", err);
    return internalError();
  }
}

export const notifyPurchase = withCors(notifyPurchaseHandler);
