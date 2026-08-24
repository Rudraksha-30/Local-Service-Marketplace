# TrustHome — Local Service Marketplace

**TrustHome** is a local service marketplace web application built with the MERN stack (Node.js, Express, React, Tailwind CSS). This repository contains the navigational shell and role-based dashboard scaffolding for four distinct user archetypes.

---

## 🚀 Features

- **Landing Page (`/`)**: Displays brand identity, project tagline, and quick navigation cards to access all role-based workspaces directly without authentication.
- **Role-Based Dashboard Shells**:
  - **Customer Workspace** (`/dashboard/customer`): Manage bookings, service history, and disputes.
  - **Professional Workspace** (`/dashboard/professional`): Track assigned jobs, Trust Score metrics, and verification docs.
  - **Quality Inspector Workspace** (`/dashboard/inspector`): Conduct quality audits and compliance reviews.
  - **Support & Admin Workspace** (`/dashboard/admin`): Arbitrate customer disputes and monitor system health.
- **Theme Toggle**: Full light/dark mode support persisted across navigation using React Context.
- **API Health Integration**: Live health check badge fetching `GET /api/health` from the Node.js/Express backend.

---

## 📁 Repository Structure

```
trusthome/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Database & service configurations (placeholder)
│   │   ├── controllers/      # Route logic controllers (placeholder)
│   │   ├── models/           # Data models (placeholder)
│   │   ├── routes/           # API routes (health.js)
│   │   └── server.js         # Express server entrypoint (Port 5000)
│   ├── .env.example          # Environment variable template
│   └── package.json
│
├── frontend/                 # React (Vite) + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/       # Reusable Navbar & Sidebar components
│   │   ├── context/          # ThemeContext (Light / Dark mode)
│   │   ├── layouts/          # DashboardLayout wrapper
│   │   ├── pages/            # LandingPage & 4 Role Dashboard Pages
│   │   ├── App.jsx           # React Router route definitions
│   │   └── index.css         # Tailwind directives & global styling
│   ├── vite.config.js        # Vite dev server + API proxy configuration
│   └── package.json
│
├── .gitignore                # Ignored node_modules, build outputs, and environment files
└── README.md                 # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### 1. Start the Backend API Server

```bash
cd backend
npm install
npm start
```
*The Express server will start on `http://localhost:5000`.*

Test API connectivity:
```bash
curl http://localhost:5000/api/health
```

### 2. Start the Frontend React Client

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:3000`.*

---

## 🔌 REST API Endpoints

| Method | Endpoint      | Description                               | Response                        |
| :---   | :---          | :---                                      | :---                            |
| `GET`  | `/api/health` | Verifies server readiness & response time | `{ "status": "ok", ... }`       |

---

## 📌 Deferred Capabilities (Future Passes)

- Authentication (JWT / Sessions / OAuth)
- Database Integration (MongoDB / Mongoose schemas)
- Dynamic job dispatch & booking creation workflow
- Real-time Trust Score calculation algorithm
