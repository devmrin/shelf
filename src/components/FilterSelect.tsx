import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

const ALL_SENTINEL = "__filter_all__";

type Props = {
  ariaLabel: string;
  allLabel: string;
  options: string[];
  /** `undefined` means no filter ("All") */
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
};

export function FilterSelect(props: Props) {
  const { ariaLabel, allLabel, options, value, onValueChange } = props;

  const radixValue =
    value !== undefined && options.includes(value)
      ? value
      : ALL_SENTINEL;

  return (
    <Select.Root
      value={radixValue}
      onValueChange={(next) =>
        onValueChange(next === ALL_SENTINEL ? undefined : next)
      }
    >
      <Select.Trigger
        className="flex h-8 min-w-[9rem] max-w-[13rem] items-center justify-between gap-2 rounded-lg border border-stone-300 bg-stone-50 px-2 text-left text-xs text-stone-900 outline-none ring-stone-400 focus:ring-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        aria-label={ariaLabel}
      >
        <Select.Value placeholder={allLabel} />
        <Select.Icon className="shrink-0">
          <ChevronDown size={14} className="text-stone-500" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 max-h-[min(16rem,var(--radix-select-content-available-height))] overflow-y-auto rounded-md border border-stone-300 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
          <Select.Viewport className="p-1">
            <Select.Item
              value={ALL_SENTINEL}
              className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-7 text-xs text-stone-800 outline-none data-[highlighted]:bg-stone-100 dark:text-stone-200 dark:data-[highlighted]:bg-stone-800"
            >
              <Select.ItemText>{allLabel}</Select.ItemText>
              <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                <Check size={12} />
              </Select.ItemIndicator>
            </Select.Item>
            {options.length ? (
              options.map((option) => (
                <Select.Item
                  key={option}
                  value={option}
                  className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-7 text-xs text-stone-800 outline-none data-[highlighted]:bg-stone-100 dark:text-stone-200 dark:data-[highlighted]:bg-stone-800"
                >
                  <Select.ItemText className="truncate">{option}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                    <Check size={12} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))
            ) : (
              <div className="px-2 py-1.5 text-xs text-stone-500 dark:text-stone-400">
                No values yet
              </div>
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
