# Road Maintenance Citizen Feedback System

Combined backend + frontend project for reporting, tracking, and analyzing road maintenance issues.

## 🧩 Project structure

- `backend/` - Flask API with MongoDB persistence, AI enrichment, admin/workers endpoints, and rating flow.
  - `app.py` - Flask app and blueprint registration.
  - `config/db.py` - MongoDB connection.
  - `routes/` - API endpoints.
  - `services/ai_service.py` - Gemini AI helper for priority, summarization, duplicate detection, image detection.
  - `middleware/auth.py` - JWT token & worker/admin role guard.
  - `requirements.txt` - Python packages.
- `frontend/` - React + Vite app with dashboards and reporting flow.
  - `src/services/api.js` - axios API client targeting `http://localhost:5000/api`.
  - `src/pages/` - screens: Home, ReportIssue, AdminLogin, AdminDashboard, WorkerDashboard, MapPage, RatingPage.

## 🚀 Features

- User complaint reporting with uploaded image (base64), GPS location, description.
- Auto AI enrichment: priority, summary, duplicate checks, damage detection, fake complaint detection.
- Admin analytics: avg resolution time per issue type.
- Status updates with email notifications.
- Worker login + task list + status update.
- Complaint rating flow by user.
- Reputation system for users (blocked if low score).

## 🛠️ Requirements

- Windows (tested) / Linux / macOS
- Python 3.11+ (or 3.9+)
- Node.js 18+ / npm 9+
- MongoDB running (local/remote)

## 🔧 Backend setup

1. `cd backend`
2. Create virtual env and activate:
   - `python -m venv .venv`
   - `.venv\Scripts\activate` (Windows)
   - `source .venv/bin/activate` (Linux/macOS)
3. Install dependencies: `pip install -r requirements.txt`

4. Create `.env` file in `backend/` (example):

```env
MONGO_URI=mongodb://localhost:27017/
PORT=5000
JWT_SECRET=my_super_secret_key_123
EMAIL_SENDER=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
GEMINI_API_KEY=your_google_gemini_key
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
```

5. Run the backend:

```bash
python app.py
```

- Base endpoint: `http://localhost:5000/` returns `{"message": "Road Maintenance API is running"}`.

## 🧩 Frontend setup

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:5173`

> If your backend runs on a different host/port, edit `frontend/src/services/api.js` `baseURL` accordingly.

## 📡 API Endpoints

### Reports

- `POST /api/report`
  - body: `name`, `email`, `issueType`, `description`, `image` (base64), `address`, `location` (JSON with `latitude`, `longitude`), `isEmergency`, `language`.
- `GET /api/reports`
- `PUT /api/report/<id>`
  - body: `{ "status": "Pending"|"In Progress"|"Resolved"}`
- `DELETE /api/report/<id>`

### Admin

- `POST /api/admin/login`
  - body: `{ "username": "admin", "password": "admin123" }`
- `PUT /api/admin/report/<id>/status`
  - same status values + email notification.
- `GET /api/admin/analytics/`
  - stats for avg resolution hours per issue type.

### Worker

- `POST /api/worker/login`
  - body: `{ "email": "worker@example.com" }`
  - returns JWT.
- `GET /api/worker/tasks` (Bearer token)
- `POST /api/worker/update-status` (Bearer token)
  - body: `complaintId`, `status` (`In Progress` | `Resolved`), optional `completionImage`.

### Ratings

- `POST /api/rate`
  - body: `complaintId`, `token`, `rating` (1-5)

## 📦 Data model (MongoDB)

`reports` document sample:

```json
{
  "name": "John Doe",
  "email": "john@mail.com",
  "issueType": "Pothole",
  "description": "Large pothole on 5th street",
  "image": "data:image/jpeg;base64,...",
  "address": "5th Street & Elm",
  "location": {"latitude": 12.34, "longitude": 56.78},
  "status": "Pending",
  "createdAt": ISODate(...),
  "resolvedAt": ISODate(...),
  "isFake": false,
  "isEmergency": false,
  "priority": "HIGH",
  "summary": "...",
  "isDuplicate": false,
  "aiSuggestion": {"urgency":"High","workersNeeded":"3","estimatedTime":"1 day"},
  "aiDetection": {"damageType":"Pothole","severity":"Medium"},
  "rating": 4,
  "ratedAt": ISODate(...)
}
```

`users` document keys:

- `email`, `name`, `role` (`worker`|`admin`), `reputationScore`.

## 🧪 Testing

- Backend: add unit tests in `backend/` (no tests currently included).
- Frontend: use `npm run lint`, plus manual flows.

## 💡 Notes

- AI features require `google-genai` and `GEMINI_API_KEY`; code has graceful fallback when unavailable.
- Worker route auth has fallback header `X-User-Email` for quick local dev.
- Admin login is currently hardcoded (`admin/admin123`) and should be replaced with secure store in production.
- Email is sent from credentials in `.env`; for Gmail you may need app-specific password and allow less secure apps.

## ✅ Quick run

From repo root:

```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python app.py

cd ../frontend
npm install
npm run dev
```

Then frontend at `http://localhost:5173` and backend at `http://localhost:5000`.
