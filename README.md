# Chai Tapri Ticket

> ChaiCode Hackathon — Backend Track  
> A cinema seat booking platform

---

## What This Project Does

Users can register and log in. Only authenticated users can book seats for a movie. Each booking is linked to the logged-in user. Duplicate bookings are prevented using database-level transactions.

---

## Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js (ESM)                    |
| Framework        | Express.js                       |
| Database         | PostgreSQL 16 (Docker)           |
| ORM              | Drizzle ORM                      |
| Auth             | JWT (Access + Refresh Token)     |
| Password Hashing | bcryptjs                         |
| Validation       | Joi (class-based DTOs)           |
| Frontend         | HTML + Tailwind CSS + Vanilla JS |
| Dev Tools        | Nodemon, Drizzle Kit             |

---

## 📁 Folder Structure

```
book-my-ticket/
│
├── server.js                          # Entry point — connects DB then starts server
├── docker-compose.yml                 # PostgreSQL container setup
├── drizzle.config.js                  # Drizzle ORM config
├── .env                               # Environment variables (copy from .env.example)
├── .env.example                       # Template for env vars
├── .gitignore
├── package.json
│
├── public/
│   └── index.html, style.css, script.js                     # Frontend — HTML + Tailwind + Vanilla JS
│
└── src/
    ├── app.js                         # Express app setup, routes, global error handler
    │
    ├── common/                        # Shared utilities used across the whole project
    │   ├── config/
    │   │   ├── db.js                  # Drizzle ORM + database connection
    │   │   └── schema.js              # Database schema: users table + seats table
    │   │
    │   ├── dto/
    │   │   └── base.dto.js            # Base DTO validate data that comes from frontend
    │   │
    │   ├── middleware/
    │   │   ├── validate.middleware.js  # Runs Joi DTO validation on req.body
    │   │   └── error.middleware.js     # Global error handler (catches all thrown errors)
    │   │
    │   └── utils/
    │       ├── api-error.js           # ApiError
    │       ├── api-response.js        # ApiResponse
    │       └── jwt.utils.js           # Generate and verify access + refresh tokens
    │
    └── modules/                       # Feature modules (each feature is self-contained)
        │
        ├── auth/
        │   ├── dto/
        │   │   ├── register.dto.js    # Validates: name, email, password, role
        │   │   └── login.dto.js       # Validates: email, password
        │   │
        │   ├── auth.model.js          # All DB queries for users (Drizzle)
        │   ├── auth.service.js        # Business logic: register, login, refresh, logout
        │   ├── auth.controller.js     # Calls service, sends HTTP response
        │   ├── auth.middleware.js     # authenticate middleware (verifies JWT)
        │   └── auth.route.js          # Wires routes to controllers + middleware
        │
        └── seats/
            ├── seat.model.js          # DB queries + booking transaction (SELECT FOR UPDATE)
            ├── seat.service.js        # Business logic for seats
            ├── seat.controller.js     # Calls service, sends HTTP response
            └── seat.route.js          # GET /api/seats (public), PUT /api/seats/:id (protected)
```

---

## Setup & Installation

### Pre-install

- [Node.js](https://nodejs.org/) v18 or above
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the database)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/SaurabhRavte/chai-tapri-cinema.git
cd chai-tapri-cinema
```

---

### Step 2 — Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and update the values if needed. Defaults work out of the box with Docker:

```env
PORT=8080
NODE_ENV=development

# Database (matches docker-compose.yml)
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

DATABASE_URL=

# JWT — change these in production!
JWT_ACCESS_SECRET=y
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d
```

---

### Step 3 — Start the database

```bash
npm run db:up
```

This starts a PostgreSQL 16 container via Docker. The database `book_my_ticket` is created automatically.

---

### Step 4 — Install dependencies

```bash
npm install
```

---

### Step 5 — Push the schema to the database

```bash
npm run db:push
```

This creates the `users` and `seats` tables using Drizzle ORM.

---

### Step 6 — Seed the seats (run once)

Connect to the database and run this SQL to insert 20 seats:

```bash
# Open psql inside the Docker container
docker exec -it bmt_postgres psql -U postgres -d book_my_ticket
```

```sql
INSERT INTO seats (isbooked) SELECT 0 FROM generate_series(1, 20);
```

Then type `\q` to exit.

---

### Step 7 — Start the server

```bash
npm run dev
```

Server runs at → **http://localhost:8080**

---

## API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint                  | Auth Required | Description                                |
| ------ | ------------------------- | :-----------: | ------------------------------------------ |
| POST   | `/api/auth/register`      |      ❌       | Create a new account                       |
| POST   | `/api/auth/login`         |      ❌       | Login, get access token + refresh cookie   |
| POST   | `/api/auth/refresh-token` |  ❌ (cookie)  | Get a new access token using refresh token |
| POST   | `/api/auth/logout`        |      ✅       | Invalidate refresh token                   |
| GET    | `/api/auth/me`            |      ✅       | Get logged-in user's profile               |

### Seat Routes — `/api/seats`

| Method | Endpoint         | Auth Required | Description                            |
| ------ | ---------------- | :-----------: | -------------------------------------- |
| GET    | `/api/seats`     |      ❌       | Get all seats and their booking status |
| PUT    | `/api/seats/:id` |      ✅       | Book a specific seat                   |

> ✅ = Send `Authorization: Bearer <accessToken>` in the request header

---

## API Request & Response Examples

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Saurabh Ravte",
  "email": "saurabh@example.com",
  "password": "xxxxxx"
}
```

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": 1,
    "name": "Saurabh Ravte",
    "email": "saurabh@example.com",
    "role": "customer",
    "createdAt": "2025-04-13T10:00:00.000Z"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "saurabh@example.com",
  "password": "xxxxxx"
}
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Saurabh Ravte",
      "email": "saurabh@example.com"
    },
    "accessToken": "eyJhbGci..."
  }
}
```

> Refresh token is set automatically as an `httpOnly` cookie.

### Book a Seat

```http
PUT /api/seats/5
Authorization: Bearer eyJhbGci...
```

```json
{
  "success": true,
  "message": "Seat booked successfully",
  "data": {
    "success": true,
    "seatId": 5,
    "bookedBy": "Saurabh Ravte"
  }
}
```

### Seat Already Booked

```json
{
  "success": false,
  "message": "Seat already booked"
}
```

---

## 🔐 Auth Flow

```
REGISTER
  → validate input (Joi DTO)
  → check email not already taken
  → hash password with bcrypt (12 rounds)
  → save user to DB
  → return user object (no password)

LOGIN
  → validate input (Joi DTO)
  → find user by email
  → compare password with bcrypt
  → generate access token  (15 min expiry, stored in memory)
  → generate refresh token (7 day expiry, stored in DB + httpOnly cookie)
  → return access token in response body

PROTECTED REQUEST
  → client sends: Authorization: Bearer <accessToken>
  → authenticate middleware decodes + verifies the token
  → looks up user in DB to confirm they still exist
  → attaches user to req.user
  → route handler proceeds

TOKEN REFRESH
  → access token expires after 15 min
  → frontend calls POST /api/auth/refresh-token
  → browser sends httpOnly cookie automatically
  → server verifies cookie token matches DB
  → issues a fresh access token

LOGOUT
  → refresh token deleted from DB
  → httpOnly cookie cleared
  → old tokens can no longer be refreshed
```

---

## Seat Booking Logic

The booking uses a **PostgreSQL transaction with row-level locking** (`SELECT FOR UPDATE`) to prevent two users from booking the same seat at the same time.

```
User A clicks Seat 5              User B clicks Seat 5 (same moment)
        ↓                                  ↓
    BEGIN                              BEGIN
        ↓                                  ↓
SELECT seat 5                      SELECT seat 5
WHERE isbooked = 0                 WHERE isbooked = 0
FOR UPDATE  ← locks the row        FOR UPDATE  ← WAITS (row locked by A)
        ↓
   Row found → safe to book
        ↓
UPDATE seat 5
  SET isbooked = 1
  SET name = 'Saurabh'
  SET user_id = 1
        ↓
    COMMIT  ← lock released
                                           ↓  (B's query now runs)
                                   Row not found (isbooked is now 1)
                                           ↓
                                       ROLLBACK
                                           ↓
                                   Returns "Seat already booked"
```

This is the same approach used in the original starter code — preserved and extended with auth.

---

## 🗃️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'customer',
  refresh_token VARCHAR(512),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Seats table (extended from starter)
CREATE TABLE seats (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255),                      -- name of person who booked
  isbooked   INTEGER DEFAULT 0,                 -- 0 = available, 1 = booked
  user_id    INTEGER REFERENCES users(id),      -- links booking to a user
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📜 Available Scripts

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start server with nodemon (auto-restart on file change) |
| `npm start`         | Start server (production)                               |
| `npm run db:up`     | Start PostgreSQL Docker container                       |
| `npm run db:down`   | Stop PostgreSQL Docker container                        |
| `npm run db:push`   | Push Drizzle schema to DB (creates/updates tables)      |
| `npm run db:studio` | Open Drizzle Studio — visual database browser           |

---

## 🔗 Changes from Starter Code

The original starter (`index.mjs`) had two endpoints:

| Original         | New                  | Change                                               |
| ---------------- | -------------------- | ---------------------------------------------------- |
| `GET /seats`     | `GET /api/seats`     | Moved under `/api` prefix, still public              |
| `PUT /:id/:name` | `PUT /api/seats/:id` | Name now comes from JWT instead of URL — more secure |

The booking transaction logic (`SELECT FOR UPDATE`, `BEGIN/COMMIT/ROLLBACK`) is identical to the starter. No existing behaviour was broken — only the name-in-URL approach was replaced with proper auth.

---

## 👨‍💻 Author

Saurabh Ravte  
GitHub: https://github.com/SaurabhRavte
