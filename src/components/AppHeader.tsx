import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { BookOpen, Languages, StickyNote } from "lucide-react";
import { AppLink, type AppRoute } from "../router";
import { useLocale } from "../i18n/LocaleContext";
import { LOCALE_LABELS, LOCALES } from "../i18n/locale";

const FE14_ROUTE_KINDS: AppRoute["kind"][] = [
  "unit-index",
  "unit-detail",
  "skill-index",
  "personal-skill-index",
];

export default function AppHeader({ route }: { route: AppRoute }) {
  const fe14Active = FE14_ROUTE_KINDS.includes(route.kind);
  const { locale, setLocale, t } = useLocale();

  return (
    <Navbar className="app-header" expand="md">
      <Container fluid="lg">
        <AppLink className="navbar-brand app-brand" to="/">
          FireEmblemBuildHelper
        </AppLink>
        <Navbar.Toggle aria-controls="primary-navigation" />
        <Navbar.Collapse id="primary-navigation">
          <Nav className="ms-auto app-navigation">
            <AppLink className={`nav-link${route.kind === "notes" ? " active" : ""}`} to="/Notes">
              <StickyNote aria-hidden="true" size={17} />
              {t("nav.notes")}
            </AppLink>
            <NavDropdown
              id="fe14-menu"
              className={`app-fe14-menu${fe14Active ? " active" : ""}`}
              title={
                <span className="app-fe14-menu-title">
                  <BookOpen aria-hidden="true" size={17} />
                  {t("nav.fe14")}
                </span>
              }
            >
              <NavDropdown.Item as={AppLink} to="/FE14/Units" active={route.kind === "unit-index" || route.kind === "unit-detail"}>
                {t("nav.units")}
              </NavDropdown.Item>
              <NavDropdown.Item as={AppLink} to="/FE14/Skills" active={route.kind === "skill-index"}>
                {t("nav.classSkills")}
              </NavDropdown.Item>
              <NavDropdown.Item as={AppLink} to="/FE14/PersonalSkills" active={route.kind === "personal-skill-index"}>
                {t("nav.personalSkills")}
              </NavDropdown.Item>
            </NavDropdown>
            <Dropdown align="end" className="app-language-menu">
              <Dropdown.Toggle
                variant="link"
                className="nav-link app-language-toggle"
                id="language-menu"
                aria-label={t("language.menuLabel")}
              >
                <Languages aria-hidden="true" size={17} />
                {LOCALE_LABELS[locale]}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {LOCALES.map((option) => (
                  <Dropdown.Item
                    key={option}
                    active={option === locale}
                    onClick={() => setLocale(option)}
                  >
                    {LOCALE_LABELS[option]}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
