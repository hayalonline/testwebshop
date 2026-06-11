import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export function Layout({ children }) {
  const { totals } = useCart();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand">Nordlane</Link>
        <nav className="main-nav" aria-label="Hoofdnavigatie">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="header-actions">
          <NavLink to="/admin" className="cart-link admin-header-link">Admin</NavLink>
          <Link to="/winkelwagen" className="cart-link" aria-label="Winkelwagen">
            <ShoppingBag size={20} />
            <span>{totals.itemCount}</span>
            <strong>{formatPrice(totals.totalPrice)}</strong>
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div>
          <strong>Nordlane</strong>
          <p>Praktische producten voor dagelijks gebruik, zorgvuldig geselecteerd.</p>
        </div>
        <div>
          <span>info@nordlane.test</span>
          <span>+31 20 123 4567</span>
        </div>
      </footer>
    </div>
  );
}
