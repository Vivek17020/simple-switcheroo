import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface UploadOptions {
  folder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Compress image before upload
 */
async function compressImage(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number; onProgress?: (progress: number) => void }
): Promise<File> {
  const { maxSizeMB = 1, maxWidthOrHeight = 1920, onProgress } = options;

  // Skip compression for small files
  if (file.size < 100 * 1024) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      onProgress: onProgress ? (p) => onProgress(Math.round(p)) : undefined,
    });

    console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB`);
    return compressed;
  } catch (error) {
    console.warn('Compression failed, using original:', error);
    return file;
  }
}

/**
 * Convert File to base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Cloudinary via edge function
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'articles', maxSizeMB = 1, maxWidthOrHeight = 1920, onProgress } = options;

  // Step 1: Compress image
  onProgress?.(10);
  const compressedFile = await compressImage(file, {
    maxSizeMB,
    maxWidthOrHeight,
    onProgress: (p) => onProgress?.(10 + p * 0.4), // 10-50%
  });

  // Step 2: Convert to base64
  onProgress?.(55);
  const base64 = await fileToBase64(compressedFile);

  // Step 3: Upload via edge function
  onProgress?.(60);
  const { data, error } = await supabase.functions.invoke('upload-image', {
    body: {
      image: base64,
      folder,
    },
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Upload failed');
  }

  onProgress?.(100);

  return {
    url: data.url,
    publicId: data.publicId,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Upload featured image (larger size for Google Discover)
 */
export async function uploadFeaturedImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadToCloudinary(file, {
    folder: 'featured',
    maxSizeMB: 2,
    maxWidthOrHeight: 1920, // Preserve larger size for Google Discover
    onProgress,
  });
}

/**
 * Upload web story slide image
 */
export async function uploadWebStoryImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadToCloudinary(file, {
    folder: 'web-stories',
    maxSizeMB: 0.5, // Smaller for mobile stories
    maxWidthOrHeight: 1280,
    onProgress,
  });
}

/**
 * Upload content image (inline in articles)
 */
export async function uploadContentImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadToCloudinary(file, {
    folder: 'content',
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    onProgress,
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
