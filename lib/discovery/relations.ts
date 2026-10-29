import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, profileDoc, userDoc } from "@/lib/firebase/collections";

export type DiscoveryPerson = {
  uid: string;
  displayName: string;
  broadLocationLabel: string;
};

async function getBlockedUids(uid: string): Promise<Set<string>> {
  const db = getAdminDb();
  const [blockedByViewer, blockedViewer] = await Promise.all([
    db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid).get(),
    db.collection(COLLECTIONS.blocks).where("blockedUid", "==", uid).get(),
  ]);

  return new Set([
    ...blockedByViewer.docs.map((doc) => doc.get("blockedUid") as string),
    ...blockedViewer.docs.map((doc) => doc.get("blockerUid") as string),
  ]);
}

async function loadPeople(uids: readonly string[], blockedUids: ReadonlySet<string>) {
  const db = getAdminDb();
  const uniqueUids = [...new Set(uids)].filter((uid) => !blockedUids.has(uid));
  if (uniqueUids.length === 0) return new Map<string, DiscoveryPerson>();

  const [users, profiles] = await Promise.all([
    db.getAll(...uniqueUids.map((uid) => db.doc(userDoc(uid)))),
    db.getAll(...uniqueUids.map((uid) => db.doc(profileDoc(uid)))),
  ]);
  const people = new Map<string, DiscoveryPerson>();

  for (let index = 0; index < uniqueUids.length; index += 1) {
    const uid = uniqueUids[index]!;
    const user = users[index];
    const profile = profiles[index];
    if (!user?.exists || user.get("accountStatus") !== "active" || !profile?.exists) continue;

    const data = profile.data() ?? {};
    if (data.visibility !== "visible" || data.moderationStatus !== "approved") continue;
    if (typeof data.displayName !== "string" || data.displayName.length === 0) continue;

    people.set(uid, {
      uid,
      displayName: data.displayName,
      broadLocationLabel:
        typeof data.broadLocationLabel === "string" ? data.broadLocationLabel : "India",
    });
  }

  return people;
}

export async function getLikesForUser(uid: string): Promise<{
  received: DiscoveryPerson[];
  sent: DiscoveryPerson[];
}> {
  const db = getAdminDb();
  const [outgoing, incoming, blockedUids] = await Promise.all([
    db.collection(COLLECTIONS.likes).where("fromUid", "==", uid).limit(100).get(),
    db.collection(COLLECTIONS.likes).where("toUid", "==", uid).limit(100).get(),
    getBlockedUids(uid),
  ]);

  const sentUids = outgoing.docs
    .filter((doc) => doc.get("action") === "like")
    .map((doc) => doc.get("toUid") as string);
  const receivedUids = incoming.docs
    .filter((doc) => doc.get("action") === "like")
    .map((doc) => doc.get("fromUid") as string);
  const people = await loadPeople([...sentUids, ...receivedUids], blockedUids);

  return {
    sent: sentUids
      .map((personUid) => people.get(personUid))
      .filter((person) => person !== undefined),
    received: receivedUids
      .map((personUid) => people.get(personUid))
      .filter((person) => person !== undefined),
  };
}

export async function getMatchesForUser(uid: string): Promise<DiscoveryPerson[]> {
  const db = getAdminDb();
  const [asA, asB, blockedUids] = await Promise.all([
    db.collection(COLLECTIONS.matches).where("userA", "==", uid).limit(100).get(),
    db.collection(COLLECTIONS.matches).where("userB", "==", uid).limit(100).get(),
    getBlockedUids(uid),
  ]);

  const otherUids = [...asA.docs, ...asB.docs]
    .filter((doc) => doc.get("status") === "active")
    .map((doc) => {
      const userA = doc.get("userA") as string;
      const userB = doc.get("userB") as string;
      return userA === uid ? userB : userA;
    });

  const people = await loadPeople(otherUids, blockedUids);
  return otherUids
    .map((personUid) => people.get(personUid))
    .filter((person) => person !== undefined);
}
