const Product = require("../models/Product");

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000/api/recommend";
const RAG_TIMEOUT_MS = parseInt(process.env.RAG_TIMEOUT_MS || "3500", 10);

/**
 * Format MongoDB product documents into the standard recommendation shape.
 */
function formatProduct(p) {
  const catName = p.Category?.name || (typeof p.Category === "string" ? p.Category : "General");
  return {
    id: p._id.toString(),
    _id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    category: catName,
    price: p.price,
    retailer_price: p.retailer_price || p.price,
    stock: p.stock || 0,
    rating: 4.5,
    description: p.description || "",
    tags: p.tags || [],
    images: p.images || [],
  };
}

/**
 * Fallback recommendation engine using native MongoDB queries when RAG microservice is unavailable.
 */
async function fallbackDatabaseRecommendations(queryString, limit = 10) {
  const cleanQuery = (queryString || "").trim();
  const filter = { active: true };

  if (cleanQuery) {
    const regex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { name: regex },
      { description: regex },
      { tags: regex },
    ];
  }

  const items = await Product.find(filter)
    .populate("Category", "name slug")
    .limit(limit)
    .lean();

  const formatted = items.map(formatProduct);
  const top = formatted.slice(0, 3);

  return {
    query: cleanQuery,
    parsed_filters: {
      category: null,
      min_price: null,
      max_price: null,
    },
    answer: top.length > 0
      ? `Here are top recommendations matching "${cleanQuery}": ${top.map(p => p.name).join(", ")}.`
      : `No direct matches found for "${cleanQuery}". Showing general popular products.`,
    total: formatted.length,
    count: formatted.length,
    top_products: top,
    why_recommended: top.map(
      p => `${p.name}: Available in stock at ₹${p.price.toLocaleString("en-IN")} in ${p.category}.`
    ),
    comparison: top.map(
      p => `${p.name} | price ₹${p.price} | stock ${p.stock} | category ${p.category}`
    ),
    products: formatted,
    source: "database_fallback",
  };
}

/**
 * POST /api/recommend
 * Query RAG microservice for smart recommendations with resilient MongoDB fallback.
 */
async function getRecommendations(req, res) {
  const { query, limit = 10 } = req.body || {};
  const cleanQuery = (query || "").trim();

  if (!cleanQuery) {
    return res.status(400).json({ message: "Query string is required." });
  }

  console.log(`[Recommend Gateway] --> POST /api/recommend | query="${cleanQuery}" | limit=${limit}`);
  const startTime = Date.now();

  // Attempt to call RAG microservice
  try {
    const response = await fetch(RAG_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQuery, limit: Number(limit) || 10 }),
      signal: AbortSignal.timeout(RAG_TIMEOUT_MS),
    });

    const elapsed = Date.now() - startTime;
    if (response.ok) {
      const data = await response.json();
      console.log(
        `[Recommend Gateway] <-- RAG microservice responded in ${elapsed}ms | returned ${data.products?.length || 0} products`
      );

      // Enrich products with full MongoDB data (images, slug, categories, etc.)
      const productIds = (data.products || []).map(p => p.id || p._id).filter(Boolean);
      let enrichedProducts = data.products || [];
      if (productIds.length > 0) {
        try {
          const dbProducts = await Product.find({ _id: { $in: productIds } })
            .populate("Category", "name slug")
            .lean();
          const dbMap = new Map(dbProducts.map(p => [p._id.toString(), p]));
          enrichedProducts = enrichedProducts.map(p => {
            const dbItem = dbMap.get(String(p.id || p._id));
            if (dbItem) {
              return {
                ...formatProduct(dbItem),
                ...p,
                images: dbItem.images || [],
                Category: dbItem.Category,
                slug: dbItem.slug,
                price: dbItem.price,
                retailer_price: dbItem.retailer_price || dbItem.price,
                price_bulk: dbItem.price_bulk,
                min_bulk_qty: dbItem.min_bulk_qty,
                stock: dbItem.stock,
              };
            }
            return p;
          });
        } catch (enrichErr) {
          console.warn("[Recommend Gateway] Product enrichment warning:", enrichErr.message);
        }
      }

      const topProductIds = (data.top_products || []).map(p => p.id || p._id).filter(Boolean);
      let enrichedTop = data.top_products || [];
      if (topProductIds.length > 0) {
        enrichedTop = enrichedTop.map(p => {
          const matched = enrichedProducts.find(ep => String(ep.id || ep._id) === String(p.id || p._id));
          return matched || p;
        });
      }

      return res.json({
        ...data,
        products: enrichedProducts,
        top_products: enrichedTop,
        source: "rag_microservice",
      });
    }

    console.warn(
      `[Recommend Gateway] RAG microservice returned HTTP ${response.status} (${elapsed}ms). Switching to DB fallback.`
    );
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.warn(
      `[Recommend Gateway] RAG microservice unavailable after ${elapsed}ms (${err.message}). Switching to DB fallback.`
    );
  }

  // Graceful degradation to MongoDB search
  try {
    const fallbackData = await fallbackDatabaseRecommendations(cleanQuery, Number(limit) || 10);
    console.log(
      `[Recommend Gateway] <-- MongoDB fallback complete | returned ${fallbackData.products?.length || 0} products`
    );
    return res.json(fallbackData);
  } catch (dbErr) {
    console.error("[Recommend Gateway] Fallback Search Error:", dbErr);
    return res.status(500).json({ message: "Failed to retrieve recommendations." });
  }
}

/**
 * GET /api/recommend/similar/:productId
 * Fetch smart similar products for a given product ID.
 */
async function getSimilarProducts(req, res) {
  const { productId } = req.params;
  const { limit = 6 } = req.query;

  try {
    const currentProduct = await Product.findById(productId)
      .populate("Category", "name slug")
      .lean();

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    const catName = currentProduct.Category?.name || "";
    const query = `${currentProduct.name} ${catName}`.trim();

    // Try RAG service
    try {
      const response = await fetch(RAG_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: Number(limit) + 1 }),
        signal: AbortSignal.timeout(RAG_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        // Exclude current product from recommendations
        const filteredProducts = (data.products || []).filter(
          p => p.id !== productId && p._id !== productId
        );
        return res.json({
          ...data,
          products: filteredProducts.slice(0, Number(limit)),
          count: Math.min(filteredProducts.length, Number(limit)),
          source: "rag_microservice",
        });
      }
    } catch {
      // RAG failed, proceed to DB fallback
    }

    // DB Fallback: find products in same category or matching tags
    const fallbackFilter = {
      _id: { $ne: currentProduct._id },
      active: true,
    };

    if (currentProduct.Category) {
      fallbackFilter.Category = currentProduct.Category._id || currentProduct.Category;
    }

    const similarItems = await Product.find(fallbackFilter)
      .populate("Category", "name slug")
      .limit(Number(limit))
      .lean();

    const formatted = similarItems.map(formatProduct);

    return res.json({
      query,
      answer: `Showing similar products to ${currentProduct.name}.`,
      products: formatted,
      count: formatted.length,
      source: "database_fallback",
    });
  } catch (err) {
    console.error("[Similar Products Error]", err);
    return res.status(500).json({ message: "Failed to fetch similar products." });
  }
}

module.exports = {
  getRecommendations,
  getSimilarProducts,
};
