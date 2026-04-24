// Minimal toast — no Radix dependency. Shows a stack of cards bottom-right.
import * as React from "react";

type ToastVariant = "default" | "destructive";
interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
}

type ToastInput = Omit<Toast, "id"> & { id?: string };

type Listener = (toasts: Toast[]) => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];
const TTL = 3500;

function emit() {
  listeners.forEach((l) => l(toasts));
}

function addToast(t: ToastInput) {
  const id = t.id ?? Math.random().toString(36).slice(2);
  const toast: Toast = { id, ...t };
  toasts = [...toasts, toast];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id);
    emit();
  }, TTL);
  return id;
}

export function toast(input: ToastInput) {
  return addToast(input);
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>(toasts);
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return { toast: addToast, toasts: state };
}

export function Toaster() {
  const { toasts: list } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border p-3 shadow-lg animate-slide-in ${
            t.variant === "destructive"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-card text-foreground"
          }`}
        >
          {t.title && (
            <div className="text-sm font-semibold leading-tight">{t.title}</div>
          )}
          {t.description && (
            <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
