import "server-only";
import { v2 as cloudinary } from "cloudinary";

export const cloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Signed params for a direct browser → Cloudinary upload (the file never touches our server). */
export function signUpload(folder: string) {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    // Strip EXIF (incl. GPS) and cap size on Cloudinary's side
    transformation: "c_limit,w_1600,h_1600,q_auto:good",
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

export async function destroyImages(publicIds: string[]) {
  if (!cloudinaryConfigured() || !publicIds.length) return;
  configure();
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (e) {
    console.error("[cloudinary] delete failed", e);
  }
}

export async function destroyFolder(prefix: string) {
  if (!cloudinaryConfigured()) return;
  configure();
  try {
    await cloudinary.api.delete_resources_by_prefix(prefix);
  } catch (e) {
    console.error("[cloudinary] delete by prefix failed", e);
  }
}
