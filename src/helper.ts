import type { Os } from "./types";

export function merge<T extends Record<string, any>>(...configs: Array<Partial<T> | undefined>): T {
  const isObj = (v: unknown) => v !== null && typeof v === "object" && !Array.isArray(v);

  return configs.reduceRight(
    (out, config) => {
      if (!config) return out;

      for (const key in config) {
        const value = config[key];

        if (value === undefined) continue;

        out[key] = isObj(out[key]) && isObj(value) ? merge(value, out[key]) : value;
      }

      return out;
    },
    {} as Record<string, any>,
  ) as T;
}

export const isEditableElement = (element: Element): boolean => {
  if (element instanceof HTMLTextAreaElement) {
    return !element.readOnly && !element.disabled;
  }

  if (element instanceof HTMLInputElement) {
    const nonEditableTypes = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ]);

    return !element.readOnly && !element.disabled && !nonEditableTypes.has(element.type);
  }

  const contentEditable = element.closest("[contenteditable]");
  if (!contentEditable) return false;

  const value = contentEditable.getAttribute("contenteditable")?.toLowerCase();
  return value === "" || value === "true" || value === "plaintext-only";
};

export function detectOsInBrowser(): Os {
  if (typeof navigator === "undefined") return "unknown";

  const platform = (navigator.platform || "").toLowerCase();
  const ua = (navigator.userAgent || "").toLowerCase();

  if (platform.includes("mac")) return "macos";
  if (platform.includes("win")) return "windows";
  if (platform.includes("linux")) return "linux";

  if (ua.includes("mac os")) return "macos";
  if (ua.includes("windows")) return "windows";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";

  return "unknown";
}
