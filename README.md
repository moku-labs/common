<div align="center">

# @moku-labs/common

**Shared, framework-agnostic plugins for the Moku family.**

Author a plugin once, reuse it across every Moku framework. `@moku-labs/common` is
a *catalog* — it exports plugin objects built on the
[@moku-labs/core](https://github.com/moku-labs/core) micro-kernel, ready to drop
into any framework's `createCoreConfig`. No framework of its own, no lock-in.

<br/>

[![npm](https://img.shields.io/npm/v/@moku-labs/common?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/@moku-labs/common)
[![types](https://img.shields.io/badge/types-included-3178c6?logo=typescript&logoColor=white)](#requirements)
[![browser entry](https://img.shields.io/badge/browser%20entry-node--free-2da44e)](#entry-points)
[![node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](#requirements)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

<br/>

[Install](#install) ·
[Catalog](#catalog) ·
[Usage](#usage) ·
[Entry points](#entry-points) ·
[Scripts](#scripts)

</div>

---

## Install

```sh
bun add @moku-labs/common @moku-labs/core
```

> [!NOTE]
> **Status: `0.x` — early.** The catalog is small and growing. The plugins are built on `@moku-labs/core`; install it alongside (your framework already depends on it).

## Why @moku-labs/common

- **Write once, reuse everywhere.** Cross-cutting plugins (logging, env, …) live here instead of being copy-pasted into every Moku framework.
- **A catalog, not a framework.** No `createApp`, no defaults of its own. You import plugin objects and register them in *your* framework's `createCoreConfig`.
- **Core plugins.** Everything here is built with `createCorePlugin`, so a plugin's API is injected onto every plugin's context (`ctx.log`, `ctx.env`) — framework-agnostic by construction.
- **The `/browser` entry is guaranteed node-free.** A client-safe subset whose static import graph references zero node modules, enforced by a CI gate.

## Catalog

| Export | Kind | Responsibility |
|---|---|---|
| [`logPlugin`](src/plugins/log/README.md) | core plugin | Always-on in-memory trace + an `expect()` event-trace DSL for testable workflows. Injected as `ctx.log`. |
| [`envPlugin`](src/plugins/env/README.md) | core plugin | Multi-provider environment / secret injection, validated and frozen at `onInit`, with `PUBLIC_` cross-validation. Exposed as `ctx.env`. |
| `dotenv` · `processEnv` · `cloudflareBindings` | env providers (Node) | Resolve env from `.env` files / `process.env` / Cloudflare bindings. Import `node:fs`. |
| `browserEnv` | env provider (browser) | Reads `import.meta.env` + `globalThis.__ENV__`. Zero `node:*`. |
| [`createBrandConsole` · `createBrandPrompts` · `brandedSink`](src/cli/README.md) | CLI kit (Node) | The family's branded terminal renderer — console / prompts / log-sink + ANSI primitives. Imported from `@moku-labs/common/cli`. |
| `Log` · `Env` | type namespaces | `Log.LogApi`, `Env.EnvConfig`, … |

## Usage

Register the plugins in your framework's `createCoreConfig` — their APIs are then injected onto every plugin's context:

```ts
// my-framework/config.ts
import { createCoreConfig } from "@moku-labs/core";
import { envPlugin, logPlugin } from "@moku-labs/common";

type Config = { /* … */ };
type Events = { /* … */ };

export const coreConfig = createCoreConfig<Config, Events, [typeof logPlugin, typeof envPlugin]>(
  "my-framework",
  {
    config: { /* … */ },
    plugins: [logPlugin, envPlugin] // ctx.log + ctx.env on every plugin
  }
);
```

Supply the `env` provider that matches each target:

```ts
import { dotenv, processEnv } from "@moku-labs/common"; // Node
import { browserEnv } from "@moku-labs/common/browser"; // browser (node-free)
```

## Entry points

| Entry | Format | For | Includes |
|---|---|---|---|
| **`@moku-labs/common`** | dual ESM + CJS | Node | the full catalog, incl. the Node env providers (`dotenv` / `processEnv` / `cloudflareBindings`) |
| **`@moku-labs/common/cli`** | dual ESM + CJS | Node CLIs | the branded CLI kit — `createBrandConsole`, `createBrandPrompts`, `brandedSink`, and the ANSI primitives |
| **`@moku-labs/common/browser`** | ESM-only | client bundles | `logPlugin`, `envPlugin`, `browserEnv` and the `Log` / `Env` types — **with all node-only code excluded** |

Importing `@moku-labs/common/browser` can **never** drag `node:*` code into a client bundle, regardless of bundler or tree-shaking — its static import graph references zero node-only modules. CI proves it:

```sh
bun run check:bundle   # asserts: zero static node imports + under the gzip budget
```

## Scripts

```sh
bun run build              # build with tsdown (dual ESM+CJS + ESM-only browser entry)
bun run test               # all tests (vitest)
bun run test:unit          # unit tests only
bun run test:integration   # integration tests only
bun run test:coverage      # tests with coverage (90% threshold)
bun run lint               # biome check + eslint
bun run lint:fix           # auto-fix lint issues
bun run format             # format with biome
bun run validate           # publint + attw — verify the package export map
bun run check:bundle       # assert the browser bundle is node-free + under the gzip budget
```

## Requirements

- **Node `>= 24`** and **Bun `>= 1.3.14`** — use `bun` exclusively (never npm/yarn/pnpm).
- **TypeScript** in strict mode, with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- **[`@moku-labs/core`](https://github.com/moku-labs/core)** — the micro-kernel the plugins are built on.

## License

[MIT](./LICENSE) © [moku-labs](https://github.com/moku-labs)
