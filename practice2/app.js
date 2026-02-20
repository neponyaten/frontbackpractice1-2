const express = require('express');
const app = express();
const port = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// База данных (массив с товарами)
let products = [
    { id: 1, name: 'Клавиатура', price: 2500 },
    { id: 2, name: 'Мышь', price: 1200 },
    { id: 3, name: 'Монитор', price: 15000 }
];

// 1. GET /products - получить все товары
app.get('/products', (req, res) => {
    res.json(products);
});

// 2. GET /products/:id - получить товар по id
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
});

// 3. POST /products - создать новый товар
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    // Проверка, что данные переданы
    if (!name || !price) {
        return res.status(400).json({ message: 'Укажите название и цену товара' });
    }
    
    const newProduct = {
        id: Date.now(), // уникальный id
        name: name,
        price: price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// 4. PATCH /products/:id - обновить товар
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (name) product.name = name;
    if (price) product.price = price;
    
    res.json(product);
});

// 5. DELETE /products/:id - удалить товар
app.delete('/products/:id', (req, res) => {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    products.splice(productIndex, 1);
    res.status(204).send(); // 204 - успешно, но без содержимого
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📦 Товары: http://localhost:${port}/products`);
});