import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import SkillIndexPage from "./games/fe14/pages/SkillIndexPage";
import PersonalSkillIndexPage from "./games/fe14/pages/PersonalSkillIndexPage";
import UnitDetailPage from "./games/fe14/pages/UnitDetailPage";
import UnitIndexPage from "./games/fe14/pages/UnitIndexPage";
import WeaponItemDirectoryPage from "./games/fe14/pages/WeaponItemDirectoryPage";
import {
  Fe6ClassIndexPage,
  Fe6UnitDetailPage,
  Fe6UnitIndexPage,
  Fe6WeaponItemDirectoryPage,
} from "./games/fe6/components/Fe6Views";
import { useAppRoute } from "./router";
import { LocaleProvider } from "./i18n/LocaleContext";
import { trackPageView } from "./analytics";
import { useEffect } from "react";

export default function App() {
  const route = useAppRoute();

  useEffect(() => {
    trackPageView(route);
  }, [route]);

  return (
    <LocaleProvider>
      <div className="app-shell">
        <AppHeader route={route} />
        {route.kind === "home" ? <HomePage /> : null}
        {route.kind === "notes" ? <NotesPage /> : null}
        {route.kind === "skill-index" ? <SkillIndexPage /> : null}
        {route.kind === "personal-skill-index" ? <PersonalSkillIndexPage /> : null}
        {route.kind === "weapon-item-directory" && route.gameId === "fe14" ? <WeaponItemDirectoryPage /> : null}
        {route.kind === "weapon-item-directory" && route.gameId === "fe6" ? <Fe6WeaponItemDirectoryPage /> : null}
        {route.kind === "unit-index" && route.gameId === "fe14" ? <UnitIndexPage /> : null}
        {route.kind === "unit-index" && route.gameId === "fe6" ? <Fe6UnitIndexPage /> : null}
        {route.kind === "unit-detail" && route.gameId === "fe14" ? <UnitDetailPage slug={route.slug} /> : null}
        {route.kind === "unit-detail" && route.gameId === "fe6" ? <Fe6UnitDetailPage slug={route.slug} /> : null}
        {route.kind === "class-index" ? <Fe6ClassIndexPage /> : null}
        {route.kind === "not-found" ? <Fe6UnitIndexPage notFound /> : null}
      </div>
    </LocaleProvider>
  );
}
