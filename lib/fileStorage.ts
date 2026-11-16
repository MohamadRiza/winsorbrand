// lib/fileStorage.ts
// Local-disk (VPS) storage that replaces Cloudinary for NEW uploads.
//
// Active by default (set STORAGE_DRIVER=cloudinary only to temporarily revert to
// Cloudinary). Files live in UPLOAD_DIR (use an ABSOLUTE path outside the
// project folder on the VPS, e.g. /var/www/winsor-uploads, so a redeploy can
// never wipe them) and are served by app/media/[...path]/route.ts.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { CloudinaryAsset } from '@/types';

export const MEDIA_URL_PREFIX = '/media/';

export function isLocalStorageEnabled(): boolean {
  return (process.env.STORAGE_DRIVER || 'local').trim().toLowerCase() !== 'cloudinary';
}

export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  const base = configured || path.join(/*turbopackIgnore: true*/ process.cwd(), 'storage', 'uploads');
  return path.resolve(/*turbopackIgnore: true*/ base);
}

/** Resolve a relative media path safely inside UPLOAD_DIR (null if it escapes). */
export function resolveInsideUploadDir(rel: string): string | null {
  const root = getUploadDir();
  const abs = path.resolve(/*turbopackIgnore: true*/ root, rel);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_BYTES = { image: 15 * 1024 * 1024, video: 120 * 1024 * 1024, raw: 15 * 1024 * 1024 };

function sanitizeFolder(folder: string): string {
  return folder
    .split('/')
    .map((s) => s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40))
    .filter(Boolean)
    .join('/') || 'misc';
}

/**
 * Save a base64 data-URI to disk. Returns the same { url, publicId } shape the
 * rest of the app already stores in MongoDB. Images are normalised with sharp
 * (EXIF-rotated, max 2400px, WebP q85) to mirror Cloudinary's "quality auto".
 */
export async function saveToLocalStorage(
  dataUri: string,
  opts: { folder: string; resourceType?: 'image' | 'video' | 'raw' | 'auto' }
): Promise<CloudinaryAsset> {
  const m = /^data:([a-zA-Z0-9.+/-]+)(?:;[^;,]+)*;base64,([\s\S]+)$/i.exec(dataUri || '');
  if (!m) throw new Error('Invalid file payload (expected a base64 data URI).');
  const mime = m[1].toLowerCase();
  let buf: Buffer = Buffer.from(m[2], 'base64');
  if (!buf.length) throw new Error('Uploaded file is empty.');

  const kind: 'image' | 'video' | 'raw' = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'raw';
  const wanted = opts.resourceType && opts.resourceType !== 'auto' ? opts.resourceType : kind;
  if (wanted === 'image' && kind !== 'image') throw new Error('Expected an image file.');
  if (wanted === 'video' && kind !== 'video') throw new Error('Expected a video file.');
  if (buf.length > MAX_BYTES[kind]) {
    throw new Error(`File too large (max ${Math.round(MAX_BYTES[kind] / 1048576)} MB for ${kind}).`);
  }
  let ext = MIME_EXT[mime];
  if (!ext) throw new Error(`Unsupported file type: ${mime}`);

  if (kind === 'image' && mime !== 'image/gif') {
    const sharp = (await import('sharp')).default;
    buf = await sharp(buf).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    ext = '.webp';
  }

  const folder = sanitizeFolder(opts.folder);
  const name = crypto.randomBytes(16).toString('hex') + ext; // unguessable, collision-free
  const rel = `${folder}/${name}`;
  const abs = resolveInsideUploadDir(rel);
  if (!abs) throw new Error('Invalid storage path.');
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });
  await fs.promises.writeFile(abs, buf, { flag: 'wx' });

  return { url: MEDIA_URL_PREFIX + rel, publicId: `local:${rel}` };
}

/** Delete a locally stored file by the publicId produced above (no-op otherwise). */
export async function deleteFromLocalStorage(publicId: string): Promise<boolean> {
  if (!publicId?.startsWith('local:')) return false;
  const abs = resolveInsideUploadDir(publicId.slice('local:'.length));
  if (!abs) return false;
  try {
    await fs.promises.unlink(abs);
    return true;
  } catch {
    return false;
  }
}
