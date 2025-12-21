from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    phone = Column(String, unique=True)
    pin_hash = Column(String)

class FaceEmbedding(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    embedding = Column(String)

class BankAccount(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    balance = Column(Float, default=1000)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    sender = Column(Integer)
    receiver = Column(Integer)
    amount = Column(Float)
    status = Column(String)
