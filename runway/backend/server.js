import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Path to scraped Jumia data file ---
const PRODUCTS_FILE = path.join(process.cwd(), "jumia_catalog_all.json");

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
 * Applies price adjustment rules and category detection.
 */
const transformProductData = (rawProduct, index) => {
  const basePrice = parsePrice(rawProduct.price);
  let adjustedPrice = basePrice;

  // 💰 Dynamic markup rules
  if (basePrice <= 1000) {
    adjustedPrice += 250;
  } else if (basePrice > 1000 && basePrice <= 3000) {
    adjustedPrice += 550;
  } else if (basePrice > 3000) {
    adjustedPrice += 700;
  }

  // Determine category from keyword or fallback to first word in title
  const category =
    rawProduct.keyword?.trim() ||
    (rawProduct.title?.split(" ")[0] ?? "Uncategorized");

  // Capitalize category
  const formattedCategory =
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return {
    id: index + 1,
    name: rawProduct.title,
    description: rawProduct.title || "No description available.",
    price: adjustedPrice,
    originalPrice: basePrice, // show pre-markup price as "discounted from"
    image: rawProduct.image,
    images: [rawProduct.image],
    category: formattedCategory,
    brand: rawProduct.source || "Unknown",
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
    quantity: 50,
    rating: 4.5,
    reviewCount: Math.floor(Math.random() * 200) + 10,
  };
};

/**
 * Read and transform products from jumia_catalog_all.json
 */
const readAndTransformProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const rawProducts = JSON.parse(data);
    return Array.isArray(rawProducts)
      ? rawProducts.map(transformProductData)
      : [];
  } catch (error) {
    console.error("❌ Error reading or transforming products.json:", error.message);
    return [];
  }
};

/**
 * --- GET /api/products ---
 * Supports category, search, min/max price, and pagination
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
 * --- GET /api/products/:id ---
 * Returns a single product
 */
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const products = await readAndTransformProducts();
    const product = products.find((p) => p.id === parseInt(id));

    if (!product)
      return res.status(404).json({
        error: "Product not found",
        details: `Product with ID ${id} not found`,
      });

    res.json(product);
  } catch (error) {
    console.error("Product fetch error:", error.message);
    res.status(500).json({
      error: "Failed to fetch product",
      details: error.message,
    });
  }
});

/**
 * --- GET /api/categories ---
 * Builds a list of categories dynamically from keywords
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
      productCount: count,
    }));

    // Add "All Products"
    categories.unshift({
      id: "all",
      name: "All Products",
      slug: "all",
      productCount: products.length,
    });

    res.json(categories);
  } catch (error) {
    console.error("Categories error:", error.message);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });
  }
});

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Aura Dropshipping API",
    timestamp: new Date().toISOString(),
    dataSource: "Local Jumia JSON File",
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Aura Server running on port ${PORT}`);
  console.log(`📦 Data Source: jumia_catalog_all.json`);
  console.log(`🌐 Products API: http://localhost:${PORT}/api/products`);
});
