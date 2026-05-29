const API_BASE_URL = "http://localhost:5000";

const getHeaders = () => {
  const token = localStorage.getItem("logo_crm_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "API Error" }));
      throw new Error(err.detail || `HTTP error! status: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  post: async (endpoint, data) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "API Error" }));
      throw new Error(err.detail || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  put: async (endpoint, data) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "API Error" }));
      throw new Error(err.detail || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "API Error" }));
      throw new Error(err.detail || `HTTP error! status: ${res.status}`);
    }
    return null;
  },

  login: async (email, password) => {
    // We call /api/auth/login/json which is our custom JSON login endpoint
    const res = await fetch(`${API_BASE_URL}/api/auth/login/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Невірна пошта або пароль" }));
      throw new Error(err.detail || "Не вдалося увійти");
    }
    return res.json();
  }
};
