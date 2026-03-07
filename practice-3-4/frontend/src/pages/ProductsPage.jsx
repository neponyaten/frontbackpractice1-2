import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../api/products";
import { getSessions, revokeSession } from "../api/auth";

export default function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
      alert("Ошибка загрузки товаров.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const data = await getSessions(token);
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
    loadSessions();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchCategory = category === "all" || p.category === category;
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
    } catch (e) {
      console.error(e);
      const message = e?.response?.data?.message || "Ошибка сохранения";
      const errors = e?.response?.data?.errors;
      alert(errors ? `${message}\n- ${errors.join("\n- ")}` : message);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;

    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      console.error(e);
      const message = e?.response?.data?.message || "Ошибка удаления";
      alert(message);
    }
  }

  async function handleRevokeSession(sessionId) {
    try {
      const token = localStorage.getItem("token");
      await revokeSession(token, sessionId);
      await loadSessions();
    } catch (e) {
      console.error(e);
      alert("Не удалось отозвать сессию");
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

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn--primary" onClick={openCreate}>
            + Добавить товар
          </button>
          <button className="btn" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 16 }}>
        <h3>Активные сессии</h3>
        {sessions.length === 0 ? (
          <p>Нет активных сессий</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <div><b>ID:</b> {s.id}</div>
                <div><b>User-Agent:</b> {s.userAgent}</div>
              </div>
              <button className="btn" onClick={() => handleRevokeSession(s.id)}>
                Отозвать
              </button>
            </div>
          ))
        )}
      </div>

      <div className="filters">
        <input
          className="input"
          placeholder="Поиск по названию/описанию/категории..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Все категории" : c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}