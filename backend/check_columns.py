import sqlite3

conn = sqlite3.connect('devicelink.db')
cursor = conn.cursor()

# Check what columns exist in listings table
cursor.execute("PRAGMA table_info(listings)")
columns = cursor.fetchall()
print("Current columns in listings table:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.close()