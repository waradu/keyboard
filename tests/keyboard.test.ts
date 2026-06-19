import { test, expect, mock, type Mock } from "bun:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { parseKeyData, parseKeyString, useKeyboard } from "@waradu/keyboard";
import type { HandlerContext, Os } from "src/types";

GlobalRegistrator.register();

const prepare = (platform?: Os) => {
  const keyboard = useKeyboard({
    platform: platform,
  });
  keyboard.init();

  // Should return void but we need to return the context to check for the template.
  const spy = mock((context: HandlerContext) => [context]) as unknown as Mock<() => void>;

  return { keyboard, spy };
};

const down = (key: string) => {
  const event = new KeyboardEvent("keydown", { key: key });
  window.dispatchEvent(event);
};

const up = (key: string) => {
  const event = new KeyboardEvent("keyup", { key: key });
  window.dispatchEvent(event);
};

test("keyboard handler fires on 'a' press", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["a"],
    run: spy,
  });

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("any keyboard handler fires on any press", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["any"],
    run: spy,
  });

  down("x");
  down("o");
  down("3");
  down(" ");

  expect(spy).toHaveBeenCalledTimes(4);

  keyboard.destroy();
});

test("one-time keyboard handler only fires once", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["a"],
    run: spy,
    config: { once: true },
  });

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler ignores editable if set", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["a"],
    run: spy,
    config: { ignoreIfEditable: true },
  });

  const ele = document.createElement("input");
  document.body.appendChild(ele);
  ele.focus();

  down("a");

  expect(spy).toHaveBeenCalledTimes(0);

  ele.blur();

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.remove();
  keyboard.destroy();
});

test("keyboard handler runs only if runIfFocused element is focused", () => {
  const { keyboard, spy } = prepare();

  const ele = document.createElement("input");
  document.body.appendChild(ele);

  keyboard.listen({
    keys: ["a"],
    run: spy,
    config: { runIfFocused: [ele] },
  });

  ele.focus();

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.blur();

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ele.remove();
  keyboard.destroy();
});

test("keyboard handler stops when signal is aborted", () => {
  const { keyboard, spy } = prepare();

  const ac = new AbortController();

  keyboard.listen({
    keys: ["a"],
    run: spy,
    config: { signal: ac.signal },
  });

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  ac.abort();

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler only fires if all keys have been pressed", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["control_y"],
    run: spy,
  });

  down("Control");

  expect(spy).toHaveBeenCalledTimes(0);

  down("y");

  expect(spy).toHaveBeenCalledTimes(1);
});

test("keyboard handler only fires if all keys are being pressed together", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["control_y"],
    run: spy,
  });

  down("Control");
  up("Control");

  down("y");

  expect(spy).toHaveBeenCalledTimes(0);

  keyboard.destroy();
});

test("keyboard handler can handle complex keybinds", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["meta_control_alt_shift_arrow-up"],
    run: spy,
  });

  down("Meta");
  down("Control");
  down("Alt");
  down("Shift");
  down("ArrowUp");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
});

test("keyboard handler only fires on macos", () => {
  const { keyboard, spy } = prepare("macos");

  keyboard.listen({
    keys: ["macos:a"],
    run: spy,
  });

  const { keyboard: keyboard2 } = prepare("linux");

  keyboard2.listen({
    keys: ["macos:a"],
    run: spy,
  });

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
  keyboard2.destroy();
});

test("keyboard handler does not fire on macos", () => {
  const { keyboard, spy } = prepare("macos");

  keyboard.listen({
    keys: ["no-macos:a"],
    run: spy,
  });

  const { keyboard: keyboard2 } = prepare("windows");

  keyboard2.listen({
    keys: ["no-macos:a"],
    run: spy,
  });

  down("a");

  expect(spy).toHaveBeenCalledTimes(1);

  keyboard.destroy();
  keyboard2.destroy();
});

test("keyboard handler returns dynamic number press", () => {
  const { keyboard, spy } = prepare();

  keyboard.listen({
    keys: ["alt_$num"],
    run: spy,
  });

  down("Alt");
  down("1");

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

  expect(parseKeyString("meta_control_alt_shift_arrow-up")).toEqual({
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

  expect(parseKeyString("alt_$num")).toEqual({
    key: "$num",
    modifiers: {
      alt: true,
      control: false,
      meta: false,
      shift: false,
    },
  });

  expect(parseKeyString("any")).toEqual({
    key: "any",
    modifiers: {
      alt: false,
      control: false,
      meta: false,
      shift: false,
    },
  });

  //@ts-expect-error out of order
  expect(parseKeyString("meta_alt_control_k")).toBeUndefined();
  //@ts-expect-error mac does not exist
  expect(parseKeyString("mac:k")).toBeUndefined();
  //@ts-expect-error notreal is not a real key (duh)
  expect(parseKeyString("meta_notreal")).toBeUndefined();
});

test("parse key data into key string", () => {
  expect(
    parseKeyData({
      key: "x",
      modifiers: {},
    }),
  ).toEqual("x");

  expect(
    parseKeyData({
      key: "arrow-up",
      modifiers: {
        alt: true,
        control: true,
        meta: true,
        shift: true,
      },
    }),
  ).toEqual("meta_control_alt_shift_arrow-up");

  expect(
    parseKeyData({
      platform: "macos",
      key: "x",
      modifiers: {},
    }),
  ).toEqual("macos:x");

  expect(
    parseKeyData({
      key: "$num",
      modifiers: {
        alt: true,
      },
    }),
  ).toEqual("alt_$num");

  expect(
    parseKeyData({
      key: "any",
      modifiers: {},
    }),
  ).toEqual("any");
});
