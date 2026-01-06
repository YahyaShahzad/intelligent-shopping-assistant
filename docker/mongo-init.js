// MongoDB initialization script
// Create application user with readWrite role on shopping_assistant
var appDb = db.getSiblingDB('shopping_assistant');
var existingUser = null;
try { existingUser = appDb.getUser('shop_user'); } catch (e) {}
if (!existingUser) {
    appDb.createUser({
        user: 'shop_user',
        pwd: 'shop_password123!',
        roles: [{ role: 'readWrite', db: 'shopping_assistant' }]
    });
}

// Ensure we are using the application database for schema/seed
db = appDb;

// Create collections
db.createCollection('users');
db.createCollection('carts');
db.createCollection('rules');
db.createCollection('sessions');
db.createCollection('products');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.carts.createIndex({ userId: 1 });
db.sessions.createIndex({ sessionId: 1 }, { unique: true });
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
db.rules.createIndex({ active: 1, priority: -1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });

// Insert sample products
db.products.insertMany([
    {
        _id: ObjectId(),
        name: "Laptop - Dell XPS 15",
        category: "electronics",
        price: 1299.99,
        stock: 15,
        tags: ["computers", "laptops", "premium"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Wireless Headphones",
        category: "electronics",
        price: 199.99,
        stock: 50,
        tags: ["audio", "wireless", "accessories"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "USB-C Cable",
        category: "accessories",
        price: 19.99,
        stock: 100,
        tags: ["cables", "usb", "accessories"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Mechanical Keyboard",
        category: "electronics",
        price: 149.99,
        stock: 30,
        tags: ["keyboards", "peripherals", "gaming"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "27-inch Monitor",
        category: "electronics",
        price: 349.99,
        stock: 20,
        tags: ["monitors", "displays", "4k"],
        createdAt: new Date()
    }
]);

// Insert sample rules
db.rules.insertMany([
    {
        _id: ObjectId(),
        name: "Student Discount",
        type: "USER_ATTRIBUTE",
        condition: "user.isStudent === true",
        action: {
            type: "PERCENTAGE_DISCOUNT",
            value: 15
        },
        priority: 10,
        active: true,
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Cart Value Threshold",
        type: "CART_CONDITION",
        condition: "cart.total > 100",
        action: {
            type: "PERCENTAGE_DISCOUNT",
            value: 10
        },
        priority: 5,
        active: true,
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Electronics Bundle",
        type: "CATEGORY_BUNDLE",
        condition: "cart.electronics.count >= 2",
        action: {
            type: "BUNDLE_DISCOUNT",
            value: 20,
            message: "Buy 2+ electronics, get 20% off"
        },
        priority: 8,
        active: true,
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Seasonal Sale",
        type: "TIME_BASED",
        condition: "now.month === 12",
        action: {
            type: "PERCENTAGE_DISCOUNT",
            value: 25,
            message: "Holiday Season Sale!"
        },
        priority: 15,
        active: true,
        createdAt: new Date()
    }
]);

print("MongoDB initialization completed successfully!");
