import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import SkillIndexPage from "./games/fe14/pages/SkillIndexPage";
import PersonalSkillIndexPage from "./games/fe14/pages/PersonalSkillIndexPage";
import UnitDetailPage from "./games/fe14/pages/UnitDetailPage";
import UnitIndexPage from "./games/fe14/pages/UnitIndexPage";
import { useAppRoute } from "./router";
import { LocaleProvider } from "./i18n/LocaleContext";

export default function App() {
  const route = useAppRoute();

  return (
    <LocaleProvider>
      <div className="app-shell">
        <AppHeader route={route} />
        {route.kind === "home" ? <HomePage /> : null}
        {route.kind === "notes" ? <NotesPage /> : null}
        {route.kind === "skill-index" ? <SkillIndexPage /> : null}
        {route.kind === "personal-skill-index" ? <PersonalSkillIndexPage /> : null}
        {route.kind === "unit-index" ? <UnitIndexPage /> : null}
        {route.kind === "unit-detail" ? <UnitDetailPage slug={route.slug} /> : null}
        {route.kind === "not-found" ? <UnitIndexPage notFound /> : null}
      </div>
    </LocaleProvider>
  );
}
