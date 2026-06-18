from fastapi import APIRouter, Depends
from app.models.auth import RegisterRequest, LoginRequest, RefreshRequest
from app.controllers import auth_controller
from app.middlewares.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(body: RegisterRequest):
    return await auth_controller.register(body)


@router.post("/login")
async def login(body: LoginRequest):
    return await auth_controller.login(body)


@router.post("/logout")
async def logout():
    return await auth_controller.logout()


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    return await auth_controller.refresh_token(body)


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return await auth_controller.get_me(current_user)
