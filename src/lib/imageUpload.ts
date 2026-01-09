import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Resizes and compresses an image blob to JPEG format
 */
const resizeAndCompressImage = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
};

/**
 * Converts a base64 data URL to a Blob
 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Uploads images to Supabase Storage, converting base64 to URLs.
 * If an image is already a URL, it's kept as-is.
 * 
 * @param userId - The user's ID for folder path
 * @param images - Array of image strings (base64 data URLs or existing URLs)
 * @returns Array of public URLs for all images
 */
export const uploadImagesIfNeeded = async (
  userId: string,
  images?: string[]
): Promise<string[]> => {
  if (!images || images.length === 0) {
    return [];
  }
  
  const uploadedUrls: string[] = [];
  
  for (const image of images) {
    // If it's already a URL (not base64), keep it as-is
    if (!image.startsWith("data:image/")) {
      uploadedUrls.push(image);
      continue;
    }
    
    try {
      // Convert base64 to blob
      const originalBlob = dataUrlToBlob(image);
      
      // Resize and compress
      const compressedBlob = await resizeAndCompressImage(originalBlob);
      
      // Generate unique filename
      const uuid = crypto.randomUUID();
      const filePath = `${userId}/${uuid}.jpg`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });
      
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        // Fall back to original base64 if upload fails
        uploadedUrls.push(image);
        continue;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);
      
      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error("Error processing image:", error);
      // Fall back to original if processing fails
      uploadedUrls.push(image);
    }
  }
  
  return uploadedUrls;
};

/**
 * Generates an optimized image URL for Supabase storage images.
 * Falls back to original URL if not a storage URL.
 */
export const getOptimizedImageUrl = (url: string, width = 800, quality = 80): string => {
  if (url.includes("/storage/v1/object/")) {
    const renderUrl = url.replace("/storage/v1/object/", "/storage/v1/render/image/");
    const separator = renderUrl.includes("?") ? "&" : "?";
    return `${renderUrl}${separator}width=${width}&quality=${quality}`;
  }
  return url;
};
