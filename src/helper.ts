import {
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
import type { Os } from "./types";

export const isEditableElement = (element: Element): boolean => {
  const editableElements = [
    "INPUT",
    "TEXTAREA",
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]',
  ];
  return editableElements.some((selector) => element.matches(selector));
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

const MOD_ORDER: ModifierValue[] = ["meta", "control", "alt", "shift"];

export type ModifierMap = Partial<Record<ModifierValue, boolean>>;

export interface KeyDataOutput {
  platform?: PlatformValue;
  modifiers: Record<ModifierValue, boolean>;
  key: KeyValue | "any";
}

/**
 * Parse a key string into parts. Returns `undefined` if the string is invalid.
 */
export const parseKeyString = (sequence: KeyString): KeyDataOutput | undefined => {
  if (sequence === "any") {
    return {
      key: "any",
      modifiers: {
        alt: false,
        control: false,
        meta: false,
        shift: false,
      },
    };
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

export interface KeyData {
  platform?: PlatformValue;
  modifiers?: ModifierMap;
  key: KeyValue | "any";
}

export const parseKeyData = (data: KeyData): KeyString => {
  const activeModifiers: ModifierValue[] = [];

  if (data.modifiers) {
    for (const mod of MOD_ORDER) {
      if (data.modifiers[mod]) {
        activeModifiers.push(mod);
      }
    }
  }

  let sequence = "";

  if (data.platform) {
    sequence += `${data.platform}:`;
  }

  for (const modifier of activeModifiers) {
    sequence += `${modifier}${SEPARATOR}`;
  }

  sequence += data.key;

  return sequence as KeySequence;
};
