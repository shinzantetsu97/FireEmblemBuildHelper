import Container from "react-bootstrap/Container";
import GameLibrary from "../components/home/GameLibrary";
import VersionLog from "../components/home/VersionLog";

export default function HomePage() {
  return (
    <main>
      <Container className="home-main" fluid="lg">
        <header className="home-heading">
          <p className="eyebrow">Fire Emblem planning</p>
          <h1>FireEmblemBuildHelper</h1>
          <p>Curated game data and browser-local planning tools.</p>
        </header>

        <GameLibrary />
        <VersionLog />
      </Container>
    </main>
  );
}
