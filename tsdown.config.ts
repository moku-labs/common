import { defineConfig } from "tsdown";

// Two INDEPENDENT build passes (not two entries in one pass). A single pass would
// let rolldown merge both graphs into one shared chunk — and because the `.` entry
// reaches the node-only env providers (dotenv/processEnv/cloudflareBindings, which
// import `node:fs`), that shared chunk would carry `node:` code that `./browser`
// would then import wholesale. Building each entry on its own keeps `browser.*`
// computed from a graph that never references the node-only module. `clean` runs on
// the first pass only, so the browser pass does not wipe the index output.
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    tsconfig: "tsconfig.build.json"
  },
  {
    // ESM-only. A CJS browser build is meaningless: browsers/bundlers consume ESM,
    // and `import.meta.env` (browserEnv) becomes `{}` under CJS. The `.` entry stays
    // dual (esm+cjs) for Node consumers.
    entry: { browser: "src/browser.ts" },
    format: ["esm"],
    dts: true,
    clean: false,
    sourcemap: false,
    tsconfig: "tsconfig.build.json"
  }
]);
