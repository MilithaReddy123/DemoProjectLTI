# Backend Documentation - Employee Cafeteria Management System

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [How Backend Works](#how-backend-works)
5. [Database Design](#database-design)
6. [Server Setup & Configuration](#server-setup--configuration)
7. [API Endpoints](#api-endpoints)
8. [Controllers Deep Dive](#controllers-deep-dive)
9. [Routes Explained](#routes-explained)
10. [Frontend-Backend Integration](#frontend-backend-integration)
11. [Data Flow Examples](#data-flow-examples)
12. [Security Features](#security-features)
13. [How to Run](#how-to-run)

---

## Overview

This is a **RESTful API backend** built with **Node.js and Express** that powers the Employee Cafeteria Management System. It handles:

- **User Authentication** (Registration & Login)
- **CRUD Operations** for user profiles
- **Data Persistence** using MySQL database
- **Password Security** with bcrypt hashing
- **CORS** enabled for frontend communication

### What This Backend Does

Think of the backend as a **smart waiter** in a cafeteria:
1. Takes orders (API requests) from customers (frontend)
2. Prepares the food (processes data)
3. Stores ingredients (saves to database)
4. Retrieves items from storage (fetches from database)
5. Delivers to customers (sends responses)
6. Ensures food safety (validates data, secures passwords)

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Runtime | JavaScript runtime for server |
| **Express** | ^4.18.2 | Web framework for REST API |
| **MySQL2** | ^3.6.5 | MySQL database client with promises |
| **bcryptjs** | ^2.4.3 | Password hashing for security |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing |
| **dotenv** | ^16.3.1 | Environment variable management |
| **uuid** | ^9.0.1 | Generate unique user IDs |
| **nodemon** | ^3.0.2 | Auto-restart server (development) |

---

## Project Structure

```
backend/
├── config/
│   └── database.js              # Database connection & initialization
├── controllers/
│   ├── authController.js        # Login & Registration logic
│   └── userController.js        # User CRUD operations logic
├── routes/
│   ├── authRoutes.js            # Authentication endpoints
│   └── userRoutes.js            # User management endpoints
├── server.js                    # Main entry point
├── package.json                 # Dependencies & scripts
└── .env (not included)          # Environment variables

Environment Variables (.env):
├── DB_HOST=localhost
├── DB_USER=root
├── DB_PASSWORD=your_password
├── DB_NAME=demo_app
├── DB_PORT=3306
└── PORT=3000
```

---

## How Backend Works

### 🚀 Startup Sequence

When you run `npm start`, here's what happens step by step:

```
1. server.js loads
   ↓
2. Environment variables loaded (.env file)
   ↓
3. Express app created
   ↓
4. Middleware attached (CORS + JSON parser)
   ↓
5. Database pool created
   ↓
6. Database tables initialized (if not exist)
   ↓
7. Routes registered (/api/register, /api/login, /api/users/*)
   ↓
8. Server starts listening on port 3000
   ↓
9. Ready to receive requests from frontend! ✓
```

### 🔄 Request-Response Cycle

When frontend makes a request, this happens:

```
Frontend (Angular)
      ↓ HTTP Request (e.g., POST /api/login)
      ↓
Express Server (server.js)
      ↓
Route Handler (authRoutes.js)
      ↓
Controller Function (authController.js)
      ↓
Database Query (MySQL)
      ↓
Database Response
      ↓
Controller Processes Data
      ↓
Response Sent Back ← JSON
      ↓
Frontend Receives Data
```

---

## Database Design

### Database: `demo_app` (MySQL)

The backend uses **TWO TABLES** with a **one-to-one relationship**:

### 📊 Table 1: `users` (Basic Authentication)

Stores essential authentication information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID (e.g., "a1b2c3d4-...") |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Email address |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `created_at` | TIMESTAMP | DEFAULT NOW | Registration timestamp |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update timestamp |

**Indexes**:
- `idx_username` - Fast username lookups
- `idx_email` - Fast email lookups

**Example Row**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password_hash": "$2a$10$abc...xyz",
  "created_at": "2025-12-23 10:30:00",
  "updated_at": null
}
```

---

### 📊 Table 2: `user_interests` (Profile Details)

Stores extended profile information for cafeteria members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | VARCHAR(36) | PRIMARY KEY, FOREIGN KEY | References users(id) |
| `mobile` | VARCHAR(15) | NOT NULL | 10-digit phone number |
| `credit_card_last4` | VARCHAR(4) | NULL | Last 4 digits only (security!) |
| `state` | VARCHAR(100) | NOT NULL | State (Telangana/Andhra Pradesh) |
| `city` | VARCHAR(100) | NOT NULL | City |
| `gender` | ENUM | NOT NULL | 'Male', 'Female', 'Other' |
| `hobbies` | JSON | NULL | Array stored as JSON |
| `tech_interests` | JSON | NULL | Array stored as JSON |
| `address` | TEXT | NULL | Full address (optional) |
| `dob` | DATE | NULL | Date of birth |

**Foreign Key**: `user_id` references `users(id)` with `ON DELETE CASCADE` (if user deleted, interests deleted too)

**Example Row**:
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "mobile": "9876543210",
  "credit_card_last4": "1234",
  "state": "Telangana",
  "city": "Hyderabad",
  "gender": "Male",
  "hobbies": "[\"Reading\", \"Music\"]",
  "tech_interests": "[\"Angular\", \"Node.js\"]",
  "address": "123 Main St, Hyderabad",
  "dob": "1990-05-15"
}
```

---

### 🔗 Table Relationship

```
users (1) ←──────────→ (1) user_interests
             ONE-TO-ONE

users.id ────────→ user_interests.user_id
         (parent)        (child, FOREIGN KEY)
```

**Why Two Tables?**

1. **Separation of Concerns**:
   - `users` = Authentication (login/register)
   - `user_interests` = Profile details (cafeteria member info)

2. **Flexibility**:
   - User can register (`/api/register`) without full profile
   - Later add profile details via `/api/users` endpoint

3. **Security**:
   - Password hash isolated from profile data
   - Only store last 4 digits of credit card

---

## Server Setup & Configuration

### `server.js` - Main Entry Point

This is the **heart of the backend**. Let's break it down:

#### 1. Dependencies & Setup

```javascript
require('dotenv').config();              // Load environment variables
const express = require('express');      // Web framework
const cors = require('cors');            // Cross-origin requests
const { createPool, initializeDatabase } = require('./config/database');
```

#### 2. Express App Creation

```javascript
const app = express();
```

Creates an Express application instance that will handle all HTTP requests.

#### 3. Middleware

```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
```

**What is Middleware?**
Middleware functions run **before** your route handlers. Think of them as security checkpoints:

- **CORS Middleware**:
  - Allows frontend (running on port 4200) to make requests to backend (port 3000)
  - Without this, browser blocks the requests (security policy)
  - `origin: 'http://localhost:4200'` = only Angular app can access

- **JSON Middleware**:
  - Parses incoming JSON request bodies
  - Converts `'{"name": "John"}'` string to `{name: "John"}` object
  - Makes data accessible via `req.body`

#### 4. Database Connection

```javascript
const pool = createPool();
initializeDatabase(pool);
```

- Creates a **connection pool** (reusable database connections)
- Initializes database tables if they don't exist

#### 5. Route Registration

```javascript
const authRoutes = require('./routes/authRoutes')(pool);
const userRoutes = require('./routes/userRoutes')(pool);

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
```

**Route Mounting**:
- `/api` → handles `/api/register` and `/api/login`
- `/api/users` → handles `/api/users/`, `/api/users/:id`, etc.

#### 6. Health Check

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
```

Simple endpoint to verify server is alive.

#### 7. Server Start

```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
```

Starts server and listens for incoming requests.

---

### `config/database.js` - Database Connection

#### 1. Create Connection Pool

```javascript
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo_app',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();
};
```

**What is a Connection Pool?**

Instead of creating a new database connection for every request (slow!), we create a **pool of reusable connections**:

- **connectionLimit: 10** = Max 10 simultaneous connections
- **waitForConnections: true** = If all 10 busy, wait for one to free up
- **queueLimit: 0** = No limit on waiting requests
- **.promise()** = Use modern async/await instead of callbacks

**Benefits**:
- ⚡ **Fast**: Reuse existing connections
- 🔒 **Safe**: Manages connections automatically
- 📈 **Scalable**: Handles multiple requests efficiently

#### 2. Initialize Database

```javascript
const initializeDatabase = async (pool) => {
  // Test connection
  await pool.query('SELECT 1');
  console.log('✓ MySQL database connected successfully');
  
  // Create users table
  await pool.query(`CREATE TABLE IF NOT EXISTS users (...)`);
  
  // Create user_interests table
  await pool.query(`CREATE TABLE IF NOT EXISTS user_interests (...)`);
};
```

**What This Does**:
1. Tests if database connection works
2. Creates `users` table (if doesn't exist)
3. Creates `user_interests` table (if doesn't exist)
4. Sets up indexes for fast queries
5. Establishes foreign key relationship

**Why "IF NOT EXISTS"?**
- Safe to run multiple times
- Won't destroy existing data
- Creates tables only on first run

---

## API Endpoints

### Complete API Reference

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| **POST** | `/api/register` | Register new user | `{name, username, email, password}` | `{message, userId}` |
| **POST** | `/api/login` | Login user | `{username, password}` | `{message, userId}` |
| **GET** | `/api/users` | Get all users | None | `[{user1}, {user2}, ...]` |
| **GET** | `/api/users/:id` | Get user by ID | None | `{user details}` |
| **POST** | `/api/users` | Create user profile | `{all fields}` | `{message, id}` |
| **PUT** | `/api/users/:id` | Update user profile | `{updated fields}` | `{message}` |
| **DELETE** | `/api/users/:id` | Delete user | None | `{message}` |
| **GET** | `/api/health` | Health check | None | `{status: 'ok'}` |

---

## Controllers Deep Dive

Controllers contain the **business logic**. They receive requests, process data, interact with database, and send responses.

### authController.js - Authentication Logic

#### 🔐 Function 1: `register(pool)`

**Purpose**: Create new user account (basic registration)

**Step-by-Step Process**:

```javascript
1. RECEIVE DATA
   ↓ req.body = {name, username, email, password}
   
2. VALIDATE REQUIRED FIELDS
   ↓ Check if all fields present
   
3. VALIDATE NAME
   ↓ Min 2 chars, only letters/spaces, no numbers
   ↓ Pattern: /^[a-zA-Z\s]+$/
   
4. VALIDATE USERNAME
   ↓ 4-20 chars, letters/numbers/_/@
   ↓ Pattern: /^[a-zA-Z0-9_@]{4,20}$/
   
5. VALIDATE EMAIL
   ↓ Valid format with TLD (.com, .org, etc.)
   ↓ Pattern: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
   
6. VALIDATE PASSWORD
   ↓ Min 8 chars, uppercase, lowercase, digit, special char
   ↓ Pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/
   
7. CHECK DUPLICATES
   ↓ Query: SELECT id FROM users WHERE username=? OR email=?
   ↓ If exists → return error
   
8. GENERATE UUID
   ↓ userId = "123e4567-e89b-12d3-a456-426614174000"
   
9. HASH PASSWORD
   ↓ Plain "Password1!" → "$2a$10$abc...xyz" (bcrypt)
   ↓ 10 salt rounds (secure, but fast)
   
10. INSERT INTO DATABASE
    ↓ INSERT INTO users (id, name, email, username, password_hash) VALUES (...)
    
11. RESPOND
    ↓ {message: "Registration successful!", userId}
```

**Example Request**:
```json
POST /api/register
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password1!"
}
```

**Success Response** (201):
```json
{
  "message": "Registration successful! You can now login.",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Response** (400):
```json
{
  "message": "Username or email already exists. Please use a different one."
}
```

---

#### 🔑 Function 2: `login(pool)`

**Purpose**: Authenticate user

**Step-by-Step Process**:

```javascript
1. RECEIVE CREDENTIALS
   ↓ req.body = {username, password}
   
2. VALIDATE REQUIRED FIELDS
   ↓ Check username and password present
   
3. QUERY DATABASE
   ↓ SELECT id, username, password_hash FROM users 
   ↓ WHERE username=? OR email=?
   ↓ (Allows login with username OR email!)
   
4. CHECK IF USER EXISTS
   ↓ If no rows found → Invalid credentials
   
5. COMPARE PASSWORD
   ↓ await bcrypt.compare(password, password_hash)
   ↓ bcrypt automatically handles salting
   
6. VERIFY MATCH
   ↓ If doesn't match → Invalid credentials
   
7. RESPOND
   ↓ {message: "Login successful", userId}
```

**Example Request**:
```json
POST /api/login
{
  "username": "johndoe",
  "password": "Password1!"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Response** (401):
```json
{
  "message": "Invalid credentials"
}
```

**Security Note**: We return generic "Invalid credentials" instead of "User not found" or "Wrong password" to prevent attackers from knowing which usernames exist.

---

### userController.js - User Management Logic

#### Helper Functions

Before diving into main functions, let's understand the helpers:

**1. sanitizeValue(value)**
```javascript
// Converts null/empty strings to null for database
sanitizeValue("  ") → null
sanitizeValue("Hello") → "Hello"
sanitizeValue(null) → null
```

**2. parseJsonField(field)**
```javascript
// Safely parses JSON strings from database
parseJsonField("[\"Reading\",\"Music\"]") → ["Reading", "Music"]
parseJsonField(null) → []
```

**3. extractCreditCardLast4(creditCard)**
```javascript
// Extracts last 4 digits from credit card
extractCreditCardLast4("1234567812345678") → "5678"
// Used for security - we NEVER store full credit card!
```

**4. formatTimestamp(timestamp)**
```javascript
// Converts MySQL timestamp to ISO string
formatTimestamp("2025-12-23 10:30:00") → "2025-12-23T10:30:00.000Z"
```

---

#### 📋 Function 1: `getAllUsers(pool)`

**Purpose**: Fetch all users with their profile details

**Database Query**:
```sql
SELECT 
  u.id, u.name, u.email, u.username, u.created_at, u.updated_at,
  ui.mobile, ui.credit_card_last4, ui.state, ui.city, ui.gender,
  ui.hobbies, ui.tech_interests, ui.address, ui.dob
FROM users u
LEFT JOIN user_interests ui ON u.id = ui.user_id
ORDER BY u.created_at DESC
```

**What LEFT JOIN Does**:
- Gets ALL users from `users` table
- Adds matching data from `user_interests` if exists
- If no match, interest fields are NULL (user registered but no profile yet)

**Data Transformation**:
```javascript
// Database returns:
{
  credit_card_last4: "5678",
  hobbies: "[\"Reading\",\"Music\"]",
  tech_interests: "[\"Angular\",\"React\"]"
}

// Controller transforms to:
{
  creditCard: "************5678",  // Masked!
  hobbies: ["Reading", "Music"],  // Parsed JSON
  techInterests: ["Angular", "React"]  // Parsed JSON
}
```

**Example Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "created_at": "2025-12-23T10:30:00.000Z",
    "updated_at": null,
    "mobile": "9876543210",
    "creditCard": "************5678",
    "state": "Telangana",
    "city": "Hyderabad",
    "gender": "Male",
    "hobbies": ["Reading", "Music"],
    "techInterests": ["Angular", "Node.js"],
    "address": "123 Main St",
    "dob": "1990-05-15"
  },
  ...more users
]
```

---

#### 👤 Function 2: `getUserById(pool)`

**Purpose**: Fetch single user details

**Similar to getAllUsers but**:
- Uses `WHERE u.id = ?` to get specific user
- Returns 404 if user not found
- Returns single object (not array)

**Example Request**:
```
GET /api/users/123e4567-e89b-12d3-a456-426614174000
```

**Response**: Same format as individual user in getAllUsers

---

#### ➕ Function 3: `createUser(pool)`

**Purpose**: Create complete user profile (with authentication + interests)

**This is Different from `/api/register`**:
- `/api/register` → Basic auth user (minimal fields)
- `/api/users` (POST) → Full cafeteria member (all fields)

**Transaction Flow**:
```javascript
1. GET DATABASE CONNECTION
   ↓ connection = await pool.getConnection()
   
2. VALIDATE REQUIRED FIELDS
   ↓ name, email, mobile, state, city, username, password
   ↓ hobbies array (min 1 item)
   ↓ techInterests array (min 1 item)
   
3. BEGIN TRANSACTION
   ↓ await connection.beginTransaction()
   ↓ (All or nothing - if anything fails, rollback everything)
   
4. CHECK DUPLICATES
   ↓ SELECT id FROM users WHERE username=? OR email=?
   
5. GENERATE UUID & HASH PASSWORD
   ↓ userId = uuid()
   ↓ passwordHash = bcrypt.hash(password)
   
6. INSERT INTO users TABLE
   ↓ INSERT INTO users (id, name, email, username, password_hash)
   
7. INSERT INTO user_interests TABLE
   ↓ INSERT INTO user_interests (user_id, mobile, credit_card_last4, ...)
   ↓ Store hobbies/techInterests as JSON strings
   ↓ Store only last 4 digits of credit card
   
8. COMMIT TRANSACTION
   ↓ await connection.commit()
   ↓ (Both inserts succeed together)
   
9. RELEASE CONNECTION
   ↓ connection.release() (back to pool)
   
10. RESPOND
    ↓ {message: "User created successfully", id: userId}
```

**Why Use Transaction?**

Imagine inserting into `users` succeeds but `user_interests` fails:
- ❌ Without transaction: User created but no profile (data inconsistency!)
- ✅ With transaction: Both tables updated or both rolled back (data integrity!)

**Example Request**:
```json
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "creditCard": "1234567812345678",
  "state": "Telangana",
  "city": "Hyderabad",
  "gender": "Male",
  "hobbies": ["Reading", "Music"],
  "techInterests": ["Angular", "Node.js"],
  "address": "123 Main St",
  "username": "johndoe",
  "password": "Password1!",
  "dob": "1990-05-15"
}
```

**Success Response** (201):
```json
{
  "message": "User created successfully",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

#### ✏️ Function 4: `updateUser(pool)`

**Purpose**: Update existing user profile

**Special Features**:
- Updates `users` table (name, email)
- Updates OR creates `user_interests` row
- Username CANNOT be changed (security)
- Password CANNOT be changed via this endpoint

**Transaction Flow**:
```javascript
1. GET CONNECTION & BEGIN TRANSACTION
   
2. UPDATE users TABLE
   ↓ UPDATE users SET name=?, email=?, updated_at=NOW() WHERE id=?
   
3. CHECK IF user_interests EXISTS
   ↓ SELECT user_id FROM user_interests WHERE user_id=?
   
4a. IF NOT EXISTS (user from /register)
    ↓ INSERT INTO user_interests (...)
    
4b. IF EXISTS
    ↓ UPDATE user_interests SET mobile=?, state=?, ... WHERE user_id=?
    
5. COMMIT TRANSACTION
   
6. RELEASE CONNECTION
   
7. RESPOND
```

**Why Check Existence?**

A user registered via `/api/register` has entry in `users` but NOT in `user_interests`. First update needs to INSERT instead of UPDATE.

**Example Request**:
```json
PUT /api/users/123e4567-e89b-12d3-a456-426614174000
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "mobile": "9876543211",
  "creditCard": "1234567812345678",
  "state": "Andhra Pradesh",
  "city": "Vijayawada",
  "gender": "Male",
  "hobbies": ["Reading", "Sports"],
  "techInterests": ["React", "Java"],
  "address": "456 New St",
  "dob": "1990-05-15"
}
```

**Response**:
```json
{
  "message": "User updated successfully"
}
```

---

#### 🗑️ Function 5: `deleteUser(pool)`

**Purpose**: Delete user completely

**Simple but Powerful**:
```javascript
await pool.query('DELETE FROM users WHERE id = ?', [id]);
```

**What Happens**:
1. Deletes row from `users` table
2. **CASCADE DELETE** automatically deletes from `user_interests`
   - Defined in foreign key: `ON DELETE CASCADE`
   - No orphan records left!

**Example Request**:
```
DELETE /api/users/123e4567-e89b-12d3-a456-426614174000
```

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

---

## Routes Explained

Routes define **which URL maps to which controller function**.

### authRoutes.js

```javascript
const router = express.Router();

module.exports = (pool) => {
  router.post('/register', register(pool));
  router.post('/login', login(pool));
  return router;
};
```

**Mounted at** `/api` in server.js

**Resulting URLs**:
- `POST /api/register` → `register()` controller
- `POST /api/login` → `login()` controller

---

### userRoutes.js

```javascript
const router = express.Router();

module.exports = (pool) => {
  router.get('/', getAllUsers(pool));
  router.get('/:id', getUserById(pool));
  router.post('/', createUser(pool));
  router.put('/:id', updateUser(pool));
  router.delete('/:id', deleteUser(pool));
  return router;
};
```

**Mounted at** `/api/users` in server.js

**Resulting URLs**:
- `GET /api/users` → `getAllUsers()` controller
- `GET /api/users/123abc` → `getUserById('123abc')` controller
- `POST /api/users` → `createUser()` controller
- `PUT /api/users/123abc` → `updateUser('123abc')` controller
- `DELETE /api/users/123abc` → `deleteUser('123abc')` controller

**:id Parameter**:
- `:id` is a route parameter
- Accessible via `req.params.id` in controller
- Example: `/api/users/abc123` → `req.params.id = "abc123"`

---

## Frontend-Backend Integration

### How Frontend & Backend Talk to Each Other

#### 1. Configuration

**Frontend** (`src/app/services/user.service.ts`):
```typescript
private baseUrl = 'http://localhost:3000/api';
```

**Backend** (`server.js`):
```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
```

- Frontend runs on `http://localhost:4200` (Angular)
- Backend runs on `http://localhost:3000` (Express)
- CORS allows port 4200 to access port 3000

#### 2. HTTP Communication

**Frontend Service** makes HTTP requests:
```typescript
// In Angular service
login(credentials): Observable<any> {
  return this.http.post(`${this.baseUrl}/login`, credentials);
}
```

**Backend Route** receives and responds:
```javascript
// In Express
router.post('/login', login(pool));
```

### Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                        │
│                  http://localhost:4200                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            │ (POST, GET, PUT, DELETE)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   CORS MIDDLEWARE                            │
│        Checks: Is request from localhost:4200?              │
│                   ✓ Yes → Allow                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  JSON MIDDLEWARE                             │
│         Parses: '{"username":"john"}' → object              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     ROUTE HANDLER                            │
│               Matches URL to function                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER                               │
│               1. Validate data                               │
│               2. Query database                              │
│               3. Process results                             │
│               4. Send response                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
│                  localhost:3306/demo_app                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Query Results
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESPONSE (JSON)                             │
│            Sent back to Angular frontend                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

Let's trace complete data flows for different scenarios.

### 📝 Example 1: User Registration

**Step-by-Step Journey**:

#### Frontend (RegisterComponent)

```typescript
// 1. User fills form and clicks "Create Account"
onSubmit() {
  const { name, username, email, password } = this.registerForm.value;
  
  // 2. Call UserService
  this.userService.register({ name, username, email, password }).subscribe({
    next: () => {
      this.successMessage = 'Registration successful!';
      this.router.navigate(['/login']);
    },
    error: (err) => {
      this.errorMessage = err?.error?.message;
    }
  });
}
```

#### UserService

```typescript
// 3. Make HTTP POST request
register(credentials): Observable<any> {
  return this.http.post(`http://localhost:3000/api/register`, credentials);
}

// Sends:
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password1!"
}
```

#### Backend Journey

```javascript
// 4. Request arrives at server.js
// ↓ CORS middleware checks origin
// ↓ JSON middleware parses body

// 5. Route handler in authRoutes.js
router.post('/register', register(pool));

// 6. Controller in authController.js
const register = (pool) => async (req, res) => {
  // Extract data
  const { name, username, email, password } = req.body;
  
  // 7. Validate all fields
  // ... validation code ...
  
  // 8. Check duplicates in database
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  
  if (existing.length > 0) {
    return res.status(400).json({
      message: 'Username or email already exists.'
    });
  }
  
  // 9. Generate UUID
  const userId = uuidv4(); // "123e4567-..."
  
  // 10. Hash password
  const saltRounds = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, saltRounds);
  // "Password1!" → "$2a$10$abc...xyz"
  
  // 11. Insert into database
  await pool.query(
    'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
    [userId, name, email, username, passwordHash]
  );
  
  // 12. Send success response
  return res.status(201).json({
    message: 'Registration successful! You can now login.',
    userId
  });
};
```

#### Backend Response

```json
{
  "message": "Registration successful! You can now login.",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Frontend Receives

```typescript
// 13. Success handler executes
next: () => {
  this.successMessage = 'Registration successful! Redirecting to login...';
  setTimeout(() => {
    this.router.navigate(['/login']); // Redirect after 2 seconds
  }, 2000);
}
```

#### Result in Database

**users table**:
```
id: 123e4567-e89b-12d3-a456-426614174000
name: John Doe
email: john@example.com
username: johndoe
password_hash: $2a$10$abc...xyz
created_at: 2025-12-23 10:30:00
updated_at: NULL
```

---

### 🔑 Example 2: User Login

**Step-by-Step Journey**:

#### Frontend (LoginComponent)

```typescript
// 1. User enters credentials and clicks "Sign In"
onSubmit() {
  // 2. Call UserService
  this.userService.login(this.loginForm.value).subscribe({
    next: () => {
      this.router.navigate(['/home']); // Go to dashboard
    },
    error: (err) => {
      this.errorMessage = err?.error?.message || 'Invalid username or password';
    }
  });
}
```

#### UserService

```typescript
// 3. Make HTTP POST request
login(credentials): Observable<any> {
  return this.http.post(`http://localhost:3000/api/login`, credentials);
}

// Sends:
{
  "username": "johndoe",
  "password": "Password1!"
}
```

#### Backend Journey

```javascript
// 4. Route handler
router.post('/login', login(pool));

// 5. Controller
const login = (pool) => async (req, res) => {
  const { username, password } = req.body;
  
  // 6. Query database (allows login with username OR email)
  const [rows] = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?',
    [username, username]
  );
  
  // 7. Check if user exists
  if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const user = rows[0];
  
  // 8. Compare password with hash
  const valid = await bcrypt.compare(password, user.password_hash);
  // bcrypt.compare("Password1!", "$2a$10$abc...xyz") → true/false
  
  // 9. Check if valid
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // 10. Send success
  return res.json({
    message: 'Login successful',
    userId: user.id
  });
};
```

#### Backend Response

```json
{
  "message": "Login successful",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Frontend Receives

```typescript
// 11. Navigate to home
next: () => {
  this.router.navigate(['/home']);
}
```

---

### 📊 Example 3: Loading User List in Dashboard

**Step-by-Step Journey**:

#### Frontend (HomeComponent)

```typescript
// 1. Component initializes
ngOnInit(): void {
  this.loadUsers();
}

// 2. Load users method
loadUsers(): void {
  this.loading = true; // Show spinner
  
  // 3. Call UserService
  this.userService.getUsers().subscribe({
    next: (data) => {
      this.users = data; // Store in component
      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load users', err);
      this.loading = false;
    }
  });
}
```

#### UserService

```typescript
// 4. Make HTTP GET request
getUsers(): Observable<User[]> {
  return this.http.get<User[]>(`http://localhost:3000/api/users`);
}
```

#### Backend Journey

```javascript
// 5. Route handler
router.get('/', getAllUsers(pool));

// 6. Controller
const getAllUsers = (pool) => async (req, res) => {
  // 7. Query database with JOIN
  const [rows] = await pool.query(`
    SELECT 
      u.id, u.name, u.email, u.username, u.created_at, u.updated_at,
      ui.mobile, ui.credit_card_last4, ui.state, ui.city, ui.gender,
      ui.hobbies, ui.tech_interests, ui.address, ui.dob
    FROM users u
    LEFT JOIN user_interests ui ON u.id = ui.user_id
    ORDER BY u.created_at DESC
  `);
  
  // 8. Transform each row
  const users = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    username: r.username,
    created_at: formatTimestamp(r.created_at),
    updated_at: formatTimestamp(r.updated_at),
    mobile: sanitizeValue(r.mobile),
    creditCard: r.credit_card_last4 ? '************' + r.credit_card_last4 : null,
    state: sanitizeValue(r.state),
    city: sanitizeValue(r.city),
    gender: r.gender || 'Male',
    hobbies: parseJsonField(r.hobbies),
    techInterests: parseJsonField(r.tech_interests),
    address: sanitizeValue(r.address),
    dob: sanitizeValue(r.dob)
  }));
  
  // 9. Send response
  return res.json(users);
};
```

#### Backend Response

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "created_at": "2025-12-23T10:30:00.000Z",
    "updated_at": null,
    "mobile": "9876543210",
    "creditCard": "************5678",
    "state": "Telangana",
    "city": "Hyderabad",
    "gender": "Male",
    "hobbies": ["Reading", "Music"],
    "techInterests": ["Angular", "Node.js"],
    "address": "123 Main St",
    "dob": "1990-05-15"
  },
  {
    "id": "987e6543-e21a-98d7-b654-321456987000",
    "name": "Jane Smith",
    ...
  }
]
```

#### Frontend Receives & Displays

```typescript
// 10. Data stored in component
this.users = data;

// 11. Template displays in PrimeNG table
<p-table [value]="users">
  <ng-template pTemplate="body" let-user>
    <tr>
      <td>{{ user.email }}</td>
      <td>{{ user.username }}</td>
      <td>{{ user.mobile }}</td>
      <!-- ... more columns ... -->
    </tr>
  </ng-template>
</p-table>
```

---

### ✏️ Example 4: Editing User Profile

**Step-by-Step Journey**:

#### Frontend - Opening Edit Dialog

```typescript
// 1. User clicks edit button in table
openEditUser(user: User): void {
  // 2. Fetch full user details (including sensitive data)
  this.userService.getUserById(user.id).subscribe({
    next: (fullUser) => {
      this.selectedUser = fullUser;
      this.displayEditDialog = true; // Open modal
    }
  });
}
```

#### UserService - Fetch User

```typescript
// 3. GET request to fetch user details
getUserById(id: string): Observable<User> {
  return this.http.get<User>(`http://localhost:3000/api/users/${id}`);
}
```

#### Backend - Get User

```javascript
// 4. Route: GET /api/users/:id
router.get('/:id', getUserById(pool));

// 5. Controller
const getUserById = (pool) => async (req, res) => {
  const { id } = req.params;
  
  // 6. Query database
  const [rows] = await pool.query(`
    SELECT u.*, ui.* FROM users u
    LEFT JOIN user_interests ui ON u.id = ui.user_id
    WHERE u.id = ?
  `, [id]);
  
  // 7. Transform and send
  return res.json({...formatted user data...});
};
```

#### Frontend - User Edits Form

```typescript
// 8. UserFormComponent receives user data
@Input() user: User | null = null;

ngOnChanges(changes: SimpleChanges): void {
  if (changes['user']) {
    this.patchForm(); // Pre-fill form with existing data
  }
}

// 9. User modifies fields and clicks "Update"
onSubmit(): void {
  const userData = {...this.userForm.value};
  
  // 10. Call update service
  this.userService.updateUser(this.user.id, userData).subscribe({
    next: () => {
      this.saved.emit(); // Notify parent
    }
  });
}
```

#### UserService - Update User

```typescript
// 11. PUT request with updated data
updateUser(id: string, user: Partial<User>): Observable<any> {
  return this.http.put(`http://localhost:3000/api/users/${id}`, user);
}

// Sends:
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "mobile": "9876543211",
  "state": "Andhra Pradesh",
  "city": "Vijayawada",
  "gender": "Male",
  "hobbies": ["Reading", "Sports"],
  "techInterests": ["React", "Java"],
  ...
}
```

#### Backend - Update User

```javascript
// 12. Route: PUT /api/users/:id
router.put('/:id', updateUser(pool));

// 13. Controller
const updateUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();
  const { id } = req.params;
  const { name, email, mobile, state, city, ...rest } = req.body;
  
  await connection.beginTransaction();
  
  // 14. Update users table
  await connection.query(
    'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
    [name, email, id]
  );
  
  // 15. Check if interests exist
  const [interestRows] = await connection.query(
    'SELECT user_id FROM user_interests WHERE user_id = ?',
    [id]
  );
  
  if (interestRows.length === 0) {
    // 16a. Insert new interests
    await connection.query(
      'INSERT INTO user_interests (...) VALUES (...)',
      [...]
    );
  } else {
    // 16b. Update existing interests
    await connection.query(
      'UPDATE user_interests SET mobile=?, state=?, city=?, ... WHERE user_id=?',
      [mobile, state, city, ..., id]
    );
  }
  
  // 17. Commit transaction
  await connection.commit();
  
  // 18. Send response
  return res.json({ message: 'User updated successfully' });
};
```

#### Frontend - Refresh List

```typescript
// 19. Parent component receives saved event
onUserSaved(): void {
  this.displayEditDialog = false; // Close modal
  this.loadUsers(); // Refresh table with updated data
}
```

---

## Security Features

### 🔒 1. Password Security

**Hashing with bcrypt**:
```javascript
// Registration
const saltRounds = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, saltRounds);

// Plain: "Password1!"
// Hash:  "$2a$10$N9qo8uLOickgx2ZMRZoMye.IjefW8Z8qhg5..."
```

**Why bcrypt?**
- **Slow by design**: 10 rounds = slow enough to prevent brute force
- **Salted**: Each password gets unique salt (prevents rainbow tables)
- **One-way**: Cannot reverse hash back to password

**Login Verification**:
```javascript
const valid = await bcrypt.compare(password, user.password_hash);
// Automatically handles salt, returns true/false
```

### 🔐 2. Credit Card Security

**Only Store Last 4 Digits**:
```javascript
const extractCreditCardLast4 = (creditCard) => {
  const digitsOnly = creditCard.replace(/\D/g, '');
  return digitsOnly.slice(-4); // "1234567812345678" → "5678"
};

// Database stores: "5678"
// Frontend receives: "************5678"
```

**Benefits**:
- **PCI Compliance**: Not storing full card data
- **Identity Verification**: Can confirm card without exposing
- **Security**: Even if database breached, cards safe

### 🛡️ 3. SQL Injection Prevention

**Parameterized Queries**:
```javascript
// ❌ BAD (vulnerable to SQL injection):
await pool.query(`SELECT * FROM users WHERE username = '${username}'`);

// ✅ GOOD (safe):
await pool.query('SELECT * FROM users WHERE username = ?', [username]);
```

**How It Works**:
- MySQL2 library escapes special characters
- User input never directly concatenated into SQL
- Even malicious input like `' OR '1'='1` is treated as string

### 🔒 4. Input Validation

**Server-Side Validation** (Never Trust Frontend):
```javascript
// Validate name (no numbers)
const namePattern = /^[a-zA-Z\s]+$/;
if (!namePattern.test(name)) {
  return res.status(400).json({
    message: 'Name can only contain letters and spaces'
  });
}

// Validate password strength
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
if (password.length < 8 || !passwordPattern.test(password)) {
  return res.status(400).json({
    message: 'Password must be at least 8 characters...'
  });
}
```

**Why Both Frontend & Backend?**
- **Frontend**: Better UX (instant feedback)
- **Backend**: Security (user can bypass frontend)

### 🌐 5. CORS Protection

```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
```

**What This Does**:
- Only Angular app (port 4200) can make requests
- Other websites cannot access your API
- Prevents malicious sites from making requests

### 🔑 6. UUID Instead of Auto-Increment

```javascript
const userId = uuidv4(); // "123e4567-e89b-12d3-a456-426614174000"
```

**Why UUID?**
- **Non-Guessable**: Cannot guess other user IDs
- **Globally Unique**: No collisions even across databases
- **Security**: Auto-increment IDs (1, 2, 3) are predictable

### 🛡️ 7. Database Transactions

**ACID Properties**:
```javascript
await connection.beginTransaction();
try {
  await connection.query('INSERT INTO users ...');
  await connection.query('INSERT INTO user_interests ...');
  await connection.commit(); // Both succeed
} catch (err) {
  await connection.rollback(); // Both fail
}
```

**Benefits**:
- **Atomicity**: All or nothing
- **Consistency**: No partial data
- **Isolation**: Concurrent requests don't interfere
- **Durability**: Once committed, data persists

### 🔒 8. Error Handling

**Don't Expose Internal Details**:
```javascript
// ❌ BAD:
return res.status(500).json({ error: err.stack });

// ✅ GOOD:
return res.status(500).json({ 
  message: 'Internal server error: ' + err.message 
});
```

**Generic Error Messages**:
```javascript
// Login fails - don't say "User not found" or "Wrong password"
return res.status(401).json({ message: 'Invalid credentials' });
// Attacker can't tell which is wrong
```

---

## How to Run

### Prerequisites

1. **Node.js** installed (v14+ recommended)
2. **MySQL** installed and running
3. **MySQL Database** created

### Setup Steps

#### 1. Install Dependencies

```bash
cd backend
npm install
```

#### 2. Create Database

```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE demo_app;

-- Tables will be created automatically by backend
```

#### 3. Configure Environment Variables

Create `.env` file in `backend/` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=demo_app
DB_PORT=3306
PORT=3000
```

#### 4. Start Server

**Development** (auto-restart on changes):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

#### 5. Verify Server Running

You should see:
```
✓ MySQL database connected successfully
✓ Users table created
✓ User interests table created
✓ Database initialization complete
📝 All tables are ready for use!
✓ Backend server running on port 3000
```

#### 6. Test Health Endpoint

Open browser or use curl:
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Complete Request-Response Examples

### Example 1: Register → Login → View Profile

```bash
# 1. Register new user
POST http://localhost:3000/api/register
Content-Type: application/json

{
  "name": "Test User",
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234!"
}

# Response:
{
  "message": "Registration successful! You can now login.",
  "userId": "abc123-def456-..."
}

# ----------------------------------------

# 2. Login
POST http://localhost:3000/api/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "Test1234!"
}

# Response:
{
  "message": "Login successful",
  "userId": "abc123-def456-..."
}

# ----------------------------------------

# 3. Get user details
GET http://localhost:3000/api/users/abc123-def456-...

# Response:
{
  "id": "abc123-def456-...",
  "name": "Test User",
  "email": "test@example.com",
  "username": "testuser",
  "mobile": null,
  "creditCard": null,
  "state": null,
  "city": null,
  "gender": "Male",
  "hobbies": [],
  "techInterests": [],
  "address": null,
  "dob": null
}
```

---

## Architecture Summary

### Layer Architecture

```
┌─────────────────────────────────────────────┐
│         FRONTEND (Angular/TypeScript)        │
│         Components + Services                │
└─────────────────────────────────────────────┘
                     ↕ HTTP (JSON)
┌─────────────────────────────────────────────┐
│              API LAYER (Express)             │
│           Routes + Middleware                │
└─────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────┐
│         BUSINESS LOGIC (Controllers)         │
│     Validation + Processing + Security       │
└─────────────────────────────────────────────┘
                     ↕ SQL Queries
┌─────────────────────────────────────────────┐
│         DATA LAYER (MySQL Database)          │
│            users + user_interests            │
└─────────────────────────────────────────────┘
```

### Data Flow Summary

1. **User Action** (Frontend) → Clicks button
2. **Component** → Calls service method
3. **Service** → Makes HTTP request
4. **Express Server** → Receives request
5. **Middleware** → Validates CORS + Parses JSON
6. **Route Handler** → Maps URL to controller
7. **Controller** → Validates + Processes data
8. **Database** → Stores/Retrieves data
9. **Controller** → Formats response
10. **Express** → Sends JSON response
11. **Service** → Returns Observable
12. **Component** → Updates UI

---

## Key Takeaways

### What Makes This Backend Good?

✅ **Secure**
- Password hashing with bcrypt
- SQL injection prevention
- Input validation
- CORS protection
- UUID for user IDs

✅ **Organized**
- Clear separation: routes, controllers, database
- Modular code (easy to maintain)
- Consistent patterns

✅ **Robust**
- Database transactions (data integrity)
- Error handling
- Connection pooling (performance)
- Foreign key constraints

✅ **Scalable**
- Connection pool (handle multiple requests)
- RESTful design (standard patterns)
- JSON responses (universal format)

✅ **Developer-Friendly**
- Clear console logs
- Helpful error messages
- Environment variables (easy config)
- Auto-creates database tables

---

## Summary

This backend is a **well-structured, secure, and efficient API server** that:

1. **Receives** HTTP requests from Angular frontend
2. **Validates** all incoming data
3. **Processes** business logic (registration, authentication, CRUD)
4. **Secures** sensitive data (passwords, credit cards)
5. **Stores** data in MySQL database
6. **Responds** with JSON data back to frontend

The integration between frontend and backend is **seamless** through:
- **HTTP communication** (RESTful API)
- **JSON data format** (universal)
- **CORS configuration** (cross-origin access)
- **Consistent error handling** (predictable behavior)

Everything works together like a well-oiled machine! 🚀

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Backend Stack**: Node.js + Express + MySQL

