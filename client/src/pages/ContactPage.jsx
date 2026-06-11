import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Contact</span>
        <h1>Neem contact op</h1>
      </div>
      <div className="contact-layout">
        <form className="checkout-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
          <label>
            Naam
            <input required />
          </label>
          <label>
            E-mailadres
            <input type="email" required />
          </label>
          <label>
            Bericht
            <textarea rows="6" required />
          </label>
          <button type="submit" className="primary-button">Versturen</button>
          {sent && <div className="form-success">Bedankt, je bericht is ontvangen.</div>}
        </form>
        <aside className="company-info">
          <div><MapPin size={20} /><span>Rembro BV, Herengracht 100, 1015 BS Amsterdam</span></div>
          <div><Mail size={20} /><span>info@rembro.test</span></div>
          <div><Phone size={20} /><span>+31 20 123 4567</span></div>
          <h2>Openingstijden</h2>
          <p>Maandag t/m vrijdag: 09:00 - 17:30</p>
          <p>Zaterdag: 10:00 - 16:00</p>
        </aside>
      </div>
    </section>
  );
}
