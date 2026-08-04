import { v2 as cloudinary } from "cloudinary";

export interface UploadImageResult {
  url: string;
  publicId: string | null;
  placeholder: boolean;
}

export async function uploadImage(source: string, folder = "fleet-fuel"): Promise<UploadImageResult> {
  if (!process.env.CLOUDINARY_URL) {
    return { url: source || "/images/placeholder-upload.svg", publicId: null, placeholder: true };
  }
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "image",
    overwrite: false,
  });
  return { url: result.secure_url, publicId: result.public_id, placeholder: false };
}
