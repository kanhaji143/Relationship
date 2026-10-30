"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { photoId: string; url: string; moderationStatus: string };

export function PhotoGallery() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPhotos() {
    try {
      const response = await fetch("/api/me/photos", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { photos?: Photo[] };
      setPhotos(Array.isArray(body.photos) ? body.photos : []);
    } catch {
      setMessage("Photos are temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // This effect synchronizes the client gallery with the authenticated API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPhotos();
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const response = await fetch("/api/me/photos", { method: "POST", body: formData });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "upload_failed");
      }
      await loadPhotos();
      setMessage("Photo uploaded for privacy review.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === "file_too_large"
          ? "Choose a photo smaller than 5 MB."
          : "We could not upload that photo. Use JPG, PNG or WebP under 5 MB.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(photoId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/me/photos/${photoId}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setPhotos((current) => current.filter((photo) => photo.photoId !== photoId));
      setMessage("Photo removed.");
    } catch {
      setMessage("We could not remove that photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="border-line overflow-hidden rounded-2xl border bg-white/70 shadow-sm dark:bg-white/[0.03]"
      aria-labelledby="photos-heading"
    >
      <div className="from-brand-soft/80 border-line border-b bg-gradient-to-r to-transparent px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-brand text-xs font-bold tracking-[0.18em] uppercase">Your profile</p>
            <h2 id="photos-heading" className="text-ink mt-1 text-xl font-semibold">
              Profile photos
            </h2>
            <p className="text-ink-muted mt-1 max-w-xl text-sm leading-relaxed">
              Add a clear photo when you are ready. Photos are private, reviewed and served through
              short-lived links.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="bg-brand-strong inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            Add photo
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? <p className="text-ink-muted text-sm">Loading your private gallery…</p> : null}
        {!loading && photos.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border-line hover:border-brand group flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 p-6 text-center transition-colors dark:bg-white/[0.02]"
          >
            <span className="from-brand-soft to-accent-soft text-brand-strong grid size-16 place-items-center rounded-3xl bg-gradient-to-br text-2xl font-bold shadow-inner">
              B
            </span>
            <span className="text-ink mt-3 text-sm font-semibold">
              Show your real, comfortable self
            </span>
            <span className="text-ink-muted mt-1 text-xs">JPG, PNG or WebP · maximum 5 MB</span>
          </button>
        ) : null}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.photoId}
                className="group bg-brand-soft relative aspect-[4/5] overflow-hidden rounded-2xl"
              >
                <img src={photo.url} alt="Your profile photo" className="size-full object-cover" />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl bg-black/65 px-2.5 py-2 text-[11px] text-white backdrop-blur-sm">
                  <span>{photo.moderationStatus === "approved" ? "Approved" : "In review"}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(photo.photoId)}
                    className="font-semibold underline underline-offset-2 hover:text-pink-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {message ? (
          <p role="status" className="text-ink-muted mt-4 text-xs">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
