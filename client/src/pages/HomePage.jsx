import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { ProductCard } from "../components/ProductCard.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ErrorState } from "../components/ErrorState.jsx";
import { useProducts } from "../hooks/useProducts.js";

export function HomePage() {
  const { products, loading, error } = useProducts();
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">Nieuwe collectie</span>
          <h1>Rembro</h1>
          <p>Een moderne webshop met zorgvuldig geselecteerde essentials voor werk, wonen en onderweg.</p>
          <Link to="/shop" className="primary-link">Bekijk producten</Link>
        </div>
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80"
          alt="Moderne winkelbalie met verpakte producten"
        />
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Uitgelicht</span>
          <h2>Populaire producten</h2>
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="product-grid">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="benefits">
        <div>
          <Truck size={24} />
          <h3>Snelle levering</h3>
          <p>Bestellingen worden zorgvuldig verwerkt en snel verzonden.</p>
        </div>
        <div>
          <PackageCheck size={24} />
          <h3>Direct uit voorraad</h3>
          <p>Actuele voorraadstatus per product, helder en zonder gedoe.</p>
        </div>
        <div>
          <CheckCircle2 size={24} />
          <h3>Eenvoudig bestellen</h3>
          <p>Een korte checkout en je order staat direct in de database.</p>
        </div>
      </section>
    </>
  );
}
