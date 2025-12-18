import { useState, useRef, useCallback } from "react";

interface UseCameraOptions {
  onCapture?: (imageUrl: string) => void;
  initialFacingMode?: "user" | "environment";
}

export const useCamera = ({ onCapture, initialFacingMode = "environment" }: UseCameraOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(initialFacingMode);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = useCallback(async (mode?: "user" | "environment") => {
    const targetMode = mode ?? facingMode;
    
    try {
      setError(null);
      setIsCameraReady(false);
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: targetMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false,
      });
      
      setStream(mediaStream);
      setFacingMode(targetMode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Use loadeddata event for more reliable detection
        videoRef.current.onloadeddata = () => {
          setIsCameraReady(true);
        };
        // Also listen for play event as fallback
        videoRef.current.onplaying = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraReady(false);
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    await startCamera(newMode);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Mirror the image if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
    
    onCapture?.(imageUrl);
    return imageUrl;
  }, [onCapture, facingMode]);

  const openCamera = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCamera = useCallback(() => {
    stopCamera();
    setIsOpen(false);
  }, [stopCamera]);

  return {
    isOpen,
    openCamera,
    closeCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    videoRef,
    canvasRef,
    stream,
    error,
    isCameraReady,
    facingMode,
  };
};

export const usePhotoPicker = (onSelect?: (imageUrls: string[]) => void) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const imageUrls: string[] = [];
      const readers: Promise<string>[] = [];

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          readers.push(
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            })
          );
        }
      });

      Promise.all(readers).then((urls) => {
        onSelect?.(urls);
      });

      // Reset input to allow selecting the same file again
      event.target.value = "";
    },
    [onSelect]
  );

  return {
    inputRef,
    openPicker,
    handleFileChange,
  };
};
