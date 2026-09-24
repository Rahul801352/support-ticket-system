# Support Ticket Management System

A production-grade, full-stack Support Ticket Portal built with **React.js**, **Node.js**, **Express.js**, **MySQL**, **JWT Authentication**, **bcrypt password hashing**, **Jest & Supertest**, and **Postman**.

---

## 🌟 Overview & Business Scenario

This application provides a support portal where:
1. **Customers** can register, log in, submit support tickets, search/filter their tickets, view conversation threads, and post comments/replies.
2. **Support Agents** can log in, view system-wide dashboard metrics, monitor all support tickets, search/filter/sort tickets, update ticket status and priority levels, assign tickets to agents, and post official responses.

---

## 🚀 Key Features

### 👤 Customer Capabilities
* **Account Registration**: Secure signup with bcrypt password hashing (`role = customer`).
* **Authentication**: JWT token-based login/logout.
* **Ticket Creation**: Submit tickets with subject, detailed description, and priority level (`low`, `medium`, `high`).
* **Ticket Isolation**: View and search **only** their own support tickets (enforced strictly by backend ownership checks).
* **Ticket Conversation**: View comments/updates and post replies to open tickets.

### 🛡️ Support Agent Capabilities
* **Agent Dashboard**: High-level statistical cards showing Total Tickets, Open, In Progress, Resolved, and High Priority counts.
* **Global Queue Access**: View, search, filter, and sort **all** customer support tickets.
* **Ticket Management**: Update status (`open`, `in_progress`, `closed`), change priority (`low`, `medium`, `high`), and assign tickets to available agents.
* **Agent List Access**: Access restricted `/api/users` endpoint to populate agent assignment dropdowns.
* **Agent Responses**: Post responses directly into ticket conversation threads.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, React Router DOM v6, Axios, Lucide React Icons, Modern CSS |
| **Backend** | Node.js, Express.js, REST API Architecture |
| **Database** | MySQL (with parameterized queries via `mysql2`) |
| **Authentication** | JWT (JSON Web Tokens) & Bcrypt (10 rounds password hashing) |
| **Automated Testing** | Jest + Supertest (17 integration test cases passing) |
| **API Testing** | Postman Collection v2.1 |
| **Environment** | dotenv for secret & configuration management |

---

## 📁 Directory Structure

```
support-ticket-system/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints (/register, /login, /me)
│   │   ├── tickets.js       # Ticket & comment CRUD + stats endpoints
│   │   └── users.js         # Agent user listing endpoint
│   ├── middleware/
│   │   └── auth.js          # authenticate & requireRole middleware
│   ├── tests/
│   │   └── api.test.js      # Jest + Supertest integration test suite
│   ├── db.js                # MySQL pool connection + SQLite in-memory test driver
│   ├── server.js            # Express application entrypoint
│   ├── .env.example         # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # Navbar, StatusBadge, PriorityBadge, ProtectedRoute
│   │   ├── context/         # AuthContext provider
│   │   ├── pages/           # LoginPage, RegisterPage, CustomerDashboard, CreateTicketPage, TicketDetailPage, AgentDashboard, NotFoundPage
│   │   ├── api.js           # Centralized Axios client with JWT interceptor
│   │   ├── App.js           # React Router configuration
│   │   ├── index.js
│   │   └── index.css        # Custom responsive design stylesheet
│   └── package.json
│
├── database/
│   ├── schema.sql           # MySQL database schema (users, tickets, ticket_comments)
│   └── seed.sql             # Demo seed data (seed customers, agents, sample tickets, comments)
│
├── tests/
│   └── api.test.js          # Root test suite wrapper
│
├── postman_collection.json  # Complete Postman v2.1 collection with collection variables
├── .env.example             # Root environment configuration template
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation & reference guide
```

---

## 🔒 Security Architecture

1. **Password Hashing**: Passwords are salted and hashed using **bcrypt** (cost factor 10) prior to storage in MySQL.
2. **JWT Authentication**: Tokens are signed using `JWT_SECRET` and contain `{ id, name, email, role }`.
3. **Backend Authorization Enforcement**: 
   * Authentication (`authenticate`) is cleanly decoupled from Role Authorization (`requireRole`).
   * Ticket ownership (`ticket.user_id === req.user.id`) is verified on every individual ticket GET, comment GET, and comment POST operation.
   * `req.user.id` and `req.user.role` are derived exclusively from the verified JWT payload—never from client request bodies.
4. **SQL Injection Prevention**: All MySQL queries utilize parameterized placeholders (`?`) via `pool.execute(...)`.
5. **CORS Configuration**: Cross-Origin Resource Sharing is enabled for frontend-backend communication.

---

## 🗄️ Database Schema & SQL Setup

### Schema Overview (`database/schema.sql`)
- **`users`**: `id` (PK), `name`, `email` (UNIQUE), `password_hash`, `role` (`customer` | `agent`), `created_at`
- **`tickets`**: `id` (PK), `user_id` (FK -> users.id), `subject`, `description`, `priority` (`low` | `medium` | `high`), `status` (`open` | `in_progress` | `closed`), `assigned_to` (FK -> users.id), `created_at`, `updated_at`
- **`ticket_comments`**: `id` (PK), `ticket_id` (FK -> tickets.id), `user_id` (FK -> users.id), `comment`, `created_at`
- **Indexes**: `idx_status`, `idx_priority`, `idx_user_id`, `idx_assigned_to`, `idx_email` for optimized query performance.

### Mandatory JOIN Query
Demonstrated query to retrieve all open tickets along with customer details:
```sql
SELECT tickets.id, tickets.subject, tickets.status, users.name AS customer_name, users.email
FROM tickets
JOIN users ON tickets.user_id = users.id
WHERE tickets.status = 'open';
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer** | `john@example.com` | `Password123!` |
| **Customer** | `jane@example.com` | `Password123!` |
| **Support Agent** | `agent.sarah@example.com` | `Password123!` |
| **Support Agent** | `agent.mike@example.com` | `Password123!` |

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get logged-in user profile details |
| `GET` | `/api/tickets` | Authenticated | Fetch tickets (Customers get own tickets, Agents get all) |
| `POST` | `/api/tickets` | Authenticated | Create a new support ticket |
| `GET` | `/api/tickets/stats` | Agent Only | Fetch ticket summary metrics for dashboard |
| `GET` | `/api/tickets/:id` | Authorized User | Fetch single ticket details with customer & agent metadata |
| `PUT` | `/api/tickets/:id` | Agent Only | Update status, priority, or assigned agent |
| `DELETE` | `/api/tickets/:id` | Agent Only | Delete a ticket |
| `GET` | `/api/tickets/:id/comments` | Authorized User | Fetch comments thread for a ticket |
| `POST` | `/api/tickets/:id/comments` | Authorized User | Post a reply/comment to a ticket thread |
| `GET` | `/api/users` | Agent Only | Fetch agents list for ticket assignment dropdown |

---

## 💻 Local Installation & Setup

### Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **MySQL Server**: v8.0+ (or SQLite in-memory fallback for automated tests)

### 1. Database Setup
Log in to your local MySQL server and run the schema and seed scripts:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=support_tickets
JWT_SECRET=super_secret_jwt_key_support_ticket_system_2026
CLIENT_URL=http://localhost:3000
```

Start the Backend Server:
```bash
npm run dev
# Server will run on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Configure `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the React Frontend App:
```bash
npm start
# Application will launch on http://localhost:3000
```

---

## 🧪 Automated Testing

The backend includes a Jest + Supertest integration test suite covering 17 test scenarios:
- Customer Registration & Validation
- Password Hashing & Credentials Verification
- JWT Bearer Authentication & 401 Rejections
- Role Authorization & 403 Forbidden Checks
- Ticket Creation, Ownership Restrictions, and Status Updates
- Comment Posting and Ticket Stats Generation

Run Automated Tests:
```bash
cd backend
npm test
```

---

## 📮 Postman Collection Instructions

1. Open Postman.
2. Click **Import** and select `postman_collection.json` from the repository root.
3. The collection is configured with variables (`baseUrl`, `customerToken`, `agentToken`, `ticketId`).
4. Execute `1.2 Customer Login` or `1.3 Support Agent Login`—the response test scripts will automatically capture and populate the JWT tokens for subsequent requests!

---

## 🌐 Production Deployment

### 1. Cloud Database (MySQL)
- Deploy MySQL instance on **Railway**, **Aiven**, or **PlanetScale**.
- Run `database/schema.sql` and `database/seed.sql` on the cloud instance.

### 2. Deployed Backend (Render / Railway)
- Connect GitHub repo and specify directory `backend/`.
- Set Environment Variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `CLIENT_URL`.
- Deployed API URL Placeholder: `https://support-ticket-api.onrender.com`

### 3. Deployed Frontend (Vercel / Netlify)
- Connect GitHub repo and specify directory `frontend/`.
- Set Environment Variable: `REACT_APP_API_URL=https://support-ticket-api.onrender.com/api`.
- Deployed App URL Placeholder: `https://support-ticket-system.vercel.app`
