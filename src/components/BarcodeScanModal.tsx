import * as Dialog from "@radix-ui/react-dialog";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookDraft } from "../features/books/types";
import {
  lookupIsbn,
  normalizeIsbn,
  toBookDraft,
} from "../features/books/openLibrary";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (draft: BookDraft) => void;
};

type ScanPhase = "scanning" | "looking-up" | "error";

function BarcodeScanModalBody({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (draft: BookDraft) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handledRef = useRef(false);

  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [message, setMessage] = useState(
    "Point your camera at the ISBN barcode on the book.",
  );
  const [manualIsbn, setManualIsbn] = useState("");

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const lookupAndSelect = useCallback(
    async (rawIsbn: string) => {
      const isbn = normalizeIsbn(rawIsbn);
      if (!isbn) {
        setPhase("error");
        setMessage("Could not read a valid ISBN from the barcode.");
        return;
      }

      setPhase("looking-up");
      setMessage(`Looking up ISBN ${isbn}...`);

      try {
        const result = await lookupIsbn(isbn);
        if (!result) {
          setPhase("error");
          setMessage(
            `No book found for ISBN ${isbn}. You can enter it manually below.`,
          );
          setManualIsbn(isbn);
          return;
        }

        const draft = await toBookDraft(result);
        onSelect({ ...draft, isbn: draft.isbn ?? isbn });
        onClose();
      } catch (err: unknown) {
        setPhase("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Could not look up this ISBN on Open Library.",
        );
        setManualIsbn(isbn);
      }
    },
    [onClose, onSelect],
  );

  useEffect(() => {
    handledRef.current = false;
    const reader = new BrowserMultiFormatReader();

    void (async () => {
      try {
        if (!videoRef.current) {
          setPhase("error");
          setMessage("Camera preview unavailable.");
          return;
        }

        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
            },
            audio: false,
          },
          videoRef.current,
          (result, err) => {
            if (handledRef.current) return;
            if (!result) {
              if (err && err.name !== "NotFoundException") {
                console.debug("Barcode scan:", err);
              }
              return;
            }

            const text = result.getText();
            const digits = text.replace(/[^0-9Xx]/g, "");
            if (digits.length < 10) return;

            handledRef.current = true;
            stopCamera();
            void lookupAndSelect(digits);
          },
        );
        controlsRef.current = controls;
        streamRef.current =
          videoRef.current.srcObject instanceof MediaStream
            ? videoRef.current.srcObject
            : null;
      } catch (err: unknown) {
        stopCamera();
        setPhase("error");
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setMessage(
            "Camera permission denied. Allow camera access or enter the ISBN manually.",
          );
        } else {
          setMessage(
            err instanceof Error
              ? err.message
              : "Could not start the barcode scanner.",
          );
        }
      }
    })();

    return () => {
      stopCamera();
    };
  }, [lookupAndSelect, stopCamera]);

  const handleManualSubmit = () => {
    void lookupAndSelect(manualIsbn);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Dialog.Title className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Scan ISBN
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Scan a book barcode to look it up on Open Library.
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </Dialog.Close>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="aspect-[4/3] w-full object-cover"
          muted
          playsInline
        />
        {phase === "looking-up" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <div className="flex items-center gap-2 text-sm text-stone-100">
              <Loader2 size={16} className="animate-spin" />
              Looking up book...
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm ${phase === "error" ? "text-red-600 dark:text-red-300" : "text-stone-600 dark:text-stone-300"}`}
        >
          {message}
        </p>
      ) : null}

      {phase === "error" ? (
        <div className="mt-3 flex gap-2">
          <input
            value={manualIsbn}
            onChange={(event) => setManualIsbn(event.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-stone-300 bg-stone-50 px-2 text-sm outline-none ring-stone-400 focus:ring-2 dark:border-stone-700 dark:bg-stone-950"
            placeholder="Enter ISBN"
            aria-label="ISBN manual entry"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            className="shrink-0 rounded-md border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            Look up
          </button>
        </div>
      ) : null}
    </>
  );
}

export function BarcodeScanModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 data-[state=open]:animate-[fadeIn_140ms_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(420px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-stone-100 p-4 shadow-2xl outline-none dark:border-stone-700 dark:bg-stone-900 data-[state=open]:animate-[scaleIn_160ms_ease-out] sm:p-5">
          {open ? (
            <BarcodeScanModalBody
              onClose={() => onOpenChange(false)}
              onSelect={onSelect}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
