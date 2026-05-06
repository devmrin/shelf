import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Book, BookDraft } from "../features/books/types";
import {
  detectDuplicates,
  clearDraft,
  getDraft,
  upsertDraft,
} from "../features/books/repository";
import { filesFromClipboard, optimizeImage } from "../utils/image";

type Props = {
  onSave: (data: BookDraft) => Promise<void>;
  editingBook?: Book;
  onCancelEdit?: () => void;
  instantMode: boolean;
  setInstantMode: (value: boolean) => void;
};

type FormValues = {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishedYear?: number;
  categories: string;
  tags: string;
  notes: string;
  rating?: number;
  status: "unread" | "reading" | "completed";
  readyToDonate: boolean;
  isFavorite: boolean;
};

const DRAFT_KEY = "book-form-draft";

export function BookForm(props: Props) {
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string | undefined>(
    props.editingBook?.coverImage,
  );
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    props.editingBook?.additionalImages ?? [],
  );
  const [duplicates, setDuplicates] = useState<
    { id: string; title: string; author?: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      title: props.editingBook?.title ?? "",
      author: props.editingBook?.author ?? "",
      isbn: props.editingBook?.isbn ?? "",
      publisher: props.editingBook?.publisher ?? "",
      publishedYear: props.editingBook?.publishedYear,
      categories: (props.editingBook?.categories ?? []).join(", "),
      tags: (props.editingBook?.tags ?? []).join(", "),
      notes: props.editingBook?.notes ?? "",
      rating: props.editingBook?.rating,
      status: props.editingBook?.status ?? "unread",
      readyToDonate: props.editingBook?.readyToDonate ?? false,
      isFavorite: props.editingBook?.isFavorite ?? false,
    },
  });

  const title = watch("title");
  const author = watch("author");
  const formSnapshot = watch();

  useEffect(() => {
    void (async () => {
      if (props.editingBook) return;
      const draft = await getDraft(DRAFT_KEY);
      if (!draft?.payload) return;
      try {
        const parsed = JSON.parse(draft.payload) as FormValues & {
          coverImage?: string;
          additionalImages?: string[];
        };
        reset(parsed);
        setCoverImage(parsed.coverImage);
        setAdditionalImages(parsed.additionalImages ?? []);
      } catch {
        // noop
      }
    })();
  }, [props.editingBook, reset]);

  useEffect(() => {
    if (props.editingBook) return;
    const id = window.setTimeout(() => {
      void upsertDraft(
        DRAFT_KEY,
        JSON.stringify({ ...formSnapshot, coverImage, additionalImages }),
      );
    }, 280);

    return () => window.clearTimeout(id);
  }, [formSnapshot, coverImage, additionalImages, props.editingBook]);

  useEffect(() => {
    if (!title.trim()) {
      setDuplicates([]);
      return;
    }

    const id = window.setTimeout(() => {
      void detectDuplicates({ title, author }).then((matches) => {
        setDuplicates(
          matches.map(({ id, title, author }) => ({ id, title, author })),
        );
      });
    }, 220);

    return () => window.clearTimeout(id);
  }, [title, author]);

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      void filesFromClipboard(event).then((files) => {
        if (!files.length) return;
        event.preventDefault();
        void addImageFiles(files);
      });
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  });

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const addImageFiles = async (files: Blob[]) => {
    const optimized = await Promise.all(
      files.map(async (file) => {
        const result = await optimizeImage(file);
        return result.full || result.fallback;
      }),
    );

    if (!coverImage && optimized[0]) {
      setCoverImage(optimized[0]);
      setAdditionalImages(optimized.slice(1));
    } else {
      setAdditionalImages((current) => [...current, ...optimized]);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload: BookDraft = {
        ...values,
        categories: values.categories
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        tags: values.tags
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        coverImage,
        additionalImages,
      };

      await props.onSave(payload);

      if (props.instantMode) {
        reset({ ...values, title: "", author: "" });
        setCoverImage(undefined);
        setAdditionalImages([]);
      } else {
        reset();
        setCoverImage(undefined);
        setAdditionalImages([]);
      }

      await clearDraft(DRAFT_KEY);
    } finally {
      setSaving(false);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/"),
        );
        if (files.length) void addImageFiles(files);
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          {props.editingBook ? "Edit Book" : "Add Book"}
        </h3>
        <label className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300">
          <input
            type="checkbox"
            checked={props.instantMode}
            onChange={(event) => props.setInstantMode(event.target.checked)}
          />
          Instant Add
        </label>
      </div>

      <input
        {...register("title", { required: true })}
        className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-950"
        placeholder="Title *"
        autoFocus
        aria-label="Book title"
      />
      <input
        {...register("author")}
        className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-950"
        placeholder="Author"
        aria-label="Book author"
      />

      {duplicates.length ? (
        <p className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Possible duplicates:{" "}
          {duplicates
            .map((match) => `${match.title} (${match.author ?? "Unknown"})`)
            .join(", ")}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 rounded-md border border-stone-300 px-2 text-xs hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Upload Cover
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void addImageFiles(files);
            event.target.value = "";
          }}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          className="text-xs"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void addImageFiles(files);
            event.target.value = "";
          }}
        />
      </div>

      {coverImage ? (
        <div className="relative mt-1">
          <img
            src={coverImage}
            alt="Cover preview"
            className="aspect-[3/4] w-28 rounded-md object-cover"
          />
          <button
            type="button"
            className="absolute -right-2 -top-2 rounded-full bg-stone-950 px-2 py-1 text-[10px] text-stone-50"
            onClick={() => setCoverImage(undefined)}
          >
            Remove
          </button>
        </div>
      ) : null}

      {!props.instantMode ? (
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="text-xs text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
        >
          {showMore ? "Hide details" : "More details"}
        </button>
      ) : null}

      {(showMore || !props.instantMode) && (
        <div className="grid grid-cols-2 gap-2">
          <input
            {...register("isbn")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="ISBN"
          />
          <input
            {...register("publisher")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Publisher"
          />
          <input
            {...register("publishedYear", { valueAsNumber: true })}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Year"
            type="number"
          />
          <input
            {...register("categories")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Categories (comma)"
          />
          <input
            {...register("tags")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Tags (comma)"
          />
          <select
            {...register("status")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
          >
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="completed">Completed</option>
          </select>
          <textarea
            {...register("notes")}
            className="col-span-2 h-16 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Notes"
          />
          <input
            {...register("rating", { valueAsNumber: true })}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Rating (1-5)"
            type="number"
            min={1}
            max={5}
          />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" {...register("isFavorite")} /> Favorite
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" {...register("readyToDonate")} /> Donate
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSave || saving}
          className="h-9 flex-1 rounded-lg bg-stone-900 text-sm font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
        >
          {saving
            ? "Saving..."
            : props.instantMode
              ? "Add (Enter)"
              : "Save Book"}
        </button>
        {props.editingBook && props.onCancelEdit ? (
          <button
            type="button"
            className="h-9 rounded-lg border border-stone-300 px-3 text-sm dark:border-stone-700"
            onClick={props.onCancelEdit}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
