"""product_service.py — remote product source service.

This service uses PRODUCTS_API_URL as the only source of truth.
No local products.json fallback is used.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import List, Optional
from urllib import error, request

from app.models.schema import ProductCreate, ProductOut

def _get_api_url() -> str:
    return (os.getenv("PRODUCTS_API_URL") or "http://localhost:5000/api/products").strip()

def _get_timeout() -> float:
    return float(os.getenv("PRODUCTS_API_TIMEOUT_SECONDS", "3.0"))

def _get_sync_interval() -> float:
    return float(os.getenv("PRODUCTS_SYNC_INTERVAL_SECONDS", "30"))

_products: List[dict] = []
_last_remote_sync_ts: float = 0.0
logger = logging.getLogger(__name__)


class ProductSourceUnavailableError(RuntimeError):
    """Raised when the external product source cannot be reached."""


def _coerce_product_dict(item: dict) -> Optional[dict]:
    """Validate and normalize a product payload item from external source (MongoDB / Node.js)."""
    try:
        # Extract product ID from id or MongoDB _id
        raw_id = item.get("id") or item.get("_id")
        if not raw_id:
            return None
        item_id = str(raw_id)

        # Extract category name from string or populated object
        cat_val = item.get("category") or item.get("Category") or item.get("category_id")
        if isinstance(cat_val, dict):
            category_name = cat_val.get("name") or cat_val.get("slug") or "General"
        elif cat_val:
            category_name = str(cat_val)
        else:
            category_name = "General"

        name = str(item.get("name") or "").strip()
        if not name:
            return None

        description = str(item.get("description") or name).strip()
        price = float(item.get("price") or 0.0)
        if price <= 0:
            price = 1.0  # Ensure valid price for schema validation

        stock = int(item.get("stock") or 0)
        rating = float(item.get("rating") or 0.0)
        tags = item.get("tags") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        normalized = {
            "id": item_id,
            "name": name,
            "category": category_name,
            "price": price,
            "stock": stock,
            "rating": rating,
            "description": description,
            "tags": tags,
        }
        product = ProductOut(**normalized)
        return product.model_dump()
    except Exception as exc:
        logger.debug("Failed to coerce product dict: %s", exc)
        return None


def _fetch_remote_products() -> Optional[List[dict]]:
    """Fetch products from external backend API and normalize response shape."""
    api_url = _get_api_url()
    if not api_url:
        logger.warning("[Product Service] PRODUCTS_API_URL is not set. Cannot fetch products.")
        return None

    logger.info("[Product Service] Fetching catalogue from %s ...", api_url)
    req = request.Request(api_url, method="GET")
    try:
        with request.urlopen(req, timeout=_get_timeout()) as response:
            raw = response.read().decode("utf-8")
    except (error.HTTPError, error.URLError, TimeoutError, ValueError) as exc:
        logger.warning(
            "[Product Service] Could not connect to '%s' (%s). Backend might be starting or offline.",
            api_url,
            exc,
        )
        return None

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("[Product Service] Invalid JSON received from '%s': %s", api_url, exc)
        return None

    # Accept raw list or envelope with 'items' (Node.js MERN backend) or 'products'
    if isinstance(payload, list):
        items = payload
    elif isinstance(payload, dict):
        if isinstance(payload.get("items"), list):
            items = payload["items"]
        elif isinstance(payload.get("products"), list):
            items = payload["products"]
        else:
            logger.warning("[Product Service] API returned unknown envelope keys: %s", list(payload.keys()))
            return None
    else:
        logger.error("[Product Service] Unsupported payload shape from %s", api_url)
        return None

    normalized: List[dict] = []
    for item in items:
        if isinstance(item, dict):
            parsed = _coerce_product_dict(item)
            if parsed is not None:
                normalized.append(parsed)

    logger.info(
        "[Product Service] Successfully normalized %d products from remote (received %d raw items)",
        len(normalized),
        len(items),
    )
    return normalized


def _refresh_from_remote_if_needed(force: bool = False) -> None:
    """Sync products from external API at most once per configured interval."""
    global _products, _last_remote_sync_ts
    now = time.time()
    if not force and now - _last_remote_sync_ts < _get_sync_interval():
        return

    remote_products = _fetch_remote_products()
    _last_remote_sync_ts = now
    if remote_products is not None:
        _products = remote_products
        logger.info("[Product Service] Product cache refreshed with %d items.", len(_products))
        return

    # Remote is unavailable; log warning without crashing
    if not _products:
        logger.warning(
            "[Product Service] External product API '%s' is unavailable and in-memory cache is empty.",
            _get_api_url(),
        )



# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def list_products(
    *,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[int, List[ProductOut]]:
    """
    Return (total_matching, paginated_page) after optional filtering.

    Parameters
    ----------
    category  : case-insensitive exact match on product.category
    tag       : products whose tags list contains this value (case-insensitive)
    min_price : inclusive lower bound on price
    max_price : inclusive upper bound on price
    skip      : offset for pagination
    limit     : page size (max items to return)
    """
    _refresh_from_remote_if_needed()
    results = _products

    if category:
        results = [p for p in results if p["category"].lower() == category.lower()]

    if tag:
        results = [p for p in results if tag.lower() in [t.lower() for t in p.get("tags", [])]]

    if min_price is not None:
        results = [p for p in results if p["price"] >= min_price]

    if max_price is not None:
        results = [p for p in results if p["price"] <= max_price]

    total = len(results)
    page = results[skip : skip + limit]

    return total, [ProductOut(**item) for item in page]


def get_product(product_id: str) -> Optional[ProductOut]:
    """Return a single product by its ID, or None if not found."""
    _refresh_from_remote_if_needed()
    for p in _products:
        if p["id"].upper() == product_id.upper():
            return ProductOut(**p)
    return None


def add_product(payload: ProductCreate) -> ProductOut:
    """Create operation is not supported by this service in remote-only mode."""
    raise NotImplementedError("POST /api/products is disabled. Use your external products backend API.")


def get_categories() -> List[str]:
    """Return unique categories currently present in the catalogue."""
    _refresh_from_remote_if_needed()
    seen = set()
    categories: List[str] = []
    for product in _products:
        category = product.get("category")
        if isinstance(category, str) and category not in seen:
            seen.add(category)
            categories.append(category)
    return categories
