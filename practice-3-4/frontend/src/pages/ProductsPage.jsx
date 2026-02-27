import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../api/products";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
      alert("Ошибка загрузки товаров. Проверь backend и CORS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      alert("Ошибка удаления");
    }
  }

  return (
    <div className="container">
      <header className="topbar">
        <h1>Интернет-магазин</h1>
        <button className="btn btn--primary" onClick={openCreate}>
          + Добавить товар
        </button>
      </header>

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