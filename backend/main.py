from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

# Database Setup
DATABASE_URL = "sqlite:///./devicelink.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password = Column(String) # In production, use hashed passwords!

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class UserSchema(BaseModel):
    username: str
    password: str

# Routes
@app.post("/register")
def register(user: UserSchema):
    db = SessionLocal()
    db_user = User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    return {"message": "User created"}

@app.post("/login")
def login(user: UserSchema):
    db = SessionLocal()
    db_user = db.query(User).filter(User.username == user.username, User.password == user.password).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"message": "Login successful"}

@app.get("/listings")
def get_listings():
    db = SessionLocal()
    listings = db.query(Listing).all()
    db.close() # Always close the session
    return listings

# Add ListingSchema to your schemas section
class ListingCreate(BaseModel):
    title: str
    description: str

# Add this route to your backend
@app.post("/listings")
def create_listing(listing: ListingCreate):
    db = SessionLocal()
    new_listing = Listing(title=listing.title, description=listing.description)
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    db.close()
    return new_listing