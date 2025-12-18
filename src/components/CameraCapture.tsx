import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, SwitchCamera, ImageIcon, RotateCcw } from "lucide-react";
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
    switchCamera,
    capturePhoto,
    videoRef,
    canvasRef,
    error,
    isCameraReady,
    facingMode,
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
  }, [isOpen]);

  const handleCapture = () => {
    const imageUrl = capturePhoto();
    if (imageUrl) {
      onClose();
    }
  };

  const handleSwitchCamera = async () => {
    await switchCamera();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black"
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
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X size={24} />
            </Button>
            <h2 className="font-semibold text-white">Take Photo</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSwitchCamera}
              disabled={!isCameraReady}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              <SwitchCamera size={24} />
            </Button>
          </div>

          {/* Camera View */}
          <div className="absolute inset-0 flex items-center justify-center">
            {error ? (
              <div className="text-center p-4">
                <p className="text-red-400 mb-4">{error}</p>
                <Button variant="outline" onClick={() => startCamera()} className="text-white border-white hover:bg-white/20">
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
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
                style={{ 
                  opacity: isCameraReady ? 1 : 0,
                  transition: "opacity 0.2s ease-in-out"
                }}
              />
            )}
          </div>

          {/* Loading indicator */}
          {!isCameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-3">
                <Camera size={48} className="text-white/60" />
                <p className="text-sm text-white/60">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-around">
              {/* Gallery button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 text-white hover:bg-white/20"
                onClick={openPicker}
              >
                <ImageIcon size={28} />
              </Button>

              {/* Capture button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCapture}
                disabled={!isCameraReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </motion.button>

              {/* Placeholder for symmetry */}
              <div className="w-14 h-14" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Photo selection choice dialog component
interface PhotoChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseCamera: () => void;
  onChooseGallery: () => void;
}

export const PhotoChoiceDialog = ({
  isOpen,
  onClose,
  onChooseCamera,
  onChooseGallery,
}: PhotoChoiceDialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8"
          >
            <div className="bg-card rounded-2xl overflow-hidden shadow-xl">
              <button
                onClick={onChooseCamera}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera size={24} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Take a Photo</p>
                  <p className="text-sm text-muted-foreground">Use your camera</p>
                </div>
              </button>
              
              <button
                onClick={onChooseGallery}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <ImageIcon size={24} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Choose from Gallery</p>
                  <p className="text-sm text-muted-foreground">Select existing photos</p>
                </div>
              </button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-3 py-6 rounded-2xl text-base font-medium"
              onClick={onClose}
            >
              Cancel
            </Button>
          </motion.div>
        </>
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
