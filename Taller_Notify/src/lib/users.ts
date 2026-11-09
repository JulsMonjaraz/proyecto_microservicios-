import { invokeLambda, usersFn } from "./lambdaInvoke";
import type { UserInfo } from "../types";

/** Consulta a Taller_Users (getUser) por Lambda invoke. Devuelve null si no existe. */
export async function getUser(userId: string): Promise<UserInfo | null> {
  try {
    const res = await invokeLambda<{ user: UserInfo }>(usersFn("getUser"), {
      pathParameters: { id: userId },
    });
    return res.statusCode === 200 ? res.body.user : null;
  } catch (err) {
    console.error(`getUser(${userId}) failed:`, err);
    return null;
  }
}
