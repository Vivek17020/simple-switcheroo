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

// Standard max dimensions for general images
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;

// Google Discover minimum requirements
const GOOGLE_DISCOVER_MIN_WIDTH = 1200;
const FEATURED_IMAGE_MIN_WIDTH = 1200;
const FEATURED_IMAGE_MIN_HEIGHT = 675;

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a File
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if image meets Google Discover requirements
 */
export function meetsGoogleDiscoverRequirements(dimensions: ImageDimensions): boolean {
  return dimensions.width >= GOOGLE_DISCOVER_MIN_WIDTH;
}

/**
 * Optimize image for featured/hero use (preserves minimum 1200px width for Google Discover)
 */
export async function optimizeFeaturedImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OptimizedImageResult> {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const originalSize = file.size;
    const dimensions = await getImageDimensions(file);
    
    console.log('Original featured image dimensions:', dimensions);

    // For featured images, we need to maintain at least 1200px width
    // Only compress if image is larger than needed
    const options = {
      maxSizeMB: 2, // Allow larger files for featured images (higher quality)
      maxWidthOrHeight: Math.max(dimensions.width, FEATURED_IMAGE_MIN_WIDTH), // Don't downscale below 1200px
      useWebWorker: true,
      fileType: 'image/webp' as const, // WebP for better quality/size ratio
      initialQuality: 0.9, // Higher quality for featured images
      onProgress: onProgress,
      preserveExif: false,
    };

    // If image is smaller than 1200px, don't compress - just convert format
    if (dimensions.width < FEATURED_IMAGE_MIN_WIDTH) {
      console.warn('⚠️ Featured image is smaller than 1200px - may not be optimal for Google Discover');
    }

    const compressedFile = await imageCompression(file, options);
    const optimizedSize = compressedFile.size;
    const compressionRatio = Math.round((1 - optimizedSize / originalSize) * 100);

    const fileExtension = compressedFile.type.split('/')[1];
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const optimizedFile = new File(
      [compressedFile],
      `${baseName}-featured.${fileExtension}`,
      { type: compressedFile.type }
    );

    // Verify final dimensions
    const finalDimensions = await getImageDimensions(optimizedFile);
    console.log('Optimized featured image dimensions:', finalDimensions);

    return {
      optimizedFile,
      originalFile: file,
      compressionRatio,
      originalSize,
      optimizedSize,
    };
  } catch (error) {
    console.error('Featured image optimization error:', error);
    return {
      optimizedFile: file,
      originalFile: file,
      compressionRatio: 0,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
}

/**
 * Standard image optimization for content images
 */
export async function optimizeImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OptimizedImageResult> {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const originalSize = file.size;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: MAX_WIDTH,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/webp' : file.type,
      initialQuality: 0.8,
      onProgress: onProgress,
    };

    const compressedFile = await imageCompression(file, options);
    const optimizedSize = compressedFile.size;
    const compressionRatio = Math.round((1 - optimizedSize / originalSize) * 100);

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
