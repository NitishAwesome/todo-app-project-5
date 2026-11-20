from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.tasks import router as task_router
from app.routes.admin import router as admin_router

app = FastAPI(
    title="To-Do Application API",
    description="Backend APIs for task management",
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

app.include_router(task_router)
app.include_router(admin_router)


@app.get("/")
def home():
    return {"message": "To-Do FastAPI Backend is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}