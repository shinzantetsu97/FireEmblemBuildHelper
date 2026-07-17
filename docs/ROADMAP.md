# Roadmap

## Purpose

This roadmap describes the intended sequence for FireEmblemBuildHelper. It is outcome-oriented, not a release contract: a phase may be split, reordered, or reduced when the data or implementation reveals a better path.

Fire Emblem Fates / Fire Emblem if / FE14 is the first supported game. Later games are a future direction, not a reason to flatten Fates-specific mechanics into generic assumptions.

## Current Direction

The product is moving toward a rules-aware Fire Emblem build and run planner. Its foundation is curated, validated game data; its user-facing value is helping players explore legal build paths and understand their campaign-wide consequences.

## Phase 1: Local Foundation

**Outcome:** A player can create and revisit browser-local planning space, understand how to protect it, and use a real frontend interaction.

- Establish the TypeScript and web-application baseline; retain existing Node tooling only where it supports development or data work.
- Create a browser-local profile and basic notes with create, read, update, and delete behavior.
- Persist user-created data with IndexedDB and preserve UTF-8 text through browser storage and UI boundaries.
- Establish the initial frontend shell and one working end-to-end interaction.
- Define browser-local ownership for multiple saved projects or run plans.
- Implement versioned JSON run-plan export/import as the first backup and portability path.
- Provide a separate human-readable text export for reference; it is not an import format.
- Make the risk of clearing site data highly visible in the planning experience.

**Not the goal:** Building a generic notes application or a hosted account system. Notes are a vertical slice and a future attachment point for units, builds, runs, pairings, and source-data review.

## Phase 2: Fates Data Foundation

**Outcome:** The project can turn curated Fates sources into trusted, inspectable application data.

- Inventory source spreadsheets, guides, and other inputs with their provenance and known limitations.
- Inspect source formats before committing to a parser design.
- Create a repeatable pipeline from raw source to normalized seed data.
- Start with a narrow, useful data area, such as weapons, classes, or skills, before parsing every Fates entity.
- Validate canonical IDs, aliases, references, localized names, routes, version or region dimensions, and suspicious values.
- Add explicit Unicode and mojibake checks to imports and generated files.
- Keep raw sources, normalized seeds, validation reports, and runtime data separate.

**Not the goal:** Treating a spreadsheet as automatically authoritative or shipping an unvalidated data dump.

## Phase 3: Fates Reference Viewer

**Outcome:** A player can browse the curated Fates data that will support planning.

- Render character, class, skill, weapon, and route information from normalized data.
- Show each fact in context, including route availability and relevant source provenance where useful.
- Make class access, support options, and other relationships discoverable.
- Provide a stable, readable frontend foundation for later planning screens.

**Not the goal:** A comprehensive Fire Emblem wiki or a combat simulator.

### Near-Term Mini-Refactor: Unit State and JSON Inspection

**Outcome:** Unit pages remain useful as reference pages while their interactive choices can grow into saved build configurations.

- Replace the full-page unit JSON tab with small **View JSON** and **Export JSON** actions near the unit-page header.
- Keep curated unit JSON read-only and separate from player selections; exporting a unit record is for inspection and data review, not for restoring a run plan.
- Move Corrin, offspring-parent, support, class, and other build-relevant selections behind a shared unit-configuration state boundary instead of leaving them isolated in page components.
- Preserve selections when navigating between unit pages or opening the JSON inspector.
- Prepare those configurations to be owned by a browser-local profile and run plan in IndexedDB, using stable unit and option IDs.
- Add schema versions and migration coverage before persisted unit configurations are treated as durable user data.

This refactor should establish the state and ownership boundary without prematurely building the complete Phase 4 planner.

## Phase 4: Fates Build Planner (MVP)

**Outcome:** A player can create a local Fates run plan, add unit builds, and understand whether their intended paths are legal for the selected route and difficulty.

- Create and switch between multiple locally saved Fates projects or run plans.
- Select a route and difficulty for a run plan.
- Add builds for characters with goals, priority, notes, and ordered steps.
- Persist each unit's selected configuration within its run plan, including applicable avatar settings, parentage, pairings, and class choices.
- Model an initial set of build steps: recruitment or availability, seals or class changes, promotions, and target skills.
- Explain validation results clearly: unavailable units, route restrictions, inaccessible classes, missing requirements, and invalid step order.
- Surface relevant weapon-rank requirements and, where data is ready, required weapon uses or experience.
- Allow drafting with incomplete plans; distinguish warnings from definitive invalid states.

**MVP boundary:** The planner must be useful for a complete individual build path. It does not yet need to resolve all pairings, calculate every child outcome, or balance the campaign economy.

## Phase 5: Fates Run Coordination

**Outcome:** A player can understand how separate build decisions compete or fit together inside one campaign.

- Associate builds, notes, and priorities with a shared run plan.
- Add planned pairings and relationship choices.
- Detect soft conflicts, such as one character appearing in multiple pairings.
- Support draft and finalized planning states, with stricter validation for the latter.
- Organize campaign-level goals, recruitment intentions, and build dependencies.

**Not the goal:** Solving every conflict automatically. The planner should make tradeoffs clear while leaving strategic choices to the player.

## Phase 6: Fates Rules Engine

**Outcome:** The planner can model the Fates-specific mechanics that make a campaign plan more than a collection of builds.

- Calculate child-unit availability and variable-parent outcomes.
- Model inheritance, class access, skill transfer, growth changes, and cap changes.
- Refine support and weapon-rank progression rules as reliable data becomes available.
- Add route-specific availability and timing constraints where they materially affect plans.
- Begin modelling Conquest's constrained economy: planned seals, weapons, forges, staves, consumables, and gold by campaign timing.
- Produce explainable warnings when a plan has incompatible assumptions or unrealistic resource demands.

## Phase 7: Data Quality and Authoring Tools

**Outcome:** Curated data becomes easier to maintain and audit as the project grows.

- Report missing localized names, duplicate IDs, broken references, suspicious values, and unresolved aliases.
- Compare imported data against guide material where practical.
- Support review notes and corrections tied to source facts.
- Improve import reports so data changes are easy to inspect before they reach users.

These tools may remain developer-facing or local-admin features until there is a reason to expose them broadly.

## Phase 8: Broader Fire Emblem Support and Assistance

**Outcome:** The platform can add other Fire Emblem games without compromising Fates correctness.

- Identify the shared platform concepts that genuinely transfer across games.
- Add another game only with its own documented mechanics, terminology, data model, and validation rules.
- Provide import/export and sharing options for local plans when they can remain durable and understandable.
- Consider AI-assisted explanation, summarization, checklist writing, and conflict review only on top of validated data.

AI assistance must not invent game facts or silently replace the curated data and rules engine as the source of truth.

## Working Principles

- Deliver vertical slices that a player can actually use, even when the surrounding architecture has future extension points.
- Keep data ingestion, validation, storage, API, and frontend responsibilities distinct.
- Prefer explicit assumptions and explanations to false precision.
- Treat Fates terminology and rules as game-specific unless evidence supports a shared abstraction.
- Keep the roadmap honest: update it when implementation learns something important.
