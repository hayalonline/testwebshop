import React, { useEffect, useMemo, useState } from "react";
import { Edit3, LogOut, PackagePlus, Save, Trash2 } from "lucide-react";
import { api } from "../services/api.js";
import { formatPrice } from "../utils/format.js";

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
  stock: "",
  category: ""
};

const statuses = ["nieuw", "in_behandeling", "verzonden", "afgerond", "geannuleerd"];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin-token") || "");
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  }, [orders]);

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  async function loadAdminData(activeToken = token) {
    setLoading(true);
    setError("");
    try {
      const [productData, orderData] = await Promise.all([
        api.getProducts(),
        api.adminGetOrders(activeToken)
      ]);
      setProducts(productData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Niet ingelogd")) logout();
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoginError("");
    try {
      const result = await api.adminLogin(login);
      sessionStorage.setItem("admin-token", result.token);
      setToken(result.token);
      setLogin({ username: result.user.username, password: "" });
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem("admin-token");
    setToken("");
    setOrders([]);
    setSelectedOrder(null);
  }

  function updateProductField(event) {
    const { name, value } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "name" && !editingId ? { slug: slugify(value) } : {})
    }));
  }

  function editProduct(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      image: product.image,
      stock: String(product.stock),
      category: product.category
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProductForm() {
    setEditingId(null);
    setProductForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock)
    };

    try {
      if (editingId) {
        await api.adminUpdateProduct(editingId, payload, token);
        setMessage("Product bijgewerkt.");
      } else {
        await api.adminCreateProduct(payload, token);
        setMessage("Product aangemaakt.");
      }
      resetProductForm();
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteProduct(id) {
    const confirmed = window.confirm("Weet je zeker dat je dit product wilt verwijderen?");
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await api.adminDeleteProduct(id, token);
      setMessage("Product verwijderd.");
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOrderStatus(orderId, status) {
    setError("");
    try {
      const updated = await api.adminUpdateOrderStatus(orderId, status, token);
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      setMessage(`Order #${orderId} bijgewerkt.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewOrder(orderId) {
    setError("");
    try {
      setSelectedOrder(await api.adminGetOrder(orderId, token));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm("Weet je zeker dat je deze order wilt verwijderen?");
    if (!confirmed) return;

    setError("");
    try {
      await api.adminDeleteOrder(orderId, token);
      setOrders((current) => current.filter((order) => order.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      setMessage(`Order #${orderId} verwijderd.`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <section className="admin-login">
        <form className="admin-login-panel" onSubmit={submitLogin}>
          <span className="eyebrow">Admin</span>
          <h1>Beheeromgeving</h1>
          <p>Log in om producten en orders te beheren.</p>
          <label>
            Gebruikersnaam
            <input
              value={login.username}
              onChange={(event) => setLogin({ ...login, username: event.target.value })}
              autoComplete="username"
            />
          </label>
          <label>
            Wachtwoord
            <input
              type="password"
              value={login.password}
              onChange={(event) => setLogin({ ...login, password: event.target.value })}
              autoComplete="current-password"
            />
          </label>
          {loginError && <div className="form-error">{loginError}</div>}
          <button className="primary-button" type="submit">Inloggen</button>
          <small>Standaard lokaal: admin / admin123</small>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-topbar">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Webshop beheer</h1>
        </div>
        <button className="admin-ghost-button" type="button" onClick={logout}>
          <LogOut size={18} />
          Uitloggen
        </button>
      </div>

      <div className="admin-stats">
        <div><span>Producten</span><strong>{products.length}</strong></div>
        <div><span>Orders</span><strong>{orders.length}</strong></div>
        <div><span>Omzet</span><strong>{formatPrice(totalRevenue)}</strong></div>
      </div>

      {loading && <div className="state-panel">Admin data laden...</div>}
      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="admin-grid">
        <form className="admin-panel product-editor" onSubmit={saveProduct}>
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Product</span>
              <h2>{editingId ? "Product wijzigen" : "Product toevoegen"}</h2>
            </div>
            <PackagePlus size={24} />
          </div>
          <div className="admin-form-grid">
            <label>Naam<input name="name" value={productForm.name} onChange={updateProductField} required /></label>
            <label>Slug<input name="slug" value={productForm.slug} onChange={updateProductField} required /></label>
            <label>Prijs<input name="price" type="number" step="0.01" min="0" value={productForm.price} onChange={updateProductField} required /></label>
            <label>Voorraad<input name="stock" type="number" min="0" value={productForm.stock} onChange={updateProductField} required /></label>
            <label>Categorie<input name="category" value={productForm.category} onChange={updateProductField} required /></label>
            <label>Afbeelding URL<input name="image" value={productForm.image} onChange={updateProductField} required /></label>
          </div>
          <label>
            Beschrijving
            <textarea name="description" rows="4" value={productForm.description} onChange={updateProductField} required />
          </label>
          <div className="admin-actions">
            <button className="primary-button" type="submit">
              <Save size={18} />
              {editingId ? "Opslaan" : "Aanmaken"}
            </button>
            {editingId && <button className="admin-ghost-button" type="button" onClick={resetProductForm}>Annuleren</button>}
          </div>
        </form>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Catalogus</span>
              <h2>Producten</h2>
            </div>
          </div>
          <div className="admin-list">
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <img src={product.image} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category} - {formatPrice(product.price)} - voorraad {product.stock}</span>
                </div>
                <button className="icon-button" type="button" onClick={() => editProduct(product)} aria-label={`${product.name} wijzigen`}>
                  <Edit3 size={17} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => deleteProduct(product.id)} aria-label={`${product.name} verwijderen`}>
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid orders-grid">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Orders</span>
              <h2>Bestellingen</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Klant</th>
                  <th>Totaal</th>
                  <th>Status</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customerName}<br /><small>{order.email}</small></td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <select value={order.orderStatus} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => viewOrder(order.id)}>Bekijk</button>
                        <button type="button" onClick={() => deleteOrder(order.id)}>Verwijder</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="admin-panel order-detail">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Details</span>
              <h2>{selectedOrder ? `Order #${selectedOrder.id}` : "Selecteer order"}</h2>
            </div>
          </div>
          {selectedOrder ? (
            <>
              <div className="order-address">
                <strong>{selectedOrder.customerName}</strong>
                <span>{selectedOrder.email}</span>
                <span>{selectedOrder.phone}</span>
                <span>{selectedOrder.address}</span>
                <span>{selectedOrder.postalCode} {selectedOrder.city}</span>
              </div>
              <div className="order-lines">
                {selectedOrder.items.map((item) => (
                  <div key={item.id}>
                    <span>{item.quantity}x {item.productName}</span>
                    <strong>{formatPrice(item.totalPrice)}</strong>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span>Totaal</span>
                <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
              </div>
            </>
          ) : (
            <p>Klik op “Bekijk” om orderregels en klantgegevens te zien.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
