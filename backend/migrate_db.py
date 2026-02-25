import sqlite3

conn = sqlite3.connect('devicelink.db')
cursor = conn.cursor()

# Add the status column to the listings table
cursor.execute("ALTER TABLE listings ADD COLUMN status VARCHAR DEFAULT 'ACTIVE'")

# Verify the column was added
cursor.execute("PRAGMA table_info(listings)")
columns = cursor.fetchall()
print("Updated columns in listings table:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()

print("Status column added successfully!")