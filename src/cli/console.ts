/**
 * @file `@moku-labs/common/cli` — the branded console: the shared, **stateless** line
 * vocabulary every Moku CLI prints through so the look never drifts between projects.
 * It is the generic counterpart to a framework's own (stateful) panels: the `▟▙` lockup
 * banner, section `heading`s, `info`/`warn`/`error` lines, `✓/✗ check` rows, plus the
 * `railLine`/`box` builders a project composes its own panels from. Built entirely on the
 * {@link makePalette} primitives, TTY/`NO_COLOR`-aware, every line routed through an
 * injectable sink so tests capture output (and a non-CLI consumer can redirect it).
 */
import {
  box as boxLines,
  makePalette,
  type Palette,
  supportsColor,
  supportsTruecolor,
  visibleWidth
} from "./ansi";

/** Default total visible width the lockup rule spans and `railLine` right-aligns to. */
const DEFAULT_WIDTH = 66;

/**
 * Options for {@link createBrandConsole}. All optional: the defaults wire the console to
 * `console.log`/`console.error` with auto-detected color/truecolor, while tests inject a
 * capturing sink and force `color: false` for deterministic plain output.
 *
 * @example
 * const lines: string[] = [];
 * const ui = createBrandConsole({ write: line => lines.push(line), color: false });
 */
export type BrandConsoleOptions = {
  /** Sink for normal (stdout) lines. Defaults to `console.log`. */
  write?: (line: string) => void;
  /** Sink for warning/error (stderr) lines. Defaults to `console.error`. */
  writeError?: (line: string) => void;
  /** Force color on/off. Defaults to `supportsColor()` (TTY + `NO_COLOR` unset). */
  color?: boolean;
  /** Force 24-bit truecolor on/off. Defaults to `supportsTruecolor()` (`COLORTERM`). */
  truecolor?: boolean;
  /** Total visible width the lockup rule spans / `railLine` aligns to. Defaults to `66`. */
  width?: number;
};

/**
 * The fields of the `▟▙ moku <name>` lockup banner. Every part is optional except the
 * wordmark, so a one-off tool can print just `▟▙ moku tool` while a framework adds a
 * per-command label, a version (right-aligned) and a runtime-facts line beneath the rule.
 *
 * @example
 * ui.lockup({ wordmark: "moku worker", label: "deploy", version: "v1.2.0" });
 */
export type LockupOptions = {
  /** The product wordmark shown in bold brand pink (e.g. `moku web`). */
  wordmark: string;
  /** Optional dim per-command/context label shown beside the wordmark (e.g. `serve · dev`). */
  label?: string;
  /** Optional dim version string right-aligned on the lockup line (e.g. `v1.2.0`). */
  version?: string;
  /** Optional dim facts line shown beneath the rule (e.g. `node 24.3.0 · darwin arm64`). */
  facts?: string;
};

/**
 * The branded console surface: the shared brand vocabulary plus the `palette` and the
 * `railLine`/`box` builders a project composes its own panels from.
 *
 * @example
 * const ui = createBrandConsole();
 * ui.lockup({ wordmark: "moku tool" });
 * ui.info("ready");
 */
export type BrandConsole = {
  /** The bound color palette (the same one the lines are rendered with). */
  readonly palette: Palette;
  /** Whether this console emits color/Unicode. */
  readonly color: boolean;
  /** The lockup/rail width this console aligns to. */
  readonly width: number;
  /**
   * Write a pre-rendered line verbatim through the stdout sink.
   *
   * @param text - The line to write (defaults to an empty line).
   * @returns Nothing.
   * @example
   * ui.line("  custom row");
   */
  line(text?: string): void;
  /**
   * Render the `▟▙ <wordmark>` lockup: the cube + bold-pink wordmark and an optional dim
   * label on the left with the version right-aligned, a dim hairline rule, and an optional
   * dim facts line beneath it. The cube/rule degrade to ASCII (`*`/`-`) off a TTY.
   *
   * @param options - The lockup fields (see {@link LockupOptions}).
   * @returns Nothing.
   * @example
   * ui.lockup({ wordmark: "moku web", label: "build", version: "v1.2.0" });
   */
  lockup(options: LockupOptions): void;
  /**
   * Render a section heading: a blank line followed by a bold brand-pink label.
   *
   * @param text - The heading label.
   * @returns Nothing.
   * @example
   * ui.heading("Diagnostics");
   */
  heading(text: string): void;
  /**
   * Render a neutral informational line (`› message`). Continuation lines (after a `\n`)
   * are indented under the first.
   *
   * @param message - The line to print.
   * @returns Nothing.
   * @example
   * ui.info("watching for changes…");
   */
  info(message: string): void;
  /**
   * Render a warning line (`⚠ message`, written to stderr).
   *
   * @param message - The warning to print.
   * @returns Nothing.
   * @example
   * ui.warn("deploy skipped");
   */
  warn(message: string): void;
  /**
   * Render an error line (`✗ message`, written to stderr), optionally with a cause printed
   * beneath it.
   *
   * @param message - The error summary to print.
   * @param cause - Optional underlying error/value to print beneath the summary.
   * @returns Nothing.
   * @example
   * ui.error("build failed", err);
   */
  error(message: string, cause?: unknown): void;
  /**
   * Render one diagnostic line: a green `✓` (pass) or red `✗` (fail) + label, with optional
   * dim, indented detail beneath (e.g. a fix hint for a failing check).
   *
   * @param ok - Whether the check passed.
   * @param label - The check label.
   * @param detail - Optional multi-line guidance shown indented under the line.
   * @returns Nothing.
   * @example
   * ui.check(false, "API_TOKEN is set", "Create one at …");
   */
  check(ok: boolean, label: string, detail?: string): void;
  /**
   * Right-align `right` against `left` within `width`, measuring visible width so embedded
   * ANSI never throws the alignment off. The building block for custom rail/panel rows.
   *
   * @param left - The left segment (may contain ANSI).
   * @param right - The right segment (may contain ANSI).
   * @param width - Total visible width to fill (defaults to the console width).
   * @returns The padded line.
   * @example
   * ui.railLine("  ✓ pages", "· 12ms");
   */
  railLine(left: string, right: string, width?: number): string;
  /**
   * Frame the given content lines in a brand box and write the result. Unicode borders on
   * a TTY, ASCII off it; padded to the widest line or `minInnerWidth`.
   *
   * @param lines - The content lines (may contain ANSI).
   * @param minInnerWidth - Minimum inner width to pad every row to. Defaults to `0`.
   * @returns Nothing.
   * @example
   * ui.box(["Local    http://localhost:4173"]);
   */
  box(lines: string[], minInnerWidth?: number): void;
};

/**
 * Create a {@link BrandConsole}. Output flows through the injected sink (default
 * `console.log`/`console.error`) and is colorized only when color is enabled, so the
 * identical render path yields branded color/Unicode on a TTY and plain ASCII in CI/pipes.
 *
 * @param options - Optional sinks, color/truecolor overrides, and width (see
 *   {@link BrandConsoleOptions}).
 * @returns The branded console.
 * @example
 * const ui = createBrandConsole();
 * ui.lockup({ wordmark: "moku tool", version: "v1.0.0" });
 * ui.check(true, "config loaded");
 */
export function createBrandConsole(options: BrandConsoleOptions = {}): BrandConsole {
  // biome-ignore lint/suspicious/noConsole: the brand console writes to stdout (default sink); callers inject a capturing sink.
  const write = options.write ?? ((line: string) => console.log(line));
  const writeError = options.writeError ?? ((line: string) => console.error(line));
  const color = options.color ?? supportsColor();
  const truecolor = options.truecolor ?? (color && supportsTruecolor());
  const palette = makePalette(color, truecolor);
  const width = options.width ?? DEFAULT_WIDTH;
  const cube = color ? "▟▙" : "*";
  const rule = color ? "─" : "-";

  /**
   * Right-align `right` against `left` within `lineWidth`, measuring visible width so
   * embedded ANSI never throws the alignment off.
   *
   * @param left - The left segment (may contain ANSI).
   * @param right - The right segment (may contain ANSI).
   * @param lineWidth - Total visible width to fill (defaults to the console width).
   * @returns The padded line.
   * @example
   * railLine("left", "right", 20);
   */
  const railLine = (left: string, right: string, lineWidth = width): string => {
    const gap = Math.max(1, lineWidth - visibleWidth(left) - visibleWidth(right));
    return `${left}${" ".repeat(gap)}${right}`;
  };

  return {
    palette,
    color,
    width,
    /**
     * Write a pre-rendered line verbatim through the stdout sink.
     *
     * @param text - The line to write (defaults to an empty line).
     * @example
     * ui.line("  custom row");
     */
    line(text = "") {
      write(text);
    },
    /**
     * Render the `▟▙ <wordmark>` lockup (cube + bold-pink wordmark + optional label,
     * version right-aligned), a dim hairline rule, and an optional dim facts line.
     *
     * @param opts - The lockup fields (see {@link LockupOptions}).
     * @example
     * ui.lockup({ wordmark: "moku web", label: "build", version: "v1.2.0" });
     */
    lockup(opts) {
      const wordmark = palette.pink(palette.bold(opts.wordmark));
      const label = opts.label ? `  ${palette.dim(opts.label)}` : "";
      const left = ` ${palette.pink(cube)} ${wordmark}${label}`;
      write(railLine(left, opts.version ? palette.dim(opts.version) : ""));
      write(` ${palette.dim(rule.repeat(width - 1))}`);
      if (opts.facts !== undefined) write(` ${palette.dim(opts.facts)}`);
    },
    /**
     * Render a section heading: a blank line followed by a bold brand-pink label.
     *
     * @param text - The heading label.
     * @example
     * ui.heading("Diagnostics");
     */
    heading(text) {
      write("");
      write(`  ${palette.bold(palette.pink(text))}`);
    },
    /**
     * Render a neutral informational line (`› message`), indenting continuation lines.
     *
     * @param message - The line to print.
     * @example
     * ui.info("watching for changes…");
     */
    info(message) {
      const [first = "", ...rest] = message.split("\n");
      write(`  ${palette.cyan("›")} ${first}`);
      for (const lineText of rest) write(`    ${lineText}`);
    },
    /**
     * Render a warning line (`⚠ message`, to stderr).
     *
     * @param message - The warning to print.
     * @example
     * ui.warn("deploy skipped");
     */
    warn(message) {
      writeError(`  ${palette.yellow("⚠")} ${message}`);
    },
    /**
     * Render an error line (`✗ message`, to stderr), optionally with a cause beneath.
     *
     * @param message - The error summary to print.
     * @param cause - Optional underlying error/value printed beneath the summary.
     * @example
     * ui.error("build failed", err);
     */
    error(message, cause) {
      writeError(`  ${palette.red("✗")} ${message}`);
      if (cause !== undefined) writeError(String(cause));
    },
    /**
     * Render a diagnostic line — green `✓` / red `✗` + label, with optional dim,
     * indented detail beneath.
     *
     * @param ok - Whether the check passed.
     * @param label - The check label.
     * @param detail - Optional multi-line guidance shown indented under the line.
     * @example
     * ui.check(true, "config loaded");
     */
    check(ok, label, detail) {
      write(`  ${ok ? palette.green("✓") : palette.red("✗")} ${label}`);
      if (detail !== undefined) {
        for (const lineText of detail.split("\n")) write(`      ${palette.dim(lineText)}`);
      }
    },
    railLine,
    /**
     * Frame the given content lines in a brand box and write the result.
     *
     * @param lines - The content lines (may contain ANSI).
     * @param minInnerWidth - Minimum inner width to pad every row to. Defaults to `0`.
     * @example
     * ui.box(["Local    http://localhost:4173"]);
     */
    box(lines, minInnerWidth = 0) {
      for (const lineText of boxLines(lines, color, minInnerWidth)) write(lineText);
    }
  };
}
