"""
LLM generation layer for recommendation answers.

Design goals:
* Grounded generation: only use retrieved products as source of truth
* Low hallucination: explicit constraints in prompt
* Safe fallback: deterministic answer when Gemini/env is unavailable
"""

from __future__ import annotations

import json
import logging
import os
import time
from urllib import error, request

from app.models.schema import ProductOut
from app.utils.helpers import chunk_by_char_budget, truncate_text

logger = logging.getLogger("rag.generator")

_SYSTEM_PROMPT = (
    "You are a product recommendation assistant. "
    "Use ONLY the provided product context. "
    "Do not invent specs or products. "
    "If context is insufficient, say so clearly."
)


def _build_product_context(products: list[ProductOut], *, max_items: int = 6, max_chars: int = 3200) -> str:
    rows: list[str] = []
    for i, product in enumerate(products[:max_items], start=1):
        row = {
            "rank": i,
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "price": product.price,
            "rating": product.rating,
            "stock": product.stock,
            "description": truncate_text(product.description, 220),
            "tags": product.tags,
        }
        rows.append(json.dumps(row, ensure_ascii=True))

    return "\n".join(chunk_by_char_budget(rows, max_chars))


def _fallback_answer(query: str, products: list[ProductOut]) -> str:
    if not products:
        return f"No products matching '{query}' were found in the catalog."

    best = products[0]
    alternatives = ", ".join(product.name for product in products[1:3])
    if alternatives:
        return f"Top match: {best.name}. You can also explore {alternatives}."
    return f"Top match: {best.name}."


def _call_groq(prompt: str, *, timeout_seconds: int = 15) -> str:
    """Call Groq chat completions API and return plain text output."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not api_key.strip():
        logger.info("[LLM] GROQ_API_KEY not configured. Skipping Groq call.")
        return ""

    configured_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    candidate_models = [configured_model]
    for fallback in ["openai/gpt-oss-120b", "groq/compound", "openai/gpt-oss-20b"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    url = "https://api.groq.com/openai/v1/chat/completions"

    for model in candidate_models:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 250,
        }
        body = json.dumps(payload).encode("utf-8")

        req = request.Request(
            url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key.strip()}",
                "User-Agent": "KripaConnect-RAG/1.0",
            },
            method="POST",
        )

        t0 = time.time()
        logger.info("[Groq] Calling %s (model: %s)...", url, model)
        try:
            with request.urlopen(req, timeout=timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as he:
            duration_ms = (time.time() - t0) * 1000
            logger.warning("[Groq] Model '%s' failed after %.1fms: %s", model, duration_ms, he)
            if he.code in (404, 400):
                # Model not found or decommissioned, try next candidate
                continue
            return ""
        except (error.URLError, TimeoutError) as exc:
            duration_ms = (time.time() - t0) * 1000
            logger.warning("[Groq] Request failed after %.1fms: %s", duration_ms, exc)
            return ""

        try:
            parsed = json.loads(raw)
            choices = parsed.get("choices", [])
            if not choices:
                logger.warning("[Groq] No choices returned in payload.")
                continue
            content = choices[0].get("message", {}).get("content", "")
            duration_ms = (time.time() - t0) * 1000
            logger.info(
                "[Groq] Generated recommendation in %.1fms (%d chars) using %s",
                duration_ms,
                len(content),
                model,
            )
            return content.strip() if content else ""
        except (json.JSONDecodeError, AttributeError, IndexError, TypeError) as exc:
            logger.warning("[Groq] Failed to parse response: %s", exc)
            return ""

    return ""


def _call_gemini(prompt: str, *, timeout_seconds: int = 20) -> str:
    """Call Gemini generateContent API and return plain text output (secondary fallback)."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        return ""

    model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 220,
        },
    }
    body = json.dumps(payload).encode("utf-8")

    req = request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": api_key.strip(),
        },
        method="POST",
    )

    t0 = time.time()
    logger.info("[Gemini] Calling %s (model: %s)...", url, model)
    try:
        with request.urlopen(req, timeout=timeout_seconds) as response:
            raw = response.read().decode("utf-8")
    except (error.HTTPError, error.URLError, TimeoutError) as exc:
        logger.warning("[Gemini] Request failed: %s", exc)
        return ""

    try:
        parsed = json.loads(raw)
        candidates = parsed.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
        content = " ".join(t.strip() for t in texts if t.strip())
        logger.info("[Gemini] Generated recommendation in %.1fms", (time.time() - t0) * 1000)
        return content
    except (json.JSONDecodeError, AttributeError, IndexError, TypeError):
        return ""


def generate_answer(query: str, products: list[ProductOut]) -> str:
    """Generate a grounded natural-language recommendation answer using Groq (or fallback)."""
    if not products:
        return _fallback_answer(query, products)

    context = _build_product_context(products)

    user_prompt = (
        f"User query:\n"
        f"{query}\n\n"
        "Retrieved products (JSON lines):\n"
        f"{context}\n\n"
        "Task:\n"
        "1) Pick the best product from the list and explain why in 3-5 sentences.\n"
        "2) Mention up to 2 alternatives with short trade-offs.\n"
        "3) Do not mention any product that is not in the list.\n"
        "4) Keep response under 140 words."
    )

    # 1. Try Groq first (preferred)
    text = _call_groq(user_prompt)
    if text:
        return text

    # 2. Try Gemini second if configured
    text = _call_gemini(user_prompt)
    if text:
        return text

    # 3. Always return deterministic fallback so service never fails
    logger.info("[LLM] Using deterministic explainability fallback.")
    return _fallback_answer(query, products)

