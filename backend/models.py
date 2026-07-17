from sqlalchemy import Column, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    fullname = Column(String)
    telegram = Column(String, nullable=True)
    role = Column(String, default="user")  # nilainya bisa 'user' atau 'admin'
    is_active = Column(Boolean, default=True)