import { refreshAccessToken } from "./auth";

const API_URL = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token") || "";
}

function setToken(token) {
  localStorage.setItem("token", token);
}

async function requestWithAutoRefresh(url, options = {}) {
  let token = getToken();

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (response.status !== 401) {
    return response;
  }

  try {
    const refreshed = await refreshAccessToken();
    setToken(refreshed.accessToken);

    token = refreshed.accessToken;

    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    return response;
  } catch (error) {
    localStorage.removeItem("token");
    throw error;
  }
}

export async function getProducts() {
  const response = await fetch(`${API_URL}/api/products`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка загрузки товаров");
  }

  return data;
}

export async function createProduct(payload) {
  const response = await requestWithAutoRefresh(`${API_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Ошибка создания товара");
    error.response = { data };
    throw error;
  }

  return data;
}

export async function updateProduct(id, payload) {
  const response = await requestWithAutoRefresh(`${API_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Ошибка обновления товара");
    error.response = { data };
    throw error;
  }

  return data;
}

export async function deleteProduct(id) {
  const response = await requestWithAutoRefresh(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(data?.message || "Ошибка удаления товара");
    error.response = { data };
    throw error;
  }

  return true;
}