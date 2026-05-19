import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

const OUTPUT_SIZE = 512; // px (square)
const JPEG_QUALITY = 0.85;

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
  saving?: boolean;
}

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export const AvatarCropDialog = ({ open, imageSrc, onClose, onConfirm, saving }: AvatarCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onConfirm(file);
    } finally {
      setProcessing(false);
    }
  };

  const busy = processing || saving;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-base font-semibold">Recadrer ta photo</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-72 bg-muted/60 mt-3">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="px-5 py-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Zoom</p>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(v) => setZoom(v[0])}
            disabled={busy}
          />
        </div>

        <DialogFooter className="px-5 pb-5 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={busy || !areaPixels} className="flex-1">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
