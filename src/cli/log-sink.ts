/**
 * @file `@moku-labs/common/cli` — a branded log {@link LogSink}. Renders structured
 * `ctx.log` entries through the {@link createBrandConsole} vocabulary so a log-based CLI
 * (e.g. a deploy progress TUI) gets the family look — `›` info, `⚠` warn, `✗` error,
 * dim debug — instead of the default object-dump console sink. Pair it with the log
 * API's `clearSinks()` to replace the default sink:
 * `ctx.log.clearSinks(); ctx.log.addSink(brandedSink())`.
 *
 * Lives in the (Node) CLI kit, not the log plugin, so the log plugin — and the browser
 * bundle that ships it — never pulls in any rendering code. Depends on the log plugin
 * only by type.
 */
import type { LogEntry, LogLevel, LogSink } from "../plugins/log/types";
import { type BrandConsole, createBrandConsole } from "./console";

/** Severity rank for threshold comparison (higher = more severe). Mirrors the log plugin. */
const LEVEL_RANK: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

/**
 * Render an entry's optional structured `data` as a compact, dim suffix. Falls back to
 * `String(data)` when it is not JSON-serializable (e.g. a circular object).
 *
 * @param ui - The brand console (for its palette).
 * @param data - The entry's structured payload.
 * @returns A leading-space dim suffix, or `""` when there is no data.
 * @example
 * formatData(ui, { count: 12 }); // ' {"count":12}' (dim)
 */
function formatData(ui: BrandConsole, data: unknown): string {
  if (data === undefined) return "";
  let text: string;
  try {
    text = JSON.stringify(data);
  } catch {
    text = String(data);
  }
  return text === undefined ? "" : ` ${ui.palette.dim(text)}`;
}

/**
 * Build a branded log {@link LogSink}: routes each entry to the matching brand line —
 * `error` → `✗` (stderr), `warn` → `⚠` (stderr), `info` → `›`, `debug` → dim — with any
 * structured `data` appended dim. Entries below `minLevel` are dropped (the in-memory
 * trace still records everything). TTY/`NO_COLOR`-aware via the brand console.
 *
 * @param minLevel - Lowest severity to print. Defaults to `"debug"` (print all).
 * @returns A {@link LogSink} that writes branded lines to stdout/stderr.
 * @example
 * ctx.log.clearSinks();
 * ctx.log.addSink(brandedSink("info")); // suppress debug spam, branded output
 */
export function brandedSink(minLevel: LogLevel = "debug"): LogSink {
  const threshold = LEVEL_RANK[minLevel];
  const ui = createBrandConsole();
  return {
    /**
     * Render one entry as a branded line matching its level (dropping entries below
     * the threshold).
     *
     * @param entry - The entry to emit.
     * @example
     * sink.write({ level: "info", event: "deploy:done", ts: 0 });
     */
    write(entry: LogEntry): void {
      if (LEVEL_RANK[entry.level] < threshold) return;
      const message = `${entry.event}${formatData(ui, entry.data)}`;
      switch (entry.level) {
        case "error": {
          ui.error(message);
          break;
        }
        case "warn": {
          ui.warn(message);
          break;
        }
        case "debug": {
          ui.line(`  ${ui.palette.dim(message)}`);
          break;
        }
        default: {
          ui.info(message);
        }
      }
    }
  };
}
