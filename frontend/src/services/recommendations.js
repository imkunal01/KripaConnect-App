import { apiFetch } from './api'

/**
 * Fetch smart natural language product recommendations.
 *
 * @param {string} query - Natural language search query
 * @param {number} limit - Maximum number of products to return
 * @returns {Promise<Object>} Recommendation payload with answer, top_products, and products
 */
export async function getSmartRecommendations(query, limit = 10) {
  try {
    const res = await apiFetch('/api/recommend', {
      method: 'POST',
      body: { query, limit },
      noThrow: true,
    })

    if (res?.ok && res?.data) {
      return res.data
    }

    return {
      query,
      answer: 'Showing matching products from catalogue.',
      products: [],
      top_products: [],
      why_recommended: [],
      comparison: [],
      count: 0,
      total: 0,
    }
  } catch (err) {
    console.warn('[Smart Recommendations] Request failed:', err)
    return {
      query,
      answer: 'Failed to retrieve recommendations. Please try standard search.',
      products: [],
      top_products: [],
      why_recommended: [],
      comparison: [],
      count: 0,
      total: 0,
    }
  }
}

/**
 * Fetch smart similar products for a specific product ID.
 *
 * @param {string} productId - The product ID
 * @param {number} limit - Maximum similar items
 * @returns {Promise<Array>} Array of similar products
 */
export async function getSimilarProductRecommendations(productId, limit = 6) {
  try {
    const res = await apiFetch(`/api/recommend/similar/${productId}?limit=${limit}`, {
      method: 'GET',
      noThrow: true,
    })

    if (res?.ok && res?.data?.products) {
      return res.data.products
    }
    return []
  } catch (err) {
    console.warn('[Similar Products] Request failed:', err)
    return []
  }
}
