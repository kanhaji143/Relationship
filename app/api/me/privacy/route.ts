import { getAdminDb } from "@/lib/firebase/admin/app";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { getPrivacySettings, savePrivacySettings } from "@/lib/privacy/server";
import { getSessionUser } from "@/lib/session";
import { privacySettingsSchema } from "@/lib/validation/privacy";

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");
  const settings = await getPrivacySettings(session.uid);
  return Response.json(settings, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = privacySettingsSchema.partial().safeParse(body.data);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_input",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const current = await getPrivacySettings(session.uid);
  await savePrivacySettings(session.uid, { ...current, ...parsed.data });

  // Keep discovery pause in sync with preferences when possible.
  if (parsed.data.discoveryPaused !== undefined) {
    await getAdminDb()
      .doc(`preferences/${session.uid}`)
      .set({ discoveryPaused: parsed.data.discoveryPaused }, { merge: true });
  }
  if (parsed.data.profileVisibility !== undefined) {
    await getAdminDb()
      .doc(`profiles/${session.uid}`)
      .set(
        { visibility: parsed.data.profileVisibility === "hidden" ? "hidden" : "visible" },
        { merge: true },
      );
  }

  return Response.json({ ok: true });
}
