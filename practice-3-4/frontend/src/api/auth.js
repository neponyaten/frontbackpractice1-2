const API_URL = "http://localhost:3000";

export async function registerUser(payload) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка регистрации");
  }

  return data;
}

export async function loginUser(payload) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка входа");
  }

  return data;
}

export async function getMe(token) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка получения пользователя");
  }

  return data;
}

export async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка обновления access token");
  }

  return data;
}

export async function logoutUser(token) {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка выхода");
  }

  return data;
}

export async function getSessions(token) {
  const response = await fetch(`${API_URL}/api/auth/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка получения сессий");
  }

  return data;
}

export async function revokeSession(token, sessionId) {
  const response = await fetch(`${API_URL}/api/auth/sessions/${sessionId}/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ошибка отзыва сессии");
  }

  return data;
}