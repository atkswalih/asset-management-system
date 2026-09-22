<div align="center">

# 🚀 Asset Management System

### A modern full-stack platform for managing assets, inventory, assignments, repairs, users, and AI-assisted operations.

Built with **Django REST Framework + React** and deployed with **Docker + NGINX + Render**.

<br>

<a href="https://asset-management-frontend-m8sg.onrender.com">
  <img src="https://img.shields.io/badge/🌐%20LIVE%20DEMO-2563EB?style=for-the-badge" alt="Live Demo">
</a>
&nbsp;
<a href="https://asset-management-system-npgv.onrender.com">
  <img src="https://img.shields.io/badge/⚡%20BACKEND%20API-111827?style=for-the-badge" alt="Backend API">
</a>
&nbsp;
<a href="https://github.com/atkswalih/asset-management-system">
  <img src="https://img.shields.io/badge/💻%20GITHUB-181717?style=for-the-badge&logo=github" alt="GitHub">
</a>

<br><br>

<img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white">
<img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white">
<img src="https://img.shields.io/badge/Django%20REST%20Framework-A30000?style=flat-square">
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/NGINX-009639?style=flat-square&logo=nginx&logoColor=white">
<img src="https://img.shields.io/badge/Render-000000?style=flat-square&logo=render&logoColor=white">

<br><br>

<img src="docs/screenshots/dashboard.png" width="92%" alt="Asset Management System Dashboard">

</div>

---

## ✨ Overview

**Asset Management System** is a full-stack asset operations platform designed to provide organizations with a centralized system for managing equipment, inventory, employees, assignments, maintenance workflows, repair tickets, and users.

The platform covers the complete asset lifecycle:

```text
┌──────────┐
│ Register │
└────┬─────┘
     ↓
┌──────────┐
│  Track   │
└────┬─────┘
     ↓
┌──────────┐
│  Assign  │
└────┬─────┘
     ↓
┌──────────┐
│ Maintain │
└────┬─────┘
     ↓
┌──────────┐
│  Repair  │
└────┬─────┘
     ↓
┌──────────┐
│ Monitor  │
└──────────┘
```

It combines business workflows with:

* 🤖 Integrated AI assistant
* 🔐 JWT authentication
* 👥 Role-based authorization
* 🔄 User impersonation
* 📦 Inventory management
* 🛠️ Repair ticket workflows
* 🚀 Production deployment infrastructure

---

## 🌐 Live Demo

| Service             | URL                                                           |
| ------------------- | ------------------------------------------------------------- |
| 🌐 **Frontend**     | https://asset-management-frontend-m8sg.onrender.com           |
| ⚡ **Backend API**   | https://asset-management-system-npgv.onrender.com             |
| ❤️ **Health Check** | https://asset-management-system-npgv.onrender.com/api/health/ |

> **Note:** The backend runs on Render's free tier and may take a few seconds to wake up after inactivity.

---

# 🖥️ Application Preview

<table>
<tr>

<td width="50%" valign="top">

### 📊 Dashboard

<img src="docs/screenshots/dashboard.png" width="100%" alt="Dashboard">

</td>

<td width="50%" valign="top">

### 💻 Asset Management

<img src="docs/screenshots/assets.png" width="100%" alt="Assets">

</td>

</tr>

<tr>

<td width="50%" valign="top">

### 📦 Inventory

<img src="docs/screenshots/inventory.png" width="100%" alt="Inventory">

</td>

<td width="50%" valign="top">

### 👤 Assignments

<img src="docs/screenshots/assignments.png" width="100%" alt="Assignments">

</td>

</tr>

<tr>

<td width="50%" valign="top">

### 🔧 Repair Tickets

<img src="docs/screenshots/tickets.png" width="100%" alt="Repair Tickets">

</td>

<td width="50%" valign="top">

### 🤖 AI Assistant

<img src="docs/screenshots/ai-assistant.png" width="100%" alt="AI Assistant">

</td>

</tr>

<tr>

<td width="50%" valign="top">

### 👥 User Management

<img src="docs/screenshots/users.png" width="100%" alt="User Management">

</td>

<td width="50%" valign="top">

### 🚀 Production Ready

Full-stack application deployed with Docker, NGINX and Render.

</td>

</tr>
</table>

---

# ⭐ Key Features

<table>
<tr>

<td width="33%" align="center">

### 📦 Asset Management

Create, update, track and manage organizational assets.

</td>

<td width="33%" align="center">

### 📊 Inventory

Monitor inventory items, stock levels and availability.

</td>

<td width="33%" align="center">

### 👤 Assignments

Assign assets to employees and track ownership.

</td>

</tr>

<tr>

<td width="33%" align="center">

### 🔧 Repair Tickets

Manage damaged assets and maintenance workflows.

</td>

<td width="33%" align="center">

### 🤖 AI Assistant

Integrated AI-powered assistant for interacting with the system.

</td>

<td width="33%" align="center">

### 🔐 Authentication

JWT-based authentication with protected API endpoints.

</td>

</tr>

<tr>

<td width="33%" align="center">

### 👥 User Management

Manage employees, administrators and system users.

</td>

<td width="33%" align="center">

### 🔄 Impersonation

Authorized administrators can operate through user accounts when required.

</td>

<td width="33%" align="center">

### 📱 Responsive UI

Modern React interface designed for different screen sizes.

</td>

</tr>
</table>

---

# 🧩 Core Modules

| Module                | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| 📦 **Assets**         | Manage organizational assets and their lifecycle |
| 📊 **Inventory**      | Track stock and inventory items                  |
| 👤 **Assignments**    | Assign assets to employees                       |
| 🔧 **Repair Tickets** | Track damaged assets and repairs                 |
| 👥 **Users**          | Manage users and roles                           |
| 🤖 **AI Assistant**   | AI-powered system assistance                     |
| 🔐 **Authentication** | Secure JWT authentication                        |
| 🛡️ **Authorization** | Role-based access control                        |
| 📈 **Dashboard**      | Centralized operational overview                 |

---

# 🏗️ Architecture

```text
                        ┌──────────────────────┐
                        │       Browser        │
                        │    React + Vite      │
                        └──────────┬───────────┘
                                   │
                                   │ HTTP / REST
                                   ▼
                        ┌──────────────────────┐
                        │        NGINX         │
                        │   Reverse Proxy      │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Django REST API    │
                        │      Backend         │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────────┐
              │PostgreSQL│  │   JWT    │  │ AI Assistant │
              │ Database │  │   Auth   │  │    Service   │
              └──────────┘  └──────────┘  └──────────────┘
```

---

# 🔐 Authentication Flow

The application uses JWT-based authentication.

```text
User
  │
  ▼
Login
  │
  ▼
Django Authentication
  │
  ▼
JWT Access + Refresh Tokens
  │
  ▼
Protected API Requests
  │
  ▼
Role-Based Authorization
```

Protected resources are accessible according to the authenticated user's permissions.

---

# 🤖 AI Assistant

The platform includes an integrated AI assistant designed to provide contextual assistance within the asset management environment.

The assistant is accessible directly from the application interface and provides an additional natural-language interaction layer alongside the traditional dashboard workflows.

---

# 🛠️ Tech Stack

### Frontend

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">

### Backend

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white">
<img src="https://img.shields.io/badge/DRF-A30000?style=for-the-badge">

### Database

<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">

### Infrastructure

<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
<img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white">
<img src="https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white">

---

# 📁 Project Structure

```text
asset-management-system/
│
├── backend/
│   ├── assets/
│   ├── config/
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── assets.png
│       ├── inventory.png
│       ├── assignments.png
│       ├── tickets.png
│       ├── ai-assistant.png
│       └── users.png
│
├── README.md
└── docker-compose.yml
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/atkswalih/asset-management-system.git
cd asset-management-system
```

## 2. Backend setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run migrations

```bash
python manage.py migrate
```

### Start Django

```bash
python manage.py runserver
```

---

## 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available through the Vite development server.

---

# 🔌 API

### Authentication

```text
POST /api/auth/login/
POST /api/auth/refresh/
GET  /api/auth/me/
```

### Health Check

```text
GET /api/health/
```

### Application API

```text
/api/
```

The API provides endpoints for the application's asset, inventory, assignment, repair, user and related workflows.

---

# 🚢 Deployment

The production architecture uses:

```text
React
  ↓
Vite Build
  ↓
NGINX
  ↓
Render
  ↓
Django REST API
  ↓
PostgreSQL
```

The frontend and backend are deployed separately, with NGINX handling frontend delivery and API reverse-proxying.

---

# 🛡️ Security

The project includes several security-oriented practices:

* JWT authentication
* Protected API endpoints
* Role-based authorization
* Django security middleware
* Environment-based configuration
* Server-side validation
* Controlled user impersonation
* Production-ready reverse proxy configuration

---

# 📚 What This Project Demonstrates

This project demonstrates practical experience with:

* Full-stack application architecture
* REST API development
* React frontend development
* Django backend development
* Database-driven applications
* JWT authentication
* Role-based authorization
* CRUD workflows
* Asset lifecycle management
* AI integration
* Docker containerization
* NGINX configuration
* Production deployment
* Git and GitHub workflows
* Debugging deployed applications

---

# 🗺️ Roadmap

Potential future improvements:

* [ ] Advanced analytics dashboard
* [ ] Asset history timeline
* [ ] Email notifications
* [ ] Automated maintenance reminders
* [ ] Advanced reporting
* [ ] Audit logs
* [ ] More AI-powered workflows
* [ ] Automated testing suite
* [ ] CI/CD pipeline

---

# 👨‍💻 Author

<div align="center">

### Mohamed Swalih

Full Stack Python Developer · AI Application Developer

<a href="https://github.com/atkswalih">
  <img src="https://img.shields.io/badge/GitHub-atkswalih-181717?style=for-the-badge&logo=github">
</a>

</div>

---

<div align="center">

### ⭐ If you found this project interesting, consider giving it a star.

Built with ❤️ using **Python, Django, React and modern web technologies.**

</div>
