const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Логи
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ===== Swagger setup =====
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Online Store API",
      version: "1.0.0",
      description: "Swagger документация для CRUD товаров",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Локальный сервер",
      },
    ],
  },
  // Важно: swagger-jsdoc будет читать JSDoc ниже из этого же файла
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== "База данных" в памяти (минимум 10 товаров) =====
let products = [
  {
    id: nanoid(),
    title: "Клавиатура механическая",
    category: "Периферия",
    description: "Механика, подсветка, USB-C",
    price: 2500,
    stock: 12,
    rating: 4.6,
    image: "https://via.placeholder.com/300x200?text=Keyboard",
  },
  {
    id: nanoid(),
    title: "Мышь игровая",
    category: "Периферия",
    description: "DPI до 12000, 6 кнопок",
    price: 1200,
    stock: 30,
    rating: 4.4,
    image: "https://via.placeholder.com/300x200?text=Mouse",
  },
  {
    id: nanoid(),
    title: "Монитор 24''",
    category: "Мониторы",
    description: "IPS, 75Hz, FullHD",
    price: 15000,
    stock: 8,
    rating: 4.7,
    image: "https://via.placeholder.com/300x200?text=Monitor",
  },
  {
    id: nanoid(),
    title: "Наушники",
    category: "Аудио",
    description: "Закрытые, хороший бас",
    price: 5000,
    stock: 14,
    rating: 4.3,
    image: "https://via.placeholder.com/300x200?text=Headphones",
  },
  {
    id: nanoid(),
    title: "Колонки 2.0",
    category: "Аудио",
    description: "Компактные, питание USB",
    price: 1800,
    stock: 25,
    rating: 4.1,
    image: "https://via.placeholder.com/300x200?text=Speakers",
  },
  {
    id: nanoid(),
    title: "SSD 512GB",
    category: "Накопители",
    description: "SATA, до 550MB/s",
    price: 4200,
    stock: 20,
    rating: 4.8,
    image: "https://via.placeholder.com/300x200?text=SSD",
  },
  {
    id: nanoid(),
    title: "Флешка 64GB",
    category: "Накопители",
    description: "USB 3.0, металлический корпус",
    price: 700,
    stock: 60,
    rating: 4.2,
    image: "https://via.placeholder.com/300x200?text=USB+Flash",
  },
  {
    id: nanoid(),
    title: "Веб-камера",
    category: "Аксессуары",
    description: "1080p, автофокус",
    price: 2600,
    stock: 10,
    rating: 4.0,
    image: "https://via.placeholder.com/300x200?text=Webcam",
  },
  {
    id: nanoid(),
    title: "Микрофон",
    category: "Аудио",
    description: "USB, для стрима/уроков",
    price: 3200,
    stock: 9,
    rating: 4.5,
    image: "https://via.placeholder.com/300x200?text=Microphone",
  },
  {
    id: nanoid(),
    title: "Коврик для мыши",
    category: "Аксессуары",
    description: "Большой, прошитые края",
    price: 600,
    stock: 50,
    rating: 4.6,
    image: "https://via.placeholder.com/300x200?text=Mousepad",
  },
];

// ===== Helpers =====
function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateProductCreate(body) {
  const errors = [];

  if (!body.title || typeof body.title !== "string") errors.push("title обязателен (string)");
  if (!body.category || typeof body.category !== "string") errors.push("category обязателен (string)");
  if (!body.description || typeof body.description !== "string") errors.push("description обязателен (string)");
  if (!isNumber(body.price)) errors.push("price обязателен (number)");
  if (!Number.isInteger(body.stock)) errors.push("stock обязателен (integer)");

  return errors;
}

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: CRUD для товаров
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         title:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           description: Рейтинг (опционально)
 *         image:
 *           type: string
 *           description: Ссылка на изображение (опционально)
 *       example:
 *         id: "abc123"
 *         title: "Клавиатура механическая"
 *         category: "Периферия"
 *         description: "Механика, подсветка, USB-C"
 *         price: 2500
 *         stock: 12
 *         rating: 4.6
 *         image: "https://via.placeholder.com/300x200?text=Keyboard"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Массив товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Товар не найден" });
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */
app.post("/api/products", (req, res) => {
  const errors = validateProductCreate(req.body);
  if (errors.length) return res.status(400).json({ message: "Ошибка валидации", errors });

  const newProduct = {
    id: nanoid(),
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    rating: isNumber(req.body.rating) ? req.body.rating : 0,
    image:
      typeof req.body.image === "string"
        ? req.body.image
        : "https://via.placeholder.com/300x200?text=Product",
  };

  products.unshift(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар частично
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Товар не найден" });

  const { title, category, description, price, stock, rating, image } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string") return res.status(400).json({ message: "title должен быть string" });
    product.title = title;
  }
  if (category !== undefined) {
    if (typeof category !== "string") return res.status(400).json({ message: "category должен быть string" });
    product.category = category;
  }
  if (description !== undefined) {
    if (typeof description !== "string") return res.status(400).json({ message: "description должен быть string" });
    product.description = description;
  }
  if (price !== undefined) {
    if (!isNumber(price)) return res.status(400).json({ message: "price должен быть number" });
    product.price = price;
  }
  if (stock !== undefined) {
    if (!Number.isInteger(stock)) return res.status(400).json({ message: "stock должен быть integer" });
    product.stock = stock;
  }
  if (rating !== undefined) {
    if (!isNumber(rating)) return res.status(400).json({ message: "rating должен быть number" });
    product.rating = rating;
  }
  if (image !== undefined) {
    if (typeof image !== "string") return res.status(400).json({ message: "image должен быть string" });
    product.image = image;
  }

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Успешно удалено (без тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Товар не найден" });

  products.splice(idx, 1);
  res.status(204).send();
});

// health check
app.get("/", (req, res) => res.send("OK"));

// 404 + error handlers
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
});