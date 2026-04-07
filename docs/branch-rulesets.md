# Protecting Important Branches with GitHub Rulesets

This repository includes a starter ruleset template at:

- `.github/rulesets/critical-branches.json`

## What this template protects

It enforces the following for critical branches (`main`, `production`, and default branch):

1. No branch deletion.
2. No force pushes.
3. Linear history required.
4. Pull-request-based changes with review requirements.
5. Required status checks before merge.

## Apply via GitHub CLI

From your local machine (authenticated with `gh auth login`), run:

```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/rulesets \
  --input .github/rulesets/critical-branches.json
```

Replace `OWNER/REPO` with your repository path.

## Update required checks

Before applying, edit the `required_status_checks` section to match your real CI job names.

Current placeholders:

- `deploy-preview`
- `html-validate`

If these checks do not exist in your repo, merges will be blocked.
