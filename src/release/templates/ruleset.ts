/**
 * @file `moku-release` — the branch ruleset `setup` applies to `main`.
 *
 * A VERBATIM copy of `moku-labs/ci`'s `rulesets/main.json`: PR-only main, no deletion, no
 * force-push, and the four required checks the thin `ci.yml` produces (`ci / lint`,
 * `ci / types`, `ci / test`, `ci / build`). Tags are deliberately NOT restricted — the
 * release workflow pushes `v*` tags, and a tag ruleset would block every release.
 */

/** Name the ruleset is created under in the central definition. */
export const MAIN_RULESET_NAME = "protect-main";

/** The ruleset payload for `gh api repos/{owner}/{repo}/rulesets --input -`. */
export const MAIN_RULESET_JSON = `{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "ci / lint" },
          { "context": "ci / types" },
          { "context": "ci / test" },
          { "context": "ci / build" }
        ]
      }
    }
  ]
}
`;
