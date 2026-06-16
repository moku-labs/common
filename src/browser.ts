/**
 * @file `@moku-labs/common/browser` — the browser-safe subset of the shared catalog.
 *
 * A node-excluded view of the main `@moku-labs/common` entry: the SAME `logPlugin`
 * and `envPlugin`, plus the node-free `browserEnv` provider, but with **zero**
 * `node:*` in its static import graph. The Node env providers (`dotenv`,
 * `processEnv`, `cloudflareBindings`) import `node:fs` and are omitted here — so
 * importing this entry can never drag the Node graph into a client bundle,
 * regardless of the consumer's bundler or tree-shaking. Built as its own ESM-only
 * pass so the graph never even references the node-only module (see tsdown.config.ts).
 * @see src/index.ts — the full (Node-capable) entry.
 */

// ─── Plugins (node-free subset) ─────────────────────────────────────────────────
export { logPlugin } from "./plugins/log";
export { envPlugin } from "./plugins/env";

// ─── env provider (browser-safe; the Node providers live on the `.` entry) ──────
export { browserEnv } from "./plugins/env/providers.browser";

// ─── Type namespaces ────────────────────────────────────────────────────────────
export * as Log from "./plugins/log/types";
export * as Env from "./plugins/env/types";

// ─── Plugin types (flat; for consumer type portability — see src/index.ts) ───────
export type {
  ExpectChain,
  LogApi,
  LogConfig,
  LogEntry,
  LogLevel,
  LogSink,
  LogState
} from "./plugins/log/types";
export type { EnvApi, EnvConfig, EnvProvider, EnvState, EnvVarSpec } from "./plugins/env/types";
