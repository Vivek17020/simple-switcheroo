import imageCompression from 'browser-image-compression';

export interface OptimizedImageResult {
  optimizedFile: File;
  originalFile: File;
  optimizedUrl?: string;
  originalUrl?: string;
  compressionRatio: number;
  originalSize: number;
  optimizedSize: number;
}

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;

export async function optimizeImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OptimizedImageResult> {
  try {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const originalSize = file.size;

    // Compression options
    const options = {
      maxSizeMB: 1, // Max size in MB
      maxWidthOrHeight: MAX_WIDTH, // Resize if larger than this
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/webp' : file.type, // Convert PNG to WebP
      initialQuality: 0.8, // High quality compression
      onProgress: onProgress,
    };

    // Compress the image
    const compressedFile = await imageCompression(file, options);
    const optimizedSize = compressedFile.size;
    
    // Calculate compression ratio
    const compressionRatio = Math.round((1 - optimizedSize / originalSize) * 100);

    // Rename file to reflect optimization
    const fileExtension = compressedFile.type.split('/')[1];
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const optimizedFile = new File(
      [compressedFile],
      `${baseName}-optimized.${fileExtension}`,
      { type: compressedFile.type }
    );

    return {
      optimizedFile,
      originalFile: file,
      compressionRatio,
      originalSize,
      optimizedSize,
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    // Fallback: return original if optimization fails
    return {
      optimizedFile: file,
      originalFile: file,
      compressionRatio: 0,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
