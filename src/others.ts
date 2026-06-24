import type { AnyKey, KeyValue } from "./keys";

export const readableMap: Partial<Record<KeyValue | AnyKey, string>> = {
  // Special
  $any: "Any",
  $num: "Any Number",

  // Navigation
  "page-up": "Page Up",
  "page-down": "Page Down",
  "arrow-left": "Arrow Left",
  "arrow-up": "Arrow Up",
  "arrow-right": "Arrow Right",
  "arrow-down": "Arrow Down",
  "print-screen": "Print Screen",
  "context-menu": "Context Menu",

  // Lock keys
  "num-lock": "Num Lock",
  "scroll-lock": "Scroll Lock",

  // Media / audio
  "audio-volume-mute": "Volume Mute",
  "audio-volume-down": "Volume Down",
  "audio-volume-up": "Volume Up",
  "media-track-next": "Next Track",
  "media-track-previous": "Previous Track",
  "media-play-pause": "Play/Pause",
  "media-play": "Play",
  "media-pause": "Pause",
  "media-stop": "Stop",

  // Symbols / punctuation
  minus: "-",
  equal: "=",
  plus: "+",
  comma: ",",
  period: ".",
  star: "*",
  hash: "#",
  percent: "%",
  ampersand: "&",
  "single-quote": "'",
  "double-quote": '"',
  slash: "/",
  backslash: "\\",
  "angle-brackets-open": "<",
  "angle-brackets-close": ">",
  "square-brackets-open": "[",
  "square-brackets-close": "]",
  "curly-brackets-open": "{",
  "curly-brackets-close": "}",
  backquote: "`",
  tilde: "~",
  dollar: "$",
  "question-mark": "?",
  "exclamation-mark": "!",
};
