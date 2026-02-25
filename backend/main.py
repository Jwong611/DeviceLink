from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, Boolean, DateTime, create_engine, or_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
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

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    category = Column(String)
    condition = Column(String)
    quantity = Column(Integer)
    owner = Column(String)
    status = Column(String, default='PENDING')  # PENDING, ACTIVE, DELETED, COMPLETED
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserWarning(Base):
    __tablename__ = "user_warnings"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    reason = Column(String)
    issued_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    username = Column(String)
    details = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

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
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)

    @staticmethod
    def get_password_hash(password: str):
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8')

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
    status: str = 'PENDING'

class ListingUpdate(BaseModel):
    title: str
    description: str
    category: str
    condition: str
    quantity: int
    status: str = 'ACTIVE'

class UserWarningCreate(BaseModel):
    username: str
    reason: str

class ListingApprovalUpdate(BaseModel):
    listing_id: int
    approved: bool

class UserSuspensionUpdate(BaseModel):
    username: str
    is_suspended: bool

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
def get_listings(
    q: Optional[str] = Query(None, description="Search term matched against title and description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
    min_quantity: Optional[int] = Query(None, ge=0, description="Minimum quantity"),
    max_quantity: Optional[int] = Query(None, ge=0, description="Maximum quantity"),
    owner: Optional[str] = Query(None, description="Filter by owner username"),
    own_username: Optional[str] = Query(None, description="If provided, show all listings (approved/unapproved) for this user"),
    approved: bool = Query(True, description="Only include approved listings by default"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    per_page: int = Query(20, ge=1, le=200, description="Results per page"),
):
    """Browse/search/filter listings as a normal user.

    If own_username is provided, shows all that user's listings (approved and unapproved).
    Otherwise defaults to showing only approved listings. Supports pagination, text search
    (against title and description), and filters for category, condition,
    quantity range and owner.
    Returns a dict with `items` and `meta` pagination info.
    """
    db = SessionLocal()
    query = db.query(Listing)

    # If viewing own listings, show all; otherwise only approved listings that are not DELETED/COMPLETED
    if own_username:
        query = query.filter(Listing.owner == own_username)
    else:
        query = query.filter(Listing.approved == True)
        # Filter out DELETED and COMPLETED listings, but handle cases where status might be null
        query = query.filter(
            or_(Listing.status.is_(None), Listing.status == 'ACTIVE')
        )

    if q:
        like_term = f"%{q}%"
        query = query.filter(or_(Listing.title.ilike(like_term), Listing.description.ilike(like_term)))

    if category:
        query = query.filter(Listing.category == category)

    if condition:
        query = query.filter(Listing.condition == condition)

    if owner:
        query = query.filter(Listing.owner == owner)

    if min_quantity is not None:
        query = query.filter(Listing.quantity >= min_quantity)

    if max_quantity is not None:
        query = query.filter(Listing.quantity <= max_quantity)

    total = query.count()

    items = query.order_by(Listing.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    db.close()

    def _serialize(l: Listing):
        return {
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "category": l.category,
            "condition": l.condition,
            "quantity": l.quantity,
            "owner": l.owner,
            "status": getattr(l, 'status', 'ACTIVE'),  # Handle case where status column might not exist
            "approved": l.approved,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }

    return {
        "items": [_serialize(l) for l in items],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page if per_page else 0,
        },
    }

@app.post("/listings")
def create_listing(listing: ListingCreate):
    db = SessionLocal()
    new_listing = Listing(
        title=listing.title,
        description=listing.description,
        category=listing.category,
        condition=listing.condition,
        quantity=listing.quantity,
        owner=listing.owner,
        status=listing.status,
        approved=False
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    log_entry = ActivityLog(
        action="listing_created",
        username=listing.owner,
        details=f"Created listing: {listing.title}"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return new_listing

@app.put("/listings/{listing_id}")
def update_listing(listing_id: int, listing: ListingUpdate, username: str):
    db = SessionLocal()
    db_listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not db_listing:
        db.close()
        raise HTTPException(status_code=404, detail="Listing not found")
    if db_listing.owner != username:
        db.close()
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
    
    # Validate status transition
    valid_statuses = ['ACTIVE', 'DELETED', 'COMPLETED']
    if listing.status not in valid_statuses:
        db.close()
        raise HTTPException(status_code=400, detail="Invalid status. Must be ACTIVE, DELETED, or COMPLETED")
    
    db_listing.title = listing.title
    db_listing.description = listing.description
    db_listing.category = listing.category
    db_listing.condition = listing.condition
    db_listing.quantity = listing.quantity
    db_listing.status = listing.status
    db.commit()
    db.refresh(db_listing)
    
    log_entry = ActivityLog(
        action="listing_updated",
        username=username,
        details=f"Updated listing: {listing.title} (status: {listing.status})"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return db_listing

@app.delete("/listings/{listing_id}")
def delete_listing(listing_id: int, username: str):
    db = SessionLocal()
    db_listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not db_listing:
        db.close()
        raise HTTPException(status_code=404, detail="Listing not found")
    if db_listing.owner != username:
        db.close()
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    db.delete(db_listing)
    
    log_entry = ActivityLog(
        action="listing_deleted",
        username=username,
        details=f"Deleted listing: {db_listing.title}"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return {"message": "Listing deleted successfully"}

# ========== ADMIN ENDPOINTS ==========

@app.get("/admin/check/{username}")
def check_admin_status(username: str):
    db = SessionLocal()
    user = db.query(User).filter(User.username == username).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"is_admin": user.is_admin}

@app.get("/admin/users")
def get_all_users():
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return [{"id": u.id, "username": u.username, "is_suspended": u.is_suspended, "warning_count": u.warning_count, "is_admin": u.is_admin} for u in users]

@app.get("/admin/listings")
def get_all_listings_admin():
    db = SessionLocal()
    listings = db.query(Listing).all()
    db.close()
    return [{"id": l.id, "title": l.title, "owner": l.owner, "approved": l.approved, "category": l.category, "created_at": l.created_at} for l in listings]

@app.post("/admin/warning")
def issue_warning(admin_username: str, warning: UserWarningCreate):
    db = SessionLocal()
    admin = db.query(User).filter(User.username == admin_username).first()
    if not admin or not admin.is_admin:
        db.close()
        raise HTTPException(status_code=403, detail="Only admins can issue warnings")

    user = db.query(User).filter(User.username == warning.username).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    new_warning = UserWarning(
        username=warning.username,
        reason=warning.reason,
        issued_by=admin_username
    )
    user.warning_count += 1
    db.add(new_warning)
    db.commit()

    log_entry = ActivityLog(
        action="warning_issued",
        username=warning.username,
        details=f"Warning issued: {warning.reason}"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return {"message": f"Warning issued to {warning.username}"}

@app.post("/admin/suspend")
def suspend_user(admin_username: str, suspension: UserSuspensionUpdate):
    db = SessionLocal()
    admin = db.query(User).filter(User.username == admin_username).first()
    if not admin or not admin.is_admin:
        db.close()
        raise HTTPException(status_code=403, detail="Only admins can suspend users")

    user = db.query(User).filter(User.username == suspension.username).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    user.is_suspended = suspension.is_suspended
    db.commit()

    status = "suspended" if suspension.is_suspended else "unsuspended"
    log_entry = ActivityLog(
        action=f"user_{status}",
        username=suspension.username,
        details=f"User {status} by {admin_username}"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return {"message": f"User {status}"}

@app.post("/admin/approve-listing")
def approve_listing(admin_username: str, approval: ListingApprovalUpdate):
    db = SessionLocal()
    admin = db.query(User).filter(User.username == admin_username).first()
    if not admin or not admin.is_admin:
        db.close()
        raise HTTPException(status_code=403, detail="Only admins can approve listings")

    listing = db.query(Listing).filter(Listing.id == approval.listing_id).first()
    if not listing:
        db.close()
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.approved = approval.approved
    if approval.approved:
        listing.status = "ACTIVE"
    db.commit()

    status = "approved" if approval.approved else "rejected"
    log_entry = ActivityLog(
        action=f"listing_{status}",
        username=listing.owner,
        details=f"Listing '{listing.title}' was {status}"
    )
    db.add(log_entry)
    db.commit()
    db.close()
    return {"message": f"Listing {status}"}

@app.get("/admin/warnings/{username}")
def get_user_warnings(username: str):
    db = SessionLocal()
    warnings = db.query(UserWarning).filter(UserWarning.username == username).all()
    db.close()
    return [{"id": w.id, "reason": w.reason, "issued_by": w.issued_by, "created_at": w.created_at} for w in warnings]

@app.get("/admin/activity-logs")
def get_activity_logs(limit: int = 50):
    db = SessionLocal()
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    db.close()
    return [{"id": l.id, "action": l.action, "username": l.username, "details": l.details, "created_at": l.created_at} for l in logs]