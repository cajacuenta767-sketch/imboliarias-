import { slugify } from "@/lib/utils";

/** Genera un slug único consultando la existencia con `exists`. */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  currentId?: string | null,
): Promise<string> {
  void currentId;
  const root = slugify(base) || "item";
  let slug = root;
  let i = 2;
  while (await exists(slug)) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export function uniqueCode(prefix = "HB") {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${prefix}-${n}`;
}
