import type { AppRoute } from "./router";

// Vendor-agnostic telemetry choke point.
//
// Only page views are tracked, and only anonymous route paths leave the browser
// (never Notes content or any player-created data). Telemetry stays disabled
// unless VITE_UMAMI_WEBSITE_ID is provided at build time, so `npm run dev` and
// Vitest are no-ops by default.

interface UmamiTracker {
  track: (override?: (payload: Record<string, unknown>) => Record<string, unknown>) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const scriptSrc =
  (import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? "https://cloud.umami.is/script.js";

const enabled = Boolean(websiteId) && typeof document !== "undefined";

let ready = false;
const pending: string[] = [];

/**
 * Injects the Umami tracker once. Safe to call multiple times; no-ops when
 * telemetry is disabled or already initialized.
 */
export function initAnalytics(): void {
  if (!enabled || ready || document.querySelector("script[data-website-id]")) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = scriptSrc;
  script.dataset.websiteId = websiteId;
  // We drive page views manually (custom SPA router), and honor browser DNT.
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.addEventListener("load", () => {
    ready = true;
    for (const url of pending.splice(0)) {
      sendPageView(url);
    }
  });
  document.head.appendChild(script);
}

/** Records a page view for the given route (queued until the tracker loads). */
export function trackPageView(route: AppRoute): void {
  if (!enabled) {
    return;
  }
  const url = pagePath(route);
  if (ready) {
    sendPageView(url);
  } else {
    pending.push(url);
  }
}

function sendPageView(url: string): void {
  window.umami?.track((payload) => ({ ...payload, url }));
}

/** Maps an app route to a stable, base-independent analytics path. */
function pagePath(route: AppRoute): string {
  switch (route.kind) {
    case "home":
      return "/";
    case "notes":
      return "/notes";
    case "unit-index":
      return "/fe14/units";
    case "unit-detail":
      return `/fe14/units/${route.slug}`;
    case "skill-index":
      return "/fe14/skills";
    case "personal-skill-index":
      return "/fe14/personalskills";
    case "not-found":
      return "/404";
  }
}
