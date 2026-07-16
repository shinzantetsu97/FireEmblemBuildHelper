import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { BookOpen, StickyNote } from "lucide-react";
import { AppLink, type AppRoute } from "../router";

export default function AppHeader({ route }: { route: AppRoute }) {
  const unitsActive = route.kind === "unit-index" || route.kind === "unit-detail";

  return (
    <Navbar className="app-header" expand="md">
      <Container fluid="lg">
        <AppLink className="navbar-brand app-brand" to="/">
          FireEmblemBuildHelper
        </AppLink>
        <Navbar.Toggle aria-controls="primary-navigation" />
        <Navbar.Collapse id="primary-navigation">
          <Nav className="ms-auto app-navigation">
            <AppLink className={`nav-link${route.kind === "notes" ? " active" : ""}`} to="/">
              <StickyNote aria-hidden="true" size={17} />
              Notes
            </AppLink>
            <AppLink className={`nav-link${unitsActive ? " active" : ""}`} to="/FE14/Units">
              <BookOpen aria-hidden="true" size={17} />
              FE14 Units
            </AppLink>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
