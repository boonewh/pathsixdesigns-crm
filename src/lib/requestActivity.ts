let pendingReads = 0;
const listeners = new Set<() => void>();

export const getPendingReads = () => pendingReads;
export const subscribeToReads = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function beginRead() {
  pendingReads += 1;
  listeners.forEach(listener => listener());
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    pendingReads -= 1;
    listeners.forEach(listener => listener());
  };
}
