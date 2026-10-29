import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

from .routes import dfa_router, ai_router
from .models.dfa_models import HealthStatus
from .services.ai_service import AIService

app = FastAPI(
    title="AutomataForge TOC Analysis API",
    description="Formal Language Compiler, Equivalence Hunter, Minimization Observatory, and Automata Doctor backend.",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(dfa_router)
app.include_router(ai_router)

ai_service = AIService()

@app.get("/api/health", response_model=HealthStatus)
def health_check() -> HealthStatus:
    configured = ai_service.is_configured()
    return HealthStatus(
        status="ok",
        backend="AutomataForge FastAPI TOC Engine v1.0",
        ai_configured=configured,
        ai_provider=ai_service.provider if configured else None,
        ai_model=ai_service.model if configured else None
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

