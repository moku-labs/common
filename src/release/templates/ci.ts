/**
 * @file `moku-release` — the `.github/workflows/ci.yml` template.
 *
 * A VERBATIM copy of `moku-labs/ci`'s `examples/package/ci.yml`. It is a thin caller: the
 * whole check matrix lives once in the central reusable workflow, so a pipeline change is
 * one PR there instead of one per repository. Two details are load-bearing and must not be
 * "tidied": the caller job id is `ci` (GitHub prefixes the reused jobs with it, so the
 * required checks are `ci / lint`, `ci / types`, `ci / test`, `ci / build`), and there is
 * deliberately NO concurrency block — the called workflow already groups by
 * `github.workflow`, and a caller group with the same value deadlocks against its own child.
 */

/** Repo-relative path this template is written to. */
export const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";

/** The reusable workflow ref `doctor` recognizes a migrated `ci.yml` by. */
export const CI_WORKFLOW_REF = "moku-labs/ci/.github/workflows/package-ci.yml@v1";

/** The rendered `ci.yml` body — byte-identical to the central example. */
export const CI_WORKFLOW = `name: CI

# Thin caller. All logic lives in moku-labs/ci, pinned to the moving @v1 major tag.
# Required status checks land as "ci / lint", "ci / types", "ci / test", "ci / build"
# (GitHub prefixes a reusable workflow's jobs with the CALLER's job id) — see rulesets/main.json.
on:
  push:
    branches: [main]
  pull_request:
  # No \`workflow_call:\` needed — publish.yml reaches the same checks through
  # package-release.yml, which calls package-ci.yml itself.

# NO concurrency block here on purpose: package-ci.yml already scopes its group by
# github.workflow (= this workflow's name), and a caller group with the same value would
# deadlock against its own child.

permissions:
  contents: read

jobs:
  ci:
    uses: moku-labs/ci/.github/workflows/package-ci.yml@v1
`;
