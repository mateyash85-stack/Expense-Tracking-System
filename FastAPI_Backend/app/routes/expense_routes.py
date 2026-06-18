from fastapi import APIRouter, Depends, Query
from app.models.expense import ExpenseCreate, ExpenseUpdate
from app.controllers import expense_controller
from app.middlewares.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/summary")
async def get_summary(
    start_date: str | None = Query(None),
    end_date:   str | None = Query(None),
    current_user=Depends(get_current_user),
):
    return await expense_controller.get_summary(str(current_user.id), start_date, end_date)


@router.get("/")
async def get_expenses(
    type:        str | None = Query(None),
    category_id: str | None = Query(None),
    start_date:  str | None = Query(None),
    end_date:    str | None = Query(None),
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return await expense_controller.get_expenses(
        str(current_user.id), type, category_id, start_date, end_date, page, limit
    )


@router.get("/{expense_id}")
async def get_expense_by_id(expense_id: str, current_user=Depends(get_current_user)):
    return await expense_controller.get_expense_by_id(expense_id, str(current_user.id))


@router.post("/", status_code=201)
async def create_expense(body: ExpenseCreate, current_user=Depends(get_current_user)):
    return await expense_controller.create_expense(body, str(current_user.id))


@router.put("/{expense_id}")
async def update_expense(expense_id: str, body: ExpenseUpdate, current_user=Depends(get_current_user)):
    return await expense_controller.update_expense(expense_id, body, str(current_user.id))


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, current_user=Depends(get_current_user)):
    return await expense_controller.delete_expense(expense_id, str(current_user.id))
