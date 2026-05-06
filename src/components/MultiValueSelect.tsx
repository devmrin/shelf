import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

type Props = {
  values: string[];
  options: string[];
  placeholder: string;
  addPlaceholder: string;
  onChange: (values: string[]) => void;
};

export function MultiValueSelect({
  values,
  options,
  placeholder,
  addPlaceholder,
  onChange,
}: Props) {
  const [draft, setDraft] = useState("");

  const availableOptions = options.filter((option) => !values.includes(option));

  const addValue = (value: string) => {
    const normalized = value.trim();
    if (!normalized || values.includes(normalized)) return;
    onChange([...values, normalized]);
    setDraft("");
  };

  const removeValue = (value: string) => {
    onChange(values.filter((entry) => entry !== value));
  };

  return (
    <div className="space-y-1">
      <Select.Root onValueChange={addValue} value="">
        <Select.Trigger
          className="flex h-8 w-full items-center justify-between rounded-md border border-stone-300 bg-white px-2 text-left text-xs text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          aria-label={placeholder}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown size={14} className="text-stone-500" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 overflow-hidden rounded-md border border-stone-300 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <Select.Viewport className="p-1">
              {availableOptions.length ? (
                availableOptions.map((option) => (
                  <Select.Item
                    key={option}
                    value={option}
                    className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-7 text-xs text-stone-800 outline-none data-[highlighted]:bg-stone-100 dark:text-stone-200 dark:data-[highlighted]:bg-stone-800"
                  >
                    <Select.ItemText>{option}</Select.ItemText>
                    <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                      <Check size={12} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-stone-500 dark:text-stone-400">
                  No more options
                </div>
              )}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue(draft);
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-950"
          placeholder={addPlaceholder}
        />
        <button
          type="button"
          onClick={() => addValue(draft)}
          className="h-8 rounded-md border border-stone-300 px-2 text-xs hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Add
        </button>
      </div>

      {values.length ? (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => removeValue(value)}
              className="rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              aria-label={`Remove ${value}`}
            >
              {value} x
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
