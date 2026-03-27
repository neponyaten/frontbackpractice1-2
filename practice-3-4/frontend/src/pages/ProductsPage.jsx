import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../api/products";
import { getSessions, revokeSession } from "../api/auth";

const PRODUCTS_CACHE_KEY = "cachedProducts";

function readCachedProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushBrowserNotification(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      payload: { title, body }
    });
    return;
  }

  new Notification(title, { body });
}

export default function ProductsPage({ user, onLogout, offlineMode }) {
  const [products, setProducts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [socketState, setSocketState] = useState("connecting");
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editing, setEditing] = useState(null);

  const isReadonly = offlineMode || !online;

  async function load() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data));
      setNotice("");
    } catch (error) {
      console.error(error);
      const cachedProducts = readCachedProducts();

      if (cachedProducts.length) {
        setProducts(cachedProducts);
        setNotice("Сеть недоступна: показываю сохранённый офлайн-снимок товаров.");
      } else {
        alert("Ошибка загрузки товаров.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const token = localStorage.getItem("token");
      if (!token || offlineMode) {
        return;
      }

      const data = await getSessions(token);
      setSessions(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    load();
    loadSessions();
  }, []);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setNotice("Соединение восстановлено.");
      load();
      loadSessions();
    }

    function handleOffline() {
      setOnline(false);
      setNotice("Вы офлайн. Приложение работает в режиме App Shell.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000/ws");

    socket.addEventListener("open", () => {
      setSocketState("open");
    });

    socket.addEventListener("close", () => {
      setSocketState("closed");
    });

    socket.addEventListener("error", () => {
      setSocketState("error");
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "products:snapshot") {
          setProducts(payload.products);
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(payload.products));
          return;
        }

        if (payload.type === "product:created") {
          setProducts((prev) => [payload.product, ...prev.filter((item) => item.id !== payload.product.id)]);
        }

        if (payload.type === "product:updated") {
          setProducts((prev) =>
            prev.map((item) => (item.id === payload.product.id ? payload.product : item))
          );
        }

        if (payload.type === "product:deleted") {
          setProducts((prev) => prev.filter((item) => item.id !== payload.productId));
        }

        if (payload.notification) {
          setNotice(payload.notification.body);
          pushBrowserNotification(payload.notification.title, payload.notification.body);
        }
      } catch (error) {
        console.error("WebSocket message parse failed", error);
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchQuery =
        !normalizedQuery ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

      const matchCategory = category === "all" || product.category === category;
      return matchQuery && matchCategory;
    });
  }, [products, query, category]);

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setModalMode("edit");
    setEditing(product);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    try {
      if (modalMode === "create") {
        await createProduct(payload);
      } else {
        await updateProduct(editing.id, payload);
      }

      setModalOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || "Ошибка сохранения";
      const errors = error?.response?.data?.errors;
      alert(errors ? `${message}\n- ${errors.join("\n- ")}` : message);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Удалить товар?");
    if (!ok) {
      return;
    }

    try {
      await deleteProduct(id);
      await load();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || "Ошибка удаления";
      alert(message);
    }
  }

  async function handleRevokeSession(sessionId) {
    try {
      const token = localStorage.getItem("token");
      await revokeSession(token, sessionId);
      await loadSessions();
    } catch (error) {
      console.error(error);
      alert("Не удалось отозвать сессию");
    }
  }

  async function handleEnableNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotice("Разрешение на уведомления получено.");
      pushBrowserNotification("Уведомления включены", "Теперь вы будете получать realtime-события.");
    }
  }

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <h1>Интернет-магазин</h1>
          <p style={{ marginTop: 6 }}>
            Вы вошли как: <b>{user.first_name} {user.last_name}</b> ({user.email})
          </p>
          <p style={{ marginTop: 4 }}>
            Роль: <b>{user.role}</b>
          </p>
        </div>

        <div className="topbar__actions">
          <button className="btn btn--primary" onClick={openCreate} disabled={isReadonly}>
            + Добавить товар
          </button>
          <button
            className="btn"
            onClick={handleEnableNotifications}
            disabled={notificationPermission === "granted"}
          >
            {notificationPermission === "granted" ? "Уведомления включены" : "Включить уведомления"}
          </button>
          <button className="btn" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      <section className="status-panel">
        <div className={`pill ${online ? "pill--ok" : "pill--warn"}`}>
          {online ? "Сеть: онлайн" : "Сеть: офлайн"}
        </div>
        <div className={`pill ${socketState === "open" ? "pill--ok" : "pill--muted"}`}>
          WebSocket: {socketState}
        </div>
        <div className={`pill ${offlineMode ? "pill--warn" : "pill--muted"}`}>
          {offlineMode ? "Режим: офлайн-доступ" : "Режим: обычный"}
        </div>
      </section>

      {notice ? <div className="notice">{notice}</div> : null}

      <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 16 }}>
        <h3>Активные сессии</h3>
        {sessions.length === 0 ? (
          <p>Нет активных сессий</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #eee"
              }}
            >
              <div>
                <div><b>ID:</b> {session.id}</div>
                <div><b>User-Agent:</b> {session.userAgent}</div>
              </div>
              <button className="btn" onClick={() => handleRevokeSession(session.id)}>
                Отозвать
              </button>
            </div>
          ))
        )}
      </div>

      <div className="filters">
        <input
          className="input"
          placeholder="Поиск по названию, описанию или категории..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "Все категории" : item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEdit}
              onDelete={handleDelete}
              readonly={isReadonly}
            />
          ))}
        </div>
      )}

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        readonly={isReadonly}
      />
    </div>
  );
}
