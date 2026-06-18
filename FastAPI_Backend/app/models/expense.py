from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Literal
from app.models.category import CategoryResponse


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    date: DateType
    type: Literal["income", "expense"] = "expense"
    category_id: str
    note: str = ""


class ExpenseUpdate(BaseModel):
    title: str | None = None
    amount: float | None = None
    date: DateType | None = None
    type: Literal["income", "expense"] | None = None
    category_id: str | None = None
    note: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    date: str
    type: str
    category_id: str | None = None
    category: CategoryResponse | None = None
    note: str | None = None
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    page: int
    limit: int


class SummaryResponse(BaseModel):
    income: float
    expense: float
    balance: float
