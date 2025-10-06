import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { Buffer } from "buffer";
import puppeteer from "puppeteer"; // for this import for automation

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- File Paths ---
const PRODUCTS_FILE = path.join(process.cwd(), "jumia_catalog_all.json");
const ORDERS_FILE = path.join(process.cwd(), "orders.json");
const CATEGORIES_FILE = path.join(process.cwd(), "categories.json");

// --- Utility Functions ---

/**
 * Parse price strings like "KSh 1,500" into a number
 */
const parsePrice = (priceStr) => {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const match = priceStr.replace(/,/g, "").match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * Transform raw scraped data → structured format for frontend
 */
const transformProductData = (rawProduct, index) => {
  const basePrice = parsePrice(rawProduct.price);
  let adjustedPrice = basePrice;

  // Dynamic pricing rules
  if (basePrice <= 1000) {
    adjustedPrice += 250;
  } else if (basePrice > 1000 && basePrice <= 3000) {
    adjustedPrice += 550;
  } else if (basePrice > 3000) {
    adjustedPrice += 700;
  }

  // Determine category
  const category = rawProduct.keyword?.trim() || 
                  rawProduct.title?.split(" ")[0] || 
                  "Uncategorized";

  const formattedCategory = category.charAt(0).toUpperCase() + 
                           category.slice(1).toLowerCase();

  return {
    id: index + 1,
    name: rawProduct.title || "Untitled Product",
    description: rawProduct.title || "No description available.",
    price: Math.round(adjustedPrice),
    originalPrice: basePrice,
    image: rawProduct.image || "https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image",
    images: [rawProduct.image].filter(Boolean),
    category: formattedCategory,
    brand: rawProduct.source || "Generic",
    supplier: {
      name: rawProduct.source || "Third-party Seller",
      location: "Kenya",
      rating: 4.5,
    },
    shipping: {
      time: "3-7 days",
      cost: 5.99,
      express: true,
    },
    inStock: true,
    quantity: Math.floor(Math.random() * 50) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
    reviewCount: Math.floor(Math.random() * 200) + 10,
    features: [],
    specifications: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceUrl: rawProduct.link || `https://www.jumia.co.ke/product/${index + 1}` // Assume or add product URL
  };
};

/**
 * Read and transform products from JSON file
 */
const readAndTransformProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const rawProducts = JSON.parse(data);
    return Array.isArray(rawProducts) ? rawProducts.map(transformProductData) : [];
  } catch (error) {
    console.error("❌ Error reading products file:", error.message);
    return [];
  }
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
  const products = await readAndTransformProducts();
  return products.find(p => p.id === parseInt(id));
};

/**
 * Read orders from JSON file
 */
const readOrders = async () => {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error("❌ Error reading orders:", error.message);
    return [];
  }
};

/**
 * Write orders to JSON file
 */
const writeOrders = async (orders) => {
  try {
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing orders:", error.message);
    return false;
  }
};

/**
 * Generate unique order ID
 */
const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Validate phone number format
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(07\d{8}|2547\d{8}|\+2547\d{8}|011\d{7})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format phone number for M-Pesa (254 format)
 */
const formatPhoneForMpesa = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+254')) {
    return cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Simulate M-Pesa STK Push (Testing Mode)
 */
const simulateMpesaStkPush = async (phone, amount, orderId) => {
  console.log(`Simulating M-Pesa STK Push for order ${orderId}`);
  console.log(`Phone: ${phone}, Amount: KSh ${amount}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    ResponseCode: "0",
    ResponseDescription: "Success",
    MerchantRequestID: `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    CheckoutRequestID: `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    CustomerMessage: "Please enter your M-Pesa PIN to complete the payment."
  };
};

/**
 * Real M-Pesa STK Push Implementation
 */
const initiateRealMpesaStkPush = async (phone, amount, orderId) => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa-callback';

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenRes.json();

    // Generate password and timestamp
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // STK Push request
    const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formatPhoneForMpesa(phone),
        PartyB: shortcode,
        PhoneNumber: formatPhoneForMpesa(phone),
        CallBackURL: `${callbackUrl}?orderId=${orderId}`,
        AccountReference: orderId,
        TransactionDesc: 'Payment for AURA order'
      })
    });

    if (!stkRes.ok) {
      throw new Error('STK Push request failed');
    }

    return await stkRes.json();
  } catch (err) {
    console.error('M-Pesa STK Push error:', err);
    throw new Error(`M-Pesa payment initiation failed: ${err.message}`);
  }
};

/**
 * Automate order placement on Jumia (testing simulation)
 * we will use Puppeteer to place order in production
 */
const automateJumiaOrder = async (order) => {
  console.log(`Automating Jumia order for AURA order ${order.id}`);

  // Simulate for testing (no real purchase)
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate delay

  const fulfillment = {
    status: 'fulfilled',
    jumiaOrderId: `JUM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    trackingNumber: `TRK-${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Order placed successfully on Jumia (simulated for testing)'
  };

  // For real automation (uncomment and configure):
  /*
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login to Jumia (use env vars for credentials)
    await page.goto('https://www.jumia.co.ke/customer/account/login/');
    await page.type('#input_identifierValue', process.env.JUMIA_EMAIL);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.type('#input_password', process.env.JUMIA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    let totalCost = 0;
    for (const item of order.items) {
      await page.goto(item.sourceUrl); // Assume sourceUrl in product
      await page.click('button.add-to-cart'); // Selector may vary
      totalCost += item.totalPrice;
    }

    await page.goto('https://www.jumia.co.ke/cart/');
    await page.click('button.checkout');

    // Fill shipping
    await page.type('#shipping-address', order.shippingAddress.address);
    await page.type('#shipping-city', order.shippingAddress.city);
    // etc.

    // Payment (assume COD or pre-configured)
    await page.click('button.confirm-order');

    // Get confirmation
    await page.waitForSelector('.order-confirmation');
    const jumiaOrderId = await page.evaluate(() => document.querySelector('.order-id').textContent);

    fulfillment = {
      status: 'fulfilled',
      jumiaOrderId,
      totalCost,
      message: 'Real order placed on Jumia'
    };

  } catch (err) {
    fulfillment = {
      status: 'failed',
      error: err.message
    };
  } finally {
    await browser.close();
  }
  */

  return fulfillment;
};

// --- API Routes ---

/**
 * GET /api/health - Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Aura Dropshipping API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

/**
 * GET /api/products - Get products with filtering, search, and pagination
 */
app.get("/api/products", async (req, res) => {
  try {
    const {
      category,
      search,
      min_price,
      max_price,
      page = 1,
      per_page = 48,
    } = req.query;

    let products = await readAndTransformProducts();

    // Apply filters
    if (category && category !== "all") {
      products = products.filter((p) =>
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm) ||
          p.brand?.toLowerCase().includes(searchTerm)
      );
    }

    if (min_price) {
      products = products.filter((p) => p.price >= parseFloat(min_price));
    }

    if (max_price) {
      products = products.filter((p) => p.price <= parseFloat(max_price));
    }

    // --- Pagination ---
    const total = products.length;
    const total_pages = Math.max(1, Math.ceil(total / per_page));
    const start = (page - 1) * per_page;
    const end = start + parseInt(per_page);
    const paginatedProducts = products.slice(start, end);

    res.json({
      products: paginatedProducts,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total,
        total_pages,
      },
      total_count: total,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
});

/**
 * GET /api/products/:id - Get single product by ID
 */
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
        details: `Product with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Product fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
      details: error.message
    });
  }
});

/**
 * GET /api/categories - Get all categories with counts
 */
app.get("/api/categories", async (req, res) => {
  try {
    const products = await readAndTransformProducts();

    const categoryCount = {};
    products.forEach((p) => {
      const category = p.category || "Uncategorized";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categories = Object.entries(categoryCount).map(([name, count]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      productCount: count
    }));

    // Add "All Products"
    categories.unshift({
      id: "all",
      name: "All Products",
      slug: "all",
      productCount: products.length
    });

    res.json(categories);
  } catch (error) {
    console.error("Categories error:", error.message);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message
    });
  }
});

/**
 * GET /api/orders - Get all orders (admin) or filtered by customer
 */
app.get("/api/orders", async (req, res) => {
  try {
    const { customerPhone } = req.query;
    let orders = await readOrders();

    if (customerPhone) {
      orders = orders.filter(o => o.customerInfo.phone === customerPhone);
    }

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Orders fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      details: error.message
    });
  }
});

/**
 * POST /api/orders - Create new order
 */
app.post("/api/orders", async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, customerInfo, paymentInfo } = req.body;

    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    if (!product.inStock) return res.status(400).json({ success: false, error: 'Product out of stock' });

    const order = {
      id: generateOrderId(),
      productId,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      shippingAddress,
      customerInfo,
      status: 'pending',
      trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    let paymentResponse = null;
    if (paymentInfo.method === 'mpesa') {
      paymentResponse = await simulateMpesaStkPush(paymentInfo.details, order.totalPrice, order.id);
    }

    // Automate fulfillment
    const fulfillment = await automateJumiaOrder(order);
    order.fulfillment = fulfillment;

    // Save order
    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);

    res.json({
      success: true,
      order,
      message: 'Order created successfully',
      fulfillmentConfirmation: fulfillment
    });

  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create order', details: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Aura Server running on port ${PORT}`);
  console.log(`Data Source: jumia_catalog_all.json`);
  console.log(`Products API: http://localhost:${PORT}/api/products`);
});
