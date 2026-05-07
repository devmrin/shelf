import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronUp, Plus, Star, X } from "lucide-react";
import type { Book, BookDraft } from "../features/books/types";
import {
  detectDuplicates,
  clearDraft,
  getCategoryTagOptions,
  getDraft,
  upsertDraft,
} from "../features/books/repository";
import { filesFromClipboard, optimizeImage } from "../utils/image";
import { MultiValueSelect } from "./MultiValueSelect";
import { RadixCheckbox } from "./RadixCheckbox";
import { SingleSelect } from "./SingleSelect";

type Props = {
  onSave: (data: BookDraft) => Promise<void>;
  editingBook?: Book;
  onCancelEdit?: () => void;
};

type FormValues = {
  title: string;
  authors: string[];
  isbn: string;
  publisher: string;
  publishedYear: string;
  categories: string[];
  tags: string[];
  notes: string;
  rating?: number;
  status: "unread" | "reading" | "completed";
  readyToDonate: boolean;
  isFavorite: boolean;
};

const DRAFT_KEY = "book-form-draft";

function toFormValues(book?: Book): FormValues {
  const authorList = (book?.author ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    title: book?.title ?? "",
    authors: authorList.length ? authorList : [""],
    isbn: book?.isbn ?? "",
    publisher: book?.publisher ?? "",
    publishedYear:
      typeof book?.publishedYear === "number" ? String(book.publishedYear) : "",
    categories: book?.categories ?? [],
    tags: book?.tags ?? [],
    notes: book?.notes ?? "",
    rating: book?.rating,
    status: book?.status ?? "unread",
    readyToDonate: book?.readyToDonate ?? false,
    isFavorite: book?.isFavorite ?? false,
  };
}

export function BookForm(props: Props) {
  const [showMore, setShowMore] = useState(true);
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
  const coverInputId = "book-cover-upload";

  const { register, handleSubmit, watch, reset, setValue } =
    useForm<FormValues>({
      defaultValues: toFormValues(props.editingBook),
    });

  const categoryTagOptions = useLiveQuery(() => getCategoryTagOptions(), [], {
    categories: [],
    tags: [],
  }) ?? { categories: [], tags: [] };

  const title = watch("title");
  const authors = watch("authors") ?? [];
  const categories = watch("categories") ?? [];
  const tags = watch("tags") ?? [];
  const rating = watch("rating");
  const status = watch("status");
  const isFavorite = watch("isFavorite");
  const readyToDonate = watch("readyToDonate");
  const author = authors
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
  const formSnapshot = watch();

  useEffect(() => {
    reset(toFormValues(props.editingBook));
    setCoverImage(props.editingBook?.coverImage);
    setAdditionalImages(props.editingBook?.additionalImages ?? []);

    if (props.editingBook) {
      setShowMore(true);
    }
  }, [props.editingBook, reset]);

  useEffect(() => {
    void (async () => {
      if (props.editingBook) return;
      const draft = await getDraft(DRAFT_KEY);
      if (!draft?.payload) return;
      try {
        const parsed = JSON.parse(draft.payload) as Record<string, unknown>;

        const parsedCategories = Array.isArray(parsed.categories)
          ? parsed.categories
              .map((entry) => String(entry).trim())
              .filter(Boolean)
          : typeof parsed.categories === "string"
            ? parsed.categories
                .split(",")
                .map((entry: string) => entry.trim())
                .filter(Boolean)
            : [];

        const parsedTags = Array.isArray(parsed.tags)
          ? parsed.tags.map((entry) => String(entry).trim()).filter(Boolean)
          : typeof parsed.tags === "string"
            ? parsed.tags
                .split(",")
                .map((entry: string) => entry.trim())
                .filter(Boolean)
            : [];

        const parsedAuthors = Array.isArray(parsed.authors)
          ? parsed.authors.map((entry) => String(entry).trim()).filter(Boolean)
          : typeof parsed.author === "string"
            ? parsed.author
                .split(",")
                .map((entry: string) => entry.trim())
                .filter(Boolean)
            : [];

        reset({
          title: typeof parsed.title === "string" ? parsed.title : "",
          authors: parsedAuthors.length ? parsedAuthors : [""],
          isbn: typeof parsed.isbn === "string" ? parsed.isbn : "",
          publisher:
            typeof parsed.publisher === "string" ? parsed.publisher : "",
          publishedYear:
            typeof parsed.publishedYear === "number"
              ? String(parsed.publishedYear)
              : typeof parsed.publishedYear === "string"
                ? parsed.publishedYear
                : "",
          categories: parsedCategories,
          tags: parsedTags,
          notes: typeof parsed.notes === "string" ? parsed.notes : "",
          rating: typeof parsed.rating === "number" ? parsed.rating : undefined,
          status:
            parsed.status === "reading" || parsed.status === "completed"
              ? parsed.status
              : "unread",
          readyToDonate: Boolean(parsed.readyToDonate),
          isFavorite: Boolean(parsed.isFavorite),
        });
        setCoverImage(
          typeof parsed.coverImage === "string" ? parsed.coverImage : undefined,
        );
        setAdditionalImages(
          Array.isArray(parsed.additionalImages)
            ? parsed.additionalImages
                .map((entry) => String(entry).trim())
                .filter(Boolean)
            : [],
        );
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
          matches
            .filter((match) => match.id !== props.editingBook?.id)
            .map(({ id, title, author }) => ({ id, title, author })),
        );
      });
    }, 220);

    return () => window.clearTimeout(id);
  }, [title, author, props.editingBook?.id]);

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
      const trimmedPublishedYear = values.publishedYear.trim();
      const parsedPublishedYear = Number(trimmedPublishedYear);
      const normalizedPublishedYear =
        trimmedPublishedYear.length > 0 && Number.isFinite(parsedPublishedYear)
          ? parsedPublishedYear
          : undefined;

      const payload: BookDraft = {
        ...values,
        publishedYear: normalizedPublishedYear,
        author:
          values.authors
            .map((entry) => entry.trim())
            .filter(Boolean)
            .join(", ") || undefined,
        categories: values.categories,
        tags: values.tags,
        coverImage,
        additionalImages,
      };

      await props.onSave(payload);

      reset(toFormValues());
      setDuplicates([]);
      setCoverImage(undefined);
      setAdditionalImages([]);

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
      </div>

      <input
        {...register("title", { required: true })}
        className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-950"
        placeholder="Title *"
        autoFocus
        aria-label="Book title"
      />

      <div className="space-y-1">
        <span className="text-xs text-stone-600 dark:text-stone-300">
          Authors
        </span>
        {authors.map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              {...register(`authors.${index}` as const)}
              className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-950"
              placeholder={`Author ${index + 1}`}
              aria-label={`Book author ${index + 1}`}
            />
            {authors.length > 1 ? (
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                onClick={() =>
                  setValue(
                    "authors",
                    authors.length > 1
                      ? authors.filter(
                          (__, removeIndex) => removeIndex !== index,
                        )
                      : [""],
                  )
                }
                aria-label={`Remove author ${index + 1}`}
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setValue("authors", [...authors, ""])}
          className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          <Plus size={12} /> Add author
        </button>
      </div>

      {duplicates.length ? (
        <p className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Possible duplicates:{" "}
          {duplicates
            .map((match) => `${match.title} (${match.author ?? "Unknown"})`)
            .join(", ")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowMore((value) => !value)}
        className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
      >
        {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showMore ? "Hide details" : "More details"}
      </button>

      {showMore && (
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label
              htmlFor={coverInputId}
              className="inline-flex h-8 cursor-pointer items-center rounded-md border border-stone-300 px-2 text-xs hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Upload cover
            </label>
            <input
              id={coverInputId}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void addImageFiles(files);
                event.target.value = "";
              }}
            />
          </div>

          {coverImage ? (
            <div className="relative col-span-2 mt-1">
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
            {...register("publishedYear")}
            className="h-8 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Year"
            type="text"
            inputMode="numeric"
          />
          <SingleSelect
            value={status}
            onValueChange={(value) =>
              setValue("status", value as FormValues["status"], {
                shouldDirty: true,
              })
            }
            ariaLabel="Reading status"
            options={[
              { value: "unread", label: "Unread" },
              { value: "reading", label: "Reading" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <div className="col-span-2">
            <MultiValueSelect
              values={categories}
              options={categoryTagOptions.categories}
              placeholder="Select category"
              addPlaceholder="New category"
              onChange={(values) => setValue("categories", values)}
            />
          </div>
          <div className="col-span-2">
            <MultiValueSelect
              values={tags}
              options={categoryTagOptions.tags}
              placeholder="Select tag"
              addPlaceholder="New tag"
              onChange={(values) => setValue("tags", values)}
            />
          </div>
          <textarea
            {...register("notes")}
            className="col-span-2 h-16 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-950"
            placeholder="Notes"
          />
          <div className="col-span-2 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-950">
            <div className="mb-1 text-[11px] text-stone-500 dark:text-stone-400">
              Rating
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue("rating", star)}
                  className="rounded p-0.5 hover:bg-stone-100 dark:hover:bg-stone-800"
                  aria-label={`Set rating ${star}`}
                >
                  <Star
                    size={16}
                    className={
                      (rating ?? 0) >= star
                        ? "fill-amber-400 text-amber-500"
                        : "text-stone-400"
                    }
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setValue("rating", undefined)}
                className="ml-1 rounded border border-stone-300 px-1.5 py-0.5 text-[11px] hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1 text-xs">
              <RadixCheckbox
                checked={isFavorite}
                onCheckedChange={(checked) =>
                  setValue("isFavorite", checked, { shouldDirty: true })
                }
                ariaLabel="Favorite"
              />
              Favorite
            </label>
            <label className="flex items-center gap-1 text-xs">
              <RadixCheckbox
                checked={readyToDonate}
                onCheckedChange={(checked) =>
                  setValue("readyToDonate", checked, { shouldDirty: true })
                }
                ariaLabel="Ready to donate"
              />
              Donate
            </label>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSave || saving}
          className="h-9 flex-1 rounded-lg bg-stone-900 text-sm font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
        >
          {saving ? "Saving..." : props.editingBook ? "Update" : "Save Book"}
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
