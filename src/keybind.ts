import {
  ANYKEY,
  keys,
  platforms,
  SEPARATOR,
  type AnyKey,
  type KeySequence,
  type KeyString,
  type KeyValue,
  type ModifierValue,
  type PlatformValue,
} from "./keys";
import type { CreateKeybindShape, KeybindShape, OptionsKeys } from "./types";

export class Keybind {
  public key: KeyValue | AnyKey;
  public modifiers: Record<ModifierValue, boolean>;
  public platform?: PlatformValue;

  private constructor(shape: KeybindShape) {
    this.key = shape.key;
    this.modifiers = { ...shape.modifiers };
    this.platform = shape.platform;
  }

  static fromString(string: KeyString) {
    if (string === ANYKEY) {
      return Keybind.fromShape({
        key: ANYKEY,
      });
    }

    let platformLabel: PlatformValue | undefined;
    let keySequence: KeySequence = string as KeySequence;

    if (string.includes(":")) {
      const [platform, seq, ...rest] = string.split(":") as [PlatformValue, KeySequence];
      if (rest.length) return;
      if (!Object.values(platforms).includes(platform)) return;

      platformLabel = platform;
      keySequence = seq;
    }

    const parts = keySequence.split(SEPARATOR);
    if (parts.length === 0) return;

    const key = parts.pop() as KeyValue;
    const validKeyValues = new Set(Object.values(keys));
    if (!validKeyValues.has(key)) return;

    const MOD_ORDER = ["meta", "ctrl", "ctrl-cmd", "alt", "shift"] as const;

    const modSet = new Set(MOD_ORDER);
    const modifiersOnly = parts as Array<(typeof MOD_ORDER)[number]>;

    let lastIndex = -1;
    for (const mod of modifiersOnly) {
      if (!modSet.has(mod)) return;
      const idx = MOD_ORDER.indexOf(mod);
      if (idx === -1 || idx <= lastIndex) return;
      lastIndex = idx;
    }
    if (modifiersOnly.includes("ctrl-cmd")) {
      if (modifiersOnly.includes("meta") || modifiersOnly.includes("ctrl")) return;
    }

    const modifierMap: Record<ModifierValue, boolean> = {
      alt: false,
      ctrl: false,
      ctrlCmd: false,
      meta: false,
      shift: false,
    };
    for (const mod of modifiersOnly) {
      if (mod === "ctrl-cmd") modifierMap.ctrlCmd = true;
      else modifierMap[mod] = true;
    }

    return new Keybind({
      platform: platformLabel,
      modifiers: modifierMap,
      key,
    });
  }

  static fromShape(shape: CreateKeybindShape) {
    return new Keybind({
      key: shape.key,
      modifiers: {
        alt: shape.modifiers?.alt ?? false,
        ctrl: shape.modifiers?.ctrl ?? false,
        ctrlCmd: shape.modifiers?.ctrlCmd ?? false,
        meta: shape.modifiers?.meta ?? false,
        shift: shape.modifiers?.shift ?? false,
      },
      platform: shape.platform,
    });
  }

  toString() {
    const parts: string[] = [];

    if (this.modifiers.meta) parts.push("meta");
    if (this.modifiers.ctrl) parts.push("ctrl");
    if (this.modifiers.ctrlCmd) parts.push("ctrl-cmd");
    if (this.modifiers.alt) parts.push("alt");
    if (this.modifiers.shift) parts.push("shift");

    parts.push(this.key);

    const sequence = parts.join("+");

    return this.platform ? `${this.platform}:${sequence}` : sequence;
  }

  toShape(): KeybindShape {
    return {
      key: this.key,
      modifiers: { ...this.modifiers },
      platform: this.platform,
    };
  }

  equals(other: OptionsKeys) {
    const otherKeybind = Keybind.from(other);

    return !!otherKeybind && this.toString() === otherKeybind.toString();
  }

  static from(keybind: OptionsKeys) {
    return keybind instanceof Keybind
      ? keybind
      : typeof keybind === "string"
        ? Keybind.fromString(keybind)
        : Keybind.fromShape(keybind);
  }
}
