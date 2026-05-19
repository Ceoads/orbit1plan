import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X, ZoomIn, ZoomOut, RotateCw, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { SectionAnchor } from "./SmartScrollContext";
import { PdfPagesViewer } from "./PdfPagesViewer";

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  scrollTarget?: SectionAnchor | null;
  onScrollComplete?: () => void;
}

const isPdfUrl = (url: string, name?: string) => {
  const u = url.toLowerCase();
  const n = (name || "").toLowerCase();
  return u.includes(".pdf") || n.endsWith(".pdf");
};

export const DocumentViewer = ({ 
  fileUrl, 
  fileName, 
  scrollTarget,
  onScrollComplete 
}: DocumentViewerProps) => {
  const haptics = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<{ y: number; height: number } | null>(null);
  const [showHighlight, setShowHighlight] = useState(false);
  const [pageIndicator, setPageIndicator] = useState<{ page: number; total: number } | null>(null);
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);
  const compactScrollRef = containerRef;

  // Handle scroll to anchor
  useEffect(() => {
    if (!scrollTarget || !containerRef.current || !imageRef.current) return;

    const imageHeight = imageRef.current.offsetHeight;
    const targetY = scrollTarget.relativeY * imageHeight;
    const highlightHeight = imageHeight * 0.15; // 15% of image height

    // Calculate scroll position to center the target
    const container = containerRef.current;
    const scrollTo = targetY - container.offsetHeight / 2 + highlightHeight / 2;

    // Smooth scroll to position
    container.scrollTo({
      top: Math.max(0, scrollTo),
      behavior: 'smooth'
    });

    // Show highlight overlay
    setHighlightPosition({
      y: targetY - highlightHeight / 2,
      height: highlightHeight
    });
    setShowHighlight(true);

    // Clear highlight after animation
    const timer = setTimeout(() => {
      setShowHighlight(false);
      setHighlightPosition(null);
      onScrollComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [scrollTarget, onScrollComplete]);

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

  const isPdf = isPdfUrl(fileUrl, fileName);

  return (
    <>
      {/* Compact viewer with scroll support */}
      <motion.div
        layoutId="document-viewer"
        className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-soft"
      >
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-auto scroll-smooth overscroll-contain",
            isPdf ? "max-h-[70vh] p-3" : "aspect-[4/3]"
          )}
          style={{
            WebkitOverflowScrolling: "touch" as any,
          }}
        >
          {isPdf ? (
            <PdfPagesViewer fileUrl={fileUrl} scrollRoot={compactScrollRef} />
          ) : (
            <div className="relative min-h-full">
              <img
                ref={imageRef}
                src={fileUrl}
                alt={fileName}
                className="w-full h-auto object-contain bg-muted/50"
                loading="eager"
              />

              {/* Smart scroll highlight overlay */}
              <AnimatePresence>
                {showHighlight && highlightPosition && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: highlightPosition.y,
                      height: highlightPosition.height,
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-primary/20 border-2 border-primary/40 rounded-xl"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(var(--primary), 0.4)",
                          "0 0 0 12px rgba(var(--primary), 0)",
                        ],
                      }}
                      transition={{
                        duration: 1,
                        repeat: 2,
                        ease: "easeOut",
                      }}
                    />

                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    >
                      <Eye className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Fullscreen button overlay */}
          <Button
            onClick={handleFullscreen}
            size="icon"
            variant="secondary"
            className="sticky float-right bottom-3 right-3 mr-3 mb-3 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg hit-target z-10"
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
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 pt-safe bg-gradient-to-b from-black/70 to-transparent">
              <Button
                onClick={handleCloseFullscreen}
                size="icon"
                variant="ghost"
                className="rounded-full text-white bg-white/10 hover:bg-white/20 hit-target w-11 h-11"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </Button>

              {isPdf ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-white text-sm font-medium px-3.5 h-11 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/15"
                >
                  <ExternalLink className="w-4 h-4" />
                  Onglet
                </a>
              ) : (
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
              )}
            </div>

            {/* Content */}
            {isPdf ? (
              <>
                <div
                  ref={fullscreenScrollRef}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) handleCloseFullscreen();
                  }}
                  className="absolute inset-0 pt-20 pb-10 px-3 overflow-auto overscroll-contain"
                  style={{ WebkitOverflowScrolling: "touch" as any, touchAction: "pan-y" }}
                >
                  <div className="max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
                    <PdfPagesViewer
                      fileUrl={fileUrl}
                      scrollRoot={fullscreenScrollRef}
                      onVisiblePageChange={(page, total) => setPageIndicator({ page, total })}
                    />
                  </div>
                </div>
                {pageIndicator && pageIndicator.total > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium ring-1 ring-white/10">
                    {pageIndicator.page} / {pageIndicator.total}
                  </div>
                )}
              </>
            ) : (
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
