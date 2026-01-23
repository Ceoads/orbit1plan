import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { GlassCard } from "./GlassCard";
import { Camera, X, QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface QRCodeScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export const QRCodeScanner = ({ onScan, onClose }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isValidCalendarUrl = (url: string): boolean => {
    const lowered = url.toLowerCase();
    return (
      lowered.includes('.ics') ||
      lowered.includes('ical') ||
      lowered.includes('vcal') ||
      lowered.includes('calendar') ||
      lowered.includes('planning') ||
      lowered.includes('webcal://') ||
      lowered.includes('hyperplanning') ||
      lowered.includes('celcat') ||
      lowered.includes('ade') ||
      (lowered.startsWith('http') && (
        lowered.includes('export') ||
        lowered.includes('subscribe')
      ))
    );
  };

  const normalizeCalendarUrl = (url: string): string => {
    // Convert webcal:// to https://
    if (url.startsWith('webcal://')) {
      return url.replace('webcal://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const scannerId = "qr-reader";
      
      // Wait for the container to be mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!document.getElementById(scannerId)) {
        console.error("Scanner container not found");
        return;
      }

      scannerRef.current = new Html5Qrcode(scannerId);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // QR Code not detected - ignore
        }
      );
      
      setIsScanning(true);
      setHasPermission(true);
    } catch (error: any) {
      console.error("Failed to start scanner:", error);
      setHasPermission(false);
      
      if (error.message?.includes('Permission denied')) {
        toast.error("Accès caméra refusé", {
          description: "Autorise l'accès à la caméra dans les paramètres",
        });
      } else {
        toast.error("Impossible d'ouvrir la caméra");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately
    await stopScanner();
    
    const normalizedUrl = normalizeCalendarUrl(decodedText.trim());
    
    if (isValidCalendarUrl(normalizedUrl)) {
      setScannedUrl(normalizedUrl);
      toast.success("QR Code détecté !", {
        description: "URL de calendrier trouvée",
      });
      
      // Auto-submit after a short delay
      setTimeout(() => {
        onScan(normalizedUrl);
      }, 1000);
    } else if (decodedText.startsWith('http')) {
      // It's a URL but might not be a calendar - let user decide
      setScannedUrl(normalizedUrl);
      toast.info("URL détectée", {
        description: "Vérifie si c'est bien ton calendrier",
      });
    } else {
      toast.error("QR Code invalide", {
        description: "Ce n'est pas une URL de calendrier",
      });
      // Restart scanning
      startScanner();
    }
  };

  const handleConfirm = () => {
    if (scannedUrl) {
      onScan(scannedUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <QrCode className="w-5 h-5" />
            <span className="font-display font-semibold">Scanner QR</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner or Result */}
        <GlassCard variant="elevated" className="p-4 overflow-hidden">
          {scannedUrl ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-foreground mb-2">
                  URL détectée
                </p>
                <p className="text-sm text-muted-foreground break-all px-2 max-h-20 overflow-y-auto">
                  {scannedUrl}
                </p>
              </div>
              <Button
                onClick={handleConfirm}
                className="w-full gradient-primary text-white rounded-xl"
              >
                Utiliser cette URL
              </Button>
            </div>
          ) : (
            <>
              {/* Camera Viewfinder */}
              <div 
                ref={containerRef}
                className="relative bg-black rounded-2xl overflow-hidden aspect-square"
              >
                <div id="qr-reader" className="w-full h-full" />
                
                {/* Viewfinder Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner markers */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                    </div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 overflow-hidden">
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {!isScanning && hasPermission === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Permission denied */}
                {hasPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-white font-medium mb-2">Caméra non disponible</p>
                    <p className="text-muted-foreground text-sm">
                      Autorise l'accès à la caméra ou entre l'URL manuellement
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  📱 Pointe le QR code de ton calendrier
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Compatible iCal, vCal, Hyperplanning, CELCAT, ADE...
                </p>
              </div>
            </>
          )}
        </GlassCard>

        {/* Cancel button */}
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-4 text-white/70 hover:text-white hover:bg-white/10"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};
