import * as Checkbox from "@radix-ui/react-checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../utils/cn";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
  className?: string;
};

export function RadixCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
  className,
}: Props) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(state: CheckedState) => onCheckedChange(state === true)}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded border border-stone-400 bg-white text-stone-900 outline-none data-[state=checked]:bg-stone-900 data-[state=checked]:text-stone-50 focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:data-[state=checked]:bg-stone-100 dark:data-[state=checked]:text-stone-900",
        className,
      )}
    >
      <Checkbox.Indicator>
        <Check size={12} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
