import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";

export type StaffRole = "admin" | "moderator";

export type ReportView = {
  id: string;
  reporterUid: string;
  targetUid: string;
  category: string;
  priority: string;
  status: string;
  description: string | null;
  conversationId: string | null;
  createdAt: string | null;
};

export async function getStaffRole(uid: string): Promise<StaffRole | null> {
  const user = await getAdminDb().doc(`users/${uid}`).get();
  if (!user.exists) return null;
  const role = user.get("role");
  return role === "admin" || role === "moderator" ? role : null;
}

export async function listReports(status = "open", limit = 50): Promise<ReportView[]> {
  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.reports)
    .where("status", "==", status)
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      reporterUid: String(doc.get("reporterUid")),
      targetUid: String(doc.get("targetUid")),
      category: String(doc.get("category")),
      priority: String(doc.get("priority")),
      status: String(doc.get("status")),
      description: typeof doc.get("description") === "string" ? doc.get("description") : null,
      conversationId:
        typeof doc.get("conversationId") === "string" ? doc.get("conversationId") : null,
      createdAt:
        doc.get("createdAt") && typeof doc.get("createdAt").toDate === "function"
          ? doc.get("createdAt").toDate().toISOString()
          : null,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
