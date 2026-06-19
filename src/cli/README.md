# cli

> **Kit** — the Moku family's branded CLI renderer: one branded console so every Moku command line shares the same look, while each project keeps its own command logic.

`@moku-labs/common/cli` is the shared **brand DNA** for terminal output — extracted from `@moku-labs/web`'s "Velocity Lockup" CLI so `web`, `worker`, and any future project render through the same primitives instead of each reinventing (and drifting from) the look. It is a plain **library module**, *not* a Moku plugin: there is no `createPlugin`/`createCorePlugin` and nothing to register — you import the functions you need directly. Zero runtime dependencies (pure ANSI), TTY/`NO_COLOR`-aware (color + Unicode on a real TTY, plain ASCII in CI/pipes), and **Node-only** — it reads `process.*` / uses `node:readline`, so it ships on the `.` / `./cli` entries and is deliberately excluded from the node-free [`/browser`](../../README.md#entry-points) entry.

It is layered so you take exactly what you need:

- **primitives** (`ansi`) — the palette (`BRAND_PINK` = `#FF1E6F`), `box`, `spinnerFrameAt`, cursor/clear escapes. Build your own panels on top.
- **console** (`createBrandConsole`) — the stateless line vocabulary: the `▟▙` lockup, `heading` / `info` / `warn` / `error` / `check`, plus `railLine` / `box` to compose custom rows.
- **prompts** (`createBrandPrompts`) — branded `confirm` (y/N) and `select` (one-of-N).
- **log sink** (`brandedSink`) — render a `log` plugin's `ctx.log` entries through the brand vocabulary (pair with `ctx.log.clearSinks()`).

## Example

```ts
import { createBrandConsole } from "@moku-labs/common/cli";

const ui = createBrandConsole();
ui.lockup({ wordmark: "moku tool", label: "build", version: "v1.2.0" });
ui.info("watching for changes…");
ui.check(true, "config loaded");
ui.check(false, "API_TOKEN is set", "Create one at https://dash…");
// ▟▙ moku tool  build                                          v1.2.0
//  ────────────────────────────────────────────────────────────────
//   › watching for changes…
//   ✓ config loaded
//   ✗ API_TOKEN is set
//       Create one at https://dash…
```

Branding a `log`-based CLI (the `@moku-labs/worker` deploy TUI pattern) — swap the default object-dump console sink for the branded one at init:

```ts
import { brandedSink } from "@moku-labs/common/cli";

// in a (node-only) CLI plugin's onInit — runtime logging is untouched:
ctx.log.clearSinks();
ctx.log.addSink(brandedSink("info"));
// now ctx.log.info("deployed → …") renders as "  › deployed → …"
```

Branded interactive prompts:

```ts
import { createBrandPrompts } from "@moku-labs/common/cli";

const prompts = createBrandPrompts();
if (await prompts.confirm("Deploy dist/ to Cloudflare Pages?")) {
  const i = await prompts.select("Workflow trigger?", ["Auto on push", "Manual only"]);
}
```

## API

### `createBrandConsole(options?) → BrandConsole`

Options (all optional): `write` (stdout sink, default `console.log`), `writeError` (stderr sink, default `console.error`), `color` (default `supportsColor()`), `truecolor` (default `color && supportsTruecolor()`), `width` (rail width, default `66`).

| Member | Signature | Notes |
|---|---|---|
| `lockup` | `(o: { wordmark; label?; version?; facts? }) => void` | The `▟▙ <wordmark>` banner: cube + bold-pink wordmark + dim label, version right-aligned, a dim rule, and an optional facts line. ASCII (`*`/`-`) off a TTY. |
| `heading` | `(text) => void` | Blank line + bold brand-pink label. |
| `info` | `(message) => void` | `  › message` (continuation lines after `\n` are indented). |
| `warn` | `(message) => void` | `  ⚠ message` → **stderr**. |
| `error` | `(message, cause?) => void` | `  ✗ message` → **stderr**, with an optional cause beneath. |
| `check` | `(ok, label, detail?) => void` | `  ✓`/`  ✗` + label, with optional dim indented detail. |
| `line` | `(text?) => void` | Write a pre-rendered line verbatim (blank when omitted). |
| `railLine` | `(left, right, width?) => string` | Right-align `right` against `left` within `width`, ANSI-aware — the building block for custom rows. |
| `box` | `(lines, minInnerWidth?) => void` | Frame lines in a brand box (Unicode on a TTY, ASCII off it) and write them. |
| `palette` · `color` · `width` | properties | The bound `Palette`, the color flag, and the rail width. |

### `createBrandPrompts(options?) → BrandPrompts`

Options: `color`, `truecolor`, `width`, `input` (default `process.stdin`), `output` (default `process.stdout`), `write` (choices-block sink). Built on `node:readline`; the streams + sink are injectable so tests drive prompts without a TTY.

| Method | Signature | Notes |
|---|---|---|
| `confirm` | `(question) => Promise<boolean>` | Resolves `true` only on explicit `y`/`yes` (default No). |
| `select` | `(question, choices) => Promise<number>` | Presents choices numbered from 1; resolves the chosen zero-based index (empty/out-of-range → `0`). |

### `brandedSink(minLevel?) → LogSink`

A `LogSink` (from the [`log`](../plugins/log/README.md) plugin) that renders each entry through the brand vocabulary — `info` → `›`, `warn` → `⚠` (stderr), `error` → `✗` (stderr), `debug` → dim — with structured `data` appended dim. Entries below `minLevel` (default `"debug"`) are dropped. Install it with `ctx.log.clearSinks(); ctx.log.addSink(brandedSink())` to replace the default object-dump sink.

### Primitives (`ansi`)

`makePalette(color, truecolor?)` → a `Palette` (`bold`/`dim`/`green`/`yellow`/`red`/`cyan`/`pink`/`paint`); `box(lines, color, minInnerWidth?)`, `boxGlyphs(color)`; `spinnerFrameAt(elapsedMs, frameMs?)`, `SPINNER_FRAMES`; `cursorUp(n)`, `CLEAR_LINE`, `CLEAR_BELOW`; `visibleWidth(text)` (ignores ANSI); `supportsColor(stream?, noColor?)`, `supportsTruecolor(colorTerm?)`; `fg24(r,g,b)`, `ANSI`, `BRAND_PINK`. Types: `Palette`, `AnsiCode`, `BoxGlyphs`, `ColorStream`.

## Design notes

- **Not a plugin — a library.** No `createPlugin`; import functions directly. (The thing it pairs with — `clearSinks` / `addSink` — lives on the `log` plugin's API.)
- **Zero dependencies, pure ANSI.** No `chalk`/`ora`/`boxen` — colors, boxes, spinners, and progress are hand-rolled escapes, so the look is fully owned and stays identical everywhere.
- **Brand color.** `#FF1E6F` exact (24-bit truecolor) when `COLORTERM` advertises it, the 16-color `magenta` approximation otherwise, plain text off a TTY.
- **Node-only by design.** Reads `process.*` and uses `node:readline`; it is *not* re-exported from `@moku-labs/common/browser`, and the browser-bundle CI gate confirms it never reaches the client graph.
- **Each project keeps its own panels.** `web` renders its BUILD/serve/deploy boxes; `worker` renders its deploy TUI — both on these shared primitives. The *style* comes from here; the *logic* stays local.

## Files

| File | Responsibility |
|---|---|
| `ansi.ts` | The brand primitives — palette / `BRAND_PINK` / `box` / `spinnerFrameAt` / cursor + color detection. Zero imports. |
| `console.ts` | `createBrandConsole` — the stateless line vocabulary (lockup, info/warn/error/check, railLine/box). |
| `prompts.ts` | `createBrandPrompts` — branded `confirm` / `select` over `node:readline`. |
| `log-sink.ts` | `brandedSink` — render `ctx.log` entries through `createBrandConsole`. |
| `index.ts` | Barrel — the public `@moku-labs/common/cli` surface. |
| `__tests__/` | Colocated unit tests (ansi, console, prompts, log-sink). |

---

<sub>Part of <strong><a href="../../README.md">@moku-labs/common</a></strong> — built on <a href="https://github.com/moku-labs/core">@moku-labs/core</a>.</sub>
