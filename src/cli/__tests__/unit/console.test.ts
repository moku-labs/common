import { describe, expect, it } from "vitest";
import { createBrandConsole } from "../../console";

const ESC = String.fromCodePoint(0x1b);

// Build a brand console capturing stdout + stderr lines, color off by default.
function capture(color = false) {
  const out: string[] = [];
  const err: string[] = [];
  const ui = createBrandConsole({
    write: line => out.push(line),
    writeError: line => err.push(line),
    color
  });
  return { ui, out, err };
}

describe("createBrandConsole (plain mode)", () => {
  it("exposes color/width/palette", () => {
    const { ui } = capture();
    expect(ui.color).toBe(false);
    expect(ui.width).toBe(66);
    expect(ui.palette.enabled).toBe(false);
  });

  it("renders the lockup: cube, wordmark, label, version and facts", () => {
    const { ui, out } = capture();
    ui.lockup({ wordmark: "moku web", label: "build", version: "v1.2.0", facts: "node 24" });
    const joined = out.join("\n");
    expect(joined).toContain("moku web");
    expect(joined).toContain("build");
    expect(joined).toContain("v1.2.0");
    expect(joined).toContain("node 24");
    // ASCII cube + rule in plain mode.
    expect(joined).toContain("*");
    expect(out[1]).toMatch(/^ -+$/);
  });

  it("omits the facts line when not provided", () => {
    const { ui, out } = capture();
    ui.lockup({ wordmark: "moku tool" });
    expect(out).toHaveLength(2); // lockup line + rule only
  });

  it("renders info to stdout with indented continuation lines", () => {
    const { ui, out } = capture();
    ui.info("first\nsecond");
    expect(out[0]).toContain("› first");
    expect(out[1]).toBe("    second");
  });

  it("routes warn and error (with cause) to stderr", () => {
    const { ui, out, err } = capture();
    ui.warn("careful");
    ui.error("boom", new Error("cause"));
    expect(out).toHaveLength(0);
    expect(err.join("\n")).toContain("careful");
    expect(err.join("\n")).toContain("boom");
    expect(err.join("\n")).toContain("cause");
  });

  it("error without a cause prints only the summary", () => {
    const { ui, err } = capture();
    ui.error("nope");
    expect(err).toHaveLength(1);
    expect(err[0]).toContain("✗ nope");
  });

  it("renders heading, check rows (✓/✗ with detail) and raw/blank lines", () => {
    const { ui, out } = capture();
    ui.heading("Diagnostics");
    ui.check(true, "token set");
    ui.check(false, "project exists", "create it at https://dash");
    ui.line("raw");
    ui.line();
    const joined = out.join("\n");
    expect(joined).toContain("Diagnostics");
    expect(joined).toContain("✓ token set");
    expect(joined).toContain("✗ project exists");
    expect(joined).toContain("create it at https://dash");
    expect(out).toContain("raw");
    expect(out).toContain("");
  });

  it("railLine right-aligns within the width and box frames content", () => {
    const { ui, out } = capture();
    const line = ui.railLine("left", "right", 20);
    expect(line.length).toBe(20);
    expect(line.startsWith("left")).toBe(true);
    expect(line.endsWith("right")).toBe(true);
    ui.box(["content"]);
    expect(out[0]).toMatch(/^\+-+\+$/);
    expect(out.at(-1)).toMatch(/^\+-+\+$/);
  });

  it("emits NO ANSI escape codes when color is disabled", () => {
    const { ui, out, err } = capture(false);
    ui.lockup({ wordmark: "moku web", version: "v1" });
    ui.info("hi");
    ui.warn("w");
    ui.check(false, "x", "d");
    for (const line of [...out, ...err]) {
      expect(line).not.toContain(ESC);
    }
  });
});

describe("createBrandConsole (color mode)", () => {
  it("emits ANSI escape codes and the Unicode cube/rule", () => {
    const { ui, out } = capture(true);
    ui.lockup({ wordmark: "moku web", label: "deploy", version: "v1" });
    const joined = out.join("\n");
    expect(joined).toContain(ESC);
    expect(joined).toContain("▟▙");
    expect(joined).toContain("─");
  });
});
