from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes import auth_routes, category_routes, expense_routes

app = FastAPI(
    title="Expense Tracking System API",
    description="REST API built with FastAPI + Supabase",
    version="1.0.0",
)

# CORS — allow all origins in production for simplicity
# Restrict to specific origins by setting CLIENT_ORIGIN in Render env vars
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_routes.router,     prefix="/api")
app.include_router(category_routes.router, prefix="/api")
app.include_router(expense_routes.router,  prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok"}
