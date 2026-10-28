import { FieldValue } from "firebase-admin/firestore";

import { isAllowedOrigin } from "@/lib/http/origin";
import { readJson, jsonError } from "@/lib/http/json";
import { requestOrigin } from "@/lib/http/request";
import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, userDoc } from "@/lib/firebase/collections";
import { getPromptAnswers } from "@/lib/prompts/server";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { promptAnswersSchema } from "@/lib/validation/prompts";

const SAVE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 };

class MissingAccountRecordError extends Error {}

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  try {
    const answers = await getPromptAnswers(session.uid);
    return Response.json({ answers });
  } catch (error) {
    logger.error("profile.prompts.read_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "prompts_unavailable");
  }
}

/** Replaces only the signed-in user's prompt answers in one transaction. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`prompts:${session.uid}`, SAVE_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = promptAnswersSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_input",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const uid = session.uid;
  const userRef = db.doc(userDoc(uid));
  const promptsQuery = db.collection(COLLECTIONS.prompts).where("uid", "==", uid);
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  try {
    await db.runTransaction(async (transaction) => {
      const [userSnapshot, existingPrompts] = await Promise.all([
        transaction.get(userRef),
        transaction.get(promptsQuery),
      ]);
      if (!userSnapshot.exists) throw new MissingAccountRecordError();

      for (const document of existingPrompts.docs) transaction.delete(document.ref);

      for (const answer of parsed.data.answers) {
        const answerRef = db.collection(COLLECTIONS.prompts).doc();
        transaction.create(answerRef, {
          uid,
          promptKey: answer.promptKey,
          responseText: answer.responseText,
          moderationStatus: "pending",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.create(auditRef, {
        actorUid: uid,
        action: "profile.prompts_updated",
        targetType: "user",
        targetId: uid,
        reasonCode: null,
        metadata: { answerCount: parsed.data.answers.length },
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof MissingAccountRecordError) return jsonError(409, "registration_required");
    logger.error("profile.prompts.write_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "prompts_unavailable");
  }

  return Response.json({ ok: true, savedCount: parsed.data.answers.length });
}
