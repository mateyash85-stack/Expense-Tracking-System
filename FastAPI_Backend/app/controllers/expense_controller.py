from fastapi import HTTPException
from app.config.supabase import supabase_admin
from app.models.expense import ExpenseCreate, ExpenseUpdate


async def get_expenses(
    user_id: str,
    type: str | None = None,
    category_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    try:
        query = supabase_admin.table("expenses") \
            .select("*, category:categories(id, name, icon)", count="exact") \
            .eq("user_id", user_id) \
            .order("date", desc=True)

        if type:
            query = query.eq("type", type)
        if category_id:
            query = query.eq("category_id", category_id)
        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        res = query.execute()
        return {
            "expenses": res.data or [],
            "total": res.count or 0,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def get_summary(
    user_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    try:
        query = supabase_admin.table("expenses") \
            .select("type, amount") \
            .eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        res = query.execute()
        income  = sum(float(r["amount"]) for r in res.data if r["type"] == "income")
        expense = sum(float(r["amount"]) for r in res.data if r["type"] == "expense")

        return {"summary": {"income": income, "expense": expense, "balance": income - expense}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def get_expense_by_id(expense_id: str, user_id: str) -> dict:
    try:
        res = supabase_admin.table("expenses") \
            .select("*, category:categories(id, name, icon)") \
            .eq("id", expense_id) \
            .eq("user_id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"expense": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def create_expense(body: ExpenseCreate, user_id: str) -> dict:
    try:
        payload = {
            "title":       body.title,
            "amount":      body.amount,
            "date":        str(body.date),
            "type":        body.type,
            "category_id": body.category_id,
            "note":        body.note,
            "user_id":     user_id,
        }
        res = supabase_admin.table("expenses") \
            .insert(payload) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create expense")

        # Fetch with category join
        full = supabase_admin.table("expenses") \
            .select("*, category:categories(id, name, icon)") \
            .eq("id", res.data[0]["id"]) \
            .execute()

        return {"expense": full.data[0] if full.data else res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def update_expense(expense_id: str, body: ExpenseUpdate, user_id: str) -> dict:
    try:
        update_data = body.model_dump(exclude_none=True)
        if "date" in update_data:
            update_data["date"] = str(update_data["date"])
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        res = supabase_admin.table("expenses") \
            .update(update_data) \
            .eq("id", expense_id) \
            .eq("user_id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Expense not found")

        full = supabase_admin.table("expenses") \
            .select("*, category:categories(id, name, icon)") \
            .eq("id", expense_id) \
            .execute()

        return {"expense": full.data[0] if full.data else res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def delete_expense(expense_id: str, user_id: str) -> dict:
    try:
        res = supabase_admin.table("expenses") \
            .delete() \
            .eq("id", expense_id) \
            .eq("user_id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
