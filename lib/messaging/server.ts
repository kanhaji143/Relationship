import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, profileDoc } from "@/lib/firebase/collections";
import {
  canSendMessage,
  isParticipant,
  otherParticipantUid,
  type ConversationState,
} from "@/lib/messaging/authorization";

/**
 * Server-side chat reads.
 *
 * Only participant-scoped reads are exposed; there is no client Firestore
 * access. Messages are text-only in this slice.
 */

export type ChatPartner = {
  uid: string;
  displayName: string;
  broadLocationLabel: string;
};

export type ConversationSummary = {
  id: string;
  partner: ChatPartner;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

export type MessageView = {
  id: string;
  senderUid: string;
  body: string;
  createdAt: string | null;
};

export type ConversationThread = {
  id: string;
  partner: ChatPartner;
  status: "active" | "closed";
  canSend: boolean;
  messages: MessageView[];
};

function toIso(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

async function loadPartner(uid: string | null): Promise<ChatPartner | null> {
  if (!uid) return null;
  const profile = await getAdminDb().doc(profileDoc(uid)).get();
  if (!profile.exists) return null;

  const data = profile.data() ?? {};
  if (typeof data.displayName !== "string" || data.displayName.length === 0) return null;

  return {
    uid,
    displayName: data.displayName,
    broadLocationLabel:
      typeof data.broadLocationLabel === "string" ? data.broadLocationLabel : "India",
  };
}

async function blockedUidsFor(uid: string): Promise<Set<string>> {
  const db = getAdminDb();
  const [outgoing, incoming] = await Promise.all([
    db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid).limit(200).get(),
    db.collection(COLLECTIONS.blocks).where("blockedUid", "==", uid).limit(200).get(),
  ]);

  return new Set([
    ...outgoing.docs.map((doc) => doc.get("blockedUid") as string),
    ...incoming.docs.map((doc) => doc.get("blockerUid") as string),
  ]);
}

export async function hasBlockBetween(uid: string, otherUid: string): Promise<boolean> {
  const db = getAdminDb();
  const [outgoing, incoming] = await Promise.all([
    db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid).limit(200).get(),
    db.collection(COLLECTIONS.blocks).where("blockerUid", "==", otherUid).limit(200).get(),
  ]);

  return (
    outgoing.docs.some((doc) => doc.get("blockedUid") === otherUid) ||
    incoming.docs.some((doc) => doc.get("blockedUid") === uid)
  );
}

/** Active matches only; a block or unmatch hides the thread from the list. */
export async function getConversationsForUser(uid: string): Promise<ConversationSummary[]> {
  const db = getAdminDb();
  const [asA, asB, blocked] = await Promise.all([
    db.collection(COLLECTIONS.matches).where("userA", "==", uid).limit(100).get(),
    db.collection(COLLECTIONS.matches).where("userB", "==", uid).limit(100).get(),
    blockedUidsFor(uid),
  ]);

  const rows = [...asA.docs, ...asB.docs]
    .filter((doc) => doc.get("status") === "active")
    .map((doc) => {
      const userA = doc.get("userA") as string;
      const userB = doc.get("userB") as string;
      return { id: doc.id, partnerUid: userA === uid ? userB : userA };
    })
    .filter((row) => !blocked.has(row.partnerUid));

  const summaries = await Promise.all(
    rows.map(async (row) => {
      const [partner, conversation, latest] = await Promise.all([
        loadPartner(row.partnerUid),
        db.collection(COLLECTIONS.conversations).doc(row.id).get(),
        db
          .collection(COLLECTIONS.conversations)
          .doc(row.id)
          .collection("messages")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get(),
      ]);
      if (!partner || !conversation.exists) return null;

      const lastMessage = latest.docs[0]?.data() ?? null;
      return {
        id: row.id,
        partner,
        lastMessageAt: toIso(lastMessage?.createdAt ?? conversation.get("lastMessageAt")),
        lastMessagePreview:
          lastMessage && typeof lastMessage.body === "string"
            ? lastMessage.body.slice(0, 120)
            : null,
      } satisfies ConversationSummary;
    }),
  );

  return summaries
    .filter((summary) => summary !== null)
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

/**
 * Returns null for missing conversations and for non-participants, so callers
 * render a 404 instead of leaking whether a thread exists.
 */
export async function getConversationThread(
  uid: string,
  conversationId: string,
): Promise<ConversationThread | null> {
  const db = getAdminDb();
  const conversationRef = db.collection(COLLECTIONS.conversations).doc(conversationId);
  const conversation = await conversationRef.get();
  if (!conversation.exists) return null;

  const participantUids = (conversation.get("participantUids") as string[]) ?? [];
  if (!isParticipant(uid, participantUids)) return null;

  const partnerUid = otherParticipantUid(uid, participantUids);
  const [partner, match, blocked] = await Promise.all([
    loadPartner(partnerUid),
    db.collection(COLLECTIONS.matches).doc(conversationId).get(),
    partnerUid ? hasBlockBetween(uid, partnerUid) : Promise.resolve(true),
  ]);
  if (!partner) return null;

  const state: ConversationState = {
    participantUids,
    conversationStatus:
      typeof conversation.get("status") === "string" ? conversation.get("status") : "closed",
    matchStatus:
      match.exists && typeof match.get("status") === "string" ? match.get("status") : "ended",
  };

  const latest = await conversationRef
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return {
    id: conversationId,
    partner,
    status: state.conversationStatus === "active" ? "active" : "closed",
    canSend: canSendMessage(uid, state, blocked).allowed,
    messages: latest.docs
      .map((doc) => ({
        id: doc.id,
        senderUid: doc.get("senderUid") as string,
        body: typeof doc.get("body") === "string" ? doc.get("body") : "",
        createdAt: toIso(doc.get("createdAt")),
      }))
      .filter((message) => typeof message.senderUid === "string")
      .reverse(),
  };
}
