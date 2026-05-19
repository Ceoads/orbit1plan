import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use the worker shipped with pdfjs-dist via Vite URL import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite handles the ?url import
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfPagesViewerProps {
  fileUrl: string;
  /** Width in pixels used to render each page. Auto-measured if omitted. */
  width?: number;
}

export const PdfPagesViewer = ({ fileUrl, width }: PdfPagesViewerProps) => {
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
                rel="noreferrer"
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
          <div
            key={`page-${i + 1}`}
            className="w-full rounded-xl overflow-hidden bg-white shadow-soft"
          >
            <Page
              pageNumber={i + 1}
              width={measuredWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div
                  className="flex items-center justify-center bg-muted/30"
                  style={{ height: 400 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              }
            />
            {numPages > 1 && (
              <div className="text-[11px] text-muted-foreground text-center py-1.5 bg-muted/30">
                Page {i + 1} / {numPages}
              </div>
            )}
          </div>
        ))}
      </Document>
    </div>
  );
};
