from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database.db import engine, Base
from backend.app.routers import auth, patients, lessons, finance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create SQLite database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown logic if any
    await engine.dispose()

app = FastAPI(
    title="LogoCRM API",
    description="REST API для системи управління логопедичним центром LogoCRM",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(lessons.router)
app.include_router(finance.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LogoCRM Backend API",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
