const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3000;

const ACCESS_SECRET = "access_secret_key_123";
const REFRESH_SECRET = "refresh_secret_key_456";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Логи =====
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ===== "База" в памяти =====
const adminPasswordHash = bcrypt.hashSync("admin123", 10);

let users = [
  {
    id: nanoid(),
    email: "admin@test.com",
    first_name: "Admin",
    last_name: "Root",
    passwordHash: adminPasswordHash,
    role: "admin",
  },
];

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
    createdBy: "system",
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
    createdBy: "system",
  },
];

// Активные refresh-сессии
let sessions = [];

// Blacklist для access token
let tokenBlacklist = [];

// ===== Helpers =====
function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateProductCreate(body) {
  const errors = [];

  if (!body.title || typeof body.title !== "string") {
    errors.push("title обязателен (string)");
  }
  if (!body.category || typeof body.category !== "string") {
    errors.push("category обязателен (string)");
  }
  if (!body.description || typeof body.description !== "string") {
    errors.push("description обязателен (string)");
  }
  if (!isNumber(body.price)) {
    errors.push("price обязателен (number)");
  }
  if (!Number.isInteger(body.stock)) {
    errors.push("stock обязателен (integer)");
  }

  return errors;
}

function cleanupBlacklist() {
  const now = Date.now();
  tokenBlacklist = tokenBlacklist.filter((item) => item.expiresAt > now);
}

function cleanupSessions() {
  const now = Date.now();
  sessions = sessions.filter((s) => !s.isRevoked && s.expiresAt > now);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(session) {
  return jwt.sign(
    {
      sub: session.userId,
      sid: session.id,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
}

function authMiddleware(req, res, next) {
  cleanupBlacklist();

  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Missing or invalid Authorization header",
    });
  }

  const blacklisted = tokenBlacklist.find((item) => item.token === token);
  if (blacklisted) {
    return res.status(401).json({
      message: "Token is blacklisted",
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    req.accessToken = token;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
}

// ===== Swagger =====
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Online Store API",
    version: "2.0.0",
    description: "CRUD товаров + auth + refresh + roles + blacklist",
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Локальный сервер",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "first_name", "last_name", "password"],
        properties: {
          email: { type: "string", example: "user@test.com" },
          first_name: { type: "string", example: "Ivan" },
          last_name: { type: "string", example: "Petrov" },
          password: { type: "string", example: "123456" },
          role: {
            type: "string",
            enum: ["user", "moderator", "admin"],
            example: "user",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@test.com" },
          password: { type: "string", example: "admin123" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "V1StGXR8_Z5jdHi6B-myT" },
          email: { type: "string", example: "admin@test.com" },
          first_name: { type: "string", example: "Admin" },
          last_name: { type: "string", example: "Root" },
          role: { type: "string", example: "admin" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "jwt-token-here" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      RefreshResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "new-jwt-token-here" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", example: "product123" },
          title: { type: "string", example: "Клавиатура механическая" },
          category: { type: "string", example: "Периферия" },
          description: { type: "string", example: "Механика, подсветка, USB-C" },
          price: { type: "number", example: 2500 },
          stock: { type: "integer", example: 12 },
          rating: { type: "number", example: 4.6 },
          image: {
            type: "string",
            example: "https://via.placeholder.com/300x200?text=Keyboard",
          },
          createdBy: { type: "string", example: "admin@test.com" },
        },
      },
      ProductCreateRequest: {
        type: "object",
        required: ["title", "category", "description", "price", "stock"],
        properties: {
          title: { type: "string", example: "Наушники" },
          category: { type: "string", example: "Аудио" },
          description: { type: "string", example: "Беспроводные наушники" },
          price: { type: "number", example: 3500 },
          stock: { type: "integer", example: 5 },
          rating: { type: "number", example: 4.8 },
          image: {
            type: "string",
            example: "https://via.placeholder.com/300x200?text=Headphones",
          },
        },
      },
      ProductPatchRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Обновленное название" },
          category: { type: "string", example: "Периферия" },
          description: { type: "string", example: "Новое описание" },
          price: { type: "number", example: 9999 },
          stock: { type: "integer", example: 10 },
          rating: { type: "number", example: 4.9 },
          image: { type: "string", example: "https://example.com/image.png" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string", example: "session123" },
          userAgent: { type: "string", example: "Mozilla/5.0" },
          createdAt: { type: "number", example: 1700000000000 },
          expiresAt: { type: "number", example: 1700600000000 },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Ошибка" },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Проверка сервера",
        responses: {
          200: {
            description: "Сервер работает",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "OK",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Регистрация",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пользователь создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          400: { description: "Ошибка валидации" },
          409: { description: "Пользователь уже существует" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Вход",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Успешный вход",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: { description: "Неверный email или пароль" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Текущий пользователь",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Данные текущего пользователя",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: { description: "Не авторизован" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Обновить access token по refresh cookie",
        responses: {
          200: {
            description: "Новый access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshResponse" },
              },
            },
          },
          401: { description: "Невалидный refresh token" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Выход",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Успешный выход",
          },
          401: { description: "Не авторизован" },
        },
      },
    },
    "/api/auth/sessions": {
      get: {
        tags: ["Auth"],
        summary: "Список активных сессий пользователя",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Список сессий",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Session" },
                },
              },
            },
          },
          401: { description: "Не авторизован" },
        },
      },
    },
    "/api/auth/sessions/{id}/revoke": {
      post: {
        tags: ["Auth"],
        summary: "Отозвать конкретную сессию",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Сессия отозвана" },
          404: { description: "Сессия не найдена" },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Получить все товары",
        responses: {
          200: {
            description: "Список товаров",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Создать товар",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Товар создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          400: { description: "Ошибка валидации" },
          401: { description: "Не авторизован" },
          403: { description: "Недостаточно прав" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Получить товар по id",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Товар найден",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          404: { description: "Товар не найден" },
        },
      },
      patch: {
        tags: ["Products"],
        summary: "Обновить товар",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductPatchRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Товар обновлен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          400: { description: "Ошибка данных" },
          401: { description: "Не авторизован" },
          403: { description: "Недостаточно прав" },
          404: { description: "Товар не найден" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Удалить товар",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Товар удален" },
          401: { description: "Не авторизован" },
          403: { description: "Недостаточно прав" },
          404: { description: "Товар не найден" },
        },
      },
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== AUTH =====

// register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        message: "email, first_name, last_name, password обязательны",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = users.find((u) => u.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        message: "Пользователь уже существует",
      });
    }

    const allowedRoles = ["user", "moderator", "admin"];
    const finalRole = allowedRoles.includes(role) ? role : "user";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: nanoid(),
      email: normalizedEmail,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      passwordHash,
      role: finalRole,
    };

    users.push(user);

    res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

// login
app.post("/api/auth/login", async (req, res) => {
  try {
    cleanupSessions();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email и password обязательны",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({
        message: "Неверный email или пароль",
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        message: "Неверный email или пароль",
      });
    }

    const session = {
      id: nanoid(),
      userId: user.id,
      refreshToken: "",
      userAgent: req.headers["user-agent"] || "unknown",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isRevoked: false,
    };

    const refreshToken = generateRefreshToken(session);
    session.refreshToken = refreshToken;
    sessions.push(session);

    const accessToken = generateAccessToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка входа" });
  }
});

// me
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
  });
});

// refresh
app.post("/api/auth/refresh", (req, res) => {
  try {
    cleanupSessions();

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const session = sessions.find(
      (s) =>
        s.id === payload.sid &&
        s.userId === payload.sub &&
        s.refreshToken === refreshToken &&
        !s.isRevoked
    );

    if (!session) {
      return res.status(401).json({ message: "Session not found or revoked" });
    }

    const user = users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    session.isRevoked = true;

    const newSession = {
      id: nanoid(),
      userId: user.id,
      refreshToken: "",
      userAgent: req.headers["user-agent"] || "unknown",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isRevoked: false,
    };

    const newRefreshToken = generateRefreshToken(newSession);
    newSession.refreshToken = newRefreshToken;
    sessions.push(newSession);

    const newAccessToken = generateAccessToken(user);
    setRefreshCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// logout
app.post("/api/auth/logout", authMiddleware, (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const session = sessions.find((s) => s.refreshToken === refreshToken);
      if (session) {
        session.isRevoked = true;
      }
    }

    const decoded = jwt.decode(req.accessToken);
    if (decoded?.exp) {
      tokenBlacklist.push({
        token: req.accessToken,
        expiresAt: decoded.exp * 1000,
      });
    }

    clearRefreshCookie(res);

    res.json({ message: "Logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Logout error" });
  }
});

// sessions list
app.get("/api/auth/sessions", authMiddleware, (req, res) => {
  cleanupSessions();

  const userSessions = sessions
    .filter((s) => s.userId === req.user.sub && !s.isRevoked)
    .map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

  res.json(userSessions);
});

// revoke specific session
app.post("/api/auth/sessions/:id/revoke", authMiddleware, (req, res) => {
  const session = sessions.find(
    (s) => s.id === req.params.id && s.userId === req.user.sub
  );

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  session.isRevoked = true;
  res.json({ message: "Session revoked" });
});

// ===== PRODUCTS =====

// GET all
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET by id
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Товар не найден" });
  }
  res.json(product);
});

// create
app.post(
  "/api/products",
  authMiddleware,
  requireRole("user", "moderator", "admin"),
  (req, res) => {
    const errors = validateProductCreate(req.body);
    if (errors.length) {
      return res.status(400).json({ message: "Ошибка валидации", errors });
    }

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
      createdBy: req.user.email,
    };

    products.unshift(newProduct);
    res.status(201).json(newProduct);
  }
);

// patch
app.patch(
  "/api/products/:id",
  authMiddleware,
  requireRole("moderator", "admin"),
  (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const { title, category, description, price, stock, rating, image } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string") {
        return res.status(400).json({ message: "title должен быть string" });
      }
      product.title = title;
    }

    if (category !== undefined) {
      if (typeof category !== "string") {
        return res.status(400).json({ message: "category должен быть string" });
      }
      product.category = category;
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ message: "description должен быть string" });
      }
      product.description = description;
    }

    if (price !== undefined) {
      if (!isNumber(price)) {
        return res.status(400).json({ message: "price должен быть number" });
      }
      product.price = price;
    }

    if (stock !== undefined) {
      if (!Number.isInteger(stock)) {
        return res.status(400).json({ message: "stock должен быть integer" });
      }
      product.stock = stock;
    }

    if (rating !== undefined) {
      if (!isNumber(rating)) {
        return res.status(400).json({ message: "rating должен быть number" });
      }
      product.rating = rating;
    }

    if (image !== undefined) {
      if (typeof image !== "string") {
        return res.status(400).json({ message: "image должен быть string" });
      }
      product.image = image;
    }

    res.json(product);
  }
);

// delete
app.delete(
  "/api/products/:id",
  authMiddleware,
  requireRole("admin"),
  (req, res) => {
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    products.splice(idx, 1);
    res.status(204).send();
  }
);

// health
app.get("/", (req, res) => res.send("OK"));

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`👤 Admin login: admin@test.com / admin123`);
});