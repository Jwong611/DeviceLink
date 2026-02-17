# Admin Page Setup Guide

## What's New

I've created a complete admin system with three main features:

### 1. **Account Management** 
- View all user accounts
- Issue warnings to users
- Suspend/unsuspend accounts
- Track warning history

### 2. **Listing Moderation**
- View all listings pending approval
- Approve or reject listings
- Track moderation history

### 3. **Activity Logging**
- Monitor all platform activities
- Track user actions (registrations, listings, warnings, suspensions)
- View detailed audit trail

## Setup Instructions

### Step 1: Reset Database
Delete the old database file to create the new schema with admin features:

```bash
# In the backend folder
rm devicelink.db  # On Windows: del devicelink.db
```

### Step 2: Create Admin User

Run the setup script to create an admin account:

```bash
# In the backend folder
python setup_admin.py
```

Then follow the prompts:
- Enter a username
- Enter a password (minimum 8 characters)
- The script will create the admin user

**OR** if you already have a regular user account, the script can make them an admin:
- Just enter the existing username
- The script will upgrade them to admin

### Step 3: Restart Backend

Make sure your FastAPI backend is running:

```bash
# In the backend folder
# From the repository root (recommended):
python -m uvicorn main:app --reload

# Or, change into the backend folder and run:
# cd backend
# python -m uvicorn main:app --reload
```

### Step 4: Login

1. Open the frontend
2. Login with your admin credentials
3. You'll automatically be redirected to the Admin Dashboard

## Admin Features

### Accounts Tab 👥
- Click on any user to see their details
- View warning count and suspension status
- Issue warnings by entering a reason
- Suspend or unsuspend users

### Listings Tab 📋
- See all listings waiting for approval
- Pending listings appear in yellow
- Approved listings appear in green
- Click "Approve" or "Reject" to moderate

### Activity Tab 📊
- View all platform activities
- See timestamps for all actions
- Track who did what and when

## Admin Actions Logged

The system automatically logs these activities:
- User registrations
- Listing creations
- Warnings issued
- User suspensions/unsuspensions
- Listing approvals/rejections

## Notes

- Only admin accounts can access the admin dashboard
- Regular users see the normal marketplace view
- All actions are timestamped and logged
- Admins cannot be modified through the UI (only via database)

## Future Enhancements

Consider adding:
- Search/filter by username or action type
- Export activity logs
- Bulk moderation
- Custom admin roles
- Email notifications for violations
