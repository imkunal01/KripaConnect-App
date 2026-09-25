"""
Recommendation service.

Phase 4: hybrid retrieval (structured + semantic + lexical intent).

Pipeline:
1. Parse natural language query into structured constraints.
2. Filter catalogue with existing product service helpers.
3. Rank remaining products with weighted hybrid scoring.
"""

from __future__ import annotations

import logging
import re

from app.models.schema import ParsedFiltersOut, ProductOut
from app.rag.embeddings import EmbeddingService
from app.rag.generator import generate_answer
from app.rag.query_parser import parse_query
from app.rag.vector_store import ProductVectorStore
from app.services import product_service


_INTENT_TERMS = {
	"camera": {"camera", "webcam", "photo", "video", "lens", "4k"},
	"gaming": {"gaming", "game", "rgb", "performance", "mechanical"},
	"battery": {"battery", "charging", "charger", "rechargeable", "power"},
	"phone": {"phone", "phones", "mobile", "smartphone", "wireless"},
}

_STOP_WORDS = {
	"a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
	"by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
	"were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
	"can", "could", "will", "would", "shall", "should", "may", "might", "must",
	"i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
	"my", "your", "his", "their", "our", "mine", "yours", "ours", "theirs",
	"what", "which", "who", "whom", "this", "that", "these", "those",
	"give", "show", "find", "get", "tell", "best", "good", "top", "want", "need",
	"looking", "search", "please", "some", "any", "stuff", "thing", "things", "item", "items",
}

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> set[str]:
	raw = re.findall(r"[a-z0-9]+", text.lower())
	tokens = set(raw)
	for t in raw:
		if len(t) > 3 and t.endswith("s"):
			tokens.add(t[:-1])
		elif len(t) > 4 and t.endswith("es"):
			tokens.add(t[:-2])
	return tokens


def _meaningful_query_tokens(query_tokens: set[str]) -> set[str]:
	meaningful = query_tokens - _STOP_WORDS
	return meaningful if meaningful else query_tokens


def _normalize_scores(raw_scores: dict[str, float]) -> dict[str, float]:
	if not raw_scores:
		return {}
	max_val = max(raw_scores.values())
	if max_val < 0.25:
		return {item_id: max(0.0, score) for item_id, score in raw_scores.items()}
	values = list(raw_scores.values())
	lo = min(values)
	hi = max(values)
	if hi - lo < 1e-9:
		return {item_id: max(0.0, score) for item_id, score in raw_scores.items()}
	return {item_id: max(0.0, (score - lo) / (hi - lo)) for item_id, score in raw_scores.items()}


def _lexical_overlap_score(query_tokens: set[str], candidate_tokens: set[str]) -> float:
	meaningful = _meaningful_query_tokens(query_tokens)
	if not meaningful or not candidate_tokens:
		return 0.0
	overlap = meaningful & candidate_tokens
	return len(overlap) / len(meaningful)


def _intent_match_score(query_tokens: set[str], candidate_tokens: set[str]) -> float:
	query_intents = [
		intent_name
		for intent_name, terms in _INTENT_TERMS.items()
		if query_tokens & terms
	]
	if not query_intents:
		return 0.0

	matched = 0
	for intent_name in query_intents:
		if candidate_tokens & _INTENT_TERMS[intent_name]:
			matched += 1
	return matched / len(query_intents)


def _product_to_semantic_text(product: ProductOut) -> str:
	"""Build rich text used for embeddings and lexical signals."""
	tags = " ".join(product.tags)
	return f"{product.name}. Category: {product.category}. {product.description}. Tags: {tags}"


def _build_why_lines(query: str, products: list[ProductOut]) -> list[str]:
	if not products:
		return ["No products satisfied the current query constraints."]

	query_tokens = _meaningful_query_tokens(_tokenize(query))
	lines: list[str] = []
	for product in products[:3]:
		product_tokens = _tokenize(_product_to_semantic_text(product))
		overlap = sorted(query_tokens & product_tokens)
		reason_bits = [
			f"rating {product.rating:.1f}/5",
			f"price {product.price:.2f}",
		]
		if overlap:
			reason_bits.append("matches: " + ", ".join(overlap[:4]))
		lines.append(f"{product.name}: " + "; ".join(reason_bits))
	return lines


def _build_comparison_lines(products: list[ProductOut]) -> list[str]:
	rows: list[str] = []
	for product in products[:3]:
		tags = ", ".join(product.tags[:3]) if product.tags else "-"
		rows.append(
			f"{product.name} | price {product.price:.2f} | rating {product.rating:.1f}/5 | "
			f"stock {product.stock} | tags {tags}"
		)
	return rows


def recommend_products(query: str, *, limit: int = 10) -> tuple[ParsedFiltersOut, int, list[ProductOut]]:
	"""Return products ranked by hybrid score after structured filtering."""
	logger.info("[RAG Pipeline] Processing recommendation query: '%s' (limit=%d)", query, limit)
	known_categories = product_service.get_categories()
	parsed = parse_query(query, known_categories)
	logger.info(
		"[Parser] Detected constraints: category=%s, min_price=%s, max_price=%s",
		parsed.category,
		parsed.min_price,
		parsed.max_price,
	)

	# Structured filter narrows candidate pool before semantic ranking.
	total, filtered_products = product_service.list_products(
		category=parsed.category,
		min_price=parsed.min_price,
		max_price=parsed.max_price,
		limit=10000,
	)
	logger.info(
		"[Catalog] Retrieved %d candidates (out of %d total in catalog)",
		len(filtered_products),
		total,
	)

	parsed_filters = ParsedFiltersOut(
		category=parsed.category,
		min_price=parsed.min_price,
		max_price=parsed.max_price,
	)

	if total == 0 or not filtered_products:
		logger.warning("[Catalog] No products matched criteria for query: '%s'", query)
		return parsed_filters, 0, []

	embedder = EmbeddingService()
	candidate_texts = [_product_to_semantic_text(product) for product in filtered_products]
	candidate_ids = [product.id for product in filtered_products]
	candidate_embeddings = embedder.embed_texts(candidate_texts)

	store = ProductVectorStore(dim=embedder.dimension)
	store.add(candidate_ids, candidate_embeddings)

	query_embedding = embedder.embed_query(query)
	hits = store.search(query_embedding, k=len(filtered_products))
	logger.info(
		"[Vector Store] Embedded and searched %d items with dim=%d",
		len(candidate_texts),
		embedder.dimension,
	)

	semantic_raw = {hit.item_id: hit.score for hit in hits}
	semantic_scores = _normalize_scores(semantic_raw)
	query_tokens = _tokenize(query)
	is_semantic = embedder.dimension > 0 and getattr(embedder, "_model", None) is not None

	hybrid_scored: list[tuple[float, ProductOut]] = []
	for product in filtered_products:
		item_id = product.id
		text_tokens = _tokenize(_product_to_semantic_text(product))

		raw_sem = semantic_raw.get(item_id, 0.0)
		semantic_score = semantic_scores.get(item_id, 0.0)
		lexical_score = _lexical_overlap_score(query_tokens, text_tokens)
		intent_score = _intent_match_score(query_tokens, text_tokens)
		rating_score = max(0.0, min(product.rating / 5.0, 1.0))

		# Relevance validation:
		is_cat_match = bool(parsed.category) and (product.category.lower() == parsed.category.lower())
		has_lexical = lexical_score > 0.0
		has_intent = intent_score > 0.0
		has_semantic = (raw_sem >= 0.35) if is_semantic else False

		# Exclude products that have zero genuine relevance to the query
		if not (is_cat_match or has_lexical or has_intent or has_semantic):
			continue

		# Weighted rank fusion for hybrid retrieval.
		hybrid_score = (
			0.60 * semantic_score
			+ 0.20 * lexical_score
			+ 0.15 * intent_score
			+ 0.05 * rating_score
		)
		hybrid_scored.append((hybrid_score, product))

	if not hybrid_scored:
		logger.warning("[Ranker] No products passed relevance threshold for query: '%s'", query)
		return parsed_filters, 0, []

	hybrid_scored.sort(key=lambda x: (x[0], x[1].rating, -x[1].price), reverse=True)
	ranked_products = [product for _, product in hybrid_scored[:limit]]

	top_summary = ", ".join(f"{p.name} (₹{p.price})" for p in ranked_products[:3])
	logger.info(
		"[Ranker] Hybrid ranking complete. Top recommendations: [%s]",
		top_summary if top_summary else "none",
	)

	return parsed_filters, len(hybrid_scored), ranked_products


def build_recommendation_response(query: str, *, limit: int = 10) -> dict:
	"""End-to-end recommendation payload with answer and explainability."""
	try:
		parsed_filters, total, products = recommend_products(query, limit=limit)

		if not products:
			category_note = f" in category '{parsed_filters.category}'" if parsed_filters.category else ""
			return {
				"query": query,
				"parsed_filters": parsed_filters,
				"answer": f"No products matching '{query}'{category_note} were found in the catalog.",
				"total": 0,
				"count": 0,
				"top_products": [],
				"why_recommended": [],
				"comparison": [],
				"products": [],
			}

		answer = generate_answer(query, products[:3])
		why_recommended = _build_why_lines(query, products)
		comparison = _build_comparison_lines(products)

		logger.info(
			"[RAG Pipeline] Completed successfully: %d products returned (total matches: %d)",
			len(products),
			total,
		)
		return {
			"query": query,
			"parsed_filters": parsed_filters,
			"answer": answer,
			"total": total,
			"count": len(products),
			"top_products": products[:3],
			"why_recommended": why_recommended,
			"comparison": comparison,
			"products": products,
		}
	except Exception as exc:
		logger.exception("Failed to build recommendation response", extra={"query": query})
		fallback_answer = (
			"I could not generate a complete recommendation right now. "
			"Please try again with a slightly different query."
		)
		return {
			"query": query,
			"parsed_filters": ParsedFiltersOut(),
			"answer": fallback_answer,
			"total": 0,
			"count": 0,
			"top_products": [],
			"why_recommended": ["Recommendation pipeline error handled safely."],
			"comparison": [],
			"products": [],
		}
