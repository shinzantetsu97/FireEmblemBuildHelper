import { ChevronRight } from "lucide-react";
import { AppLink } from "../../router";

export default function GameLibrary() {
  return (
    <section className="home-games" aria-labelledby="game-library-heading">
      <div className="home-section-heading">
        <p className="eyebrow">Game data</p>
        <h2 id="game-library-heading">Game Library</h2>
      </div>
      <AppLink className="game-directory-link" to="/FE14/Units">
        <div>
          <span>FE14</span>
          <h3>Fire Emblem If / Fates</h3>
          <p>First-generation unit data and JSON visualizer</p>
        </div>
        <ChevronRight aria-hidden="true" size={20} />
      </AppLink>
    </section>
  );
}
