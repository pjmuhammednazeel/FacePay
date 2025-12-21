from fastapi import FastAPI
from .database import engine, Base
from . import models  # IMPORTANT: this imports models so tables are registered
from .models import User, BankAccount


app = FastAPI(title="FacePay API")

# Create tables
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "FacePay backend is running"}
