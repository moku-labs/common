/**
 * @file `moku-release` — the `.github/workflows/publish.yml` template.
 *
 * A VERBATIM copy of `moku-labs/ci`'s `examples/package/publish.yml`. The FILE NAME is the
 * contract: npm Trusted Publishing validates the CALLING workflow's filename, so this file
 * must stay `publish.yml` even though the publish itself happens inside the central
 * reusable workflow. There is no `NPM_TOKEN` anywhere — `id-token: write` is the whole
 * credential.
 */

/** Repo-relative path this template is written to. Registered with npm — never rename it. */
export const PUBLISH_WORKFLOW_PATH = ".github/workflows/publish.yml";

/**
 * The reusable workflow ref `doctor` recognizes a migrated `publish.yml` by. The
 * `publish.local-publish.yml` fallback variant calls the same ref, so it is recognized too.
 */
export const PUBLISH_WORKFLOW_REF = "moku-labs/ci/.github/workflows/package-release.yml@v1";

/** The rendered `publish.yml` body — byte-identical to the central example. */
export const PUBLISH_WORKFLOW = `name: Release

# Thin caller. The FILENAME is a contract: npm Trusted Publishing is registered against
# "publish.yml" for this repo — renaming it breaks tokenless publishing.
on:
  workflow_dispatch:
    inputs:
      release_type:
        description: Semver bump for this release
        type: choice
        required: true
        options: [patch, minor, major, prerelease]
  release:
    types: [published]

# Distinct literal group ("publish-…") — NOT github.workflow. The reused package-ci.yml
# computes its group from the CALLER's github.workflow = "Release", i.e. "Release-<ref>".
# If this run also used "Release-<ref>" it would hold that slot for its whole duration while
# its own child waits for the same slot → deadlock, and the reusable workflow never starts.
concurrency:
  group: publish-\${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: read # least privilege at the top; the release job elevates below

jobs:
  release:
    uses: moku-labs/ci/.github/workflows/package-release.yml@v1
    # A called workflow can NEVER elevate beyond what the caller grants. These two are the
    # ceiling for the whole pipeline; inside, each job takes only the one it needs.
    permissions:
      contents: write # release job: push refs/tags/* + create the GitHub release
      id-token: write # publish job: tokenless OIDC Trusted Publishing
    with:
      release_type: \${{ inputs.release_type }}
`;
