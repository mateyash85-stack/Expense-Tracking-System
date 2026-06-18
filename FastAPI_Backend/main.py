import os
import uvicorn

if __name__ == "__main__":
    # Render sets $PORT automatically — fall back to 8001 for local dev
    port = int(os.environ.get("PORT", 8001))
    is_dev = os.environ.get("NODE_ENV") == "development" or os.environ.get("ENVIRONMENT") == "development"

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
    )
