import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera, usePhotoPicker } from "@/hooks/useCamera";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
  onSelectFromGallery?: (imageUrls: string[]) => void;
}

export const CameraCapture = ({
  isOpen,
  onClose,
  onCapture,
  onSelectFromGallery,
}: CameraCaptureProps) => {
  const {
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
    error,
    isCameraReady,
  } = useCamera({ onCapture });

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    if (urls.length > 0) {
      onSelectFromGallery?.(urls);
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    const imageUrl = capturePhoto();
    if (imageUrl) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={24} />
            </Button>
            <h2 className="font-semibold">Take Photo</h2>
            <div className="w-10" />
          </div>

          {/* Camera View */}
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {error ? (
              <div className="text-center p-4">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={startCamera}>
                  <RotateCcw size={16} className="mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Loading indicator */}
          {!isCameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-background via-background/90 to-transparent">
            <div className="flex items-center justify-around">
              {/* Gallery button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12"
                onClick={openPicker}
              >
                <ImageIcon size={24} />
              </Button>

              {/* Capture button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCapture}
                disabled={!isCameraReady}
                className="w-20 h-20 rounded-full border-4 border-foreground flex items-center justify-center disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-foreground" />
              </motion.button>

              {/* Placeholder for symmetry */}
              <div className="w-12 h-12" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PhotoPickerButtonProps {
  onSelect: (imageUrls: string[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  className?: string;
}

export const PhotoPickerButton = ({
  onSelect,
  children,
  multiple = true,
  className,
}: PhotoPickerButtonProps) => {
  const { inputRef, openPicker, handleFileChange } = usePhotoPicker(onSelect);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="outline" className={className} onClick={openPicker}>
        {children}
      </Button>
    </>
  );
};
