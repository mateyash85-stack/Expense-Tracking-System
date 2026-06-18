from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes import auth_routes, category_routes, expense_routes

app = FastAPI(
    title="Expense Tracking System API",
    description="REST API built with FastAPI + Supabase",
    version="1.0.0",
)

# CORS — allow local dev + deployed frontend
allowed_origins = [
    settings.CLIENT_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# In production allow all origins if CLIENT_ORIGIN is a wildcard
if settings.CLIENT_ORIGIN == "*":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
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
