import { AnimatePresence, motion } from "framer-motion";

export type ToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type Props = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastStack({ items, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col gap-2">
      <AnimatePresence>
        {items.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-xl border border-stone-200 bg-stone-50 p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900"
          >
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {toast.message}
            </p>
            <div className="mt-2 flex gap-2">
              {toast.onAction ? (
                <button
                  type="button"
                  className="rounded-md bg-stone-200 px-2 py-1 text-xs font-medium hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
                  onClick={toast.onAction}
                >
                  {toast.actionLabel ?? "Undo"}
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                onClick={() => onDismiss(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
