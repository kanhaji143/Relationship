/**
 * Chat authorization rules (pure, so they can be unit-tested).
 *
 * A conversation is 1:1 with a match and is identified by the canonical match
 * id. Participants may always read their own thread; writes additionally need
 * an active conversation, an active match and no block in either direction.
 */

export type ConversationState = {
  participantUids: readonly string[];
  conversationStatus: string;
  matchStatus: string;
};

export type AccessReason = "not_participant" | "conversation_closed" | "match_inactive" | "blocked";

export type AccessResult = { allowed: true } | { allowed: false; reason: AccessReason };

export function isParticipant(uid: string, participantUids: readonly string[]): boolean {
  return participantUids.includes(uid);
}

export function canReadConversation(uid: string, state: ConversationState): AccessResult {
  if (!isParticipant(uid, state.participantUids)) {
    return { allowed: false, reason: "not_participant" };
  }
  return { allowed: true };
}

export function canSendMessage(
  uid: string,
  state: ConversationState,
  blocked: boolean,
): AccessResult {
  if (!isParticipant(uid, state.participantUids)) {
    return { allowed: false, reason: "not_participant" };
  }
  if (blocked) return { allowed: false, reason: "blocked" };
  if (state.matchStatus !== "active") return { allowed: false, reason: "match_inactive" };
  if (state.conversationStatus !== "active") {
    return { allowed: false, reason: "conversation_closed" };
  }
  return { allowed: true };
}

/** Normally one of the two participantUids, but tolerate legacy/extra entries. */
export function otherParticipantUid(
  uid: string,
  participantUids: readonly string[],
): string | null {
  return participantUids.find((candidate) => candidate !== uid) ?? null;
}
