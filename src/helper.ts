import {
  ANYKEY,
  keys,
  modifiers,
  platforms,
  SEPARATOR,
  type KeySequence,
  type KeyString,
  type KeyValue,
  type ModifierValue,
  type PlatformValue,
} from "./keys";
import type { CreateKeybindShape, KeybindShape, Os } from "./types";

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

export const anyKeyData: () => KeybindShape = () => ({
  key: ANYKEY,
  modifiers: {
    alt: false,
    control: false,
    meta: false,
    shift: false,
  },
});

const MOD_ORDER: ModifierValue[] = ["meta", "control", "alt", "shift"];

export type ModifierMap = Partial<Record<ModifierValue, boolean>>;

/**
 * Parse a key string into parts. Returns `undefined` if the string is invalid.
 */
export const parseKeyString = (sequence: KeyString): KeybindShape | undefined => {
  if (sequence === ANYKEY) {
    return anyKeyData();
  }

  let platformLabel: PlatformValue | undefined;
  let keySequence: KeySequence = sequence as KeySequence;

  if (sequence.includes(":")) {
    const [platform, seq] = sequence.split(":") as [PlatformValue, KeySequence];
    if (!Object.values(platforms).includes(platform)) return;

    platformLabel = platform;
    keySequence = seq;
  }

  const parts = keySequence.split(SEPARATOR);
  if (parts.length === 0) return;

  const key = parts.pop() as KeyValue;
  const validKeyValues = new Set(Object.values(keys));
  if (!validKeyValues.has(key)) return;

  const modSet = new Set(Object.values(modifiers));
  const modifiersOnly = parts as ModifierValue[];

  let lastIndex = -1;
  for (const mod of modifiersOnly) {
    if (!modSet.has(mod)) return;
    const idx = MOD_ORDER.indexOf(mod);
    if (idx === -1 || idx < lastIndex) return;
    lastIndex = idx;
  }

  const modifierMap: Record<ModifierValue, boolean> = {
    alt: false,
    control: false,
    meta: false,
    shift: false,
  };
  for (const mod of modifiersOnly) {
    modifierMap[mod] = true;
  }

  return {
    platform: platformLabel,
    modifiers: modifierMap,
    key,
  };
};

export const parseCreateKeybindShape = (shape: CreateKeybindShape): KeybindShape | undefined => {
  return {
    platform: shape.platform,
    modifiers: {
      shift: shape.modifiers?.shift ?? false,
      alt: shape.modifiers?.alt ?? false,
      control: shape.modifiers?.control ?? false,
      meta: shape.modifiers?.meta ?? false,
    },
    key: shape.key,
  };
};

export const isEditableElement = (element: Element): boolean => {
  if (element.matches("INPUT, TEXTAREA")) return true;

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
