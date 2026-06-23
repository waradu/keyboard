import type { KeyString, KeyValue, ModifierValue, PlatformValue } from "../src/keys";
import type { Config } from "../src/types";

export type ModifierMap = Partial<Record<ModifierValue, boolean>>;

export interface KeybindShape {
  platform?: PlatformValue;
  modifiers: Record<ModifierValue, boolean>;
  key: KeyValue | "any";
}

export interface CreateKeybindShape {
  platform?: PlatformValue;
  modifiers?: ModifierMap;
  key: KeyValue | "any";
}

export interface HandlerContext {
  template?: number;
  handler: Handler;
  event: KeyboardEvent;
}

export type HandlerFunc = (context: HandlerContext) => unknown;

export interface Handler {
  id: string;
  off: () => unknown;

  keys: KeybindShape[];
  handler: HandlerFunc;
  config: Config;
}

export type Handlers = Handler[];

export interface Options {
  keys: KeyString | CreateKeybindShape | (KeyString | CreateKeybindShape)[];
  run: HandlerFunc;
  config?: Config;
}

export type SubscribeCallback = (handlers: Handlers) => unknown;
