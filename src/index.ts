/**
 * @file `@moku-labs/common` — the shared plugin catalog for the Moku family.
 *
 * A plugin **catalog**, not a framework: it calls neither `createCoreConfig` nor
 * `createCore` and ships no `createApp` of its own. It exports framework-agnostic
 * plugin objects (built on `@moku-labs/core` via `createCorePlugin`) so sibling
 * frameworks (`web`, `blog`, and future ones) import and register them in their own
 * `createCoreConfig` rather than re-implementing each.
 *
 * The Node env providers (`dotenv`, `processEnv`, `cloudflareBindings`) import
 * `node:fs`; `"sideEffects": false` lets a browser bundle tree-shake them away. For
 * a guaranteed node-free client bundle, import the `@moku-labs/common/browser` entry
 * instead — see `src/browser.ts`.
 * @see README.md
 */

// ─── Plugins ──────────────────────────────────────────────────────────────────
// Core plugins (`createCorePlugin`): once a framework registers them in its
// `createCoreConfig`, their API is injected onto every plugin's context — `ctx.log`
// (always-on trace + `expect()` DSL) and `ctx.env` (validated, frozen env).
export { logPlugin } from "./plugins/log";
export { envPlugin } from "./plugins/env";

// ─── env providers (compose one per target) ────────────────────────────────────
// `dotenv` / `processEnv` / `cloudflareBindings` import `node:fs` (Node only);
// `workerSafeProcessEnv` and `browserEnv` are `node:*`-free — the worker one stays
// on this (server) barrel, `browserEnv` also ships on the `./browser` entry.
export { cloudflareBindings, dotenv, processEnv } from "./plugins/env/providers";
export { browserEnv } from "./plugins/env/providers.browser";
export { workerSafeProcessEnv } from "./plugins/env/providers.worker";

// ─── Type namespaces ────────────────────────────────────────────────────────────
// Access as `Log.LogApi`, `Env.EnvConfig`, etc.
export * as Log from "./plugins/log/types";
export * as Env from "./plugins/env/types";

// ─── Plugin types (flat) ────────────────────────────────────────────────────────
// Re-exported flat IN ADDITION to the namespaces above so a consuming framework's
// INFERRED types (e.g. its `createApp`) can NAME them: a namespace-only export
// triggers TS4023 "cannot be named" in the consumer's declaration emit.
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
