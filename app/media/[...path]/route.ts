// app/media/[...path]/route.ts
// Serves files stored on the VPS disk (UPLOAD_DIR) at /media/<path>.
// Supports HTTP Range (needed for video seeking / Safari) and long-lived caching.
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { resolveInsideUploadDir } from '@/lib/fileStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function notFound() {
  return new NextResponse('Not found', { status: 404 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) return notFound();

  let rel: string;
  try {
    rel = segments.map((s) => decodeURIComponent(s)).join('/');
  } catch {
    return notFound();
  }
  if (rel.includes('\0') || rel.split('/').some((s) => s === '..' || s.startsWith('.'))) return notFound();

  const abs = resolveInsideUploadDir(rel);
  if (!abs) return notFound();
  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) return notFound(); // never serve unknown file types

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
    if (!stat.isFile()) return notFound();
  } catch {
    return notFound();
  }

  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    ETag: etag,
    'Last-Modified': stat.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  };
  if (ext === '.svg') baseHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";

  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers: baseHeaders });
  }

  const range = req.headers.get('range');
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === '' && m[2] === '')) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
    }
    let start: number;
    let end: number;
    if (m[1] === '') {
      const suffix = Number(m[2]);
      start = Math.max(0, stat.size - suffix);
      end = stat.size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === '' ? stat.size - 1 : Math.min(Number(m[2]), stat.size - 1);
    }
    if (start >= stat.size || start > end) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(abs, { start, end })) as unknown as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: { ...baseHeaders, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(fs.createReadStream(abs)) as unknown as ReadableStream;
  return new NextResponse(stream, { status: 200, headers: { ...baseHeaders, 'Content-Length': String(stat.size) } });
}
