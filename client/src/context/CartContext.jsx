import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

function normalizeItem(product, quantity = 1) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
    quantity
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("webshop-cart");
    return stored ? JSON.parse(stored) : [];
  });

  function persist(nextItems) {
    setItems(nextItems);
    localStorage.setItem("webshop-cart", JSON.stringify(nextItems));
  }

  function addToCart(product, quantity = 1) {
    const nextItems = [...items];
    const existing = nextItems.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      nextItems.push(normalizeItem(product, Math.min(quantity, product.stock)));
    }
    persist(nextItems);
  }

  function updateQuantity(productId, quantity) {
    const nextItems = items
      .map((item) => item.id === productId ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) } : item)
      .filter((item) => item.quantity > 0);
    persist(nextItems);
  }

  function removeFromCart(productId) {
    persist(items.filter((item) => item.id !== productId));
  }

  function clearCart() {
    persist([]);
  }

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return { itemCount, totalPrice };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, totals, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart moet binnen CartProvider gebruikt worden.");
  return context;
}
