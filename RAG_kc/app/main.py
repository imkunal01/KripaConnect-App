import logging
import os
import time
from pathlib import Path
from dotenv import load_dotenv

# Load .env BEFORE any internal application modules are imported
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()  # Fallback for root cwd

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.rag.pinecone_store import get_pinecone_store

# Structured, clean logging configuration (Pinecone & Groq health validated)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("rag.app")

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RAG Recommendation API",
    description="A Retrieval-Augmented Generation (RAG) powered product recommendation engine.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def request_logger_middleware(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method

    logger.info("--> %s %s", method, path)
    try:
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000
        logger.info(
            "<-- %s %s | %d | %.1fms",
            method,
            path,
            response.status_code,
            duration,
        )
        return response
    except Exception as exc:
        duration = (time.time() - start_time) * 1000
        logger.error(
            "<-- %s %s | EXCEPTION: %s | %.1fms",
            method,
            path,
            exc,
            duration,
        )
        raise

# ---------------------------------------------------------------------------
# CORS — allow all origins during development; tighten before production
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(router, prefix="/api")


# ---------------------------------------------------------------------------
# Dependency Health Checks (Pinecone & AI API)
# ---------------------------------------------------------------------------

def check_pinecone_health() -> dict:
    """Check Pinecone vector DB connectivity and return health details."""
    pinecone_key = os.getenv("PINECONE_API_KEY")
    if not pinecone_key or not pinecone_key.strip():
        logger.info("🌲 [Pinecone] Status: NOT CONFIGURED (No PINECONE_API_KEY in .env) -> Operating in local in-memory mode")
        return {
            "status": "unconfigured",
            "mode": "in_memory_fallback",
            "message": "PINECONE_API_KEY not set. Using local in-memory vector store.",
        }

    try:
        health_data = get_pinecone_store().health_check()
        if health_data.get("status") == "healthy":
            logger.info(
                "🌲 [Pinecone] Status: HEALTHY | Index: %s | Namespace: %s | Vectors: %d | Dim: %d",
                health_data.get("index"),
                health_data.get("namespace"),
                health_data.get("namespace_vector_count", 0),
                health_data.get("dimension", 384),
            )
        else:
            logger.warning(
                "🌲 [Pinecone] Status: DEGRADED | Error: %s -> Using in-memory fallback",
                health_data.get("error"),
            )
        return health_data
    except Exception as exc:
        logger.warning("🌲 [Pinecone] Status: FAILED (%s) -> Using in-memory fallback", exc)
        return {"status": "unhealthy", "error": str(exc), "mode": "in_memory_fallback"}


def check_ai_health() -> dict:
    """Validate Groq AI and Gemini API configuration on startup."""
    from urllib import request as urllib_req, error as urllib_err

    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    result = {"groq": {}, "gemini": {}}

    # 1. Check Groq AI
    if not groq_key or not groq_key.strip():
        logger.info("🤖 [Groq AI] Status: NOT CONFIGURED (No GROQ_API_KEY in .env) -> Using deterministic fallback")
        result["groq"] = {
            "status": "unconfigured",
            "message": "GROQ_API_KEY is not set. Deterministic answer generator will be used.",
        }
    else:
        masked_key = f"{groq_key[:6]}...{groq_key[-4:]}" if len(groq_key) > 10 else "***"
        try:
            req = urllib_req.Request(
                "https://api.groq.com/openai/v1/models",
                headers={
                    "Authorization": f"Bearer {groq_key.strip()}",
                    "User-Agent": "KripaConnect-RAG/1.0",
                },
                method="GET",
            )
            with urllib_req.urlopen(req, timeout=4.0) as res:
                if res.status == 200:
                    logger.info("🤖 [Groq AI] Status: HEALTHY | Model: %s | Key: %s", groq_model, masked_key)
                    result["groq"] = {"status": "healthy", "model": groq_model, "key": masked_key}
                else:
                    logger.warning("🤖 [Groq AI] Status: DEGRADED (HTTP %d)", res.status)
                    result["groq"] = {"status": "degraded", "http_status": res.status}
        except urllib_err.HTTPError as he:
            logger.warning(
                "🤖 [Groq AI] Status: AUTH ERROR (HTTP %d: %s) -> Check GROQ_API_KEY in .env",
                he.code,
                he.reason,
            )
            result["groq"] = {"status": "unauthorized", "http_status": he.code, "error": he.reason}
        except Exception as exc:
            logger.warning("🤖 [Groq AI] Status: UNREACHABLE (%s)", exc)
            result["groq"] = {"status": "unreachable", "error": str(exc)}

    # 2. Check Gemini AI (Secondary fallback)
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    if gemini_key and gemini_key.strip():
        masked_gemini = f"{gemini_key[:6]}...{gemini_key[-4:]}" if len(gemini_key) > 10 else "***"
        logger.info("✨ [Gemini AI] Status: CONFIGURED (Secondary Fallback) | Model: %s | Key: %s", gemini_model, masked_gemini)
        result["gemini"] = {"status": "configured", "model": gemini_model, "key": masked_gemini}
    else:
        result["gemini"] = {"status": "unconfigured"}

    return result


# ---------------------------------------------------------------------------
# Startup validation
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_validation():
    """Validate external dependencies on server boot and log health status."""
    logger.info("=" * 70)
    logger.info("🚀 RAG Recommendation Microservice Starting Up")
    logger.info("📦 Backend Products Source: %s", os.getenv("PRODUCTS_API_URL", "http://localhost:5000/api/products"))
    check_pinecone_health()
    check_ai_health()
    logger.info("=" * 70)


# ---------------------------------------------------------------------------
# Root health-check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    """Lightweight liveness probe — confirms the API is running."""
    return {"status": "ok", "message": "API running"}


@app.get("/health", tags=["Health"])
async def health():
    """Liveness probe for the API process."""
    return {
        "status": "healthy",
        "version": app.version,
        "service": app.title,
    }


@app.get("/health/deps", tags=["Health"])
async def dependency_health():
    """Detailed dependency health-check endpoint for Pinecone and AI APIs."""
    pinecone = check_pinecone_health()
    ai_status = check_ai_health()

    overall_status = "healthy"
    if pinecone.get("status") == "unhealthy" or ai_status.get("groq", {}).get("status") in ("unauthorized", "unreachable"):
        overall_status = "degraded"

    return {
        "status": overall_status,
        "version": app.version,
        "service": app.title,
        "dependencies": {
            "pinecone": pinecone,
            "ai": ai_status,
        },
    }
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
