import { CloudinaryAsset } from '@/types';

/**
 * Uploads a single file to /api/upload using XMLHttpRequest to capture real byte-level progress events.
 */
export const uploadSingleFileWithXHR = (
  file: File,
  type: 'thumbnail' | 'gallery' | 'colorImage' | 'video',
  onProgress: (loadedBytesForThisFile: number) => void
): Promise<CloudinaryAsset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.data) {
              resolve(res.data);
            } else {
              reject(new Error(res.error || 'Upload failed'));
            }
          } catch (err) {
            reject(new Error('Invalid response from upload API'));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error || `Upload failed with HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`Upload HTTP error ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(JSON.stringify({ file: base64, type, name: file.name }));
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
};
