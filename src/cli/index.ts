/**
 * @file `@moku-labs/common/cli` — the Moku family's branded CLI kit.
 *
 * The shared "look and feel" of every Moku command line, in three layers so each
 * project keeps its own command logic while the *style* comes from one place:
 *
 * - **primitives** (`./ansi`) — the brand pink, the {@link makePalette} palette, and the
 *   `box`/spinner/cursor glyphs, all TTY/`NO_COLOR`-aware with ASCII fallbacks.
 * - **console** (`./console`) — {@link createBrandConsole}: the stateless line vocabulary
 *   (the `▟▙` lockup, `heading`/`info`/`warn`/`error`/`check`, plus `railLine`/`box` to
 *   compose custom panels).
 * - **prompts** (`./prompts`) — {@link createBrandPrompts}: branded `confirm`/`select`.
 * - **log sink** (`./log-sink`) — {@link brandedSink}: render `ctx.log` entries branded.
 *
 * Node-flavored (reads `process.*`, uses `node:readline`); imported via the
 * `@moku-labs/common/cli` subpath, never the browser entry.
 * @see README.md
 */

export {
  ANSI,
  type AnsiCode,
  type BoxGlyphs,
  BRAND_PINK,
  box,
  boxGlyphs,
  CLEAR_BELOW,
  CLEAR_LINE,
  type ColorStream,
  cursorUp,
  fg24,
  makePalette,
  type Palette,
  SPINNER_FRAMES,
  spinnerFrameAt,
  supportsColor,
  supportsTruecolor,
  visibleWidth
} from "./ansi";
export {
  type BrandConsole,
  type BrandConsoleOptions,
  createBrandConsole,
  type LockupOptions
} from "./console";
export { brandedSink } from "./log-sink";
export { type BrandPrompts, type BrandPromptsOptions, createBrandPrompts } from "./prompts";
