from main import SessionLocal, Listing
db = SessionLocal()
listings = db.query(Listing).all()
print(f'Found {len(listings)} listings')
for l in listings:
    print(f'ID: {l.id}, Title: {l.title}, Owner: {l.owner}, Approved: {l.approved}, Status: {getattr(l, "status", "None")}')
db.close()