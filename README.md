# FireEmblemBuildHelper

FireEmblemBuildHelper is a Fire Emblem build and run planning project. Fire Emblem Fates / Fire Emblem if / FE14 is the first planned game ruleset.

The current working slice is a static React notes workspace. Notes are stored in browser-local IndexedDB, so they remain after reloads in the same browser but can be lost when site data is cleared. Use the JSON backup action to protect or move a workspace; the text export is a human-readable reference only.

## Development

```text
npm install
npm run dev
```

The Vite development server prints a local URL. Build the static site with:

```text
npm run build
```

## GitHub Pages

The included GitHub Actions workflow builds and deploys the site from `main` to GitHub Pages. In the repository's **Settings -> Pages**, select **GitHub Actions** as the publishing source. After a successful deployment, the default project-site URL is:

```text
https://shinzantetsu97.github.io/FireEmblemBuildHelper/
```

The app remains static and browser-local when deployed. Each visitor's notes stay in that visitor's browser unless they export a JSON backup.

## Existing Development Tooling

`npm run db:init` initializes the earlier SQLite development database at `data/app.db`. The public notes workspace does not use that database or a backend API.

## Data Folders

- `data/raw` will later hold source files such as spreadsheets and documents.
- `data/seed` will later hold generated seed JSON.
- `data/reports` will later hold parser and validation reports.
