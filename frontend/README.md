## Frontend Technical Documentation
### 1. Requirements

To run the frontend locally, the following software is required:

Node.js (version 16 or later recommended)

npm (included with Node.js)

A modern web browser (Chrome, Firefox, Edge)

### 2. Tools, Languages, and Libraries

The frontend of the DeviceLink project is built using the following technologies:

Languages

JavaScript

HTML

CSS

Framework

React – used to build reusable and interactive UI components.

Build Tool

Vite – used for fast development, hot module reloading, and building the frontend.

Libraries

React – UI component framework

Fetch API – used for communication with the backend API

CSS – used for styling the interface

### 3. Installation and Running the Frontend
1. Clone the repository
git clone <repository-url>
cd DeviceLink/frontend
2. Install dependencies
npm install
3. Start the development server
npm run dev
 4. Open the application

After starting the development server, Vite will provide a local address similar to:

http://localhost:5173

Open this URL in your browser to run the application.

### 4. Frontend Overview

The frontend provides the user interface for interacting with the DeviceLink platform. It communicates with the backend through HTTP API requests.

User actions such as:

registering or logging in

browsing listings

creating or updating listings

managing users as an administrator

viewing activity logs

trigger API requests to the FastAPI backend, which processes the request and returns the corresponding data to be displayed in the interface.
