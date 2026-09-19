import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "tests/unit/**/*.test.ts",
            "src/plugins/**/__tests__/unit/**/*.test.ts",
            "src/cli/__tests__/unit/**/*.test.ts",
            "src/release/__tests__/unit/**/*.test.ts"
          ]
        }
      },
      {
        test: {
          name: "integration",
          include: [
            "tests/integration/**/*.test.ts",
            "src/plugins/**/__tests__/integration/**/*.test.ts",
            "src/cli/__tests__/integration/**/*.test.ts",
            "src/release/__tests__/integration/**/*.test.ts"
          ]
        }
      }
    ],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.ts"],
      // `src/release/index.ts` is the bin: importing it runs the CLI, so it is measured
      // by running the commands it dispatches to, never by loading the entry itself.
      exclude: [
        "src/**/types.ts",
        "src/**/types/**",
        "src/**/__tests__/**",
        "src/release/index.ts"
      ],
      reporter: ["text", "lcov"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 }
    }
  }
});
