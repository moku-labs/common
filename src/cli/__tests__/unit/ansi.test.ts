import { describe, expect, it } from "vitest";
import {
  ANSI,
  BRAND_PINK,
  box,
  boxGlyphs,
  cursorUp,
  fg24,
  makePalette,
  SPINNER_FRAMES,
  spinnerFrameAt,
  supportsColor,
  supportsTruecolor,
  visibleWidth
} from "../../ansi";

const ESC = String.fromCodePoint(0x1b);

describe("supportsColor", () => {
  it("is false for a non-TTY stream", () => {
    expect(supportsColor({ isTTY: false })).toBe(false);
  });

  it("is false when NO_COLOR is set even on a TTY", () => {
    expect(supportsColor({ isTTY: true }, "1")).toBe(false);
  });

  it("is true on a TTY with NO_COLOR unset", () => {
    expect(supportsColor({ isTTY: true })).toBe(true);
  });
});

describe("supportsTruecolor", () => {
  it("is true for truecolor / 24bit COLORTERM and false otherwise", () => {
    expect(supportsTruecolor("truecolor")).toBe(true);
    expect(supportsTruecolor("24bit")).toBe(true);
    expect(supportsTruecolor("256color")).toBe(false);
    expect(supportsTruecolor()).toBe(false);
  });
});

describe("fg24", () => {
  it("builds a 24-bit foreground escape for the brand pink", () => {
    expect(fg24(BRAND_PINK.r, BRAND_PINK.g, BRAND_PINK.b)).toBe(`${ESC}[38;2;255;30;111m`);
  });
});

describe("makePalette", () => {
  it("returns input unchanged in plain mode", () => {
    const palette = makePalette(false);
    expect(palette.green("x")).toBe("x");
    expect(palette.pink("x")).toBe("x");
    expect(palette.bold("x")).toBe("x");
    expect(palette.enabled).toBe(false);
  });

  it("wraps text in color mode", () => {
    const palette = makePalette(true);
    expect(palette.green("x")).toContain("x");
    expect(palette.green("x")).not.toBe("x");
    expect(palette.green("x")).toContain(ANSI.green);
    expect(palette.enabled).toBe(true);
  });

  it("uses 24-bit pink only when truecolor is enabled, magenta otherwise", () => {
    expect(makePalette(true, true).pink("x")).toContain("38;2;255;30;111");
    expect(makePalette(true, false).pink("x")).toContain(ANSI.magenta);
    expect(makePalette(true, false).pink("x")).not.toContain("38;2;255;30;111");
  });

  it("exposes the named accessors over paint", () => {
    const palette = makePalette(true);
    for (const value of [
      palette.dim("x"),
      palette.yellow("x"),
      palette.red("x"),
      palette.cyan("x")
    ]) {
      expect(value).toContain("x");
      expect(value).toContain(ESC);
    }
  });
});

describe("visibleWidth", () => {
  it("ignores ANSI escapes", () => {
    expect(visibleWidth(makePalette(true).red("hi"))).toBe(2);
    expect(visibleWidth("plain")).toBe(5);
  });
});

describe("spinnerFrameAt", () => {
  it("advances one frame per frameMs and wraps", () => {
    expect(spinnerFrameAt(0, 80)).toBe(SPINNER_FRAMES[0]);
    expect(spinnerFrameAt(240, 80)).toBe(SPINNER_FRAMES[3]);
    expect(spinnerFrameAt(80 * SPINNER_FRAMES.length, 80)).toBe(SPINNER_FRAMES[0]);
    expect(spinnerFrameAt(-5, 80)).toBe(SPINNER_FRAMES[0]);
  });
});

describe("cursorUp", () => {
  it("builds the cursor-up escape, empty for n <= 0", () => {
    expect(cursorUp(3)).toBe(`${ESC}[3A`);
    expect(cursorUp(0)).toBe("");
    expect(cursorUp(-2)).toBe("");
  });
});

describe("boxGlyphs", () => {
  it("returns Unicode glyphs in color mode and ASCII off it", () => {
    expect(boxGlyphs(true).topLeft).toBe("╭");
    expect(boxGlyphs(false).topLeft).toBe("+");
  });
});

describe("box", () => {
  it("frames content and pads to the widest visible line (ASCII)", () => {
    const lines = box(["a", "longer line"], false);
    expect(lines[0]).toMatch(/^\+-+\+$/);
    expect(lines.at(-1)).toMatch(/^\+-+\+$/);
    const widths = new Set(lines.map(line => line.length));
    expect(widths.size).toBe(1);
  });

  it("honors minInnerWidth and uses Unicode borders in color mode", () => {
    const lines = box(["x"], true, 20);
    expect(lines[0]?.startsWith("╭")).toBe(true);
    // inner width 20 + 2 padding spaces => 22 horizontal glyphs between corners
    expect(visibleWidth(lines[0] ?? "")).toBe(24);
  });
});
