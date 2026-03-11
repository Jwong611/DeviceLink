## DeviceLink Architecture and System Structure

The **DeviceLink** project is built with a **modular full-stack architecture** consisting of a React frontend, a FastAPI backend, and a SQLite database.  
Each layer of the system is separated to keep the codebase **maintainable, scalable, and easy to extend**.

The project documentation is divided into separate sections:

- **Frontend documentation:**  
  https://github.com/Jwong611/DeviceLink/blob/main/frontend/README.md

- **Backend documentation:**  
  https://github.com/Jwong611/DeviceLink/blob/main/backend/README.md

Each part of the system has its **own technical documentation**, setup instructions, and explanation of components.  
The backend documentation also includes **admin setup and administration features**.

---

## System Architecture

![DeviceLink Architecture](https://raw.githubusercontent.com/Jwong611/DeviceLink/main/frontend/diagrams/devicelink_component.png)

This diagram shows the **overall architecture of DeviceLink**.

- Users interact with the system through the **React frontend** built with React and Vite.
- The frontend components (`main.jsx`, `App.jsx`, `Admin.jsx`) handle the user interface and send **HTTP API requests** to the backend.
- The **FastAPI backend** processes requests and contains modular services for:
  - Authentication
  - Listings management
  - Admin management
  - Chat system
- All data is stored in a **SQLite database (`devicelink.db`)** through the database layer.

This modular separation allows the frontend, backend, and database layers to evolve independently.

---

## Data Flow and Backend Modules

![DeviceLink Data Flow](https://raw.githubusercontent.com/Jwong611/DeviceLink/main/frontend/diagrams/dataflow_devicelink.png)

This diagram illustrates how **data flows through the system**.

- Users and administrators interact with the **React frontend**.
- The frontend communicates with different **FastAPI API endpoints**, including:
  - Authentication (register / login)
  - Listings endpoints
  - Admin endpoints
  - Chat endpoints
- These endpoints interact with different **database tables**, such as:
  - Users
  - Listings
  - UserWarnings
  - ActivityLogs
  - ChatThreads
  - ChatMessages
  - ChatReadStates

The design follows a **clear modular structure**, where each backend component manages a specific domain of the system.

---
