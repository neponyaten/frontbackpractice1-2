import { useEffect, useState } from "react";
import ProductsPage from "./pages/ProductsPage";
import AuthPage from "./pages/AuthPage";
import { getMe, logoutUser, refreshAccessToken } from "./api/auth";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  async function checkAuth() {
    let token = localStorage.getItem("token");

    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const me = await getMe(token);
      setUser(me);
    } catch (error) {
      try {
        const refreshed = await refreshAccessToken();
        localStorage.setItem("token", refreshed.accessToken);

        const me = await getMe(refreshed.accessToken);
        setUser(me);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
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
      setUser(null);
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
    return <AuthPage onLogin={setUser} />;
  }

  return <ProductsPage user={user} onLogout={handleLogout} />;
}