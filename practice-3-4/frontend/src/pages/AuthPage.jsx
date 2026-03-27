import { useState } from "react";
import { loginUser, registerUser } from "../api/auth";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  const [registerForm, setRegisterForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");

    try {
      await registerUser(registerForm);
      setMessage("Регистрация успешна. Теперь войди.");
      setMode("login");
      setRegisterForm({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const data = await loginUser(loginForm);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("cachedUser", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <header className="topbar">
        <h1>Авторизация</h1>
      </header>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          className="btn"
          onClick={() => setMode("login")}
          style={{ opacity: mode === "login" ? 1 : 0.7 }}
        >
          Вход
        </button>
        <button
          className="btn"
          onClick={() => setMode("register")}
          style={{ opacity: mode === "register" ? 1 : 0.7 }}
        >
          Регистрация
        </button>
      </div>

      {mode === "login" ? (
        <form
          onSubmit={handleLogin}
          style={{ display: "grid", gap: 12, background: "#fff", padding: 16, borderRadius: 16 }}
        >
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Пароль"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <button className="btn btn--primary" type="submit">
            Войти
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleRegister}
          style={{ display: "grid", gap: 12, background: "#fff", padding: 16, borderRadius: 16 }}
        >
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
          />
          <input
            className="input"
            type="text"
            placeholder="Имя"
            value={registerForm.first_name}
            onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
          />
          <input
            className="input"
            type="text"
            placeholder="Фамилия"
            value={registerForm.last_name}
            onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Пароль"
            value={registerForm.password}
            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
          />
          <button className="btn btn--primary" type="submit">
            Зарегистрироваться
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}
