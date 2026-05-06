import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="mx-auto my-12 flex w-full max-w-xl flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-8 text-center dark:border-stone-700 dark:bg-stone-900/50">
      <h3 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
