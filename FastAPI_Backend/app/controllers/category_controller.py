from fastapi import HTTPException
from app.config.supabase import supabase_admin
from app.models.category import CategoryCreate, CategoryUpdate


async def get_categories(user_id: str) -> dict:
    try:
        res = supabase_admin.table("categories") \
            .select("id, name, icon, user_id, created_at") \
            .eq("user_id", user_id) \
            .order("name") \
            .execute()
        return {"categories": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def create_category(body: CategoryCreate, user_id: str) -> dict:
    try:
        res = supabase_admin.table("categories") \
            .insert({"name": body.name, "icon": body.icon, "user_id": user_id}) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create category")
        return {"category": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        if "23505" in str(e) or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Category already exists")
        raise HTTPException(status_code=400, detail=str(e))


async def update_category(category_id: str, body: CategoryUpdate, user_id: str) -> dict:
    try:
        update_data = body.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        res = supabase_admin.table("categories") \
            .update(update_data) \
            .eq("id", category_id) \
            .eq("user_id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"category": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def delete_category(category_id: str, user_id: str) -> dict:
    try:
        res = supabase_admin.table("categories") \
            .delete() \
            .eq("id", category_id) \
            .eq("user_id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": "Category deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
