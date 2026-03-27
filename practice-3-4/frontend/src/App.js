import { useEffect, useState } from "react";
import ProductsPage from "./pages/ProductsPage";
import AuthPage from "./pages/AuthPage";
import { getMe, logoutUser, refreshAccessToken } from "./api/auth";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  function cacheUser(nextUser) {
    if (nextUser) {
      localStorage.setItem("cachedUser", JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem("cachedUser");
  }

  function applyUser(nextUser) {
    setUser(nextUser);
    cacheUser(nextUser);
  }

  async function checkAuth() {
    let token = localStorage.getItem("token");
    const cachedUserRaw = localStorage.getItem("cachedUser");
    const cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;

    if (!token) {
      if (!navigator.onLine && cachedUser) {
        setOfflineMode(true);
        setUser(cachedUser);
      }
      setChecking(false);
      return;
    }

    try {
      const me = await getMe(token);
      setOfflineMode(false);
      applyUser(me);
    } catch (error) {
      try {
        const refreshed = await refreshAccessToken();
        localStorage.setItem("token", refreshed.accessToken);

        const me = await getMe(refreshed.accessToken);
        setOfflineMode(false);
        applyUser(me);
      } catch {
        if (!navigator.onLine && cachedUser) {
          setOfflineMode(true);
          setUser(cachedUser);
        } else {
          localStorage.removeItem("token");
          applyUser(null);
        }
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function handleLogout() {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("token");
      setOfflineMode(false);
      applyUser(null);
    }
  }

  if (checking) {
    return (
      <div className="container">
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={applyUser} />;
  }

  return <ProductsPage user={user} onLogout={handleLogout} offlineMode={offlineMode} />;
}
