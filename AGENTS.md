# AGENTS.md

## Purpose

This file gives Codex basic operating rules for this repo.

Keep work small, explicit, and reviewable.

## Repo identity

This repo is `FireEmblemBuildHelper`.

`FireEmblemBuildHelper` is a Fire Emblem planning project. The first supported game is Fire Emblem Fates / Fire Emblem if / FE14.

The current implementation direction is Node + TypeScript with SQLite-backed local data. Do not switch languages, frameworks, package managers, or storage engines unless the user explicitly asks.

## Core rule

Do only the requested task.

Do not expand scope.

Do not make product, architecture, dependency, or framework decisions unless asked.

Before starting each new version or feature, ask the user whether the work should be done on a new branch.

When the user asks to commit, read `docs/codex-prompts/templates/post-verification-commit-merge.md` before taking git actions.

## FE14 project guidance

Support FE14/Fates first. Do not generalize FE14 mechanics to other Fire Emblem games unless explicitly requested.

Treat route, version, region, and source as first-class data dimensions. FE14 work may need to distinguish Birthright, Conquest, Revelation, DLC, localized names, Japanese names, and source provenance.

Prefer stable canonical IDs for units, classes, skills, weapons, routes, supports, children, availability constraints, and other game concepts. Display names can change; IDs should not.

Keep raw source files, normalized seed data, generated reports, and runtime database files separate.

Preserve UTF-8 text. Watch for mojibake when touching Japanese, Chinese, or localized game data.

Add validation/reporting around imported spreadsheet or source data. One incorrect support, class, route, or availability flag can make planner output misleading.

## File-reading discipline

Before reading files, decide whether the task actually requires it.

For simple filesystem tasks, do not inspect unrelated files.

Read the smallest number of files needed to complete the task.

When scanning repo context, exclude generated output and dependency folders. Do not treat `docs/codex-prompts/` as source code unless the task involves prompt archives or commit workflow prompts.

## Node workspace discipline

Do not inspect `node_modules/`, generated output, coverage, local database files, or `*.tsbuildinfo`.

Do not search dependency source or `node_modules/*/package.json` unless debugging dependency behavior.

Read the root `package.json` only when the task involves scripts, dependencies, tooling, builds, or workspace configuration.

Prefer `npm ls`, `npm explain`, and package documentation over scanning dependency files.

Do not read `package-lock.json` manually unless resolving dependency or lockfile issues.

Run the narrowest relevant script. Do not run every command for a local change unless shared behavior is affected.

## Editing discipline

Change only files needed for the task.

Do not perform drive-by refactors.

Do not add dependencies unless explicitly asked.

Do not initialize package managers unless explicitly asked.

Do not generate large docs unless explicitly asked.

If asked to create empty files, create empty files only.

## Experiments

Anything under `experiments/` is non-MVP experimental space unless explicitly promoted later.

Do not let experimental ideas leak into main project structure without user approval.

## Response style

After changes, respond briefly with:

* changed paths
* what changed
* commands run, if any

Do not paste full file contents unless asked.
