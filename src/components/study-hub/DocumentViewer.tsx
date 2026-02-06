import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
}

export const DocumentViewer = ({ fileUrl, fileName }: DocumentViewerProps) => {
  const haptics = useHaptics();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleFullscreen = () => {
    haptics.selection();
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    haptics.soft();
    setIsFullscreen(false);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    haptics.selection();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    haptics.selection();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    haptics.selection();
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <>
      {/* Compact viewer */}
      <motion.div
        layoutId="document-viewer"
        className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-soft"
      >
        <div className="aspect-[4/3] relative">
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-full object-contain bg-muted/50"
            loading="eager"
          />
          
          {/* Fullscreen button overlay */}
          <Button
            onClick={handleFullscreen}
            size="icon"
            variant="secondary"
            className="absolute bottom-3 right-3 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg hit-target"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            {/* Controls header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/50 to-transparent">
              <Button
                onClick={handleCloseFullscreen}
                size="icon"
                variant="ghost"
                className="rounded-xl text-white hover:bg-white/20 hit-target"
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleZoomOut}
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-white hover:bg-white/20 hit-target"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  onClick={handleZoomIn}
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-white hover:bg-white/20 hit-target"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleRotate}
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-white hover:bg-white/20 hit-target"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Image container with zoom and pan */}
            <div className="absolute inset-0 flex items-center justify-center overflow-auto">
              <motion.img
                layoutId="document-viewer"
                src={fileUrl}
                alt={fileName}
                className="max-w-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                dragElastic={0.1}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
