from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel, Field
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

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    category = Column(String)    # New field
    condition = Column(String)   # New field
    quantity = Column(Integer)   # New field
    owner = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class HashHelper:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str):
        # bcrypt requires bytes, so we encode the strings
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)

    @staticmethod
    def get_password_hash(password: str):
        # Hash a password for the first time
        # salt is generated automatically by gensalt()
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8') # Store as string in DB

class UserSchema(BaseModel):
    username: str
    password: str = Field(..., min_length=8)

class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    condition: str
    quantity: int
    owner: str

@app.post("/register")
def register(user: UserSchema):
    db = SessionLocal()
 
    if db.query(User).filter(User.username == user.username).first():
        db.close()
        raise HTTPException(status_code=400, detail="Username already taken")
    

    hashed_password = HashHelper.get_password_hash(user.password)
    db_user = User(username=user.username, password=hashed_password)
    
    db.add(db_user)
    db.commit()
    db.close()
    return {"message": "User created"}

@app.post("/login")
def login(user: UserSchema):
    db = SessionLocal()
    db_user = db.query(User).filter(User.username == user.username).first()
    db.close()

    if not db_user or not HashHelper.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    return {"message": "Login successful"}

@app.get("/listings")
def get_listings():
    db = SessionLocal()
    listings = db.query(Listing).all()
    db.close() 
    return listings

@app.post("/listings")
def create_listing(listing: ListingCreate):
    db = SessionLocal()
    new_listing = Listing(
        title=listing.title, 
        description=listing.description,
        category=listing.category,
        condition=listing.condition,
        quantity=listing.quantity,
        owner=listing.owner
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    db.close()
    return new_listing