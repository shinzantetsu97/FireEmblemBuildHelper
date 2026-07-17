import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import UnitDirectory from "../components/units/directory/UnitDirectory";

export default function UnitIndexPage({ notFound = false }: { notFound?: boolean }) {
  return (
    <main>
      <Container className="data-main" fluid="lg">
        {notFound ? (
          <Alert variant="warning">That page is not part of the current FE14 data slice.</Alert>
        ) : null}

        <UnitDirectory />
      </Container>
    </main>
  );
}
