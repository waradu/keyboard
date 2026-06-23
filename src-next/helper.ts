import {
  keys,
  platforms,
  SEPARATOR,
  type KeySequence,
  type KeyString,
  type KeyValue,
  type ModifierValue,
  type PlatformValue,
} from "../src/keys";
import type { CreateKeybindShape, KeybindShape } from "./types";

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
  key: "any",
  modifiers: {
    alt: false,
    control: false,
    meta: false,
    shift: false,
  },
});

/**
 * Parse a key string into parts. Returns `undefined` if the string is invalid.
 */
export const parseKeyString = (sequence: KeyString): KeybindShape | undefined => {
  if (sequence === "any") {
    return anyKeyData();
  }

  let platformLabel: PlatformValue | undefined;
  let keySequence: KeySequence = sequence as KeySequence;

  if (sequence.includes(":")) {
    const [platform, seq] = sequence.split(":") as [PlatformValue, KeySequence];
    if (Object.values(platforms).includes(platform)) {
      platformLabel = platform;
    }
    keySequence = seq;
  }

  const parts = keySequence.split(SEPARATOR);
  if (parts.length === 0) return;

  const key = parts.pop() as KeyValue;
  const validKeyValues = new Set(Object.values(keys));
  if (!validKeyValues.has(key)) return;

  const modifiersOnly = parts as ModifierValue[];

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
