// lib/uploadToCloudinary.ts
import cloudinary from '../cloudinary';
import { CloudinaryAsset } from '@/types';

interface UploadOptions {
  folder:        string;           // e.g. "winsor/thumbnails"
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxFileSize?:  number;           // bytes
}

/**
 * Upload a base64 or file buffer to Cloudinary
 * Returns { url, publicId } to store in MongoDB
 */
export async function uploadToCloudinary(
  fileData: string,               // base64 string or file path
  options: UploadOptions
): Promise<CloudinaryAsset> {
  const result = await cloudinary.uploader.upload(fileData, {
    folder:        options.folder,
    resource_type: options.resourceType ?? 'image',
    transformation: (options.resourceType === 'video' || options.resourceType === 'raw')
      ? undefined
      : [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete a Cloudinary asset by publicId
 */
export async function deleteFromCloudinary(
  publicId:     string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}