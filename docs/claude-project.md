# How Claude works on this repo

This repo has no claude.ai Project of its own. Claude reaches it from two of
Erik's other Claude Projects, and from local sessions on Erik's Mac. This page
records that setup so it can move to the Mac (T3 Code) without losing anything.

Snapshot taken 2026-11-27 from the repo, the other projects' setup docs and the
Mac. The claude.ai settings were not read directly: they come from the docs
linked below, which were read from the live projects on 2026-11-26.

## Who writes here

| Source | Lives in | When (Madrid time) | What it does here |
| --- | --- | --- | --- |
| Weekly catalogue enrichment | Claude Project "Peak Health" ([its doc](https://github.com/erikpr1994/peakhealth/blob/main/docs/agents/claude-project.md#scheduled-tasks)) | Thursday 05:00 | Works the open `new-exercise` issues and adds researched exercises on a `claude/catalogue-enrichment-<date>` branch, one PR. After the release, opens a catalogue sync PR in peakhealth. |
| Monthly agent docs prune (all projects) | Claude Project "Peak Health" | 28th, 10:17 | Prunes `CLAUDE.md` and opens a PR for Erik. Skips the repo after 60 days with no commit. |
| Weekly build-in-public refresh | Claude Project "Build in Public" ([its doc](https://github.com/erikpr1994/build-in-public/blob/main/docs/operations.md)) | Monday 09:47 | Reads the last week of merged PRs and releases as material for posts. Writes nothing here. |
| Local sessions | Erik's Mac, `~/Documents/Projects/open-exercise-db` | On demand | Hand fixes, for example PR #90. |

`new-exercise` issues come from athletes through the Peak Health app and from
the issue form in `.github/ISSUE_TEMPLATE/new-exercise.yml`.

## Config in the repo

- `CLAUDE.md`: the data invariants, release rules and working style. It is the
  only agent instruction file. There is no `AGENTS.md`.
- `.claude/settings.json`: only `deniedMcpServers`. It turns off the connectors
  this repo never needs: Gmail, Google Calendar, Google Drive, Kiwi.com,
  AllTrails, Revolut X, GoDaddy, AWS Marketplace, Composio, Neon, Kapso (both),
  Supabase, Vercel, PostHog, Linear, Sentry, PubMed, Peak Health, Lift track,
  Strava, Withings, and the local `garmin`, `hevy-mcp` and `trainingpeaks`
  servers. GitHub and web search stay on.
- No skills, hooks, subagents or `.mcp.json`.
- Checks run in git hooks (`lefthook.yml`: validate, tests and the issue form on
  commit, release compatibility on push) and in GitHub Actions (`ci.yml`,
  `auto-release.yml`, `release.yml`, Dependabot).

## Moving it to the Mac

The repo side needs no change: a local session reads `CLAUDE.md` and
`.claude/settings.json` the same way a cloud thread does. What lives outside the
repo, and must be recreated on the Mac before the claude.ai tasks are turned off:

1. The Thursday catalogue enrichment task. Its stored prompt is on claude.ai, in
   the Peak Health project. Copy it into a local scheduled task, then disable the
   claude.ai one.
2. The monthly docs prune. On the Mac it already exists as
   `~/.claude/scheduled-tasks/monthly-agent-docs-prune`, but that one covers
   peakhealth only. Add this repo to it, or keep the claude.ai task.
3. Web research. The enrichment run researches each exercise on the web. A local
   session needs web search and fetch allowed.
