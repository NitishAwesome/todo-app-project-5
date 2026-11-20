from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.tasks import router as task_router
from app.routes.admin import router as admin_router

app = FastAPI(
    title="To-Do Application API",
    description="Backend APIs for task management and authentication",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Rehan's Authentication APIs
app.include_router(auth_router)

# Mohanbabu's Task and Admin APIs
app.include_router(task_router)
app.include_router(admin_router)


@app.get("/", tags=["default"])
def home():
    return {
        "message": "To-Do FastAPI Backend is running!"
    }


@app.get("/health", tags=["default"])
def health():
    return {
        "status": "healthy"
    }
