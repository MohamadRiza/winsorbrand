// lib/uploadToCloudinary.ts
// Historic name kept so every existing import keeps working. The storage backend
// is chosen by STORAGE_DRIVER: "local" (default, VPS disk) or "cloudinary".
import { CloudinaryAsset } from '@/types';
import { isLocalStorageEnabled, saveToLocalStorage, deleteFromLocalStorage } from '../fileStorage';

interface UploadOptions {
  folder:        string;           // e.g. "winsor/thumbnails"
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxFileSize?:  number;           // bytes
}

/**
 * Upload a base64 data-URI to the active storage backend.
 * Returns { url, publicId } to store in MongoDB
 */
export async function uploadToCloudinary(
  fileData: string,               // base64 data URI
  options: UploadOptions
): Promise<CloudinaryAsset> {
  if (isLocalStorageEnabled()) {
    return saveToLocalStorage(fileData, { folder: options.folder, resourceType: options.resourceType });
  }

  const { default: cloudinary } = await import('../cloudinary');
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
 * Delete an asset by publicId (works for both local and Cloudinary assets)
 */
export async function deleteFromCloudinary(
  publicId:     string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  if (publicId?.startsWith('local:')) {
    await deleteFromLocalStorage(publicId);
    return;
  }
  if (isLocalStorageEnabled()) return; // legacy Cloudinary id after migration: nothing to delete remotely
  const { default: cloudinary } = await import('../cloudinary');
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
