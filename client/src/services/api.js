const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "De API-aanvraag is mislukt.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createOrder: (payload) => request("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  adminLogin: (payload) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  adminGetOrders: (token) => request("/orders", {
    headers: { Authorization: `Bearer ${token}` }
  }),
  adminGetOrder: (id, token) => request(`/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  adminCreateProduct: (payload, token) => request("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  adminUpdateProduct: (id, payload, token) => request(`/products/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  adminDeleteProduct: (id, token) => request(`/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  }),
  adminUpdateOrderStatus: (id, status, token) => request(`/orders/${id}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  }),
  adminDeleteOrder: (id, token) => request(`/orders/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
};
