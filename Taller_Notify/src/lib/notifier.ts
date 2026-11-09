import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { dynamo } from "./dynamodb";
import { awsClientConfig } from "./awsConfig";
import type { NotificationType } from "../types";

const ses = new SESClient(awsClientConfig());

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE!;
const SENDER_EMAIL = process.env.SENDER_EMAIL!;

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Envía el correo por SES y deja registro (SENT/FAILED) en DynamoDB. */
export async function notify(
  type: NotificationType,
  recipient: string,
  subject: string,
  html: string
): Promise<boolean> {
  let status: "SENT" | "FAILED" = "SENT";
  let error: string | undefined;

  try {
    await ses.send(
      new SendEmailCommand({
        Source: SENDER_EMAIL,
        Destination: { ToAddresses: [recipient] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      })
    );
  } catch (err) {
    status = "FAILED";
    error = err instanceof Error ? err.message : String(err);
    console.error(`SES send failed for ${recipient}:`, err);
  }

  try {
    await dynamo.send(
      new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: {
          notificationId: uuidv4(),
          type,
          recipient,
          subject,
          status,
          ...(error ? { error } : {}),
          createdAt: new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.error("Could not save notification log:", err);
  }

  return status === "SENT";
}
