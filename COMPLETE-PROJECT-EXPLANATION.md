# Complete Project Explanation - Cafeteria Management System

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Backend Explained (Line by Line)](#backend-explained)
4. [Frontend Explained (Line by Line)](#frontend-explained)
5. [Frontend ↔ Backend Communication](#frontend-backend-communication)
6. [Complete User Flows](#complete-user-flows)

---

## Project Overview

### What is this project?
This is a **Cafeteria Management System** that helps manage member registrations. Think of it like a membership database where:
- Users can register and login
- Admins can view all members in a table
- Admins can add, edit, or delete member information
- Members have details like name, email, mobile, address, hobbies, tech interests, etc.

### Project Structure
```
demoProject/
├── backend/                    # Server-side code (Node.js)
│   ├── config/
│   │   └── database.js        # Database connection setup
│   ├── controllers/
│   │   ├── authController.js  # Handles login/register
│   │   └── userController.js  # Handles user CRUD operations
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT token verification
│   ├── routes/
│   │   ├── authRoutes.js      # Login/register API routes
│   │   └── userRoutes.js      # User CRUD API routes
│   ├── server.js              # Main backend entry point
│   └── package.json           # Backend dependencies
│
└── src/                        # Frontend code (Angular)
    ├── app/
    │   ├── guards/            # (Empty - removed as per user request)
    │   ├── interceptors/      # (Empty - removed as per user request)
    │   ├── models/
    │   │   └── user.model.ts  # User data structure
    │   ├── pages/
    │   │   ├── login/         # Login page
    │   │   ├── register/      # Registration page
    │   │   └── home/          # Main user table page
    │   ├── services/
    │   │   ├── auth.service.ts # Authentication service
    │   │   └── user.service.ts # User API service
    │   ├── shared/
    │   │   └── user-form/     # Reusable add/edit form
    │   ├── app-routing.module.ts # Route configuration
    │   ├── app.module.ts      # Angular main module
    │   └── app.component.ts   # Root component
    └── assets/
        └── locations.json     # State and city data
```

---

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime for server
- **Express.js** - Web framework for creating APIs
- **MySQL** - Database to store user data
- **bcryptjs** - For password hashing (security)
- **jsonwebtoken** - For JWT authentication
- **uuid** - For generating unique user IDs
- **cors** - To allow frontend to connect to backend

### Frontend
- **Angular 14** - Frontend framework
- **TypeScript** - Typed JavaScript
- **PrimeNG** - UI component library
- **PrimeFlex** - CSS utility library
- **RxJS** - For handling async operations

### Database Schema
Two tables:
1. **users** - Basic user info (id, name, username, email, password)
2. **user_interests** - Extended info (mobile, credit card, hobbies, tech interests, etc.)

---

# BACKEND EXPLAINED

## File 1: `backend/package.json`

### Purpose
Defines the backend project metadata and lists all required Node.js packages.

### Line-by-Line Explanation

```json
{
  "name": "backend",
```
**Line 2:** The name of this backend project. Used by npm to identify it.

```json
  "version": "1.0.0",
```
**Line 3:** Version number of this project. Follows semantic versioning (major.minor.patch).

```json
  "description": "Backend API for Cafeteria Management System",
```
**Line 4:** Human-readable description of what this backend does.

```json
  "main": "server.js",
```
**Line 5:** Entry point file. When you run this project, it starts from `server.js`.

```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
```
**Lines 6-9:** 
- **npm scripts** - shortcuts to run commands
- `npm start` runs `node server.js` (starts server normally)
- `npm run dev` runs `nodemon server.js` (auto-restarts on file changes during development)

```json
  "dependencies": {
    "bcryptjs": "^2.4.3",
```
**Line 11:** **bcryptjs** - Used to hash (encrypt) passwords before storing in database. Without this, passwords would be stored as plain text (insecure!).

```json
    "cors": "^2.8.5",
```
**Line 12:** **cors** - Allows your Angular frontend (running on port 4200) to communicate with backend (running on port 3000). Without this, browser blocks cross-origin requests.

```json
    "dotenv": "^16.0.3",
```
**Line 13:** **dotenv** - Loads environment variables from `.env` file (database password, JWT secret, etc.). Keeps sensitive data out of code.

```json
    "express": "^4.18.2",
```
**Line 14:** **express** - The web framework that creates API endpoints (/api/login, /api/users, etc.). Handles HTTP requests and responses.

```json
    "jsonwebtoken": "^9.0.0",
```
**Line 15:** **jsonwebtoken** - Creates and verifies JWT tokens for authentication. Proves a user is logged in without storing session on server.

```json
    "mysql2": "^3.2.0",
```
**Line 16:** **mysql2** - Connects Node.js to MySQL database. Executes SQL queries (SELECT, INSERT, UPDATE, DELETE).

```json
    "uuid": "^9.0.0"
```
**Line 17:** **uuid** - Generates unique IDs for users. Better than auto-increment numbers because they're globally unique and unpredictable.

---

## File 2: `backend/server.js`

### Purpose
This is the **MAIN ENTRY POINT** of the backend. It:
1. Starts the Express server
2. Connects to database
3. Sets up middleware (CORS, JSON parser)
4. Registers all API routes

### Line-by-Line Explanation

```javascript
require('dotenv').config();
```
**Line 1:** 
- **What:** Loads environment variables from `.env` file into `process.env`
- **Why:** Keeps secrets (DB password, JWT key) separate from code
- **Used where:** Throughout the app via `process.env.DB_PASSWORD`, `process.env.JWT_SECRET`, etc.
- **If removed:** Server would crash because it can't find database credentials

```javascript
const express = require('express');
```
**Line 2:**
- **What:** Imports the Express.js framework
- **Why:** Express provides tools to create web APIs easily (routing, middleware, etc.)
- **Used where:** Creates the `app` object on line 6
- **If removed:** Can't create a web server

```javascript
const cors = require('cors');
```
**Line 3:**
- **What:** Imports CORS middleware
- **Why:** Angular frontend (http://localhost:4200) needs permission to call backend APIs (http://localhost:3000)
- **Used where:** Line 9 to allow cross-origin requests
- **If removed:** Frontend gets CORS errors and can't communicate with backend

```javascript
const { createPool, initializeDatabase } = require('./config/database');
```
**Line 4:**
- **What:** Imports two functions from database.js
- **Why:** 
  - `createPool`: Creates a connection pool to MySQL
  - `initializeDatabase`: Creates tables if they don't exist
- **Used where:** Lines 13 and 16
- **If removed:** Can't connect to database

```javascript
const app = express();
```
**Line 6:**
- **What:** Creates an Express application instance
- **Why:** This `app` object is used to define routes, middleware, and start the server
- **Used where:** Throughout this file (lines 9, 10, 19, 20, 23, 24, 27, 33)
- **If removed:** No web server exists

```javascript
// Middleware
```
**Line 8:** Comment explaining the next section configures middleware (code that runs before route handlers)

```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
```
**Line 9:**
- **What:** Enables CORS for requests from `http://localhost:4200`
- **Why:** Allows Angular frontend to make API calls to this backend
- **How it works:** When browser sends request from Angular, this middleware adds `Access-Control-Allow-Origin` header to response
- **If removed:** Browser blocks all API calls from frontend (CORS policy error)

```javascript
app.use(express.json());
```
**Line 10:**
- **What:** Middleware that parses incoming JSON request bodies
- **Why:** Converts JSON strings from requests into JavaScript objects accessible via `req.body`
- **Example:** When frontend sends `{ username: 'john', password: '123' }`, this makes it available as `req.body.username`
- **If removed:** `req.body` would be undefined in all controllers

```javascript
// Create database pool
```
**Line 12:** Comment

```javascript
const pool = createPool();
```
**Line 13:**
- **What:** Creates a MySQL connection pool
- **Why:** Connection pools reuse database connections (faster than creating new connection for each request)
- **How it works:** Pool maintains 5-10 connections ready to use
- **Used where:** Passed to all routes and controllers
- **If removed:** No database connection

```javascript
// Initialize database
```
**Line 15:** Comment

```javascript
initializeDatabase(pool);
```
**Line 16:**
- **What:** Runs SQL commands to create `users` and `user_interests` tables if they don't exist
- **Why:** Ensures database is ready before accepting requests
- **When:** Runs once at server startup
- **If removed:** Tables might not exist, causing SQL errors

```javascript
// Import routes
```
**Line 18:** Comment

```javascript
const authRoutes = require('./routes/authRoutes')(pool);
```
**Line 19:**
- **What:** Imports authentication routes (login, register) and passes database pool to them
- **Why:** Auth routes need database access to check passwords and create users
- **Returns:** Express Router with `/login` and `/register` endpoints
- **Used where:** Line 23 to mount these routes
- **If removed:** Login and register APIs won't exist

```javascript
const userRoutes = require('./routes/userRoutes')(pool);
```
**Line 20:**
- **What:** Imports user CRUD routes and passes database pool
- **Why:** User routes need database to get/add/update/delete users
- **Returns:** Express Router with GET, POST, PUT, DELETE for `/users`
- **Used where:** Line 24 to mount these routes
- **If removed:** Can't manage users (no table functionality)

```javascript
// Use routes
```
**Line 22:** Comment

```javascript
app.use('/api', authRoutes);
```
**Line 23:**
- **What:** Mounts auth routes under `/api` path
- **Why:** All auth endpoints become:
  - POST `/api/login`
  - POST `/api/register`
- **How it works:** Any request to `/api/login` or `/api/register` goes to authRoutes
- **If removed:** Login and register won't work

```javascript
app.use('/api/users', userRoutes);
```
**Line 24:**
- **What:** Mounts user routes under `/api/users` path
- **Why:** All user endpoints become:
  - GET `/api/users` (get all users)
  - GET `/api/users/:id` (get one user)
  - POST `/api/users` (create user)
  - PUT `/api/users/:id` (update user)
  - DELETE `/api/users/:id` (delete user)
- **If removed:** User table won't load or save data

```javascript
// Health check endpoint
```
**Line 26:** Comment

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
```
**Lines 27-29:**
- **What:** Simple endpoint to check if server is alive
- **Why:** Useful for monitoring or testing if backend is running
- **How to test:** Visit `http://localhost:3000/api/health` in browser
- **Response:** `{ "status": "ok", "message": "Server is running" }`
- **If removed:** No impact on functionality, just loses health check

```javascript
// Start server
```
**Line 31:** Comment

```javascript
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
```
**Line 32:**
- **What:** Reads port number from environment variable, defaults to 3000
- **Why:** Allows changing port via `.env` file without editing code
- **How it works:** 
  - If `.env` has `PORT=5000`, uses 5000
  - Otherwise uses 3000
- **If removed:** Would need hardcoded port

```javascript
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
```
**Lines 33-35:**
- **What:** Starts the HTTP server on the specified port
- **Why:** Makes the API accessible at `http://localhost:3000`
- **How it works:** Server starts listening for incoming requests
- **Callback:** Runs when server successfully starts, prints confirmation message
- **If removed:** Server never starts, no APIs work

---

## File 3: `backend/config/database.js`

### Purpose
Manages the MySQL database connection and creates required tables.

### Line-by-Line Explanation

```javascript
const mysql = require('mysql2/promise');
```
**Line 1:**
- **What:** Imports MySQL driver with Promise support
- **Why:** `/promise` version allows using `async/await` instead of callbacks (cleaner code)
- **Without promise:** Would need nested callbacks (callback hell)

```javascript
const createPool = () => {
```
**Line 3:**
- **What:** Function that creates and returns a database connection pool
- **Why:** Connection pools reuse connections (more efficient than creating new ones each time)

```javascript
  return mysql.createPool({
```
**Line 4:** Creates the pool with configuration options

```javascript
    host: process.env.DB_HOST || 'localhost',
```
**Line 5:**
- **What:** Database server address
- **Why:** Reads from `.env` file, defaults to `localhost` (same machine)
- **Used for:** Connecting to MySQL server
- **Example:** If MySQL is on another server, set `DB_HOST=192.168.1.100` in `.env`

```javascript
    user: process.env.DB_USER || 'root',
```
**Line 6:**
- **What:** MySQL username
- **Why:** Needed to authenticate to database
- **Default:** `root` (MySQL default admin user)

```javascript
    password: process.env.DB_PASSWORD || '',
```
**Line 7:**
- **What:** MySQL password for the user
- **Why:** Security - password should be in `.env`, not hardcoded
- **Default:** Empty string (works if MySQL has no password set)

```javascript
    database: process.env.DB_NAME || 'cafeteria_db',
```
**Line 8:**
- **What:** Name of the database to use
- **Why:** Keeps this project's data separate from other databases
- **Default:** `cafeteria_db`
- **Note:** Database must exist before running server (create it in MySQL Workbench or command line)

```javascript
    waitForConnections: true,
```
**Line 9:**
- **What:** If all connections are busy, wait for one to become available
- **Why:** Prevents errors when many requests come at once
- **Alternative:** If false, would throw error when pool is full

```javascript
    connectionLimit: 10,
```
**Line 10:**
- **What:** Maximum number of connections in the pool
- **Why:** Limits database load and memory usage
- **Impact:** If 10 requests are processing, 11th request waits
- **Typical:** 10 is good for small-medium apps

```javascript
    queueLimit: 0
```
**Line 11:**
- **What:** Maximum queued connection requests (0 = unlimited)
- **Why:** Allows any number of requests to wait for connection
- **If changed to 5:** Only 5 requests can wait; 6th gets error

```javascript
  });
};
```
**Lines 12-13:** Closes the config object and function

```javascript
const initializeDatabase = async (pool) => {
```
**Line 15:**
- **What:** Async function that creates database tables
- **Why:** Automatically sets up database structure on first run
- **When:** Called once at server startup (from server.js line 16)

```javascript
  try {
```
**Line 16:** Start try block to catch any errors

```javascript
    console.log('✓ MySQL database connected successfully');
```
**Line 17:**
- **What:** Prints success message
- **Why:** Confirms database is reachable
- **When:** You see this in terminal, database connection is working

```javascript
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
```
**Lines 19-27:**
- **What:** SQL query to create `users` table
- **Why:** Stores basic user credentials and identity
- **IF NOT EXISTS:** Only creates if table doesn't exist (safe to run multiple times)

**Table Structure:**
- `id VARCHAR(36)` - Unique identifier (UUID format like `abc-123-def`)
- `PRIMARY KEY` - Makes `id` unique and indexed (fast lookups)
- `name VARCHAR(100)` - User's full name (max 100 characters)
- `NOT NULL` - This field must have a value (can't be empty)
- `email VARCHAR(100) UNIQUE` - Email address, must be unique across all users
- `username VARCHAR(50) UNIQUE` - Username, must be unique
- `password_hash VARCHAR(255)` - Encrypted password (never store plain passwords!)
- `created_at TIMESTAMP` - When user was created (auto-set on INSERT)
- `updated_at TIMESTAMP` - When user was last updated (auto-updated on UPDATE)

**If removed:** Users table won't exist, all auth operations fail

```javascript
    console.log('✓ Users table created');
```
**Line 28:** Confirmation message

```javascript
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        user_id VARCHAR(36) PRIMARY KEY,
        mobile VARCHAR(15),
        credit_card_last4 VARCHAR(4),
        state VARCHAR(50),
        city VARCHAR(50),
        gender VARCHAR(10),
        hobbies JSON,
        tech_interests JSON,
        address TEXT,
        dob DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
```
**Lines 30-42:**
- **What:** Creates `user_interests` table for extended user information
- **Why:** Keeps user credentials separate from profile details (database normalization)

**Table Structure:**
- `user_id VARCHAR(36) PRIMARY KEY` - Links to users.id (one-to-one relationship)
- `mobile VARCHAR(15)` - Phone number (optional)
- `credit_card_last4 VARCHAR(4)` - Last 4 digits of credit card (security - never store full card!)
- `state VARCHAR(50)` - User's state
- `city VARCHAR(50)` - User's city
- `gender VARCHAR(10)` - Male/Female/Other
- `hobbies JSON` - Array stored as JSON (e.g., `["Reading", "Music"]`)
- `tech_interests JSON` - Array of technologies (e.g., `["Angular", "Node.js"]`)
- `address TEXT` - Full address (TEXT allows longer content than VARCHAR)
- `dob DATE` - Date of birth
- `FOREIGN KEY (user_id) REFERENCES users(id)` - Links to users table
- `ON DELETE CASCADE` - When user is deleted from users table, this row is also deleted automatically

**If removed:** Can't store user profile details

```javascript
    console.log('✓ User interests table created');
    console.log('✓ Database initialization complete');
    console.log('📝 All tables are ready for use!');
```
**Lines 43-45:** Confirmation messages

```javascript
  } catch (error) {
    console.error('Database initialization error:', error.message);
    process.exit(1);
  }
};
```
**Lines 46-49:**
- **What:** Error handler for database initialization
- **Why:** If tables can't be created (wrong credentials, database doesn't exist), show error and exit
- **process.exit(1):** Stops the server with error code 1
- **Why exit:** No point running server if database isn't working

```javascript
module.exports = {
  createPool,
  initializeDatabase
};
```
**Lines 51-54:**
- **What:** Exports functions so other files can use them
- **Why:** `server.js` needs these functions to set up database
- **If removed:** Can't import these functions elsewhere

---

## File 4: `backend/middleware/authMiddleware.js`

### Purpose
Handles JWT token generation and verification for authentication.

### Line-by-Line Explanation

```javascript
const jwt = require('jsonwebtoken');
```
**Line 1:**
- **What:** Imports jsonwebtoken library
- **Why:** Provides `sign()` to create tokens and `verify()` to check them
- **Used where:** Lines 7 and 22

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```
**Line 3:**
- **What:** Secret key used to sign JWT tokens
- **Why:** Like a password that proves tokens are legitimate (not forged)
- **Security:** MUST be changed in production (random, long string)
- **Example:** `JWT_SECRET=a8f9c2e1b7d4...` in `.env`
- **If leaked:** Attackers can create fake tokens

```javascript
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
```
**Line 4:**
- **What:** How long tokens remain valid
- **Why:** Security - tokens expire so stolen tokens can't be used forever
- **Default:** 24 hours
- **Format:** `'24h'`, `'7d'`, `'30m'` (hours, days, minutes)
- **After expiry:** User must login again

```javascript
// Generate JWT token
const generateToken = (userId, username) => {
```
**Lines 6-7:**
- **What:** Function to create a JWT token for a user
- **Parameters:** `userId` (unique ID) and `username` (for display/reference)
- **Used where:** Called in authController after successful login/register

```javascript
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
```
**Line 8:**
- **What:** Creates and returns a JWT token
- **jwt.sign():** Creates token with payload `{ userId, username }`
- **JWT_SECRET:** Signs token with secret key
- **expiresIn:** Sets expiration time
- **Returns:** String like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Token contains:** userId, username, issue time, expiry time (all encrypted)

```javascript
// Verify JWT middleware
const verifyToken = (req, res, next) => {
```
**Lines 11-12:**
- **What:** Middleware function to protect routes
- **Purpose:** Checks if request has valid JWT token
- **Used where:** Applied to all user routes in `userRoutes.js`
- **Parameters:**
  - `req` - incoming request
  - `res` - response object
  - `next` - function to call if token is valid (continue to next middleware/route)

```javascript
  const authHeader = req.headers.authorization;
```
**Line 13:**
- **What:** Gets `Authorization` header from request
- **Format:** `"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
- **Why:** Frontend sends token in this header
- **Example request:**
  ```
  GET /api/users
  Authorization: Bearer <token>
  ```

```javascript
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }
```
**Lines 15-17:**
- **What:** Checks if Authorization header exists and has correct format
- **Why:** Rejects requests without token or wrong format
- **Status 401:** Unauthorized (not logged in)
- **Example wrong format:** `Authorization: Token xyz` or missing header
- **Result:** Returns error, stops request processing

```javascript
  const token = authHeader.substring(7);
```
**Line 19:**
- **What:** Extracts token from header by removing "Bearer " prefix
- **Why:** `jwt.verify()` needs just the token, not the "Bearer " part
- **Example:** 
  - Input: `"Bearer abc123xyz"`
  - Output: `"abc123xyz"`
- **substring(7):** Skips first 7 characters ("Bearer ")

```javascript
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
```
**Lines 21-22:**
- **What:** Verifies token signature and decodes payload
- **Why:** Ensures token wasn't tampered with and is still valid
- **decoded contains:** `{ userId, username, iat, exp }`
  - `iat` - issued at (timestamp)
  - `exp` - expires at (timestamp)
- **Throws error if:**
  - Token signature doesn't match (forged)
  - Token expired
  - Token malformed

```javascript
    req.user = decoded;
```
**Line 23:**
- **What:** Attaches decoded user info to request object
- **Why:** Controllers can now access `req.user.userId` and `req.user.username`
- **Used where:** Controllers can use this to know which user made the request
- **Example:** In a controller: `const currentUserId = req.user.userId;`

```javascript
    next();
```
**Line 24:**
- **What:** Passes control to next middleware or route handler
- **Why:** Token is valid, allow request to proceed
- **Result:** Request continues to the actual controller (getUsers, updateUser, etc.)

```javascript
  } catch (err) {
```
**Line 25:** Catches any errors from `jwt.verify()`

```javascript
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
```
**Lines 26-28:**
- **What:** Special handling for expired tokens
- **Why:** Gives user a clear message about why they need to re-login
- **When:** User's 24-hour token has expired
- **Frontend behavior:** Should show message and redirect to login

```javascript
    return res.status(401).json({ message: 'Invalid token. Access denied.' });
  }
};
```
**Lines 29-31:**
- **What:** Handles all other token errors (invalid signature, malformed, etc.)
- **Why:** Catches forged or corrupted tokens
- **Result:** Rejects request with 401 Unauthorized

```javascript
module.exports = { generateToken, verifyToken };
```
**Line 33:**
- **What:** Exports both functions
- **Why:** 
  - `generateToken` used in authController
  - `verifyToken` used in userRoutes
- **If removed:** Other files can't use these functions

---

## File 5: `backend/controllers/authController.js`

### Purpose
Handles user registration and login logic (authentication).

### Line-by-Line Explanation

```javascript
const bcrypt = require('bcryptjs');
```
**Line 1:**
- **What:** Imports bcrypt for password hashing
- **Why:** Never store passwords as plain text (security)
- **How it works:** Hashing is one-way encryption (can't decrypt, only compare)

```javascript
const { v4: uuidv4 } = require('uuid');
```
**Line 2:**
- **What:** Imports UUID v4 generator, renames it to `uuidv4`
- **Why:** Generates unique IDs like `abc-123-def-456`
- **Used where:** Line 69 to create user ID

```javascript
const { generateToken } = require('../middleware/authMiddleware');
```
**Line 3:**
- **What:** Imports JWT token generator
- **Why:** Need to create token after successful login/register
- **Used where:** Lines 82 and 135

---

### REGISTER Function

```javascript
const register = (pool) => async (req, res) => {
```
**Line 5:**
- **What:** Function that returns an async route handler for registration
- **Why:** Pattern allows passing database pool to controller
- **Parameters:**
  - `pool` - database connection pool
  - Returns function with `(req, res)` - Express route handler
- **Used where:** Called in authRoutes.js

```javascript
  try {
```
**Line 6:** Start error handling

```javascript
    const { name, username, email, password } = req.body;
```
**Line 7:**
- **What:** Extracts registration data from request body
- **Why:** Frontend sends this data as JSON
- **Example request body:**
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Pass123!"
  }
  ```

```javascript
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: 'Name, username, email and password are required.'
      });
    }
```
**Lines 10-14:**
- **What:** Validates all required fields are present
- **Why:** Prevent incomplete registrations
- **Status 400:** Bad Request (client error)
- **Result:** Stops execution, returns error to frontend
- **If removed:** Could create users with missing data (database errors)

```javascript
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: 'Name must be at least 2 characters.' });
    }
```
**Lines 17-21:**
- **What:** Validates name is a string and at least 2 characters long
- **Why:** Prevents single-character or empty names
- **trim():** Removes spaces from start/end
- **Example invalid:** `"  a  "` becomes `"a"` (length 1, too short)

```javascript
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
      return res.status(400).json({
        message: 'Name can only contain letters and spaces (numbers not allowed).'
      });
    }
```
**Lines 22-27:**
- **What:** Regex pattern validation for name
- **Pattern:** `^[a-zA-Z\s]+$`
  - `^` - start of string
  - `[a-zA-Z\s]+` - one or more letters (upper/lower) or spaces
  - `$` - end of string
- **Why:** Prevents names like "John123" or "User@#$"
- **If removed:** Would allow numbers and special chars in names

```javascript
    const usernamePattern = /^[a-zA-Z0-9_@]{4,20}$/;
    if (!usernamePattern.test(username)) {
      return res.status(400).json({
        message:
          'Username must be 4-20 characters (letters, numbers, underscore _ and @ only).'
      });
    }
```
**Lines 30-36:**
- **What:** Username validation
- **Pattern:** `^[a-zA-Z0-9_@]{4,20}$`
  - `{4,20}` - between 4 and 20 characters
  - Only letters, numbers, underscore, and @
- **Why:** Enforces consistent username format
- **Examples:**
  - Valid: `john_doe`, `user123`, `admin@1`
  - Invalid: `abc` (too short), `user name` (space), `this_is_a_very_long_username_123` (too long)

```javascript
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return res
        .status(400)
        .json({ message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).' });
    }
```
**Lines 39-44:**
- **What:** Email format validation
- **Pattern breakdown:**
  - `[^\s@]+` - one or more characters that are not space or @
  - `@` - literal @ symbol
  - `[^\s@]+` - domain name
  - `\.` - literal dot
  - `[a-zA-Z]{2,}` - at least 2 letters for TLD (.com, .org, etc.)
- **Valid:** `user@example.com`, `test@domain.co.uk`
- **Invalid:** `user@`, `@example.com`, `user@domain`

```javascript
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    if (password.length < 8 || !passwordPattern.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
      });
    }
```
**Lines 47-54:**
- **What:** Strong password validation
- **Pattern breakdown:**
  - `(?=.*[a-z])` - at least one lowercase letter
  - `(?=.*[A-Z])` - at least one uppercase letter
  - `(?=.*\d)` - at least one digit
  - `(?=.*[@$!%*?&])` - at least one special character
  - `.+` - one or more of any character
- **Why:** Enforces secure passwords
- **Valid:** `Pass123!`, `MySecure@Pass1`
- **Invalid:** `password` (no uppercase/number/special), `Pass123` (no special)

```javascript
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
```
**Lines 57-60:**
- **What:** Checks if username or email already exists in database
- **Why:** Usernames and emails must be unique
- **SQL:** Searches for any user with matching username OR email
- **await:** Waits for database response
- **[existing]:** Array destructuring (MySQL returns `[rows, fields]`, we only need rows)

```javascript
    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists. Please use a different one.'
      });
    }
```
**Lines 62-66:**
- **What:** If existing user found, reject registration
- **Why:** Prevent duplicate accounts
- **Status 400:** Client error (they chose a taken username/email)
- **If removed:** Would allow duplicate usernames/emails (database error due to UNIQUE constraint)

```javascript
    const userId = uuidv4();
```
**Line 69:**
- **What:** Generates a unique ID for new user
- **Why:** Primary key for users table
- **Format:** `"3bae4b71-5678-4705-a8c9-42c9e0cbc5e4"`
- **Alternative:** Could use auto-increment, but UUIDs are globally unique

```javascript
    const saltRounds = await bcrypt.genSalt(10);
```
**Line 70:**
- **What:** Generates a random "salt" for password hashing
- **Why:** Salt makes each hash unique (even for same password)
- **10 rounds:** Higher = more secure but slower (10 is standard)
- **Example:** Password "Pass123!" + salt → unique hash each time

```javascript
    const passwordHash = await bcrypt.hash(password, saltRounds);
```
**Line 71:**
- **What:** Hashes the password using bcrypt + salt
- **Why:** NEVER store plain passwords (security)
- **Result:** String like `$2a$10$N9qo8uLOickgx2ZMRZoMye...`
- **One-way:** Can't decrypt hash back to password
- **Verification:** Use `bcrypt.compare()` to check passwords later

```javascript
    await pool.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), username, passwordHash]
    );
```
**Lines 74-77:**
- **What:** Inserts new user into `users` table
- **Why:** Creates the user account
- **Values:**
  - `userId` - generated UUID
  - `name.trim()` - removes extra spaces
  - `email.trim().toLowerCase()` - normalizes email (prevents `User@X.com` vs `user@x.com` duplicates)
  - `username` - as entered
  - `passwordHash` - encrypted password
- **?** placeholders: Prevents SQL injection (secure)

```javascript
    console.log('✓ New user registered:', username);
```
**Line 79:** Logs successful registration to server console

```javascript
    const token = generateToken(userId, username);
```
**Line 82:**
- **What:** Creates JWT token for the newly registered user
- **Why:** Automatically log them in after registration (better UX)
- **Contains:** userId and username encrypted in token

```javascript
    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: userId, username, email: email.trim().toLowerCase(), name: name.trim() }
    });
```
**Lines 84-88:**
- **What:** Sends success response to frontend
- **Status 201:** Created (successful resource creation)
- **Response contains:**
  - `message` - success message to display
  - `token` - JWT token to store in localStorage
  - `user` - user details to display in UI
- **Frontend receives this:** AuthService stores token and user data

```javascript
  } catch (err) {
    console.error('Error during registration:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```
**Lines 89-94:**
- **What:** Error handler for any unexpected errors
- **Status 500:** Server error (not client's fault)
- **Example errors:** Database down, network issues
- **Result:** Returns error message to frontend

---

### LOGIN Function

```javascript
const login = (pool) => async (req, res) => {
```
**Line 97:**
- **What:** Function that returns login route handler
- **Why:** Authenticates users
- **Used where:** Called in authRoutes.js for POST `/api/login`

```javascript
  try {
    const { username, password } = req.body;
```
**Lines 98-99:**
- **What:** Extracts credentials from request
- **Example request:**
  ```json
  {
    "username": "johndoe",
    "password": "Pass123!"
  }
  ```

```javascript
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required.'
      });
    }
```
**Lines 101-105:**
- **What:** Validates both fields are provided
- **Why:** Can't login without both
- **If removed:** Would try to query database with undefined values (error)

```javascript
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
```
**Lines 108-111:**
- **What:** Searches for user by username OR email
- **Why:** Allows login with either username or email (flexible UX)
- **SQL:** Checks both columns with same value
- **Example:** If user types "john@example.com", searches username AND email columns
- **Returns:** Array of matching users

```javascript
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
```
**Lines 113-115:**
- **What:** If no user found, reject login
- **Status 401:** Unauthorized (wrong username/email)
- **Message:** Generic "Invalid credentials" (security - don't reveal if username exists)
- **If removed:** Would crash on next line (rows[0] undefined)

```javascript
    const user = rows[0];
```
**Line 117:**
- **What:** Gets first matching user
- **Why:** Contains id, username, and password_hash
- **Structure:** `{ id: "uuid", username: "john", password_hash: "$2a$10..." }`

```javascript
    const valid = await bcrypt.compare(password, user.password_hash);
```
**Line 118:**
- **What:** Compares entered password with stored hash
- **Why:** Can't decrypt hash, must compare using bcrypt
- **How it works:** bcrypt hashes the entered password with same salt and compares
- **Returns:** `true` if passwords match, `false` otherwise
- **Security:** Even with same password, different users have different hashes (due to salt)

```javascript
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
```
**Lines 120-122:**
- **What:** Rejects login if password doesn't match
- **Why:** Wrong password
- **Message:** Same generic message as username not found (security best practice)

```javascript
    console.log('✓ User logged in:', username);
```
**Line 124:** Server log for debugging/auditing

```javascript
    const [userDetails] = await pool.query(
      'SELECT id, username, email, name FROM users WHERE id = ?',
      [user.id]
    );
```
**Lines 127-130:**
- **What:** Fetches full user details (excluding password_hash)
- **Why:** Return clean user object to frontend (no sensitive data)
- **Result:** `[{ id, username, email, name }]`

```javascript
    const token = generateToken(user.id, user.username);
```
**Line 133:**
- **What:** Creates JWT token with user's id and username
- **Why:** Frontend needs this token to make authenticated requests
- **Lifespan:** 24 hours (set in authMiddleware.js)

```javascript
    return res.json({
      message: 'Login successful',
      token,
      user: userDetails[0]
    });
```
**Lines 135-139:**
- **What:** Sends successful login response
- **Status 200:** OK (default for res.json)
- **Response structure:**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "username": "john",
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
  ```
- **Frontend:** Stores token in localStorage, saves user object, redirects to /home

```javascript
  } catch (err) {
    console.error('Error logging in:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```
**Lines 140-145:**
- **What:** Catches unexpected errors
- **Examples:** Database connection lost, query syntax error
- **Status 500:** Server error

```javascript
module.exports = {
  register,
  login
};
```
**Lines 147-150:**
- **What:** Exports both functions
- **Why:** authRoutes.js imports and uses them

---

## File 6: `backend/controllers/userController.js`

### Purpose
Handles CRUD (Create, Read, Update, Delete) operations for user management.

This file is large, so I'll explain it section by section.

### Helper Functions (Top of file)

```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
```
**Lines 1-2:** Same as authController (needed for password hashing and UUID generation)

```javascript
const sanitizeValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
};
```
**Lines 4-7:**
- **What:** Helper to clean string values
- **Why:** Converts empty strings to NULL, removes extra spaces
- **Example:** `"  test  "` → `"test"`, `""` → `null`
- **Used where:** Throughout this file when saving data

```javascript
const extractCreditCardLast4 = (creditCard) => {
  if (!creditCard) return null;
  const digitsOnly = String(creditCard).replace(/\D/g, '');
  return digitsOnly.slice(-4) || null;
};
```
**Lines 9-13:**
- **What:** Extracts last 4 digits from credit card
- **Why:** Security - never store full credit card numbers (PCI compliance)
- **How:**
  - `replace(/\D/g, '')` - removes all non-digits
  - `slice(-4)` - gets last 4 characters
- **Example:** `"1234-5678-9012-3456"` → `"3456"`

---

### getAllUsers Function

```javascript
const getAllUsers = (pool) => async (req, res) => {
```
**Line 15:**
- **What:** Route handler to get all users with their details
- **Used:** Frontend calls this to populate the table

```javascript
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.username,
        ui.mobile, ui.credit_card_last4, ui.state, ui.city, 
        ui.gender, ui.hobbies, ui.tech_interests, ui.address, ui.dob,
        u.created_at, u.updated_at
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      ORDER BY u.created_at DESC
    `);
```
**Lines 16-24:**
- **What:** SQL query joining users and user_interests tables
- **Why:** Gets complete user information in one query (efficient)
- **LEFT JOIN:** Includes users even if they don't have interests record yet
- **SELECT:** Specifies columns to retrieve
  - `u.id, u.name...` - from users table
  - `ui.mobile, ui.credit_card_last4...` - from user_interests table
- **ORDER BY created_at DESC:** Newest users first
- **If removed:** Would need 2 queries (slow)

```javascript
    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      mobile: row.mobile || '',
      creditCard: row.credit_card_last4 || '',
      state: row.state || '',
      city: row.city || '',
      gender: row.gender || '',
      hobbies: parseJsonField(row.hobbies),
      techInterests: parseJsonField(row.tech_interests),
      address: row.address || '',
      dob: row.dob || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
```
**Lines 26-42:**
- **What:** Transforms database rows into frontend-friendly format
- **Why:** 
  - Database uses snake_case (`credit_card_last4`)
  - Frontend uses camelCase (`creditCard`)
  - Converts NULL to empty strings
  - Parses JSON fields
- **map():** Loops through each row and transforms it
- **parseJsonField():** Converts JSON strings to arrays
- **Result:** Array of user objects ready for Angular

```javascript
    return res.json(users);
```
**Line 44:**
- **What:** Sends user array to frontend
- **Status:** 200 OK (default)
- **Format:** JSON array

```javascript
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```
**Lines 45-50:**
- **What:** Error handler
- **Catches:** Database errors, network issues
- **Status 500:** Server error

---

### getUserById Function

```javascript
const getUserById = (pool) => async (req, res) => {
  try {
    const { id } = req.params;
```
**Lines 52-54:**
- **What:** Gets single user by ID
- **req.params:** URL parameters (e.g., `/api/users/abc-123` → `id = "abc-123"`)
- **Used:** When editing a specific user

```javascript
    const [rows] = await pool.query(
      `
      SELECT 
        u.id, u.name, u.email, u.username,
        ui.mobile, ui.credit_card_last4, ui.state, ui.city, 
        ui.gender, ui.hobbies, ui.tech_interests, ui.address, ui.dob,
        u.created_at, u.updated_at
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      WHERE u.id = ?
    `,
      [id]
    );
```
**Lines 56-68:**
- **What:** Same JOIN query as getAllUsers but filtered by ID
- **WHERE u.id = ?:** Gets only the user with matching ID
- **? placeholder:** Safely inserts `id` value (prevents SQL injection)

```javascript
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
```
**Lines 70-72:**
- **What:** If no user with that ID, return 404
- **Status 404:** Not Found
- **Why:** Prevents returning empty object

```javascript
    const user = {
      id: rows[0].id,
      name: rows[0].name,
      // ... (same transformation as getAllUsers)
    };

    return res.json(user);
```
**Lines 74-92:**
- **What:** Transforms row to camelCase format and returns it
- **Same logic** as getAllUsers but for single user

---

### createUser Function

```javascript
const createUser = (pool) => async (req, res) => {
```
**Line 97:**
- **What:** Creates a new user WITH full profile (mobile, hobbies, etc.)
- **Difference from register:** This is for admin creating users in the Home page
- **Used:** When clicking "Add Member" in Home page

```javascript
  const connection = await pool.getConnection();
```
**Line 98:**
- **What:** Gets a dedicated connection from pool
- **Why:** Need transaction support (multiple queries must all succeed or all fail)
- **Must release:** Line 249 releases it back to pool

```javascript
  try {
    const {
      name, username, email, password,
      mobile, creditCard, state, city, gender,
      hobbies, techInterests, address, dob
    } = req.body;
```
**Lines 100-106:**
- **What:** Extracts ALL user fields from request
- **Why:** Creating complete user profile (not just auth credentials)

```javascript
    // Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: 'Name, username, email, and password are required.'
      });
    }
```
**Lines 108-113:** Validates required fields (same as register)

```javascript
    // Name validation...
    // Username validation...
    // Email validation...
    // Password validation...
```
**Lines 115-174:** Same validation logic as register function (ensures data quality)

```javascript
    // Mobile validation
    const mobileDigits = String(mobile || '').replace(/\D/g, '');
    if (mobileDigits && mobileDigits.length !== 10) {
      return res.status(400).json({
        message: 'Mobile number must be exactly 10 digits.'
      });
    }
```
**Lines 176-182:**
- **What:** Validates mobile number is 10 digits
- **Why:** Indian mobile number format
- **replace(/\D/g, ''):** Removes all non-digits
- **Example:** `"(123) 456-7890"` → `"1234567890"`
- **If removed:** Would allow invalid mobile numbers

```javascript
    // Credit card validation
    const cardDigits = String(creditCard || '').replace(/\D/g, '');
    if (cardDigits && cardDigits.length !== 16 && cardDigits.length !== 4) {
      return res.status(400).json({
        message: 'Credit card must be either 16 digits or last 4 digits.'
      });
    }
```
**Lines 184-190:**
- **What:** Validates credit card is either full 16 digits or last 4
- **Why:** Allows both full card (for registration) or last 4 (for security)
- **If removed:** Could accept invalid card numbers

```javascript
    // Check for existing username or email
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists.'
      });
    }
```
**Lines 192-203:**
- **What:** Duplicate check (same as register)
- **Why:** Enforce unique usernames and emails

```javascript
    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);
```
**Lines 206-208:**
- **What:** Generates user ID and encrypts password
- **Same as register function**

```javascript
    await connection.beginTransaction();
```
**Line 211:**
- **What:** Starts a database transaction
- **Why:** Next queries must ALL succeed or ALL rollback
- **Example:** If INSERT users succeeds but INSERT user_interests fails, first INSERT is undone
- **If removed:** Partial data could be saved (corrupt state)

```javascript
    // Insert into users table
    await connection.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, username, passwordHash]
    );
```
**Lines 213-216:**
- **What:** Inserts basic user credentials into users table
- **Why:** Create the authentication record first

```javascript
    await connection.query(
      `
      INSERT INTO user_interests 
      (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        sanitizeValue(mobile),
        extractCreditCardLast4(creditCard),
        sanitizeValue(state),
        sanitizeValue(city),
        gender || 'Male',
        JSON.stringify(hobbies),
        JSON.stringify(techInterests),
        sanitizeValue(address),
        sanitizeValue(dob)
      ]
    );
```
**Lines 218-234:**
- **What:** Inserts user profile details into user_interests table
- **Why:** Stores extended information
- **Key transformations:**
  - `sanitizeValue()` - cleans strings
  - `extractCreditCardLast4()` - stores only last 4 digits
  - `JSON.stringify(hobbies)` - converts array to JSON string for database
  - `gender || 'Male'` - defaults to 'Male' if not provided

```javascript
    await connection.commit();
```
**Line 236:**
- **What:** Commits (saves) the transaction
- **Why:** Both INSERTs succeeded, make changes permanent
- **If removed:** Changes would rollback (not saved)

```javascript
    return res.status(201).json({
      message: 'User created successfully',
      id: userId
    });
```
**Lines 238-241:**
- **What:** Success response
- **Status 201:** Created
- **Returns:** User ID so frontend can reference the new user

```javascript
  } catch (err) {
    await connection.rollback();
```
**Lines 242-243:**
- **What:** If any error occurred, undo all changes
- **Why:** Don't want partial data (user without interests)
- **Example:** If interests INSERT fails, user INSERT is also undone

```javascript
    console.error('Error creating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};
```
**Lines 244-250:**
- **Error handling:** Returns 500 error
- **finally block:** ALWAYS executes (even if error)
- **connection.release():** Returns connection to pool (critical!)
- **If not released:** Pool runs out of connections

---

### updateUser Function

```javascript
const updateUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();
```
**Lines 254-255:**
- **What:** Updates existing user
- **Why:** For inline editing in Home page table
- **Connection:** Needed for transaction

```javascript
  try {
    const { id } = req.params;
    const {
      name, username, email,
      mobile, creditCard, state, city, gender,
      hobbies, techInterests, address, dob
    } = req.body;
```
**Lines 257-271:**
- **What:** Extracts user ID from URL and updated fields from body
- **req.params.id:** From URL `/api/users/abc-123` → `id = "abc-123"`
- **req.body:** Contains all updated field values

```javascript
    await connection.beginTransaction();
```
**Line 273:** Starts transaction (both UPDATEs must succeed)

```javascript
    // Update users table (username is not editable)
    await connection.query(
      'UPDATE users SET name = ?,username=?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, username, email, id]
    );
```
**Lines 276-279:**
- **What:** Updates basic user info in users table
- **Fields updated:** name, username, email
- **CURRENT_TIMESTAMP:** Automatically sets updated_at to now
- **WHERE id = ?:** Only updates this specific user
- **Note:** User manually added `username` back (though typically username shouldn't change)

```javascript
    // Check if user_interests row exists for this user
    const [interestRows] = await connection.query(
      'SELECT user_id FROM user_interests WHERE user_id = ?',
      [id]
    );
```
**Lines 282-285:**
- **What:** Checks if user has a record in user_interests table
- **Why:** Users registered via /register might not have interests row yet
- **Result:** Either empty array or array with one row

```javascript
    const creditCardLast4 = extractCreditCardLast4(creditCard);
```
**Line 287:**
- **What:** Extracts last 4 digits from submitted credit card
- **Why:** Only store last 4 (security)

```javascript
    if (interestRows.length === 0) {
      // No interests row yet → INSERT one
      await connection.query(
        `
        INSERT INTO user_interests 
        (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob)
        ]
      );
    }
```
**Lines 289-310:**
- **What:** If no interests row exists, create one
- **Why:** User might have been created via /register (which only creates users row)
- **INSERT:** Adds new row with provided values
- **JSON.stringify:** Converts arrays to JSON strings for storage

```javascript
    else {
      // Update existing interests row
      await connection.query(
        `
        UPDATE user_interests 
        SET mobile = ?, credit_card_last4 = ?, state = ?, city = ?, 
            gender = ?, hobbies = ?, tech_interests = ?, address = ?, dob = ?
        WHERE user_id = ?
      `,
        [
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob),
          id
        ]
      );
    }
```
**Lines 311-332:**
- **What:** If interests row exists, update it
- **Why:** Most common case (user already has profile)
- **UPDATE:** Modifies existing row
- **WHERE user_id = ?:** Only updates this user's interests

```javascript
    await connection.commit();
```
**Line 334:**
- **What:** Saves both UPDATEs (or INSERT + UPDATE)
- **Why:** Makes changes permanent

```javascript
    return res.json({
      message: 'User updated successfully',
      id
    });
```
**Lines 336-339:**
- **What:** Success response
- **Returns:** Confirmation message and user ID

```javascript
  } catch (err) {
    await connection.rollback();
    console.error('Error updating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};
```
**Lines 340-349:**
- **Error handling:** Rollback on error, release connection
- **Why rollback:** Prevents partial updates

---

### deleteUser Function

```javascript
const deleteUser = (pool) => async (req, res) => {
  try {
    const { id } = req.params;
```
**Lines 352-354:**
- **What:** Deletes a user
- **id:** From URL parameter

```javascript
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
```
**Line 356:**
- **What:** Deletes user from users table
- **Why:** Remove user account
- **CASCADE effect:** Due to `ON DELETE CASCADE` in user_interests table, that row is also deleted automatically
- **result:** Contains info about deletion (affectedRows, etc.)

```javascript
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
```
**Lines 358-360:**
- **What:** If no rows deleted, user didn't exist
- **affectedRows:** Number of rows deleted (should be 1)
- **Status 404:** Not found

```javascript
    return res.json({
      message: 'User deleted successfully',
      id
    });
```
**Lines 362-365:**
- **What:** Success response
- **Returns:** Confirmation and deleted user's ID

---

### Helper Functions

```javascript
function parseJsonField(field) {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return Array.isArray(field) ? field : [];
}
```
**Lines 372-382:**
- **What:** Safely parses JSON fields from database
- **Why:** MySQL stores arrays as JSON strings (`'["Reading","Music"]'`)
- **Error handling:** If JSON is invalid, returns empty array (safe fallback)
- **Examples:**
  - Input: `'["Angular","React"]'` → Output: `["Angular","React"]`
  - Input: `null` → Output: `[]`
  - Input: `'invalid json'` → Output: `[]` (catches error)

```javascript
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
```
**Lines 384-390:**
- **What:** Exports all controller functions
- **Why:** userRoutes.js imports and uses them

---

## File 7: `backend/routes/authRoutes.js`

### Purpose
Defines the API endpoints for authentication (login and register).

### Line-by-Line Explanation

```javascript
const express = require('express');
```
**Line 1:** Imports Express to create router

```javascript
const { register, login } = require('../controllers/authController');
```
**Line 2:**
- **What:** Imports controller functions
- **Why:** Routes delegate actual logic to controllers
- **Pattern:** Routes handle HTTP, controllers handle business logic

```javascript
const router = express.Router();
```
**Line 4:**
- **What:** Creates a new router instance
- **Why:** Groups related routes together
- **Result:** Can define multiple routes on this router

```javascript
module.exports = (pool) => {
```
**Line 6:**
- **What:** Exports a function that takes pool and returns configured router
- **Why:** Pattern allows passing database pool to routes

```javascript
  router.post('/register', register(pool));
```
**Line 7:**
- **What:** Defines POST endpoint at `/register`
- **Full path:** `/api/register` (because server.js mounts this under `/api`)
- **Handler:** Calls `register(pool)` which returns the controller function
- **Usage:** Frontend sends POST request to this endpoint to create account

```javascript
  router.post('/login', login(pool));
```
**Line 8:**
- **What:** Defines POST endpoint at `/login`
- **Full path:** `/api/login`
- **Handler:** Calls `login(pool)` controller
- **Usage:** Frontend sends POST request to authenticate

```javascript
  return router;
};
```
**Lines 10-11:**
- **What:** Returns configured router
- **Why:** server.js uses this router

---

## File 8: `backend/routes/userRoutes.js`

### Purpose
Defines API endpoints for user CRUD operations, all protected by JWT authentication.

### Line-by-Line Explanation

```javascript
const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
```
**Lines 1-9:**
- **What:** Imports dependencies
- **express:** For router
- **User controllers:** The actual logic functions
- **verifyToken:** JWT middleware to protect routes

```javascript
const router = express.Router();
```
**Line 11:** Creates router instance

```javascript
module.exports = (pool) => {
```
**Line 13:** Exports function that receives pool

```javascript
  // All user routes protected with JWT verification
  router.get('/', verifyToken, getAllUsers(pool));
```
**Line 15:**
- **What:** GET endpoint to fetch all users
- **Full path:** `/api/users`
- **verifyToken:** Middleware runs FIRST, checks JWT
- **Flow:** Request → verifyToken → getAllUsers
- **If token invalid:** verifyToken returns 401, getAllUsers never runs
- **If token valid:** getAllUsers executes and returns user list

```javascript
  router.get('/:id', verifyToken, getUserById(pool));
```
**Line 16:**
- **What:** GET endpoint for single user
- **Full path:** `/api/users/:id` (e.g., `/api/users/abc-123`)
- **:id:** Route parameter (available as `req.params.id`)
- **Protected:** Requires valid JWT token

```javascript
  router.post('/', verifyToken, createUser(pool));
```
**Line 17:**
- **What:** POST endpoint to create new user
- **Full path:** `/api/users`
- **Protected:** Must be logged in to create users

```javascript
  router.put('/:id', verifyToken, updateUser(pool));
```
**Line 18:**
- **What:** PUT endpoint to update user
- **Full path:** `/api/users/:id`
- **Protected:** Must be logged in to edit users
- **Used:** When saving inline edits in Home table

```javascript
  router.delete('/:id', verifyToken, deleteUser(pool));
```
**Line 19:**
- **What:** DELETE endpoint to remove user
- **Full path:** `/api/users/:id`
- **Protected:** Must be logged in to delete users
- **Used:** When clicking delete button in Home table

```javascript
  return router;
};
```
**Lines 21-22:** Returns configured router with all routes protected

---

# FRONTEND EXPLAINED

## File 9: `src/app/app.module.ts`

### Purpose
The ROOT MODULE of Angular application. Declares all components and imports all libraries.

### Line-by-Line Explanation

```typescript
import { NgModule } from '@angular/core';
```
**Line 1:**
- **What:** Imports NgModule decorator from Angular
- **Why:** Used to define Angular modules
- **If removed:** Can't create modules

```typescript
import { BrowserModule } from '@angular/platform-browser';
```
**Line 2:**
- **What:** Imports browser-specific services
- **Why:** Required for any Angular app that runs in browser
- **Provides:** DOM rendering, event handling, etc.

```typescript
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
```
**Line 3:**
- **What:** Enables animations in Angular
- **Why:** PrimeNG components use animations (dialogs, dropdowns, etc.)
- **If removed:** UI components won't animate properly

```typescript
import { HttpClientModule } from '@angular/common/http';
```
**Line 4:**
- **What:** Enables HTTP requests
- **Why:** Needed to call backend APIs
- **Provides:** HttpClient service for making GET, POST, PUT, DELETE requests

```typescript
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
```
**Line 5:**
- **What:** Imports form handling modules
- **FormsModule:** Template-driven forms (ngModel)
- **ReactiveFormsModule:** Reactive forms (FormBuilder, FormGroup)
- **Why:** Both are used:
  - Reactive: Login, Register, Add Member forms
  - Template: Inline editing with ngModel

```typescript
import { MessageService } from 'primeng/api';
```
**Line 6:**
- **What:** Imports PrimeNG message service
- **Why:** Shows toast notifications (success/error messages)
- **Used where:** Injected into components for displaying messages

```typescript
import { AppRoutingModule } from './app-routing.module';
```
**Line 8:**
- **What:** Imports routing configuration
- **Why:** Defines URL structure (/login, /register, /home)

```typescript
import { AppComponent } from './app.component';
```
**Line 9:**
- **What:** Imports root component
- **Why:** Entry point component that holds `<router-outlet>`

```typescript
// Components
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { UserFormComponent } from './shared/user-form/user-form.component';
```
**Lines 11-15:**
- **What:** Imports all custom components
- **Why:** Must import before declaring in module
- **Each component:**
  - LoginComponent: Login page UI + logic
  - RegisterComponent: Registration page
  - HomeComponent: Main user table
  - UserFormComponent: Reusable add/edit form

```typescript
// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
// ... (more PrimeNG imports)
```
**Lines 17-35:**
- **What:** Imports PrimeNG UI component modules
- **Why:** Each PrimeNG component must be imported separately
- **Examples:**
  - InputTextModule: `<input pInputText>` directive
  - TableModule: `<p-table>` component
  - DialogModule: `<p-dialog>` component
- **If module not imported:** Component/directive won't work

```typescript
@NgModule({
```
**Line 37:** Decorator that defines module configuration

```typescript
  declarations: [AppComponent, LoginComponent, RegisterComponent, HomeComponent, UserFormComponent],
```
**Line 38:**
- **What:** Lists all components that belong to this module
- **Why:** Angular needs to know which components exist
- **Result:** These components can be used in templates
- **If not declared:** Angular won't recognize the component

```typescript
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,

    InputTextModule,
    PasswordModule,
    ButtonModule,
    // ... all PrimeNG modules
  ],
```
**Lines 39-64:**
- **What:** Lists all modules this module depends on
- **Why:** Makes their features available to our components
- **Angular modules:** BrowserModule, HttpClientModule, etc.
- **PrimeNG modules:** TableModule, DialogModule, etc.
- **Order matters:** AppRoutingModule should be last among Angular modules

```typescript
  providers: [MessageService],
```
**Line 66:**
- **What:** Lists services available for dependency injection
- **MessageService:** Used for toast notifications
- **Why:** Makes it available to all components without importing in each

```typescript
  bootstrap: [AppComponent]
```
**Line 67:**
- **What:** Specifies root component to load on startup
- **Why:** AppComponent is entry point, contains `<router-outlet>`

```typescript
})
export class AppModule {}
```
**Lines 68-69:**
- **What:** Closes decorator and exports module class
- **Why:** main.ts bootstraps this module to start app

---

## File 10: `src/app/app-routing.module.ts`

### Purpose
Defines URL routes and which component to show for each route.

### Line-by-Line Explanation

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
```
**Lines 1-2:**
- **What:** Imports Angular routing utilities
- **Why:** Need to define and configure routes

```typescript
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
```
**Lines 3-5:**
- **What:** Imports page components
- **Why:** Need to reference them in route configuration

```typescript
const routes: Routes = [
```
**Line 7:**
- **What:** Array of route definitions
- **Type:** Routes (Angular's route configuration type)

```typescript
  { path: '', redirectTo: 'login', pathMatch: 'full' },
```
**Line 8:**
- **What:** Default route (empty path '')
- **redirectTo:** Automatically go to 'login'
- **pathMatch: 'full':** Only match if URL is exactly '' (not a prefix)
- **Result:** `http://localhost:4200/` → redirects to `http://localhost:4200/login`

```typescript
  { path: 'login', component: LoginComponent },
```
**Line 9:**
- **What:** Route for login page
- **URL:** `/login`
- **Shows:** LoginComponent
- **Result:** When user visits `/login`, shows login form

```typescript
  { path: 'register', component: RegisterComponent },
```
**Line 10:**
- **What:** Route for registration page
- **URL:** `/register`
- **Shows:** RegisterComponent

```typescript
  { path: 'home', component: HomeComponent },
```
**Line 11:**
- **What:** Route for main page (user table)
- **URL:** `/home`
- **Shows:** HomeComponent
- **Note:** NO guard (user removed it), so anyone can access even without login

```typescript
  { path: '**', redirectTo: 'login' }
```
**Line 12:**
- **What:** Wildcard route (catches all unmatched URLs)
- **path: '**':** Matches any URL not defined above
- **redirectTo:** Goes to login
- **Example:** User types `/random` → redirects to `/login`
- **Why:** Prevents 404 errors

```typescript
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```
**Lines 13-19:**
- **imports:** Configures routing with defined routes
- **forRoot:** Sets up routes for root module (use `forChild` for lazy-loaded modules)
- **exports:** Makes RouterModule available to other modules
- **Why export:** AppModule imports this to enable routing

---

## File 11: `src/app/models/user.model.ts`

### Purpose
Defines the TypeScript interface for User data structure.

### Line-by-Line Explanation

```typescript
export interface User {
```
**Line 1:**
- **What:** Defines User interface
- **Why:** TypeScript type checking ensures data consistency
- **export:** Makes it available to other files

```typescript
  id?: string;
```
**Line 2:**
- **What:** User's unique ID
- **Type:** string (UUID format)
- **?:** Optional (might not exist for new users not yet saved)

```typescript
  name?: string;
  email?: string;
  username?: string;
```
**Lines 3-5:**
- **What:** Basic user info
- **All optional:** Because some API responses might not include all fields

```typescript
  mobile?: string;
  creditCard?: string;
```
**Lines 6-7:**
- **What:** Contact and payment info
- **creditCard:** Stores last 4 digits only

```typescript
  state?: string;
  city?: string;
  address?: string;
```
**Lines 8-10:**
- **What:** Location information

```typescript
  gender?: string;
```
**Line 11:**
- **What:** User's gender (Male/Female/Other)

```typescript
  hobbies?: string[];
  techInterests?: string[];
```
**Lines 12-13:**
- **What:** Arrays of hobbies and tech interests
- **Type:** string[] (array of strings)
- **Example:** `["Reading", "Music"]`

```typescript
  dob?: string | Date;
```
**Line 14:**
- **What:** Date of birth
- **Type:** Can be string or Date object (flexibility)
- **Why both:** API returns string, Angular Date picker uses Date

```typescript
  password?: string;
```
**Line 15:**
- **What:** Password (only used during registration)
- **Why optional:** Not included in API responses (security)

```typescript
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
```
**Lines 16-18:**
- **What:** Timestamps from database
- **Used:** Can display when user was created/modified

---

## File 12: `src/app/services/auth.service.ts`

### Purpose
Manages JWT authentication - login, register, logout, token storage.

### Line-by-Line Explanation

```typescript
import { Injectable } from '@angular/core';
```
**Line 1:**
- **What:** Imports Injectable decorator
- **Why:** Makes this class a service that can be injected into components

```typescript
import { HttpClient } from '@angular/common/http';
```
**Line 2:**
- **What:** Imports HTTP client for API calls
- **Why:** Need to call `/api/login` and `/api/register`

```typescript
import { Router } from '@angular/router';
```
**Line 3:**
- **What:** Imports router for navigation
- **Why:** Used in logout() to redirect to login page

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
```
**Line 4:**
- **What:** Imports RxJS classes
- **BehaviorSubject:** Holds current user, components can subscribe to changes
- **Observable:** Type for async data streams

```typescript
import { tap } from 'rxjs/operators';
```
**Line 5:**
- **What:** Imports tap operator
- **Why:** Performs side effects (like storing token) in observable chain

```typescript
interface AuthResponse {
  message: string;
  token: string;
  user: { id: string; username: string; email: string; name: string };
}
```
**Lines 7-11:**
- **What:** Defines structure of API auth responses
- **Why:** TypeScript type checking for API responses
- **Structure:** What backend sends after login/register

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}
```
**Lines 13-18:**
- **What:** User info structure (subset of full User model)
- **Why:** Only essential fields needed for auth state

```typescript
@Injectable({ providedIn: 'root' })
```
**Line 20:**
- **What:** Makes this a singleton service available app-wide
- **providedIn: 'root':** One instance shared by entire app
- **Alternative:** Could provide in specific module

```typescript
export class AuthService {
```
**Line 21:** Defines the service class

```typescript
  private apiUrl = 'http://localhost:3000/api';
```
**Line 22:**
- **What:** Backend API base URL
- **Why:** All auth endpoints start with this
- **Used:** Lines 32 and 37 to build full URLs

```typescript
  private tokenKey = 'jwt_token';
  private userKey = 'current_user';
```
**Lines 23-24:**
- **What:** localStorage keys for storing data
- **Why:** Consistent key names across app
- **Stored data:**
  - `jwt_token` → JWT string
  - `current_user` → User object as JSON

```typescript
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
```
**Line 25:**
- **What:** Observable that holds current user state
- **BehaviorSubject:** Has current value + notifies subscribers of changes
- **Initial value:** Calls `getCurrentUser()` to load from localStorage
- **Why:** Components can subscribe to know when user logs in/out

```typescript
  public currentUser$ = this.currentUserSubject.asObservable();
```
**Line 26:**
- **What:** Public observable for components to subscribe
- **$:** Naming convention for observables
- **Why public:** Components need access, but can't modify the subject

```typescript
  constructor(private http: HttpClient, private router: Router) {}
```
**Line 28:**
- **What:** Dependency injection
- **http:** For API calls
- **router:** For navigation

```typescript
  register(userData: any): Observable<AuthResponse> {
```
**Line 30:**
- **What:** Sends registration request to backend
- **Parameter:** userData object with name, username, email, password
- **Returns:** Observable that emits API response

```typescript
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
```
**Line 31:**
- **What:** POST request to `/api/register`
- **<AuthResponse>:** TypeScript generic - specifies response type
- **pipe:** Chains operators

```typescript
      tap(res => { this.setSession(res.token, res.user); })
```
**Line 32:**
- **What:** tap operator - performs side effect without modifying data
- **Side effect:** Calls setSession to store token and user
- **Why tap:** Doesn't change the response, just stores data
- **Result:** Token saved, then component gets response

```typescript
    );
  }
```
**Lines 33-34:** Closes pipe and function

```typescript
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => { this.setSession(res.token, res.user); })
    );
  }
```
**Lines 36-40:**
- **What:** Sends login request
- **Same pattern as register**
- **Difference:** Only sends username and password (less data)

```typescript
  private setSession(token: string, user: User): void {
```
**Line 42:**
- **What:** Stores authentication data
- **private:** Internal helper method

```typescript
    localStorage.setItem(this.tokenKey, token);
```
**Line 43:**
- **What:** Saves JWT token to browser's localStorage
- **Why:** Persists across page refreshes
- **Key:** 'jwt_token'
- **Value:** JWT string

```typescript
    localStorage.setItem(this.userKey, JSON.stringify(user));
```
**Line 44:**
- **What:** Saves user object to localStorage
- **JSON.stringify:** Converts object to string (localStorage only stores strings)
- **Example:** `{"id":"abc","username":"john",...}`

```typescript
    this.currentUserSubject.next(user);
```
**Line 45:**
- **What:** Updates current user observable
- **Why:** Notifies all subscribed components that user is now logged in
- **Result:** UI updates automatically (Angular change detection)

```typescript
  }
```
**Line 46:** Closes setSession function

```typescript
  logout(): void {
```
**Line 48:** Logs out user

```typescript
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
```
**Lines 49-50:**
- **What:** Removes token and user from localStorage
- **Why:** Clear authentication data
- **Result:** User no longer authenticated

```typescript
    this.currentUserSubject.next(null);
```
**Line 51:**
- **What:** Updates observable to null
- **Why:** Notifies components user is logged out
- **Result:** UI updates (could hide user-specific elements)

```typescript
    this.router.navigate(['/login']);
```
**Line 52:**
- **What:** Redirects to login page
- **Why:** Logged out users should see login screen

```typescript
  }
```
**Line 53:** Closes logout

```typescript
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
```
**Lines 55-57:**
- **What:** Retrieves JWT token from localStorage
- **Returns:** Token string or null if not logged in
- **Used where:** UserService adds this token to API request headers

```typescript
  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }
```
**Lines 59-62:**
- **What:** Retrieves user object from localStorage
- **JSON.parse:** Converts JSON string back to object
- **Returns:** User object or null
- **Used:** Initialize currentUserSubject on service creation

```typescript
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```
**Lines 64-66:**
- **What:** Checks if user is logged in
- **!!:** Double negation converts to boolean (truthy → true, falsy → false)
- **Logic:** If token exists, user is authenticated
- **Used where:** Components check this before showing certain UI

---

## File 13: `src/app/services/user.service.ts`

### Purpose
Handles all user-related API calls (CRUD operations) with JWT authentication.

### Line-by-Line Explanation

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
```
**Lines 1-4:**
- **Injectable:** Makes this a service
- **HttpClient:** For API calls
- **HttpHeaders:** To add Authorization header
- **User:** Type definition for user objects

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:3000/api';
```
**Lines 6-8:**
- **providedIn: 'root':** Singleton service
- **baseUrl:** Backend API base URL

```typescript
  constructor(private http: HttpClient) {}
```
**Line 10:** Injects HttpClient

```typescript
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }
```
**Lines 12-15:**
- **What:** Creates HTTP headers with JWT token
- **Why:** Backend requires `Authorization: Bearer <token>` header for protected routes
- **Process:**
  1. Gets token from localStorage
  2. Creates header: `Authorization: Bearer <token>`
  3. If no token, sends empty string
- **Used:** Every API call below uses this
- **If removed:** All API calls would get 401 Unauthorized

```typescript
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() });
  }
```
**Lines 17-19:**
- **What:** Fetches all users from backend
- **GET request:** To `/api/users`
- **headers:** Includes JWT token
- **Returns:** Observable<User[]> (array of users)
- **Used where:** HomeComponent calls this in `loadUsers()`
- **Result:** Populates the table

```typescript
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }
```
**Lines 21-23:**
- **What:** Fetches single user
- **GET:** To `/api/users/:id`
- **Used:** Could be used for user profile page (not currently used)

```typescript
  addUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user, { headers: this.getHeaders() });
  }
```
**Lines 25-27:**
- **What:** Creates new user
- **POST:** To `/api/users`
- **Body:** Complete user object
- **Used where:** UserFormComponent calls this when adding member

```typescript
  updateUser(id: string, user: Partial<User>): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, user, { headers: this.getHeaders() });
  }
```
**Lines 29-31:**
- **What:** Updates existing user
- **PUT:** To `/api/users/:id`
- **Partial<User>:** TypeScript type allowing subset of User fields
- **Used where:** HomeComponent calls this in `savechanges()` for batch updates

```typescript
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }
}
```
**Lines 33-35:**
- **What:** Deletes user
- **DELETE:** To `/api/users/:id`
- **Used where:** HomeComponent calls this in `confirmDelete()`

**KEY POINT:** All methods include `{ headers: this.getHeaders() }` which adds JWT token - this is how authentication works without interceptor!

---

## File 14: `src/app/pages/login/login.component.ts`

### Purpose
Handles user login - form validation and authentication.

### Complete Line-by-Line Explanation

*Due to the extensive nature of this file (130 lines), I'll explain the key sections systematically.*

**Imports Section (Lines 1-7):**
```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
```

- **Component**: Angular decorator for creating components
- **Form