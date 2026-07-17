import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import UnitDetailPage from "./pages/UnitDetailPage";
import UnitIndexPage from "./pages/UnitIndexPage";
import { useAppRoute } from "./router";

export default function App() {
  const route = useAppRoute();

  return (
    <div className="app-shell">
      <AppHeader route={route} />
      {route.kind === "home" ? <HomePage /> : null}
      {route.kind === "notes" ? <NotesPage /> : null}
      {route.kind === "unit-index" ? <UnitIndexPage /> : null}
      {route.kind === "unit-detail" ? <UnitDetailPage slug={route.slug} /> : null}
      {route.kind === "not-found" ? <UnitIndexPage notFound /> : null}
    </div>
  );
}
