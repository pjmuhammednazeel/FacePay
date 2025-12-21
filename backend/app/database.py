from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = "postgresql://facepay_user:facepay123@localhost:5432/facepay_db"

engine = create_engine(
    DATABASE_URL,
    echo=True  # shows SQL queries in terminal (good for learning)
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
