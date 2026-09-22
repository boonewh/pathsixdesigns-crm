import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { getPendingReads, subscribeToReads } from "@/lib/requestActivity";

export default function RequestActivity() {
  const pending = useSyncExternalStore(subscribeToReads, getPendingReads);
  return (
    <span role="status" aria-live="polite" className="inline-flex min-w-24 items-center gap-2 text-sm">
      {pending > 0 && <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />Loading…</>}
    </span>
  );
}
