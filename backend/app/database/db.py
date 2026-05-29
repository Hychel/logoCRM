from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
import os

# SQLite database path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./logocrm.db")

# Create async engine. For SQLite we use check_same_thread=False
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(DATABASE_URL, connect_args=connect_args, echo=False)

# Async session maker
SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine, class_=AsyncSession)

# Declarative Base
class Base(DeclarativeBase):
    pass

# Dependency to get async DB session
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
