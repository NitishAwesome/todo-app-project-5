from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import register_user, authenticate_user
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user with default 'User' role. Passwords are securely hashed with Argon2id."
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    return register_user(db, user_data)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials and returns a signed JWT access token."
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    user, access_token = authenticate_user(db, login_data)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Returns profile information for the authenticated user using the Bearer token."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
