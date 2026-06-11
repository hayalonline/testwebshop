import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-image-link">
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <span className="category">{product.category}</span>
        <Link to={`/product/${product.slug}`} className="product-title">{product.name}</Link>
        <p>{product.description}</p>
        <div className="product-card-actions">
          <strong>{formatPrice(product.price)}</strong>
          <button type="button" onClick={() => addToCart(product)} disabled={product.stock === 0}>
            <ShoppingCart size={18} />
            Toevoegen
          </button>
        </div>
      </div>
    </article>
  );
}
