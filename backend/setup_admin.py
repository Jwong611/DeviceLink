#!/usr/bin/env python3
"""
Admin Setup Script
Run this script to set an existing user as admin or create a new admin user.
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import bcrypt

DATABASE_URL = "sqlite:///./devicelink.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password = Column(String)
    is_admin = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False)
    warning_count = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)

def hash_password(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def main():
    db = SessionLocal()
    
    print("=" * 50)
    print("DeviceLink Admin Setup")
    print("=" * 50)
    
    username = input("\nEnter username: ").strip()
    
    user = db.query(User).filter(User.username == username).first()
    
    if user:
        # Existing user - make them admin
        user.is_admin = True
        db.commit()
        print(f"\n✓ User '{username}' is now an admin!")
    else:
        # Create new admin user
        password = input("Enter password (min 8 characters): ").strip()
        
        if len(password) < 8:
            print("✗ Password must be at least 8 characters!")
            db.close()
            return
        
        hashed_password = hash_password(password)
        new_user = User(
            username=username,
            password=hashed_password,
            is_admin=True
        )
        
        db.add(new_user)
        db.commit()
        print(f"\n✓ Admin user '{username}' created successfully!")
    
    db.close()
    print("\nYou can now login with this admin account.")

if __name__ == "__main__":
    main()
