import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker via CDN — évite les soucis de résolution Vite du worker .mjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPagesViewerProps {
  fileUrl: string;
  /** Largeur en pixels pour le rendu. Auto-mesurée si omise. */
  width?: number;
  /** Conteneur scrollable parent — utilisé comme root de l'IntersectionObserver. */
  scrollRoot?: RefObject<HTMLElement> | null;
  /** Callback à chaque changement de page visible (pour indicateur). */
  onVisiblePageChange?: (page: number, total: number) => void;
}

interface LazyPageProps {
  pageNumber: number;
  totalPages: number;
  width?: number;
  scrollRoot?: RefObject<HTMLElement> | null;
  onVisible?: (page: number) => void;
}

const LazyPage = ({ pageNumber, totalPages, width, scrollRoot, onVisible }: LazyPageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  // ratio A4 par défaut tant qu'on ne connaît pas la vraie taille
  const [estimatedHeight, setEstimatedHeight] = useState<number>(() =>
    width ? Math.round(width * 1.414) : 600
  );

  useEffect(() => {
    if (width) setEstimatedHeight((h) => (shouldRender ? h : Math.round(width * 1.414)));
  }, [width, shouldRender]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldRender(true);
            onVisible?.(pageNumber);
          }
        }
      },
      {
        root: scrollRoot?.current ?? null,
        rootMargin: "800px 0px",
        threshold: 0.01,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, scrollRoot, onVisible]);

  return (
    <div
      ref={ref}
      className="w-full rounded-xl overflow-hidden bg-white shadow-soft"
      style={!shouldRender ? { minHeight: estimatedHeight } : undefined}
    >
      {shouldRender ? (
        <>
          <Page
            pageNumber={pageNumber}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            devicePixelRatio={Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2)}
            onRenderSuccess={({ height }) => {
              if (height && Math.abs(height - estimatedHeight) > 4) {
                setEstimatedHeight(height);
              }
            }}
            loading={
              <div
                className="flex items-center justify-center bg-muted/30"
                style={{ height: estimatedHeight }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            }
          />
          {totalPages > 1 && (
            <div className="text-[11px] text-muted-foreground text-center py-1.5 bg-muted/30">
              Page {pageNumber} / {totalPages}
            </div>
          )}
        </>
      ) : (
        <div
          className="flex items-center justify-center bg-muted/20 text-[11px] text-muted-foreground"
          style={{ height: estimatedHeight }}
        >
          Page {pageNumber} / {totalPages}
        </div>
      )}
    </div>
  );
};

export const PdfPagesViewer = ({ fileUrl, width, scrollRoot, onVisiblePageChange }: PdfPagesViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(width);

  useEffect(() => {
    if (width) return;
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Math.abs((measuredWidth || 0) - w) > 2) {
        setMeasuredWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, measuredWidth]);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  }, []);

  const onLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError("Impossible de charger le PDF");
  }, []);

  const handleVisible = useCallback(
    (page: number) => {
      onVisiblePageChange?.(page, numPages);
    },
    [onVisiblePageChange, numPages]
  );

  return (
    <div ref={wrapRef} className="w-full">
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement du PDF…
          </div>
        }
        error={
          <div className="py-12 text-center text-sm text-muted-foreground">
            {error || "Impossible de charger le PDF"}
            <div className="mt-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        }
        className="flex flex-col items-center gap-3"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <LazyPage
            key={`page-${i + 1}`}
            pageNumber={i + 1}
            totalPages={numPages}
            width={measuredWidth}
            scrollRoot={scrollRoot}
            onVisible={handleVisible}
          />
        ))}
      </Document>
    </div>
  );
};
