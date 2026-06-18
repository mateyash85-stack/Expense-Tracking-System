from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None


class LoginResponse(BaseModel):
    token: str
    refreshToken: str
    user: UserResponse


class RegisterResponse(BaseModel):
    message: str
    user: UserResponse
