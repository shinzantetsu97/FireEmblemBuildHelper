import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

export type AppRoute =
  | { kind: "home" }
  | { kind: "notes" }
  | { kind: "skill-index" }
  | { kind: "personal-skill-index" }
  | { kind: "unit-index" }
  | { kind: "unit-detail"; slug: string }
  | { kind: "not-found" };

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const handleLocationChange = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  return route;
}

export function AppLink({
  children,
  className,
  to,
  ...props
}: {
  children: ReactNode;
  className?: string;
  to: string;
  [key: string]: unknown;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", toAppHref(to));
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <a {...props} className={className} href={toAppHref(to)} onClick={handleClick}>
      {children}
    </a>
  );
}

export function toAppHref(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path === "/" ? "/" : path}`;
}

function parseRoute(pathname: string): AppRoute {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;

  if (normalized === "/") {
    return { kind: "home" };
  }
  if (normalized.toLowerCase() === "/notes") {
    return { kind: "notes" };
  }
  if (normalized.toLowerCase() === "/fe14/units") {
    return { kind: "unit-index" };
  }
  if (normalized.toLowerCase() === "/fe14/skills") {
    return { kind: "skill-index" };
  }
  if (normalized.toLowerCase() === "/fe14/personalskills") {
    return { kind: "personal-skill-index" };
  }

  const detailMatch = normalized.match(/^\/fe14\/units\/([^/]+)$/i);
  if (detailMatch) {
    return { kind: "unit-detail", slug: decodeURIComponent(detailMatch[1]) };
  }

  return { kind: "not-found" };
}
