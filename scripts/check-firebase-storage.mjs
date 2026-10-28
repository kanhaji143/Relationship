#!/usr/bin/env node
/** Read-only Storage bucket probe. Does not create buckets or change billing. */
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.log(JSON.stringify({ status: "BLOCKED", reason: "project_config_missing" }));
  process.exit(0);
}

async function main() {
  initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  const bucket = getStorage().bucket();
  const [exists] = await bucket.exists();
  if (!exists) {
    console.log(JSON.stringify({ status: "BLOCKED", reason: "storage_bucket_not_provisioned" }));
    return;
  }

  const [metadata] = await bucket.getMetadata();
  let signedUploadAvailable = false;
  try {
    // Generates only an in-memory URL for a non-existent random object; no upload/write occurs.
    await bucket.file(`qa-probe/${randomUUID()}.jpg`).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60_000,
      contentType: "image/jpeg",
    });
    signedUploadAvailable = true;
  } catch {
    signedUploadAvailable = false;
  }

  let publicIamGrant = "unknown";
  try {
    const [policy] = await bucket.iam.getPolicy();
    publicIamGrant = (policy.bindings ?? []).some((binding) =>
      (binding.members ?? []).some(
        (member) => member === "allUsers" || member === "allAuthenticatedUsers",
      ),
    );
  } catch {
    // Report unknown, never print raw policy or API error details.
  }

  const uniformBucketLevelAccess =
    metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled === true;
  const publicAccessPrevention = metadata.iamConfiguration?.publicAccessPrevention ?? "unknown";
  const ready =
    uniformBucketLevelAccess &&
    publicAccessPrevention === "enforced" &&
    publicIamGrant === false &&
    signedUploadAvailable;

  console.log(
    JSON.stringify({
      status: ready ? "READY" : "BLOCKED",
      location: metadata.location ?? null,
      publicAccessPrevention,
      uniformBucketLevelAccess,
      publicIamGrant,
      signedUploadAvailable,
      reason: ready ? null : "private_storage_or_server_signing_not_confirmed",
    }),
  );
}

main().catch((error) => {
  console.log(
    JSON.stringify({
      status: "ERROR",
      reason: error instanceof Error ? error.name : "unknown",
    }),
  );
  process.exitCode = 1;
});
