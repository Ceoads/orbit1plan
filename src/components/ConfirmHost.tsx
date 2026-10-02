import { useEffect, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Req = { title: string; description?: string; confirmLabel?: string; destructive?: boolean; resolve: (ok: boolean) => void };
let push: ((r: Req) => void) | null = null;

/** Opens a "Es-tu sûr ?" dialog and resolves true if the user confirms. */
export const confirmAction = (opts: Omit<Req, "resolve">) =>
  new Promise<boolean>((resolve) => (push ? push({ ...opts, resolve }) : resolve(window.confirm(opts.title))));

export const ConfirmHost = () => {
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => { push = setReq; return () => { push = null; }; }, []);
  const close = (ok: boolean) => { req?.resolve(ok); setReq(null); };
  return (
    <AlertDialog open={!!req} onOpenChange={(o) => !o && close(false)}>
      <AlertDialogContent className="rounded-3xl p-8 gap-6 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{req?.title}</AlertDialogTitle>
          {req?.description && <AlertDialogDescription>{req.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="h-11 rounded-2xl" onClick={() => close(false)}>Annuler</AlertDialogCancel>
          <AlertDialogAction className={req?.destructive === false ? "h-11 rounded-2xl" : "h-11 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            onClick={() => close(true)}>{req?.confirmLabel ?? "Supprimer"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
