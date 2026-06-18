from pydantic import BaseModel
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    icon: str = "💰"


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: str
    user_id: str
    created_at: datetime | None = None
