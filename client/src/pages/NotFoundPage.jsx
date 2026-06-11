import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="section narrow">
      <div className="state-panel">
        <h1>Pagina niet gevonden</h1>
        <Link to="/" className="primary-link">Terug naar home</Link>
      </div>
    </section>
  );
}
