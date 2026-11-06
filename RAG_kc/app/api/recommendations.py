"""
recommendations.py - API router for recommendation queries.

Phase 4 behavior:
* Parse category/price constraints
* Run hybrid ranking over filtered candidates
* Return top-k relevant products
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.models.schema import RecommendRequest, RecommendResponse
from app.services import recommendation_service

router = APIRouter(prefix="/recommend", tags=["Recommendations"])
logger = logging.getLogger("rag.api.recommend")


@router.post(
    "",
    response_model=RecommendResponse,
    summary="Recommend products from a natural-language query",
    description=(
        "Parses structured filters (category/price), filters candidates, and "
        "applies hybrid ranking (semantic + lexical + intent signals)."
    ),
)
async def recommend(payload: RecommendRequest):
    logger.info(">>> POST /api/recommend | query='%s' | limit=%d", payload.query, payload.limit)
    try:
        result = recommendation_service.build_recommendation_response(
            payload.query,
            limit=payload.limit,
        )
    except Exception as exc:
        logger.error("POST /api/recommend failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Recommendation service failed.",
        ) from exc


    return RecommendResponse(
        query=result["query"],
        parsed_filters=result["parsed_filters"],
        answer=result["answer"],
        total=result["total"],
        count=result["count"],
        top_products=result["top_products"],
        why_recommended=result["why_recommended"],
        comparison=result["comparison"],
        products=result["products"],
    )
