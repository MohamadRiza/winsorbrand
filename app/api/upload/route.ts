import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/models/uploadToCloudinary';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/upload
// Body: { file: base64string, type: "thumbnail"|"gallery"|"colorImage"|"retailer"|"video"|"document", name: string }
export async function POST(req: NextRequest) {
  try {
    const { file, type, name } = await req.json();

    const folderMap: Record<string, string> = {
      thumbnail:  'winsor/thumbnails',
      gallery:    'winsor/gallery',
      colorImage: 'winsor/colors',
      retailer:   'winsor/retailers',
      video:      'winsor/videos',
      document:   'winsor/documents',
    };

    const asset = await uploadToCloudinary(file, {
      folder:       folderMap[type] ?? 'winsor/misc',
      resourceType: type === 'video' ? 'video' : (type === 'document' ? 'auto' : 'image'),
    });

    return NextResponse.json({ success: true, data: asset });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Upload failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}