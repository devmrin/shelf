import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: Option[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  triggerClassName?: string;
};

export function SingleSelect({
  value,
  options,
  onValueChange,
  ariaLabel,
  triggerClassName,
}: Props) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={
          triggerClassName ??
          "flex h-8 w-full items-center justify-between rounded-md border border-stone-300 bg-white px-2 text-left text-xs text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        }
        aria-label={ariaLabel}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={14} className="text-stone-500" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden rounded-md border border-stone-300 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-7 text-xs text-stone-800 outline-none data-[highlighted]:bg-stone-100 dark:text-stone-200 dark:data-[highlighted]:bg-stone-800"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check size={12} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
