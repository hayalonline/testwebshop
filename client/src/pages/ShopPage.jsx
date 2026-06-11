import React from "react";
import { ProductCard } from "../components/ProductCard.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ErrorState } from "../components/ErrorState.jsx";
import { useProducts } from "../hooks/useProducts.js";

export function ShopPage() {
  const { products, loading, error } = useProducts();

  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Shop</span>
        <h1>Alle producten</h1>
        <p>Kies uit praktische producten voor dagelijks gebruik.</p>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </section>
  );
}
