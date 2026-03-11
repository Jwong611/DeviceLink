## Backend Technical Documentation
### 1. Requirements

To run the backend locally, the following software is required:

Python (version 3.9 or later recommended)

pip (Python package manager)

A virtual environment tool such as venv

### 2. Tools, Languages, and Libraries

The backend of the DeviceLink project is built using the following technologies:

Language

Python

Framework

FastAPI – used to create REST API endpoints and handle HTTP requests.

Database

SQLite – used as the local database to store application data.

ORM

SQLAlchemy – used to define database models and interact with the database.

Data Validation

Pydantic – used to validate request and response data.

Security

bcrypt – used for secure password hashing.

Other Libraries

Uvicorn – ASGI server used to run the FastAPI application.

CORS Middleware – allows communication between the frontend and backend during development.

### 3. Installation and Running the Backend
1. Clone the repository
git clone <repository-url>
cd DeviceLink/backend
2. Create a virtual environment
python -m venv venv
3. Activate the virtual environment

Windows

venv\Scripts\activate

Mac / Linux

source venv/bin/activate
4. Install dependencies
pip install -r requirements.txt
5. Start the backend server
uvicorn main:app --reload
6. Access the API

The backend server will run locally at:

http://127.0.0.1:8000

FastAPI also provides automatic API documentation at:

http://127.0.0.1:8000/docs
### 4. Backend Overview

The backend is implemented as a FastAPI REST API responsible for handling application logic, authentication, data storage, and communication with the frontend.

The backend supports several main functionalities:

Authentication

User registration

User login

Password hashing and verification using bcrypt

Listings Management

Create listings

Update listings

Delete listings

Browse and filter listings

Admin Management

View users

Suspend or unsuspend users

Issue warnings

Approve or reject listings

View activity logs

Chat System

Create chat threads between users

Send and receive messages

Track read states for messages

All application data such as users, listings, warnings, activity logs, and chat messages are stored in a SQLite database (devicelink.db) and managed using SQLAlchemy models.
