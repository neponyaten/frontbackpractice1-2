export default function ProductCard({ product, onEdit, onDelete, readonly = false }) {
  return (
    <div className="card">
      <img className="card__image" src={product.image} alt={product.title} />
      <div className="card__body">
        <h3 className="card__title">{product.title}</h3>
        <div className="card__meta">
          <span className="badge">{product.category}</span>
          <span className="rating">★ {product.rating ?? 0}</span>
        </div>

        <p className="card__description">{product.description}</p>

        <div className="card__footer">
          <div className="price">
            {product.price} ₽ <span className="stock">• Остаток: {product.stock}</span>
          </div>

          <div className="actions">
            <button className="btn" onClick={() => onEdit(product)} disabled={readonly}>
              Редактировать
            </button>
            <button className="btn btn--danger" onClick={() => onDelete(product.id)} disabled={readonly}>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
