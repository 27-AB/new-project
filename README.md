# ASTU Analytics Platform

**Adama Science and Technology University — Research & Community Analytics System**

A full-stack microservices platform for managing and visualising university research projects, community outreach, college statistics, and funding data.

---

## Architecture

```
Browser (React :3000)
        ↓
analytics-service :4000  ←── aggregates everything + PDF/CSV
    ↙       ↓        ↘
:4001    :4002      :4003
research community  college
service  service    service
    ↘       ↓        ↙
         MongoDB Atlas
              ↑
        auth-service :4004
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| `auth-service` | 4004 | Login, JWT tokens, user roles |
| `research-service` | 4001 | Research projects CRUD |
| `community-service` | 4002 | Community projects CRUD |
| `college-service` | 4003 | Colleges + researchers data |
| `analytics-service` | 4000 | Aggregator + PDF/CSV export |
| `frontend` | 3000 | React dashboard (all pages) |

---

## Quick Start (Windows)

### Step 1 — Install everything
Double-click `install-all.bat` or run in terminal:
```
.\install-all.bat
```

### Step 2 — Start all services
Open **6 PowerShell/CMD windows** inside this folder:

```
Terminal 1:  cd auth-service      && npm start
Terminal 2:  cd research-service  && npm start
Terminal 3:  cd community-service && npm start
Terminal 4:  cd college-service   && npm start
Terminal 5:  cd analytics-service && npm start
Terminal 6:  cd frontend          && npm start
```

### Step 3 — Seed the database
1. Open http://localhost:3000
2. Login with: `admin@astu.edu.et` / `admin1234`
3. Go to **Settings** → click **"Seed All Services with ASTU Data"**
4. Refresh the dashboard — real data appears everywhere

---

## Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@astu.edu.et | admin1234 | Full access — add/edit/delete, reports, user management |
| Researcher | researcher@astu.edu.et | research1234 | Add/edit projects, view all |
| Viewer | viewer@astu.edu.et | viewer1234 | Read-only access |

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | /login | ASTU-branded login |
| Dashboard | / | Overview, charts, quick access |
| Research Projects | /research | Full table with search/filter/add/edit/delete |
| Community Projects | /community | Community outreach with impact metrics |
| Colleges | /colleges | All 7 ASTU colleges with departments |
| Researchers | /researchers | Faculty cards with publications |
| Funding & Grants | /funding | Financial breakdown by college and source |
| Reports | /reports | Generate PDF + export CSV |
| Settings | /settings | API config + user management |

---

## Features

- ✅ JWT authentication with 3 role levels
- ✅ Real MongoDB Atlas database
- ✅ Full CRUD — add, edit, delete projects
- ✅ Search and filter on all pages
- ✅ Bar, pie, and line charts (Recharts)
- ✅ PDF report generation (pdfkit)
- ✅ CSV data export
- ✅ 7 real ASTU colleges with correct departments
- ✅ 14 realistic ASTU researchers
- ✅ 12 research projects with real ASTU topics
- ✅ 8 community projects in and around Adama
- ✅ Responsive dark enterprise UI
- ✅ Protected routes — redirects to login if not authenticated

---

## Switching to Real School API

When your teacher provides the real ASTU API:

1. Login as Admin → go to **Settings**
2. Update the service URLs to the real API endpoints
3. Click **Save Configuration**
4. The system will fetch live data automatically — no code changes needed

---

## Deployment

### Backends → Render.com (free)
Deploy each service folder as a Web Service:
- Build: `npm install`
- Start: `npm start`
- Add env vars from the `.env` file in each service

### Frontend → Vercel.com (free)
- Import the `frontend/` folder
- Set env var: `REACT_APP_API_URL=https://your-analytics-service.onrender.com`
- Set env var: `REACT_APP_AUTH_URL=https://your-auth-service.onrender.com`

---

## Folder Structure

```
astu-analytics/
├── install-all.bat              ← run this first on Windows
├── auth-service/                ← port 4004
│   └── src/
│       ├── models/User.js
│       ├── controllers/authController.js
│       ├── middleware/auth.js   ← JWT verification
│       └── routes/
├── research-service/            ← port 4001
│   └── src/
│       ├── models/Research.js
│       └── controllers/researchController.js   ← 12 ASTU seed projects
├── community-service/           ← port 4002
│   └── src/
│       ├── models/Community.js
│       └── controllers/communityController.js  ← 8 Adama seed projects
├── college-service/             ← port 4003
│   └── src/
│       ├── models/College.js
│       └── controllers/collegeController.js    ← 7 colleges + 14 researchers
├── analytics-service/           ← port 4000
│   └── src/
│       ├── services/aggregatorService.js       ← fetches all 3 services
│       └── controllers/analyticsController.js  ← PDF + CSV generation
└── frontend/                    ← port 3000
    └── src/
        ├── App.js               ← router + protected routes
        ├── context/AuthContext.js
        ├── hooks/useAnalytics.js
        ├── components/
        │   ├── layout/Layout.js ← sidebar + topbar
        │   └── ui/index.js      ← shared components
        └── pages/
            ├── Login.js
            ├── Dashboard.js     ← charts, stats, recent projects
            ├── ResearchProjects.js
            ├── CommunityProjects.js
            ├── Colleges.js
            ├── Researchers.js
            ├── Funding.js
            ├── Reports.js
            └── Settings.js
```
