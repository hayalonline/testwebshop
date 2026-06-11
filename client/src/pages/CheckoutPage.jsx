import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

const initialForm = {
  customerName: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: ""
};

export function CheckoutPage() {
  const { items, totals, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function validate() {
    const nextErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      if (!value.trim()) nextErrors[key] = "Dit veld is verplicht.";
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Vul een geldig e-mailadres in.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitOrder(event) {
    event.preventDefault();
    setApiError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const order = await api.createOrder({
        ...form,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      setSuccessOrder(order);
      clearCart();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (successOrder) {
    return (
      <section className="section narrow">
        <div className="state-panel success">
          <CheckCircle2 size={42} />
          <h1>Bestelling geplaatst</h1>
          <p>Bedankt, {successOrder.customerName}. Je order #{successOrder.id} is opgeslagen.</p>
          <Link to="/shop" className="primary-link">Verder winkelen</Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section narrow">
        <div className="state-panel">
          <h1>Geen producten om af te rekenen</h1>
          <Link to="/shop" className="primary-link">Naar de shop</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Afrekenen</span>
        <h1>Bestelling afronden</h1>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submitOrder} noValidate>
          {[
            ["customerName", "Naam"],
            ["email", "E-mailadres"],
            ["phone", "Telefoonnummer"],
            ["address", "Adres"],
            ["postalCode", "Postcode"],
            ["city", "Plaats"]
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                name={name}
                value={form[name]}
                onChange={updateField}
                type={name === "email" ? "email" : "text"}
                aria-invalid={Boolean(errors[name])}
              />
              {errors[name] && <span className="field-error">{errors[name]}</span>}
            </label>
          ))}
          {apiError && <div className="form-error">{apiError}</div>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Bestelling plaatsen..." : "Bestelling plaatsen"}
          </button>
        </form>
        <aside className="summary">
          <h2>Orderoverzicht</h2>
          {items.map((item) => (
            <div key={item.id}>
              <span>{item.quantity}x {item.name}</span>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Totaal</span>
            <strong>{formatPrice(totals.totalPrice)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
