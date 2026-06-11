import React from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export function CartPage() {
  const { items, totals, updateQuantity, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="section narrow">
        <div className="state-panel">
          <h1>Je winkelwagen is leeg</h1>
          <p>Bekijk de shop en voeg een product toe om verder te gaan.</p>
          <Link to="/shop" className="primary-link">Naar de shop</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Winkelwagen</span>
        <h1>Je bestelling</h1>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <article className="cart-row" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{formatPrice(item.price)} per stuk</p>
              </div>
              <input
                type="number"
                min="1"
                max={item.stock}
                value={item.quantity}
                onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                aria-label={`Aantal ${item.name}`}
              />
              <strong>{formatPrice(item.price * item.quantity)}</strong>
              <button type="button" className="icon-button" onClick={() => removeFromCart(item.id)} aria-label={`${item.name} verwijderen`}>
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
        <aside className="summary">
          <h2>Overzicht</h2>
          <div>
            <span>Subtotaal</span>
            <strong>{formatPrice(totals.totalPrice)}</strong>
          </div>
          <div>
            <span>Verzending</span>
            <strong>Gratis</strong>
          </div>
          <div className="summary-total">
            <span>Totaal</span>
            <strong>{formatPrice(totals.totalPrice)}</strong>
          </div>
          <Link to="/afrekenen" className="primary-link">Afrekenen</Link>
        </aside>
      </div>
    </section>
  );
}
