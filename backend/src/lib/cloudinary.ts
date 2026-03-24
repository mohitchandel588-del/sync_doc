import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env";
import { ApiError } from "../utils/api-error";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

export const uploadBufferToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  mimeType: string
) => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(500, "Cloudinary is not configured on the server.");
  }

  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimeType.startsWith("image/") ? "image" : "raw"
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    stream.end(fileBuffer);
  });
};

