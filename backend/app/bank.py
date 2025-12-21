from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import BankAccount, Transaction

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/transfer")
def transfer(sender_id: int, receiver_id: int, amount: float, db: Session = Depends(get_db)):
    sender = db.query(BankAccount).filter(BankAccount.user_id == sender_id).first()
    receiver = db.query(BankAccount).filter(BankAccount.user_id == receiver_id).first()

    if sender.balance < amount:
        return {"error": "Insufficient balance"}

    sender.balance -= amount
    receiver.balance += amount

    txn = Transaction(sender=sender_id, receiver=receiver_id, amount=amount, status="SUCCESS")
    db.add(txn)
    db.commit()

    return {"message": "Transaction successful"}
