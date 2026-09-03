import cloudinary from '../cloudinary';
import { CloudinaryAsset } from '@/types';
import sharp from 'sharp';

interface UploadOptions {
  folder:        string;           // e.g. "winsor/thumbnails"
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxFileSize?:  number;           // bytes
  format?:       string;
}

/**
 * Automatically optimizes an image using sharp:
 * - Downscales large images to max 1920x1920 (preserving aspect ratio, no enlargement)
 * - Auto-orients mobile camera photos using EXIF orientation
 * - Converts to modern, high-efficiency WebP format (quality: 82, effort: 4)
 * - Safely falls back to original data if sharp encounters any error
 */
async function optimizeImageWithSharp(fileData: string): Promise<string> {
  try {
    let inputBuffer: Buffer;

    if (fileData.startsWith('data:')) {
      const commaIndex = fileData.indexOf(',');
      if (commaIndex !== -1) {
        inputBuffer = Buffer.from(fileData.slice(commaIndex + 1), 'base64');
      } else {
        inputBuffer = Buffer.from(fileData, 'base64');
      }
    } else {
      inputBuffer = Buffer.from(fileData, 'base64');
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return fileData;
    }

    const optimizedBuffer = await sharp(inputBuffer)
      .rotate() // auto-orient based on EXIF tag
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    return `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('[Sharp Optimization Fallback]: Image optimization skipped, uploading original format:', error);
    return fileData;
  }
}

/**
 * Upload a base64 or file buffer to Cloudinary with automated Sharp WebP optimization
 * Returns { url, publicId } to store in MongoDB
 */
export async function uploadToCloudinary(
  fileData: string,               // base64 string or file path
  options: UploadOptions
): Promise<CloudinaryAsset> {
  const isImage = !options.resourceType || options.resourceType === 'image';
  let dataToUpload = fileData;

  if (isImage) {
    dataToUpload = await optimizeImageWithSharp(fileData);
  }

  const result = await cloudinary.uploader.upload(dataToUpload, {
    folder:        options.folder,
    resource_type: options.resourceType ?? 'image',
    format:        isImage ? 'webp' : undefined,
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