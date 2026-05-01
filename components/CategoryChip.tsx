import type { Category } from "@/lib/types";
import { CATEGORY_GRADIENT, CATEGORY_LABEL } from "@/lib/types";

export function CategoryChip({ category }: { category: Category }) {
  const [g1] = CATEGORY_GRADIENT[category];
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-paper"
      style={{ background: `${g1}33`, border: `1px solid ${g1}66` }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}
