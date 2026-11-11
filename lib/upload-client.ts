"use client";

export type UploadKind = "profile" | "flat" | "chat";

/** Downscale on-device first (saves data on Indian mobile networks), then upload straight to Cloudinary. */
export async function uploadImage(file: File, kind: UploadKind, matchId?: string): Promise<{ url: string; publicId: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large (max 15 MB)");

  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, matchId }),
  });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error ?? "Upload failed");

  const blob = await downscale(file, 1600);
  const form = new FormData();
  form.append("file", blob);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  form.append("transformation", sign.transformation);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await up.json();
  if (!up.ok) throw new Error(data?.error?.message ?? "Upload failed");
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

async function downscale(file: File, max: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding also strips EXIF (incl. GPS) on-device
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
