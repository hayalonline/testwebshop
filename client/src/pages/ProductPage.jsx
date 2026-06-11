import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { api } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import { LoadingState } from "../components/LoadingState.jsx";
import { ErrorState } from "../components/ErrorState.jsx";

export function ProductPage() {
  const { slugOrId } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProduct(slugOrId)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <section className="product-detail">
      <img src={product.image} alt={product.name} />
      <div className="product-detail-content">
        <Link to="/shop" className="back-link">Terug naar shop</Link>
        <span className="category">{product.category}</span>
        <h1>{product.name}</h1>
        <strong className="detail-price">{formatPrice(product.price)}</strong>
        <p>{product.description}</p>
        <p className={product.stock > 0 ? "stock available" : "stock unavailable"}>
          {product.stock > 0 ? `${product.stock} op voorraad` : "Niet op voorraad"}
        </p>
        <button type="button" className="primary-button" onClick={() => addToCart(product)} disabled={product.stock === 0}>
          <ShoppingCart size={20} />
          Toevoegen aan winkelwagen
        </button>
      </div>
    </section>
  );
}
