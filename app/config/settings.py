from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8001
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    CLIENT_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
