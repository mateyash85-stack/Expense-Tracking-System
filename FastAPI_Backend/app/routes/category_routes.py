from fastapi import APIRouter, Depends
from app.models.category import CategoryCreate, CategoryUpdate
from app.controllers import category_controller
from app.middlewares.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/")
async def get_categories(current_user=Depends(get_current_user)):
    return await category_controller.get_categories(str(current_user.id))


@router.post("/", status_code=201)
async def create_category(body: CategoryCreate, current_user=Depends(get_current_user)):
    return await category_controller.create_category(body, str(current_user.id))


@router.put("/{category_id}")
async def update_category(category_id: str, body: CategoryUpdate, current_user=Depends(get_current_user)):
    return await category_controller.update_category(category_id, body, str(current_user.id))


@router.delete("/{category_id}")
async def delete_category(category_id: str, current_user=Depends(get_current_user)):
    return await category_controller.delete_category(category_id, str(current_user.id))
