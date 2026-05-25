/**
 * Shared size presets. Safe to import from both server and client components
 * (no "server-only" here, like ./admin/constants).
 *
 * A category declares its `size_type`; the storefront size selector and the
 * admin per-size stock grid both read the option list from here. To add a new
 * size system, add an entry to each map below.
 */

export type SizeType = "none" | "apparel" | "shoe"

/** The selectable sizes for each size type. `none` has no sizes (one-size item). */
export const SIZE_OPTIONS: Record<SizeType, string[]> = {
  none: [],
  apparel: ["XS", "S", "M", "L", "XL"],
  shoe: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"], // EU
}

/** Human labels for the admin category picker. */
export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  none: "No size (one size)",
  apparel: "Apparel (XS–XL)",
  shoe: "Shoes (EU 36–46)",
}

export const SIZE_TYPES = ["none", "apparel", "shoe"] as const

/** Narrow an arbitrary string to a known SizeType, defaulting to "none". */
export function asSizeType(value: string | null | undefined): SizeType {
  return value === "apparel" || value === "shoe" ? value : "none"
}
