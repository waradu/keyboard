import { detectOsInBrowser } from "./helper";
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
import type { CreateKeybindShape, KeybindShape, OptionsKeys, Os } from "./types";

export class Keybind {
  public key: KeyValue | AnyKey;
  public modifiers: Record<ModifierValue, boolean>;
  public platform?: PlatformValue;

  private constructor(shape: KeybindShape) {
    this.key = shape.key;
    this.modifiers = { ...shape.modifiers };
    this.platform = shape.platform;
  }

  /**
   * Format this keybind as a canonical key string.
   *
   * @returns A valid `KeyString`.
   */
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

  /**
   * Format the main key for display.
   *
   * @returns A human-readable key label.
   */
  toReadableKey() {
    switch (this.key) {
      case "$any":
        return "Any";
      case "$num":
        return "Any Number";
      default:
        return this.key
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
    }
  }

  /**
   * Format the platform constraint for display.
   *
   * @returns A human-readable platform label.
   */
  toReadablePlatform() {
    switch (this.platform) {
      case "linux":
        return "Linux";
      case "macos":
        return "macOS";
      case "win":
        return "Windows";
      case "no-linux":
        return "macOS & Windows";
      case "no-macos":
        return "Linux & Windows";
      case "no-win":
        return "Linux & macOS";
      default:
        return "All Platforms";
    }
  }

  /**
   * Format this keybind as display parts.
   *
   * The returned parts can be joined into a string or rendered as separate keycaps.
   *
   * @returns Human-readable modifier and key labels.
   */
  toReadable() {
    const parts: string[] = [];

    if (this.modifiers.meta) parts.push("Meta");
    if (this.modifiers.ctrl) parts.push("Ctrl");
    if (this.modifiers.ctrlCmd) parts.push("Ctrl-Cmd");
    if (this.modifiers.alt) parts.push("Alt");
    if (this.modifiers.shift) parts.push("Shift");

    parts.push(this.toReadableKey());

    return parts;
  }

  /**
   * Format this keybind as display parts for a platform.
   *
   * When no platform is provided, the browser platform is detected. Passing a platform
   * is recommended for SSR and tests.
   *
   * @param config Optional platform override.
   * @returns Human-readable modifier and key labels.
   */
  toLocalReadable(config: { platform?: Os } = {}) {
    const parts: string[] = [];

    if (this.modifiers.meta) parts.push("Meta");
    if (this.modifiers.ctrl) parts.push("Ctrl");
    if (this.modifiers.ctrlCmd) {
      const browserPlatform = config.platform ?? detectOsInBrowser();

      if (browserPlatform === "macos") parts.push("Cmd");
      else parts.push("Ctrl");
    }
    if (this.modifiers.alt) parts.push("Alt");
    if (this.modifiers.shift) parts.push("Shift");

    parts.push(this.toReadableKey());

    return parts;
  }

  /**
   * Convert this keybind into a serializable object shape.
   *
   * @returns A `KeybindShape`.
   */
  toShape(): KeybindShape {
    return {
      key: this.key,
      modifiers: { ...this.modifiers },
      platform: this.platform,
    };
  }

  /**
   * Compare two keybind inputs.
   *
   * @param a First keybind input.
   * @param b Second keybind input.
   * @returns Whether both inputs resolve to the same canonical key string.
   */
  static equals(a: OptionsKeys, b: OptionsKeys) {
    const kbdA = Keybind.from(a);
    const kbdB = Keybind.from(b);

    return !!kbdA && !!kbdB && kbdA.toString() === kbdB.toString();
  }

  /**
   * Compare this keybind with another keybind input.
   *
   * @param other Keybind input to compare against.
   * @returns Whether both inputs resolve to the same canonical key string.
   */
  equals = (other: OptionsKeys) => Keybind.equals(this, other);

  /**
   * Parse a key string into a keybind.
   *
   * @param string Key string to parse.
   * @returns A `Keybind`, or `undefined` when the string is invalid.
   */
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

  /**
   * Create a keybind from a plain object shape.
   *
   * Missing modifiers default to `false`.
   *
   * @param shape Keybind shape to normalize.
   * @returns A `Keybind`.
   */
  static fromShape(shape: CreateKeybindShape) {
    const ctrlCmd = shape.modifiers?.ctrlCmd ?? false;

    return new Keybind({
      key: shape.key,
      modifiers: {
        alt: shape.modifiers?.alt ?? false,
        ctrl: Boolean(!ctrlCmd && shape.modifiers?.ctrl),
        ctrlCmd: ctrlCmd,
        meta: Boolean(!ctrlCmd && shape.modifiers?.ctrl),
        shift: shape.modifiers?.shift ?? false,
      },
      platform: shape.platform,
    });
  }

  /**
   * Normalize any supported keybind input.
   *
   * @param keybind Key string, keybind shape, or existing `Keybind`.
   * @returns A `Keybind`, or `undefined` when the input is invalid.
   */
  static from(keybind: OptionsKeys) {
    return keybind instanceof Keybind
      ? keybind
      : typeof keybind === "string"
        ? Keybind.fromString(keybind)
        : Keybind.fromShape(keybind);
  }
}
