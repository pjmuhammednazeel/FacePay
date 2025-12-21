from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.auth import router as auth_router
from app.bank import router as bank_router


app = FastAPI(title="FacePay Backend")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(bank_router)

@app.get("/")
def root():
    return {"status": "FacePay Backend Running"}
