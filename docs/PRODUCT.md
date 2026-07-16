# Product

## Thesis

FireEmblemBuildHelper is a Fire Emblem build and run planner for testing legal unit paths, calculating their mechanical outcomes, and organizing a campaign around them.

The first supported game is Fire Emblem Fates / Fire Emblem if / FE14. The product is designed so later Fire Emblem games can be added without pretending their mechanics are interchangeable with Fates.

## Product Promise

Help a player answer two connected questions with trustworthy, explainable data:

1. Can I make this unit build in this game, route, and run?
2. What does choosing it cost, unlock, or constrain elsewhere in my run?

The tool should make its reasoning visible. It should show the relevant source facts and rules behind a result, not produce opaque recommendations.

## Audience

The initial audience is Fire Emblem players who enjoy planning builds and complete runs in detail, especially players working through Fates routes, difficulty modes, pairings, child units, seals, skills, and limited resources.

It should still be useful for a player who only wants to inspect a unit, class, skill, weapon, or support option without creating a full campaign plan.

## Planning Levels

### Unit Build Planning

A build is a sequence of choices, not only a final class and skill list. A player should be able to explore and preserve a path such as recruitment, class changes, promotions, skill pickups, weapon-rank goals, and its eventual result.

For each supported game, the planner should progressively help with:

- unit data, including bases, growths, caps, personal traits, availability, and game-specific data;
- class and skill access, including access granted through game-specific relationships or mechanics;
- legal build routes and their requirements;
- weapon-rank planning, including required weapon uses or experience where the game models them;
- support options and their mechanical implications;
- child-unit availability, inheritance, growth, cap, class, and skill outcomes where the game has those systems;
- notes and rationale attached to a unit or build.

### Campaign Run Planning

A run plan brings individual builds into a campaign-level model. It represents the route, difficulty, roster intentions, pairings or equivalent relationships, and the limited resources that affect whether those builds fit together.

For each supported game, the planner should progressively help with:

- multiple saved plans or projects per user;
- route- and difficulty-specific priorities and constraints;
- build plans assigned to a run;
- pairing and child planning where applicable;
- soft warnings during drafting and stronger validation when a player finalizes a plan;
- planned purchases and campaign resources, such as seals, weapons, forges, staves, consumables, and gold, when the game's economy warrants modelling;
- player notes at the run, build, unit, and source-data levels.

## Fates First

Fire Emblem Fates is the first game because its class access, S-supports, child units, inheritance, route distinctions, and constrained Conquest economy make the value of a rules-aware planner especially clear.

Early Fates work should support the three routes, relevant regional/version differences, and source provenance as explicit data dimensions. The application must not generalize Fates mechanics into universal Fire Emblem rules merely because Fates is implemented first.

## Product Principles

### Curated data is authoritative

The application is powered by carefully curated, validated game data. Imported spreadsheets, guides, and other sources must retain provenance. Derived data and planning results should be traceable back to their inputs.

### Explainable over magical

Warnings, calculations, and suggestions should explain the conditions that produced them. The user should be able to tell whether a result is certain, conditional, incomplete, or based on a selected assumption.

### Draft freely, validate deliberately

Players should be allowed to sketch messy, contradictory ideas while planning. The tool should flag conflicts without making exploration unpleasant, then offer stricter validation for a finalized plan.

### Respect game-specific rules

Each game implementation owns its mechanics, terminology, data dimensions, and calculations. Shared platform code may support common concepts, but it must not erase meaningful differences between games.

### Local and durable by default

Player-created notes and plans should persist in the browser and remain useful without requiring an online account. Because clearing site data can remove browser-local plans, the app must make that risk highly visible and provide versioned JSON export/import for backup before it is presented as a publicly usable planner. It should also provide a separate, human-readable text summary for players who want to read or keep their plan outside the app. Cloud infrastructure is not a prerequisite for planning.

### AI assists; it does not establish facts

Future AI features may explain validated data, summarize notes, format a guide, or identify possible plan conflicts. They must not silently invent game facts or replace the curated dataset as the source of truth.

## Initial Product Shape

The first working slices should establish the foundation in this order:

1. Profiles and local notes, proving persistence, API behavior, and multilingual text handling.
2. A repeatable Fates data-import and validation pipeline, beginning with a small, inspectable data area.
3. A static viewer for imported Fates characters, classes, skills, weapons, and route information.
4. Ordered Fates build plans with route, difficulty, goals, steps, and notes.
5. Fates run plans that collect builds, pairings, and campaign priorities.
6. Fates-specific validation for pairing conflicts, child planning, inheritance, and eventually constrained resources.

## Boundaries for Now

This is not initially a combat simulator, a complete Fire Emblem wiki, an optimizer that claims one objectively best build, or a substitute for source-data curation.

The product may grow toward those areas when its data and rules are strong enough, but early work should favor reliable planning slices over breadth.
