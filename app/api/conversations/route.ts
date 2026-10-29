import { getConversationsForUser } from "@/lib/messaging/server";
import { jsonError } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";

/** Account-scoped conversation list for the signed-in participant. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const conversations = await getConversationsForUser(session.uid);
  return Response.json(
    {
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        partner: conversation.partner,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: conversation.lastMessagePreview,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
