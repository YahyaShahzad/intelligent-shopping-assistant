const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const cartRoutes = require('./routes/cart');
const productsRoutes = require('./routes/products');
const assistantRoutes = require('./routes/assistant');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

// Import middleware
const { loginLimiter, apiLimiter, searchLimiter } = require('./middleware/rateLimiter');

// Import services
const { getShoppingAssistantService } = require('./services/ShoppingAssistantService');

// Initialize logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'https://ai-shopping-assistant-frontend.onrender.com'],
        methods: ['GET', 'POST']
    }
});

// Middleware
// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'https://ai-shopping-assistant-frontend.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

// Rate limiting middleware
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/products/search', searchLimiter);
app.use('/api/', apiLimiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_assistant', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    logger.info('Connected to MongoDB');
    initializeData();
})
.catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
});

// Initialize sample data
async function initializeData() {
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    
    // Always update products to ensure they have images
    logger.info('Initializing/Updating sample products...');
    
    // Clear existing products
    await Product.deleteMany({});
    
    if (true) {
        logger.info('Adding products with images...');
        
        const sampleProducts = [
            {
                name: "Laptop - Dell XPS 15",
                category: "electronics",
                price: 1299.99,
                originalPrice: 1499.99,
                stock: 15,
                tags: ["computers", "laptops", "premium"],
                description: "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
                images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"],
                specifications: {
                    processor: "Intel Core i7-11800H",
                    ram: "16GB DDR4",
                    storage: "512GB NVMe SSD",
                    display: "15.6\" FHD"
                },
                ratings: { average: 4.5, count: 128 }
            },
            {
                name: "Wireless Headphones",
                category: "electronics",
                price: 199.99,
                stock: 50,
                tags: ["audio", "wireless", "accessories"],
                description: "Premium noise-canceling headphones with 30-hour battery life",
                images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
                specifications: {
                    type: "Over-ear",
                    connectivity: "Bluetooth 5.0",
                    battery: "30 hours",
                    noise_cancelling: "Active"
                },
                ratings: { average: 4.7, count: 342 }
            },
            {
                name: "USB-C Cable",
                category: "accessories",
                price: 19.99,
                stock: 100,
                tags: ["cables", "usb", "accessories"],
                description: "Durable USB-C charging cable with fast charging support",
                images: ["https://images.unsplash.com/photo-1591290619762-c588d64bf9e8?w=400"],
                specifications: {
                    length: "2 meters",
                    power: "100W PD",
                    data_speed: "480 Mbps"
                },
                ratings: { average: 4.2, count: 89 }
            },
            {
                name: "Mechanical Keyboard",
                category: "electronics",
                price: 149.99,
                stock: 30,
                tags: ["keyboards", "peripherals", "gaming"],
                description: "RGB mechanical gaming keyboard with Cherry MX switches",
                images: ["https://images.unsplash.com/photo-1595225476474-87563907a212?w=400"],
                specifications: {
                    switches: "Cherry MX Red",
                    backlighting: "RGB",
                    connectivity: "Wired USB-C",
                    layout: "Full-size"
                },
                ratings: { average: 4.6, count: 215 }
            },
            {
                name: "27-inch Monitor",
                category: "electronics",
                price: 349.99,
                stock: 20,
                tags: ["monitors", "displays", "4k"],
                description: "4K UHD professional monitor with HDR support",
                images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"],
                specifications: {
                    resolution: "3840x2160",
                    refresh_rate: "60Hz",
                    panel_type: "IPS",
                    hdr: "HDR10"
                },
                ratings: { average: 4.8, count: 167 }
            },
            {
                name: "Gaming Mouse",
                category: "electronics",
                price: 79.99,
                stock: 45,
                tags: ["mouse", "gaming", "peripherals"],
                description: "Ergonomic gaming mouse with 16000 DPI sensor",
                images: ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=400"],
                specifications: {
                    dpi: "16000",
                    buttons: "8 programmable",
                    connectivity: "Wired",
                    rgb: "Yes"
                },
                ratings: { average: 4.4, count: 203 }
            },
            {
                name: "Smartphone - Galaxy S23",
                category: "electronics",
                price: 899.99,
                originalPrice: 999.99,
                stock: 25,
                tags: ["smartphones", "mobile", "premium"],
                description: "Latest flagship smartphone with 5G and 50MP camera",
                images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"],
                specifications: {
                    screen: "6.1\" AMOLED",
                    camera: "50MP Triple",
                    battery: "3900mAh",
                    storage: "256GB"
                },
                ratings: { average: 4.7, count: 521 }
            },
            {
                name: "Backpack - Tech Pro",
                category: "accessories",
                price: 69.99,
                stock: 60,
                tags: ["bags", "backpack", "travel"],
                description: "Water-resistant laptop backpack with USB charging port",
                images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"],
                specifications: {
                    capacity: "30L",
                    laptop_fit: "17 inch",
                    usb_port: "Yes",
                    material: "Waterproof nylon"
                },
                ratings: { average: 4.3, count: 142 }
            },
            {
                name: "Webcam 4K",
                category: "electronics",
                price: 129.99,
                stock: 35,
                tags: ["camera", "streaming", "video"],
                description: "4K Ultra HD webcam with auto-focus and dual microphones",
                images: ["https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=400"],
                specifications: {
                    resolution: "4K 30fps",
                    fov: "90 degrees",
                    microphone: "Dual stereo",
                    autofocus: "Yes"
                },
                ratings: { average: 4.5, count: 98 }
            },
            {
                name: "Smart Watch Pro",
                category: "electronics",
                price: 299.99,
                originalPrice: 349.99,
                stock: 40,
                tags: ["wearables", "fitness", "smartwatch"],
                description: "Advanced smartwatch with health monitoring and GPS",
                images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"],
                specifications: {
                    display: "1.9\" AMOLED",
                    battery: "7 days",
                    sensors: "Heart rate, SpO2, GPS",
                    waterproof: "5ATM"
                },
                ratings: { average: 4.6, count: 287 }
            },
            {
                name: "Portable SSD 1TB",
                category: "accessories",
                price: 119.99,
                stock: 55,
                tags: ["storage", "external", "ssd"],
                description: "Ultra-fast portable SSD with USB 3.2 Gen 2",
                images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400"],
                specifications: {
                    capacity: "1TB",
                    speed: "1050MB/s",
                    interface: "USB 3.2",
                    size: "Pocket-sized"
                },
                ratings: { average: 4.8, count: 176 }
            },
            {
                name: "Desk Lamp LED",
                category: "home",
                price: 45.99,
                stock: 70,
                tags: ["lighting", "desk", "home"],
                description: "Smart LED desk lamp with touch control and USB charging",
                images: ["https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400"],
                specifications: {
                    brightness: "Adjustable",
                    color_temp: "3000-6000K",
                    usb_port: "Yes",
                    control: "Touch"
                },
                ratings: { average: 4.4, count: 134 }
            },
            {
                name: "Tablet - iPad Air",
                category: "electronics",
                price: 599.99,
                originalPrice: 649.99,
                stock: 30,
                tags: ["tablets", "apple", "premium"],
                description: "10.9-inch Liquid Retina display with M1 chip",
                images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"],
                specifications: {
                    screen: "10.9\" Liquid Retina",
                    processor: "M1 chip",
                    storage: "64GB",
                    camera: "12MP Wide"
                },
                ratings: { average: 4.8, count: 412 }
            },
            {
                name: "Bluetooth Speaker",
                category: "electronics",
                price: 89.99,
                stock: 65,
                tags: ["audio", "portable", "speakers"],
                description: "Waterproof portable speaker with 360° sound and 12-hour battery",
                images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"],
                specifications: {
                    waterproof: "IP67",
                    battery: "12 hours",
                    connectivity: "Bluetooth 5.0",
                    sound: "360° audio"
                },
                ratings: { average: 4.5, count: 289 }
            },
            {
                name: "Standing Desk Converter",
                category: "home",
                price: 179.99,
                stock: 25,
                tags: ["furniture", "desk", "ergonomic"],
                description: "Height-adjustable standing desk converter with keyboard tray",
                images: ["https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400"],
                specifications: {
                    height_range: "6.5\" - 20\"",
                    weight_capacity: "35 lbs",
                    size: "32\" wide",
                    adjustment: "Gas spring"
                },
                ratings: { average: 4.6, count: 156 }
            },
            {
                name: "Wireless Charger Pad",
                category: "accessories",
                price: 29.99,
                stock: 80,
                tags: ["charging", "wireless", "accessories"],
                description: "Fast wireless charging pad for Qi-enabled devices",
                images: ["https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=400"],
                specifications: {
                    power: "15W fast charge",
                    compatibility: "Qi-enabled devices",
                    led: "Status indicator",
                    safety: "Overheat protection"
                },
                ratings: { average: 4.3, count: 198 }
            },
            {
                name: "Office Chair - Ergonomic",
                category: "home",
                price: 249.99,
                originalPrice: 299.99,
                stock: 15,
                tags: ["furniture", "chair", "ergonomic"],
                description: "Premium ergonomic office chair with lumbar support",
                images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400"],
                specifications: {
                    material: "Mesh back",
                    adjustable: "Height, arms, lumbar",
                    weight_capacity: "300 lbs",
                    warranty: "5 years"
                },
                ratings: { average: 4.7, count: 324 }
            },
            {
                name: "Noise Canceling Earbuds",
                category: "electronics",
                price: 149.99,
                stock: 55,
                tags: ["audio", "wireless", "earbuds"],
                description: "True wireless earbuds with active noise cancellation",
                images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"],
                specifications: {
                    anc: "Active noise cancelling",
                    battery: "8 hours + 24 hours case",
                    water_resistance: "IPX4",
                    bluetooth: "5.2"
                },
                ratings: { average: 4.6, count: 441 }
            },
            {
                name: "External Hard Drive 4TB",
                category: "accessories",
                price: 99.99,
                stock: 40,
                tags: ["storage", "external", "hdd"],
                description: "High-capacity portable hard drive for backup and storage",
                images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400"],
                specifications: {
                    capacity: "4TB",
                    interface: "USB 3.0",
                    speed: "120MB/s",
                    compatibility: "PC & Mac"
                },
                ratings: { average: 4.4, count: 267 }
            },
            {
                name: "Webcam Privacy Cover",
                category: "accessories",
                price: 9.99,
                stock: 150,
                tags: ["privacy", "security", "accessories"],
                description: "Sliding webcam cover for laptops and tablets - 3 pack",
                images: ["https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400"],
                specifications: {
                    quantity: "3 pack",
                    thickness: "Ultra-thin 0.7mm",
                    adhesive: "Residue-free",
                    compatibility: "Universal"
                },
                ratings: { average: 4.2, count: 521 }
            },
            {
                name: "USB Hub 7-Port",
                category: "accessories",
                price: 34.99,
                stock: 75,
                tags: ["usb", "hub", "peripherals"],
                description: "Powered USB 3.0 hub with individual switches",
                images: ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400"],
                specifications: {
                    ports: "7 USB 3.0",
                    power: "12V adapter included",
                    speed: "5Gbps",
                    led: "Individual indicators"
                },
                ratings: { average: 4.5, count: 187 }
            },
            {
                name: "Laptop Stand Aluminum",
                category: "accessories",
                price: 39.99,
                stock: 90,
                tags: ["stand", "ergonomic", "accessories"],
                description: "Adjustable aluminum laptop stand with heat dissipation",
                images: ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400"],
                specifications: {
                    material: "Aluminum alloy",
                    adjustable: "6 height levels",
                    compatibility: "10-17 inch laptops",
                    design: "Heat dissipation"
                },
                ratings: { average: 4.6, count: 234 }
            },
            {
                name: "Graphics Tablet",
                category: "electronics",
                price: 219.99,
                stock: 20,
                tags: ["drawing", "tablet", "creative"],
                description: "Professional drawing tablet with 8192 pressure levels",
                images: ["https://images.unsplash.com/photo-1586717799252-bd134ad00e26?w=400"],
                specifications: {
                    active_area: "10 x 6.25 inch",
                    pressure_levels: "8192",
                    pen: "Battery-free",
                    hotkeys: "8 customizable"
                },
                ratings: { average: 4.7, count: 143 }
            },
            {
                name: "Power Bank 20000mAh",
                category: "accessories",
                price: 49.99,
                stock: 85,
                tags: ["charging", "portable", "battery"],
                description: "High-capacity power bank with fast charging and LED display",
                images: ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400"],
                specifications: {
                    capacity: "20000mAh",
                    output: "18W fast charge",
                    ports: "2x USB-A, 1x USB-C",
                    display: "LED percentage"
                },
                ratings: { average: 4.5, count: 378 }
            },
            {
                name: "Smart Light Bulbs 4-Pack",
                category: "home",
                price: 54.99,
                stock: 60,
                tags: ["lighting", "smart", "wifi"],
                description: "WiFi-enabled color-changing smart bulbs with voice control",
                images: ["https://images.unsplash.com/photo-1558089687-e106bf5a0d45?w=400"],
                specifications: {
                    quantity: "4 bulbs",
                    brightness: "800 lumens",
                    colors: "16 million",
                    voice_control: "Alexa & Google"
                },
                ratings: { average: 4.4, count: 298 }
            },
            {
                name: "Microphone - USB Condenser",
                category: "electronics",
                price: 79.99,
                stock: 35,
                tags: ["audio", "recording", "streaming"],
                description: "Professional USB microphone with pop filter and stand",
                images: ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400"],
                specifications: {
                    type: "Condenser",
                    pattern: "Cardioid",
                    sample_rate: "96kHz/24bit",
                    included: "Pop filter, stand"
                },
                ratings: { average: 4.6, count: 267 }
            },
            {
                name: "Cable Management Kit",
                category: "accessories",
                price: 19.99,
                stock: 120,
                tags: ["organization", "cables", "desk"],
                description: "Complete cable management solution with clips and sleeves",
                images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
                specifications: {
                    includes: "Clips, sleeves, ties",
                    cable_sleeve: "5ft x 2",
                    clips: "20 pieces",
                    adhesive: "3M tape"
                },
                ratings: { average: 4.3, count: 412 }
            },
            {
                name: "Ring Light with Tripod",
                category: "electronics",
                price: 59.99,
                stock: 45,
                tags: ["lighting", "streaming", "photography"],
                description: "10-inch LED ring light with adjustable tripod stand",
                images: ["https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400"],
                specifications: {
                    diameter: "10 inch",
                    brightness: "3 modes, 10 levels",
                    tripod: "Extendable to 63\"",
                    remote: "Bluetooth included"
                },
                ratings: { average: 4.5, count: 324 }
            },
            {
                name: "Screen Cleaning Kit",
                category: "accessories",
                price: 14.99,
                stock: 100,
                tags: ["cleaning", "maintenance", "accessories"],
                description: "Professional screen cleaning kit for electronics",
                images: ["https://images.unsplash.com/photo-1563089145-599997674d42?w=400"],
                specifications: {
                    includes: "Spray, cloth, brush",
                    solution: "200ml",
                    cloth: "Microfiber 2-pack",
                    safe_for: "All screens"
                },
                ratings: { average: 4.2, count: 189 }
            },
            {
                name: "Docking Station - Triple Display",
                category: "electronics",
                price: 189.99,
                stock: 22,
                tags: ["dock", "usb-c", "peripherals"],
                description: "Universal USB-C docking station with triple display support",
                images: ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400"],
                specifications: {
                    displays: "Triple 4K support",
                    ports: "HDMI, DP, USB-A x5",
                    power_delivery: "100W PD",
                    ethernet: "Gigabit"
                },
                ratings: { average: 4.7, count: 178 }
            },
            {
                name: "Mouse Pad XXL",
                category: "accessories",
                price: 24.99,
                stock: 95,
                tags: ["mousepad", "desk", "gaming"],
                description: "Extended gaming mouse pad with stitched edges",
                images: ["https://images.unsplash.com/photo-1586281010691-7c22e073bb0e?w=400"],
                specifications: {
                    size: "35.4\" x 15.7\"",
                    thickness: "4mm",
                    surface: "Micro-textured",
                    base: "Anti-slip rubber"
                },
                ratings: { average: 4.4, count: 456 }
            },
            {
                name: "Monitor Arm Mount",
                category: "accessories",
                price: 119.99,
                stock: 28,
                tags: ["monitor", "mount", "ergonomic"],
                description: "Dual monitor arm mount with gas spring and cable management",
                images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"],
                specifications: {
                    monitors: "Dual 32\" max",
                    weight_capacity: "20 lbs per arm",
                    adjustment: "360° rotation",
                    vesa: "75x75, 100x100"
                },
                ratings: { average: 4.6, count: 212 }
            }
        ];

        await Product.insertMany(sampleProducts);
        
        // Add to service inventory
        const service = getShoppingAssistantService();
        const products = await Product.find();
        products.forEach(p => {
            service.addProduct({
                id: p._id.toString(),
                ...p.toObject()
            });
        });
        
        logger.info(`Initialized ${sampleProducts.length} sample products`);
    }
}

// Handle OPTIONS preflight for CORS
app.options('*', cors());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Intelligent Shopping Assistant API',
        version: '1.0.0',
        endpoints: {
            session: '/api/session',
            cart: '/api/cart',
            products: '/api/products',
            assistant: '/api/assistant'
        }
    });
});

// Socket.io for real-time updates
const service = getShoppingAssistantService();

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join session room
    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        logger.info(`Socket ${socket.id} joined session ${sessionId}`);
    });

    // Cart update event
    socket.on('cart:update', async (data) => {
        try {
            const { sessionId, action, payload } = data;
            
            let result;
            switch (action) {
                case 'add':
                    result = await service.addToCart(sessionId, payload);
                    break;
                case 'update':
                    result = await service.updateCartItem(sessionId, payload.productId, payload.quantity);
                    break;
                case 'remove':
                    result = await service.removeFromCart(sessionId, payload.productId);
                    break;
            }

            if (result && result.success) {
                const session = service.getSession(sessionId);
                const evaluation = await service.evaluateCart(session);

                // Emit updates to all clients in the session room
                io.to(sessionId).emit('cart:updated', {
                    cart: session.cart.toJSON(),
                    evaluation
                });

                // Send suggestions
                if (evaluation.suggestions.length > 0) {
                    io.to(sessionId).emit('suggestions:update', evaluation.suggestions);
                }

                // Send recommendations
                if (evaluation.recommendations.length > 0) {
                    io.to(sessionId).emit('recommendations:update', evaluation.recommendations);
                }
            }
        } catch (error) {
            logger.error('Socket cart:update error:', error);
            socket.emit('error', { message: error.message });
        }
    });

    // Request rule evaluation
    socket.on('rules:request', async (data) => {
        try {
            const { sessionId } = data;
            const session = service.getSession(sessionId);
            const evaluation = await service.evaluateCart(session);

            socket.emit('rules:result', evaluation);
        } catch (error) {
            logger.error('Socket rules:request error:', error);
            socket.emit('error', { message: error.message });
        }
    });

    // Session heartbeat
    socket.on('session:heartbeat', (sessionId) => {
        try {
            const session = service.getSession(sessionId);
            socket.emit('session:alive', {
                sessionId,
                state: session.getStateName()
            });
        } catch (error) {
            socket.emit('error', { message: 'Session not found' });
        }
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// FIX: 404 handler should come BEFORE error handling middleware
// 404 handler - must come before error middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware - must come last
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3011;
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🔌 Socket.io ready on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = { app, io, server };
