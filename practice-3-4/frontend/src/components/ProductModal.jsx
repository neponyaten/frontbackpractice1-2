import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  category: "",
  description: "",
  price: 0,
  stock: 0,
  rating: 0,
  image: "",
};

export default function ProductModal({ open, mode, initialValue, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...emptyForm, ...initialValue } : emptyForm);
    }
  }, [open, initialValue]);

  if (!open) return null;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Мини-валидация на фронте (основная валидация всё равно на backend)
    if (!form.title.trim() || !form.category.trim() || !form.description.trim()) {
      alert("Заполни: название, категорию и описание");
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      rating: Number(form.rating),
      image: form.image.trim() || "https://via.placeholder.com/300x200?text=Product",
    };

    onSubmit(payload);
  }

  return (
    <div className="modal__overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{isEdit ? "Редактировать товар" : "Добавить товар"}</h2>
          <button className="btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Название</span>
            <input value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </label>

          <label className="field">
            <span>Категория</span>
            <input value={form.category} onChange={(e) => setField("category", e.target.value)} />
          </label>

          <label className="field">
            <span>Описание</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>

          <div className="grid2">
            <label className="field">
              <span>Цена</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Количество</span>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
              />
            </label>
          </div>

          <div className="grid2">
            <label className="field">
              <span>Рейтинг (0–5)</span>
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => setField("rating", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Ссылка на фото</span>
              <input value={form.image} onChange={(e) => setField("image", e.target.value)} />
            </label>
          </div>

          <div className="modal__actions">
            <button className="btn btn--ghost" type="button" onClick={onClose}>
              Отмена
            </button>
            <button className="btn btn--primary" type="submit">
              {isEdit ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}