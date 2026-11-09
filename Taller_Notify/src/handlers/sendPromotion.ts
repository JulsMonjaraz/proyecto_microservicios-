import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, forbidden, internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";
import { getUser } from "../lib/users";
import { escapeHtml, notify } from "../lib/notifier";

const MAX_RECIPIENTS = 100;

// Body: { title, message, userIds?: string[], emails?: string[] }
// Por HTTP solo pueden enviar promociones los vendedores.
async function sendPromotionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const caller = getCaller(event);
    if (!caller.isInternal && caller.role !== "seller") {
      return forbidden("Only sellers can send promotions");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { title, message, userIds = [], emails = [] } = body as {
      title?: string;
      message?: string;
      userIds?: string[];
      emails?: string[];
    };

    if (!title || !message) return badRequest("title and message are required");
    if (!Array.isArray(userIds) || !Array.isArray(emails)) {
      return badRequest("userIds and emails must be arrays");
    }

    const users = await Promise.all(userIds.map((id) => getUser(id)));
    const recipients = [
      ...new Set([...emails, ...users.filter((u) => u !== null).map((u) => u!.email)]),
    ];

    if (recipients.length === 0) return badRequest("Provide at least one valid userId or email");
    if (recipients.length > MAX_RECIPIENTS) {
      return badRequest(`A maximum of ${MAX_RECIPIENTS} recipients is allowed per request`);
    }

    const html = `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>`;
    const results = await Promise.all(
      recipients.map((to) => notify("PROMOTION", to, title, html))
    );

    const sent = results.filter(Boolean).length;
    return ok({
      message: "Promotion processed",
      total: recipients.length,
      sent,
      failed: recipients.length - sent,
    });
  } catch (err) {
    console.error("sendPromotion error:", err);
    return internalError();
  }
}

export const sendPromotion = withCors(sendPromotionHandler);
