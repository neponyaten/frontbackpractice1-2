import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

export async function getProducts() {
  const res = await api.get("/products");
  return res.data;
}

export async function createProduct(product) {
  const res = await api.post("/products", product);
  return res.data;
}

export async function updateProduct(id, patch) {
  const res = await api.patch(`/products/${id}`, patch);
  return res.data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}