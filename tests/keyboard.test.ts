import { test, expect, mock, type Mock } from "bun:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { parseKeyString, Keyboard } from "@waradu/keyboard";

import type { HandlerContext, Os } from "../src/types";

GlobalRegistrator.register();

const prepare = (platform?: Os) => {
  const keyboard = new Keyboard({
    platform: platform,
  });
  keyboard.init();

  // Should return void but we need to return the context to check for the template.
  const spy = mock((context: HandlerContext) => [context]) as unknown as Mock<() => void>;

  return { keyboard, spy };
};

const press = (key: string, options?: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", { key, ...options });
  window.dispatchEvent(event);
};

const release = (key: string, options?: KeyboardEventInit) => {
  const event = new KeyboardEvent("keyup", { key, ...options });
  window.dispatchEvent(event);
};

test("keyboard handler fires on 'a' press", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["a"],
    run: spy,
  });

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("any keyboard handler fires on any press", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["$any"],
    run: spy,
  });

  press("x");
  press("o");
  press("3");
  press(" ");

  expect(spy).toHaveBeenCalledTimes(4);

  keyboard.destroy();
});

test("one-time keyboard handler only fires once", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["a"],
    run: spy,
    config: { once: true },
  });

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler ignores editable if set", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["a"],
    run: spy,
    config: { ignoreIfEditable: true },
  });

  const ele = document.createElement("input");
  document.body.appendChild(ele);
  ele.focus();

  press("a");

  expect(spy).toHaveBeenCalledTimes(0);

  ele.blur();

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.remove();
  keyboard.destroy();
});

test("keyboard handler runs only if runIfFocused element is focused", () => {
  const { keyboard, spy } = prepare();

  const ele = document.createElement("input");
  document.body.appendChild(ele);

  keyboard.bind({
    keys: ["a"],
    run: spy,
    config: { runIfFocused: [ele] },
  });

  ele.focus();

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.blur();

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.remove();
  keyboard.destroy();
});

test("keyboard handler stops when signal is aborted", () => {
  const { keyboard, spy } = prepare();

  const ac = new AbortController();

  keyboard.bind({
    keys: ["a"],
    run: spy,
    config: { signal: ac.signal },
  });

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ac.abort();

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler only fires if all keys have been pressed", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["control+y"],
    run: spy,
  });

  press("Control", { ctrlKey: true });

  expect(spy).toHaveBeenCalledTimes(0);

  press("y", { ctrlKey: true });

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler only fires if all keys are being pressed together", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["control+y"],
    run: spy,
  });

  press("Control", { ctrlKey: true });
  release("Control", { ctrlKey: true });

  press("y");

  expect(spy).toHaveBeenCalledTimes(0);

  keyboard.destroy();
});

test("keyboard handler can handle complex keybinds", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["meta+control+alt+shift+arrow-up"],
    run: spy,
  });

  press("Meta", { metaKey: true });
  press("Control", { metaKey: true, ctrlKey: true });
  press("Alt", { metaKey: true, ctrlKey: true, altKey: true });
  press("Shift", { metaKey: true, ctrlKey: true, altKey: true, shiftKey: true });
  press("ArrowUp", { metaKey: true, ctrlKey: true, altKey: true, shiftKey: true });

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler only fires on macos", () => {
  const { keyboard, spy } = prepare("macos");

  keyboard.bind({
    keys: ["macos:a"],
    run: spy,
  });

  const { keyboard: keyboard2 } = prepare("linux");

  keyboard2.bind({
    keys: ["macos:a"],
    run: spy,
  });

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
  keyboard2.destroy();
});

test("keyboard handler does not fire on macos", () => {
  const { keyboard, spy } = prepare("macos");

  keyboard.bind({
    keys: ["no-macos:a"],
    run: spy,
  });

  const { keyboard: keyboard2 } = prepare("windows");

  keyboard2.bind({
    keys: ["no-macos:a"],
    run: spy,
  });

  press("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
  keyboard2.destroy();
});

test("keyboard handler returns dynamic number press", () => {
  const { keyboard, spy } = prepare();

  keyboard.bind({
    keys: ["alt+$num"],
    run: spy,
  });

  press("Alt", { altKey: true });
  press("1", { altKey: true });

  expect(spy).toHaveBeenCalledTimes(1);

  const [context] = spy.mock.calls[0]! as unknown as [HandlerContext];
  expect(context.template).toBe(1);

  keyboard.destroy();
});

test("parse key string into key data", () => {
  expect(parseKeyString("x")).toEqual({
    key: "x",
    modifiers: {
      alt: false,
      control: false,
      meta: false,
      shift: false,
    },
  });

  expect(parseKeyString("meta+control+alt+shift+arrow-up")).toEqual({
    key: "arrow-up",
    modifiers: {
      alt: true,
      control: true,
      meta: true,
      shift: true,
    },
  });

  expect(parseKeyString("macos:x")).toEqual({
    platform: "macos",
    key: "x",
    modifiers: {
      alt: false,
      control: false,
      meta: false,
      shift: false,
    },
  });

  expect(parseKeyString("alt+$num")).toEqual({
    key: "$num",
    modifiers: {
      alt: true,
      control: false,
      meta: false,
      shift: false,
    },
  });

  expect(parseKeyString("$any")).toEqual({
    key: "$any",
    modifiers: {
      alt: false,
      control: false,
      meta: false,
      shift: false,
    },
  });

  //@ts-expect-error out of order
  expect(parseKeyString("meta+alt+control+k")).toBeUndefined();
  //@ts-expect-error mac does not exist
  expect(parseKeyString("mac:k")).toBeUndefined();
  //@ts-expect-error notreal is not a real key (duh)
  expect(parseKeyString("meta+notreal")).toBeUndefined();
});
