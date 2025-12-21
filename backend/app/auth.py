from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import User, FaceEmbedding, BankAccount
from app.face import image_to_embedding, compare_faces

router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
async def register(name: str, phone: str, pin: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pin_hash = pwd.hash(pin)
    user = User(name=name, phone=phone, pin_hash=pin_hash)
    db.add(user)
    db.commit()
    db.refresh(user)

    image_bytes = await file.read()
    embedding = image_to_embedding(image_bytes)

    face = FaceEmbedding(user_id=user.id, embedding=str(embedding))
    account = BankAccount(user_id=user.id, balance=1000)

    db.add(face)
    db.add(account)
    db.commit()

    return {"message": "User registered successfully"}

@router.post("/authenticate")
async def authenticate(phone: str, pin: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == phone).first()
    if not user or not pwd.verify(pin, user.pin_hash):
        return {"error": "Invalid PIN"}

    face = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user.id).first()
    stored_embedding = eval(face.embedding)

    image_bytes = await file.read()
    live_embedding = image_to_embedding(image_bytes)

    similarity = compare_faces(stored_embedding, live_embedding)

    if similarity > 0.6:
        return {"message": "Authentication successful", "user_id": user.id}
    return {"error": "Face mismatch"}
