import { toast } from "sonner";

import { undoLastAction } from "@/lib/products.functions";

export function showUndoToast(message: string, onAfterUndo?: () => void) {
  toast(message, {
    duration: 15_000,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          const r = await undoLastAction();
          if (r.success) {
            toast.success(`Action reversed${r.restoredName ? `: ${r.restoredName}` : ""}`);
            onAfterUndo?.();
          } else {
            toast.warning(r.message ?? "Nothing to undo");
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Undo failed");
        }
      },
    },
  });
}
