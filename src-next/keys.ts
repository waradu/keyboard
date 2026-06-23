export const SEPARATOR = "+" as const;
export const ANYKEY = "$any" as const;
export type AnyKey = typeof ANYKEY;

export const keys = {
  // Control / system (without modifiers)
  backspace: "backspace",
  tab: "tab",
  enter: "enter",
  pause: "pause",
  escape: "escape",
  " ": "space",
  pageup: "page-up",
  pagedown: "page-down",
  end: "end",
  home: "home",
  arrowleft: "arrow-left",
  arrowup: "arrow-up",
  arrowright: "arrow-right",
  arrowdown: "arrow-down",
  printscreen: "print-screen",
  insert: "insert",
  delete: "delete",
  contextmenu: "context-menu",

  // Numbers
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",

  // Letters
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  e: "e",
  f: "f",
  g: "g",
  h: "h",
  i: "i",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  o: "o",
  p: "p",
  q: "q",
  r: "r",
  s: "s",
  t: "t",
  u: "u",
  v: "v",
  w: "w",
  x: "x",
  y: "y",
  z: "z",

  // Function keys
  f1: "f1",
  f2: "f2",
  f3: "f3",
  f4: "f4",
  f5: "f5",
  f6: "f6",
  f7: "f7",
  f8: "f8",
  f9: "f9",
  f10: "f10",
  f11: "f11",
  f12: "f12",
  f13: "f13",
  f14: "f14",
  f15: "f15",
  f16: "f16",
  f17: "f17",
  f18: "f18",
  f19: "f19",
  f20: "f20",
  f21: "f21",
  f22: "f22",
  f23: "f23",
  f24: "f24",

  // Lock keys
  numlock: "num-lock",
  scrolllock: "scroll-lock",

  // Media / audio
  audiovolumemute: "audio-volume-mute",
  audiovolumedown: "audio-volume-down",
  audiovolumeup: "audio-volume-up",
  mediatracknext: "media-track-next",
  mediatrackprevious: "media-track-previous",
  mediaplaypause: "media-play-pause",
  mediaplay: "media-play",
  mediapause: "media-pause",
  mediastop: "media-stop",

  // Symbols / punctuation
  "-": "minus",
  "=": "equal",
  "+": "plus",
  ",": "comma",
  ".": "period",
  "*": "star",
  "#": "hash",
  "%": "percent",
  "&": "ampersand",
  "'": "single-quote",
  '"': "double-quote",
  "/": "slash",
  "\\": "backslash",
  "<": "angle-brackets-open",
  ">": "angle-brackets-close",
  "[": "square-brackets-open",
  "]": "square-brackets-close",
  "{": "curly-brackets-open",
  "}": "curly-brackets-close",
  "`": "backquote",
  "~": "tilde",
  $: "dollar",
  "?": "question-mark",
  "!": "exclamation-mark",

  // Templates
  dynNum: "$num",
} as const;

export const modifiers = {
  meta: "meta",
  control: "control",
  alt: "alt",
  shift: "shift",
} as const;

export const platforms = {
  macos: "macos",
  windows: "win",
  linux: "linux",
  no_macos: "no-macos",
  no_windows: "no-win",
  no_linux: "no-linux",
} as const;

export type ModifierKey = keyof typeof modifiers;
export type KeyKey = keyof typeof keys;
export type PlatformKey = keyof typeof platforms;

export type ModifierValue = (typeof modifiers)[ModifierKey];
export type KeyValue = (typeof keys)[KeyKey];
export type PlatformValue = (typeof platforms)[PlatformKey];

type FixedCombinations<T extends readonly string[], Acc extends string[] = []> = T extends [
  infer F extends string,
  ...infer R extends string[],
]
  ? FixedCombinations<R, Acc> | FixedCombinations<R, [...Acc, F]>
  : Acc;

type PrefixTuples = Exclude<FixedCombinations<["meta", "control", "alt", "shift"]>, []>;

type Join<T extends readonly string[]> = T extends []
  ? ""
  : T extends [infer F extends string]
    ? F
    : T extends [infer F extends string, ...infer R extends readonly string[]]
      ? `${F}${typeof SEPARATOR}${Join<R>}`
      : string;

type WithModifier = `${Join<PrefixTuples>}${typeof SEPARATOR}${KeyValue}`;
export type KeySequence = KeyValue | WithModifier;

export type KeyString = KeySequence | `${PlatformValue}:${KeySequence}` | AnyKey;
