from fastapi import HTTPException
from app.config.supabase import supabase, supabase_admin
from app.models.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    RegisterResponse, LoginResponse, UserResponse,
)


async def register(body: RegisterRequest) -> RegisterResponse:
    try:
        res = supabase_admin.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "user_metadata": {"name": body.name},
            "email_confirm": True,
        })
        if not res.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        return RegisterResponse(
            message="Registration successful.",
            user=UserResponse(
                id=str(res.user.id),
                email=res.user.email or "",
                name=body.name,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def login(body: LoginRequest) -> LoginResponse:
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        if not res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        name = None
        if res.user and res.user.user_metadata:
            name = res.user.user_metadata.get("name")

        return LoginResponse(
            token=res.session.access_token,
            refreshToken=res.session.refresh_token,
            user=UserResponse(
                id=str(res.user.id),
                email=res.user.email or "",
                name=name,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


async def logout() -> dict:
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def refresh_token(body: RefreshRequest) -> dict:
    try:
        res = supabase.auth.refresh_session(body.refresh_token)
        if not res.session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        return {
            "token": res.session.access_token,
            "refreshToken": res.session.refresh_token,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


async def get_me(current_user) -> dict:
    try:
        res = supabase_admin.table("profiles") \
            .select("id, name, created_at") \
            .eq("id", str(current_user.id)) \
            .single() \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "name": res.data.get("name"),
                "createdAt": res.data.get("created_at"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
