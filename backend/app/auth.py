import random
from .models import User, BankAccount


def generate_account_number():
    return "FP" + str(random.randint(10000, 99999))

@router.post("/register", response_model=RegisterResponse)
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        pin_hash=hash_pin(data.pin),
        face_embedding=b""
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create bank account
    account = BankAccount(
        account_number=generate_account_number(),
        balance=1000.00,  # Initial mock balance
        user_id=user.id
    )

    db.add(account)
    db.commit()

    return {
        "message": "User and bank account created successfully",
        "user_id": user.id
    }
