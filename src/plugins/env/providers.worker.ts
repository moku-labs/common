/**
 * @file env plugin — workerd-safe `process.env` provider (zero `node:*`).
 *
 * Companion to `./providers.ts` (which imports `node:fs` for `dotenv`) and to
 * `./providers.browser.ts`. This module is the Cloudflare-Workers-bundle-safe
 * source: it reads `process.env` only behind a `typeof process` guard, so baking it
 * into a Worker can never throw at cold start — `process` is present under Bun/Node
 * and under workerd with `nodejs_compat`, and absent under workerd without it, where
 * this degrades to an empty map. Unlike {@link processEnv} (in `./providers.ts`), it
 * never dereferences `process` unconditionally, and unlike `dotenv` it pulls in no
 * `node:*` import.
 */
import type { EnvProvider } from "./types";

/**
 * A workerd-safe {@link EnvProvider} that returns a shallow copy of `process.env`
 * when a `process` global exists, else an empty record. Safe to evaluate at Worker
 * cold start — it never throws on a missing `process` (`typeof` of an undeclared
 * identifier is the string `"undefined"`, not a `ReferenceError`). Re-reads fresh on
 * every `load()`, so it is not a live reference.
 *
 * @returns An {@link EnvProvider} named `worker-process-env`.
 * @example
 * ```ts
 * // wire as the env provider on a Cloudflare target so `ctx.env.get("CLOUDFLARE_API_TOKEN")`
 * // resolves under Bun/Node deploy scripts, while staying safe inside the deployed Worker.
 * const provider = workerSafeProcessEnv();
 * provider.load().CLOUDFLARE_API_TOKEN;
 * ```
 */
export function workerSafeProcessEnv(): EnvProvider {
  return {
    name: "worker-process-env",
    /**
     * Reads a shallow copy of `process.env`, or `{}` when there is no `process`
     * global (workerd without `nodejs_compat`). Never throws at cold start.
     *
     * @returns The current environment as a flat record (empty when `process` is absent).
     * @example
     * ```ts
     * workerSafeProcessEnv().load();
     * ```
     */
    load(): Record<string, string | undefined> {
      return typeof process === "undefined" ? {} : { ...process.env };
    }
  };
}
