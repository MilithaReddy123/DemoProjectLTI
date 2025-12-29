# Backend Complete Line-by-Line Explanation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [package.json - Dependencies](#packagejson---dependencies)
3. [server.js - Entry Point](#serverjs---entry-point)
4. [config/database.js - Database Configuration](#configdaborasejs---database-configuration)
5. [routes/authRoutes.js - Authentication Routes](#routesauthroutesjs---authentication-routes)
6. [routes/userRoutes.js - User CRUD Routes](#routesuserroutesjs---user-crud-routes)
7. [controllers/authController.js - Authentication Logic](#controllersauthcontrollerjs---authentication-logic)
8. [controllers/userController.js - User CRUD Logic](#controllersusercontrollerjs---user-crud-logic)
9. [Database Schema Deep Dive](#database-schema-deep-dive)
10. [Complete API Request-Response Flows](#complete-api-request-response-flows)
11. [Security Implementation](#security-implementation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Angular)                         │
│                    http://localhost:4200                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS SERVER                            │
│                    http://localhost:3000                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     MIDDLEWARE LAYER                        │ │
│  │  cors() → express.json() → Route Handler                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      ROUTES LAYER                           │ │
│  │  /api/login, /api/register, /api/users/*                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   CONTROLLERS LAYER                         │ │
│  │  authController.js, userController.js                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries (Connection Pool)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MySQL DATABASE                           │
│                        demo_app schema                           │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │       users         │───▶│       user_interests            │ │
│  │  (authentication)   │ FK │  (profile/preferences)          │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## package.json - Dependencies

```json
{
  "name": "demo-backend",
  "version": "1.0.0",
  "description": "Backend API for Employee Cafeteria Management",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Line-by-Line Explanation:

**Line 1: `"name": "demo-backend"`**
- Defines the package name for npm
- Used when publishing to npm registry or referencing in logs

**Line 2: `"version": "1.0.0"`**
- Semantic versioning: MAJOR.MINOR.PATCH
- 1.0.0 = first stable release

**Line 3: `"description": "Backend API for Employee Cafeteria Management"`**
- Human-readable description of what this package does
- Shows in npm search results

**Line 4: `"main": "server.js"`**
- Entry point when this package is imported
- `node .` or `require('demo-backend')` would load server.js

**Lines 5-8: Scripts**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```
- `npm start` → Runs `node server.js` (production)
- `npm run dev` → Runs `nodemon server.js` (development with auto-restart)

**Lines 9-16: Dependencies**

| Dependency | Version | Purpose |
|------------|---------|---------|
| `express` | ^4.18.2 | Web framework for Node.js - handles HTTP requests, routing, middleware |
| `mysql2` | ^3.6.5 | MySQL driver with Promise support and connection pooling |
| `bcryptjs` | ^2.4.3 | Password hashing library (pure JavaScript, no native dependencies) |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.3.1 | Loads environment variables from .env file |
| `uuid` | ^9.0.1 | Generates unique identifiers (UUIDs) for database records |

**Lines 17-19: devDependencies**
```json
"devDependencies": {
  "nodemon": "^3.0.2"
}
```
- `nodemon` watches files and auto-restarts server on changes
- Only needed during development, not in production

---

## server.js - Entry Point

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createPool, initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Create database pool
const pool = createPool();

// Initialize database
initializeDatabase(pool);

// Import routes
const authRoutes = require('./routes/authRoutes')(pool);
const userRoutes = require('./routes/userRoutes')(pool);

// Use routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
```

### Line-by-Line Explanation:

---

**Line 1: `require('dotenv').config();`**

```javascript
require('dotenv').config();
```

**What it does:**
- Loads the `dotenv` module and immediately calls its `config()` function
- Reads the `.env` file from the project root directory
- Parses each line (KEY=VALUE format) and adds them to `process.env`

**Why it's first:**
- Environment variables must be loaded BEFORE any other code that uses them
- If database.js is loaded first, `process.env.DB_HOST` would be undefined

**Example .env file:**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret123
DB_NAME=demo_app
DB_PORT=3306
PORT=3000
```

**After this line runs:**
```javascript
console.log(process.env.DB_HOST);     // "localhost"
console.log(process.env.DB_PASSWORD); // "secret123"
```

---

**Line 2: `const express = require('express');`**

```javascript
const express = require('express');
```

**What it does:**
- Imports the Express.js framework
- `express` is a function that creates an Express application

**What Express provides:**
- HTTP request handling
- Routing system
- Middleware architecture
- Response utilities (res.json, res.send, res.status)

---

**Line 3: `const cors = require('cors');`**

```javascript
const cors = require('cors');
```

**What it does:**
- Imports CORS (Cross-Origin Resource Sharing) middleware
- CORS is a security mechanism built into browsers

**Why it's needed:**
- Browser security policy blocks requests from one origin to another
- Frontend: `http://localhost:4200` (Angular)
- Backend: `http://localhost:3000` (Express)
- Different ports = different origins = blocked by browser

---

**Line 4: `const { createPool, initializeDatabase } = require('./config/database');`**

```javascript
const { createPool, initializeDatabase } = require('./config/database');
```

**What it does:**
- Uses destructuring to import two specific functions from database.js
- `createPool` - Creates MySQL connection pool
- `initializeDatabase` - Creates tables if they don't exist

**Equivalent to:**
```javascript
const database = require('./config/database');
const createPool = database.createPool;
const initializeDatabase = database.initializeDatabase;
```

---

**Line 6: `const app = express();`**

```javascript
const app = express();
```

**What it does:**
- Calls the `express()` function to create an Express application instance
- `app` is the central object for configuring routes, middleware, and settings

**The `app` object provides:**
- `app.use()` - Add middleware
- `app.get()`, `app.post()`, `app.put()`, `app.delete()` - Route handlers
- `app.listen()` - Start HTTP server

---

**Lines 8-10: Middleware Configuration**

```javascript
// Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
```

### Line 9: CORS Middleware

```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
```

**What `app.use()` does:**
- Registers middleware that runs on EVERY incoming request
- Middleware executes in the order it's registered

**What CORS middleware does:**
1. Checks the `Origin` header of incoming request
2. If origin matches `http://localhost:4200`:
   - Adds `Access-Control-Allow-Origin: http://localhost:4200` to response
   - Adds `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,...`
   - Adds `Access-Control-Allow-Headers: Content-Type,...`
3. For preflight requests (OPTIONS), responds with 200 OK

**The `{ origin: 'http://localhost:4200' }` configuration:**
- Only allows requests from Angular's development server
- Requests from other origins (e.g., `http://evil.com`) are blocked

**Without CORS middleware:**
```
Browser Console: "Access to XMLHttpRequest at 'http://localhost:3000/api/users' 
from origin 'http://localhost:4200' has been blocked by CORS policy"
```

### Line 10: JSON Body Parser

```javascript
app.use(express.json());
```

**What it does:**
1. Intercepts requests with `Content-Type: application/json`
2. Reads the request body stream
3. Parses JSON string into JavaScript object
4. Attaches parsed object to `req.body`

**Example:**
```
POST /api/login HTTP/1.1
Content-Type: application/json

{"username": "john", "password": "secret123"}
```

**After express.json() runs:**
```javascript
console.log(req.body);
// { username: 'john', password: 'secret123' }
```

**Without express.json():**
```javascript
console.log(req.body);  // undefined
```

---

**Lines 12-16: Database Setup**

```javascript
// Create database pool
const pool = createPool();

// Initialize database
initializeDatabase(pool);
```

### Line 13: Create Connection Pool

```javascript
const pool = createPool();
```

**What a connection pool is:**
- Pre-creates multiple database connections
- Connections are reused instead of created/destroyed per request
- Dramatically improves performance

**Without pooling (bad):**
```
Request 1 → Create connection → Query → Close connection → 150ms
Request 2 → Create connection → Query → Close connection → 150ms
Request 3 → Create connection → Query → Close connection → 150ms
Total: 450ms
```

**With pooling (good):**
```
Startup → Create 10 connections (pool)
Request 1 → Borrow connection → Query → Return to pool → 5ms
Request 2 → Borrow connection → Query → Return to pool → 5ms
Request 3 → Borrow connection → Query → Return to pool → 5ms
Total: 15ms
```

### Line 16: Initialize Database

```javascript
initializeDatabase(pool);
```

**What it does:**
- Tests the database connection
- Creates `users` table if it doesn't exist
- Creates `user_interests` table if it doesn't exist
- Logs success/failure messages

---

**Lines 18-20: Route Imports**

```javascript
// Import routes
const authRoutes = require('./routes/authRoutes')(pool);
const userRoutes = require('./routes/userRoutes')(pool);
```

**What's happening here:**

1. `require('./routes/authRoutes')` - Loads the authRoutes module
2. The module exports a FUNCTION: `module.exports = (pool) => { ... }`
3. We immediately call that function with `(pool)`
4. The function returns an Express Router configured with our routes

**Why pass `pool` to routes:**
- Routes need database access to perform queries
- Instead of importing database in every file, we pass it via dependency injection
- This pattern is called "dependency injection"

---

**Lines 22-24: Mount Routes**

```javascript
// Use routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
```

### Line 23: Mount Auth Routes

```javascript
app.use('/api', authRoutes);
```

**What it does:**
- Mounts the authRoutes router at the `/api` path prefix
- Routes defined in authRoutes get prefixed with `/api`

**Result:**
```
authRoutes has:     router.post('/register', ...)
Actual URL becomes: POST /api/register

authRoutes has:     router.post('/login', ...)
Actual URL becomes: POST /api/login
```

### Line 24: Mount User Routes

```javascript
app.use('/api/users', userRoutes);
```

**What it does:**
- Mounts userRoutes at `/api/users` prefix
- All user CRUD operations are under this path

**Result:**
```
userRoutes has:     router.get('/', ...)
Actual URL becomes: GET /api/users

userRoutes has:     router.get('/:id', ...)
Actual URL becomes: GET /api/users/abc-123

userRoutes has:     router.post('/', ...)
Actual URL becomes: POST /api/users

userRoutes has:     router.put('/:id', ...)
Actual URL becomes: PUT /api/users/abc-123

userRoutes has:     router.delete('/:id', ...)
Actual URL becomes: DELETE /api/users/abc-123
```

---

**Lines 26-29: Health Check Endpoint**

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
```

**What it does:**
- Provides a simple endpoint to verify the server is running
- Returns JSON response with status

**Use cases:**
- Container orchestration (Kubernetes) health probes
- Load balancer health checks
- Monitoring systems (Datadog, Prometheus)
- Manual verification during deployment

**Request:**
```
GET /api/health HTTP/1.1
Host: localhost:3000
```

**Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","message":"Server is running"}
```

---

**Lines 31-35: Start Server**

```javascript
// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
```

### Line 32: Port Selection

```javascript
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
```

**What it does:**
- Checks if `PORT` environment variable is set
- If set, converts it to a number (`Number()`)
- If not set, defaults to 3000

**Why this pattern:**
- Production environments (Heroku, AWS) set PORT automatically
- Development uses default 3000
- `Number()` converts string "3000" to number 3000

### Lines 33-35: Listen for Connections

```javascript
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
```

**What `app.listen()` does:**
1. Creates an HTTP server internally
2. Binds to the specified port
3. Starts accepting connections
4. Calls the callback function when ready

**After this runs:**
- Server accepts TCP connections on port 3000
- Each HTTP request triggers registered middleware/routes
- Server runs indefinitely until process is killed

---

## config/database.js - Database Configuration

```javascript
const mysql = require('mysql2');

// Create MySQL connection pool with promises
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();
};

// Initialize database tables
const initializeDatabase = async (pool) => {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ MySQL database connected successfully');

    // Create users table with UUID
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Users table created');

    // Create user_interests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        user_id VARCHAR(36) NOT NULL PRIMARY KEY,
        mobile VARCHAR(15) NOT NULL,
        credit_card_last4 VARCHAR(4),
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
        hobbies JSON,
        tech_interests JSON,
        address TEXT,
        dob DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ User interests table created');
    console.log('✓ Database initialization complete');
    console.log('📝 All tables are ready for use!');
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    console.error('Please check your database configuration');
  }
};

module.exports = { createPool, initializeDatabase };
```

### Line-by-Line Explanation:

---

**Line 1: `const mysql = require('mysql2');`**

```javascript
const mysql = require('mysql2');
```

**What it does:**
- Imports the mysql2 library
- mysql2 is a modern MySQL driver for Node.js

**Why mysql2 instead of mysql:**
- Native Promise support (`.promise()`)
- Better performance (uses binary protocol)
- Prepared statements support
- Compatible with mysql API

---

**Lines 3-15: createPool Function**

```javascript
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();
};
```

### Pool Configuration Options Explained:

**`host: process.env.DB_HOST || 'localhost'`**
- MySQL server hostname
- Default: 'localhost' (same machine)
- Production might be: 'mysql.example.com' or '10.0.0.5'

**`user: process.env.DB_USER || 'root'`**
- MySQL username for authentication
- 'root' is the default admin user (not recommended for production)

**`password: process.env.DB_PASSWORD || ''`**
- MySQL password
- Empty string as default (development only!)
- Production should always use strong password from environment

**`database: process.env.DB_NAME || 'demo_app'`**
- Which database schema to use
- All queries run against this database by default

**`port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306`**
- MySQL server port
- 3306 is the default MySQL port

**`waitForConnections: true`**
- When all connections are in use, new requests wait in queue
- If `false`, immediately returns error when pool is exhausted

**`connectionLimit: 10`**
- Maximum simultaneous connections in the pool
- Higher = more concurrent queries, but more memory/CPU
- 10 is good for small-medium applications

**`queueLimit: 0`**
- How many requests can wait in queue
- 0 = unlimited (requests wait indefinitely)
- Setting a limit prevents memory issues under extreme load

**`.promise()`**
- Returns a promise-based wrapper around the pool
- Allows using `async/await` syntax
- Without this: callbacks (`pool.query('...', (err, results) => {})`)
- With this: `const [rows] = await pool.query('...')`

---

**Lines 17-66: initializeDatabase Function**

```javascript
const initializeDatabase = async (pool) => {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ MySQL database connected successfully');
```

**`async (pool) =>`**
- Async function allows using `await` inside
- Receives the pool object as parameter

**`await pool.query('SELECT 1')`**
- Simple query to test if database is reachable
- `SELECT 1` is the simplest possible query
- If this fails, connection is broken

---

### Users Table Schema:

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

**Column-by-Column Explanation:**

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | VARCHAR(36) | NOT NULL, PRIMARY KEY | UUID identifier (e.g., 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') |
| `name` | VARCHAR(100) | NOT NULL | User's full name (max 100 chars) |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Email address, must be unique across all users |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Login username, must be unique |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash of password (never store plain text!) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Auto-set when row is inserted |
| `updated_at` | TIMESTAMP | NULL DEFAULT NULL, ON UPDATE CURRENT_TIMESTAMP | Auto-updates when row is modified |

**Why VARCHAR(36) for id?**
- UUIDs are exactly 36 characters: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Example: `550e8400-e29b-41d4-a716-446655440000`

**Why UNIQUE on email and username?**
- Prevents duplicate registrations
- Database enforces uniqueness (even if code has bugs)
- Improves query performance with automatic index

**INDEX idx_username (username)**
- Creates a B-tree index on username column
- Speeds up: `WHERE username = 'john'`
- Login query uses this index for fast lookup

**INDEX idx_email (email)**
- Creates index on email column
- Speeds up: `WHERE email = 'john@example.com'`

**ENGINE=InnoDB**
- InnoDB is MySQL's default storage engine
- Supports transactions (BEGIN, COMMIT, ROLLBACK)
- Supports foreign keys with referential integrity
- Row-level locking for better concurrency

**DEFAULT CHARSET=utf8mb4**
- Full Unicode support including emoji 🎉
- utf8mb4 = 4-byte UTF-8 (supports all Unicode)
- Regular utf8 only supports 3-byte characters (no emoji)

---

### User Interests Table Schema:

```sql
CREATE TABLE IF NOT EXISTS user_interests (
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  mobile VARCHAR(15) NOT NULL,
  credit_card_last4 VARCHAR(4),
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
  hobbies JSON,
  tech_interests JSON,
  address TEXT,
  dob DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

**Column-by-Column Explanation:**

| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | VARCHAR(36) | References users.id (1-to-1 relationship) |
| `mobile` | VARCHAR(15) | Phone number with country code |
| `credit_card_last4` | VARCHAR(4) | Only last 4 digits stored (PCI compliance) |
| `state` | VARCHAR(100) | Geographic state/region |
| `city` | VARCHAR(100) | City name |
| `gender` | ENUM | Restricted to 'Male', 'Female', 'Other' |
| `hobbies` | JSON | Array stored as JSON: ["Reading", "Music"] |
| `tech_interests` | JSON | Array stored as JSON: ["Angular", "Node.js"] |
| `address` | TEXT | Full address (up to 65,535 characters) |
| `dob` | DATE | Date of birth (YYYY-MM-DD format) |

**ENUM('Male', 'Female', 'Other')**
- Only allows these three specific values
- Provides validation at database level
- More storage-efficient than VARCHAR

**JSON columns (hobbies, tech_interests)**
- MySQL 5.7+ native JSON support
- Stored efficiently in binary format
- Can query inside JSON: `WHERE hobbies->'$[0]' = 'Reading'`

**FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE**

This is the most important line for data integrity:

```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

**What it does:**
1. `user_id` MUST exist in `users.id` (referential integrity)
2. Cannot insert user_interests with non-existent user_id
3. `ON DELETE CASCADE`: When a user is deleted, automatically delete their interests

**Example of CASCADE in action:**
```sql
-- User with id 'abc-123' exists in both tables

DELETE FROM users WHERE id = 'abc-123';

-- Result:
-- 1. Row deleted from users table
-- 2. Corresponding row AUTOMATICALLY deleted from user_interests
-- No orphaned data!
```

**Why separate tables?**
- Separation of concerns (auth vs profile)
- Can register with minimal info, add profile later
- Easier to modify one without affecting the other

---

## routes/authRoutes.js - Authentication Routes

```javascript
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

module.exports = (pool) => {
  // Auth routes delegating to controllers
  router.post('/register', register(pool));
  router.post('/login', login(pool));

  return router;
};
```

### Line-by-Line Explanation:

**Line 1: `const express = require('express');`**
- Import Express framework

**Line 2: `const { register, login } = require('../controllers/authController');`**
- Import controller functions using destructuring
- `register` handles user registration
- `login` handles user authentication

**Line 4: `const router = express.Router();`**
- Creates a mini-application (router) for grouping routes
- Like a "sub-app" that can be mounted on the main app

**Line 6: `module.exports = (pool) => { ... }`**
- Exports a FUNCTION (factory pattern)
- The function takes `pool` as parameter
- Returns configured router

**Why this pattern?**
- Dependency injection: router receives database pool
- Testability: can pass mock pool for testing
- Flexibility: same router code, different database connections

**Line 8: `router.post('/register', register(pool));`**

```javascript
router.post('/register', register(pool));
```

**Breaking this down:**
1. `router.post()` - Handles HTTP POST requests
2. `'/register'` - Route path (becomes `/api/register` when mounted)
3. `register(pool)` - Calls register function with pool, returns middleware function

**The `register(pool)` call:**
- `register` is: `const register = (pool) => async (req, res) => { ... }`
- Calling `register(pool)` returns: `async (req, res) => { ... }`
- This returned function is the actual route handler

**Line 9: `router.post('/login', login(pool));`**
- Same pattern for login route
- POST /api/login → login controller

**Line 11: `return router;`**
- Returns the configured router to server.js
- Router is then mounted with `app.use('/api', authRoutes)`

---

## routes/userRoutes.js - User CRUD Routes

```javascript
const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

module.exports = (pool) => {
  // User routes delegating to controllers
  router.get('/', getAllUsers(pool));
  router.get('/:id', getUserById(pool));
  router.post('/', createUser(pool));
  router.put('/:id', updateUser(pool));
  router.delete('/:id', deleteUser(pool));

  return router;
};
```

### REST API Route Mapping:

| HTTP Method | Path | Controller | Purpose |
|-------------|------|------------|---------|
| GET | / | getAllUsers | Retrieve all users |
| GET | /:id | getUserById | Retrieve single user |
| POST | / | createUser | Create new user |
| PUT | /:id | updateUser | Update existing user |
| DELETE | /:id | deleteUser | Delete user |

**Route Parameters (`:id`)**

```javascript
router.get('/:id', getUserById(pool));
```

- `:id` is a route parameter
- Matches any value in that position
- Value is accessible via `req.params.id`

**Example:**
```
GET /api/users/abc-123-def-456

req.params = { id: 'abc-123-def-456' }
```

---

## controllers/authController.js - Authentication Logic

```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Controller: Register new auth user (name, username, email, password)
const register = (pool) => async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Basic presence validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: 'Name, username, email and password are required.'
      });
    }

    // Name validation: min 2 chars, only letters and spaces (no numbers)
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: 'Name must be at least 2 characters.' });
    }
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
      return res.status(400).json({
        message: 'Name can only contain letters and spaces (numbers not allowed).'
      });
    }

    // Username validation: 4‑20 chars, only letters, numbers, underscore and @
    const usernamePattern = /^[a-zA-Z0-9_@]{4,20}$/;
    if (!usernamePattern.test(username)) {
      return res.status(400).json({
        message:
          'Username must be 4-20 characters (letters, numbers, underscore _ and @ only).'
      });
    }

    // Email validation: check for valid format and TLD
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return res
        .status(400)
        .json({ message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).' });
    }

    // Password strength (same as frontend)
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    if (password.length < 8 || !passwordPattern.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
      });
    }

    // Check if username or email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists. Please use a different one.'
      });
    }

    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    await pool.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), username, passwordHash]
    );

    console.log('✓ New user registered:', username);

    return res.status(201).json({
      message: 'Registration successful! You can now login.',
      userId
    });
  } catch (err) {
    console.error('Error during registration:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```

### Line-by-Line Deep Dive:

---

**Lines 1-2: Imports**

```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
```

**bcryptjs:**
- Password hashing library
- Uses adaptive hashing (slower = more secure)
- Pure JavaScript (no native dependencies)

**uuid v4:**
- Generates random UUIDs
- v4 = random (not time-based like v1)
- Virtually zero collision probability

---

**Lines 4-5: Function Structure**

```javascript
const register = (pool) => async (req, res) => {
```

**This is a curried function:**
1. `register(pool)` - Takes pool, returns inner function
2. Inner function `async (req, res) =>` - Handles the request

**Why currying?**
- Inject `pool` dependency at route setup time
- Actual handler receives `req` and `res` at request time

---

**Lines 6-7: Destructure Request Body**

```javascript
try {
  const { name, username, email, password } = req.body;
```

**What req.body contains:**
- Parsed JSON from request body
- Set by `express.json()` middleware

**Example request:**
```json
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secret123!"
}
```

---

**Lines 9-14: Presence Validation**

```javascript
if (!name || !username || !email || !password) {
  return res.status(400).json({
    message: 'Name, username, email and password are required.'
  });
}
```

**What it checks:**
- All four fields are present and truthy
- Falsy values: `undefined`, `null`, `''`, `0`, `false`

**HTTP 400 Bad Request:**
- Client error (user's fault)
- Indicates invalid input

---

**Lines 16-27: Name Validation**

```javascript
// Name validation: min 2 chars, only letters and spaces (no numbers)
if (typeof name !== 'string' || name.trim().length < 2) {
  return res.status(400).json({ message: 'Name must be at least 2 characters.' });
}
const namePattern = /^[a-zA-Z\s]+$/;
if (!namePattern.test(name.trim())) {
  return res.status(400).json({
    message: 'Name can only contain letters and spaces (numbers not allowed).'
  });
}
```

**Regex explained: `/^[a-zA-Z\s]+$/`**
- `^` - Start of string
- `[a-zA-Z\s]` - Letters (upper/lower) and whitespace
- `+` - One or more characters
- `$` - End of string

**Valid:** "John Doe", "Mary Jane Watson"
**Invalid:** "John123", "John-Doe", "John@Work"

---

**Lines 29-36: Username Validation**

```javascript
const usernamePattern = /^[a-zA-Z0-9_@]{4,20}$/;
if (!usernamePattern.test(username)) {
  return res.status(400).json({
    message: 'Username must be 4-20 characters (letters, numbers, underscore _ and @ only).'
  });
}
```

**Regex explained: `/^[a-zA-Z0-9_@]{4,20}$/`**
- `[a-zA-Z0-9_@]` - Alphanumeric, underscore, or @
- `{4,20}` - Between 4 and 20 characters

**Valid:** "john_doe", "user@123", "JohnDoe2024"
**Invalid:** "jd" (too short), "john-doe" (hyphen not allowed)

---

**Lines 38-44: Email Validation**

```javascript
const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
if (!emailPattern.test(email)) {
  return res.status(400).json({ 
    message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).' 
  });
}
```

**Regex explained: `/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/`**
- `[^\s@]+` - One or more chars that are NOT whitespace or @
- `@` - Literal @ symbol
- `[^\s@]+` - Domain name (no spaces or @)
- `\.` - Literal dot
- `[a-zA-Z]{2,}` - TLD with at least 2 letters

**Valid:** "john@example.com", "user@company.org"
**Invalid:** "john@", "@example.com", "john@example"

---

**Lines 46-54: Password Strength Validation**

```javascript
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
if (password.length < 8 || !passwordPattern.test(password)) {
  return res.status(400).json({
    message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
  });
}
```

**Regex explained:**
- `(?=.*[a-z])` - Lookahead: must contain lowercase
- `(?=.*[A-Z])` - Lookahead: must contain uppercase
- `(?=.*\d)` - Lookahead: must contain digit
- `(?=.*[@$!%*?&])` - Lookahead: must contain special char
- `.+` - One or more of any character

**Valid:** "Secret123!", "MyP@ssw0rd"
**Invalid:** "password", "PASSWORD123", "Password1"

---

**Lines 56-66: Check for Existing User**

```javascript
const [existing] = await pool.query(
  'SELECT id FROM users WHERE username = ? OR email = ?',
  [username, email]
);

if (existing.length > 0) {
  return res.status(400).json({
    message: 'Username or email already exists. Please use a different one.'
  });
}
```

**SQL Query Explained:**
```sql
SELECT id FROM users WHERE username = ? OR email = ?
```

- `SELECT id` - Only need to know if row exists (minimal data)
- `WHERE username = ? OR email = ?` - Check both fields
- `?` - Parameterized query (SQL injection protection!)

**Why `[existing]` destructuring?**
- `pool.query()` returns `[rows, fields]`
- We only need `rows`, so destructure first element
- `existing` is an array of matching rows

**Parameter Substitution:**
```javascript
// Input: [username, email] = ['john', 'john@example.com']
// SQL becomes: SELECT id FROM users WHERE username = 'john' OR email = 'john@example.com'
```

---

**Lines 68-71: Generate UUID and Hash Password**

```javascript
const userId = uuidv4();
const saltRounds = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, saltRounds);
```

**Line 68: `uuidv4()`**
- Generates random 128-bit identifier
- Example: "550e8400-e29b-41d4-a716-446655440000"
- 2^122 possible values (virtually unique)

**Line 69: `bcrypt.genSalt(10)`**
- Generates random salt for password hashing
- `10` = cost factor (2^10 = 1024 iterations)
- Higher = more secure but slower

**Line 70: `bcrypt.hash(password, saltRounds)`**
- Hashes password with the salt
- Output: `$2a$10$N9qo8uLOickgx2ZMRZoMy...` (60 chars)

**Why salt?**
- Same password = different hash each time
- Prevents rainbow table attacks
- Each user has unique hash even with same password

**Example:**
```javascript
bcrypt.hash('password123', 10)  // → '$2a$10$X9...'
bcrypt.hash('password123', 10)  // → '$2a$10$Y3...' (different!)
```

---

**Lines 73-77: Insert User into Database**

```javascript
await pool.query(
  'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
  [userId, name.trim(), email.trim().toLowerCase(), username, passwordHash]
);
```

**SQL Explained:**
```sql
INSERT INTO users (id, name, email, username, password_hash) 
VALUES (?, ?, ?, ?, ?)
```

**Parameter Array:**
1. `userId` - UUID generated above
2. `name.trim()` - Remove leading/trailing whitespace
3. `email.trim().toLowerCase()` - Normalize email
4. `username` - As entered
5. `passwordHash` - Bcrypt hash (not plain password!)

**Why lowercase email?**
- "John@Example.com" = "john@example.com"
- Prevents duplicate accounts with different casing
- Industry standard

---

**Lines 79-84: Success Response**

```javascript
console.log('✓ New user registered:', username);

return res.status(201).json({
  message: 'Registration successful! You can now login.',
  userId
});
```

**HTTP 201 Created:**
- Indicates resource was successfully created
- More specific than 200 OK

**Response body:**
```json
{
  "message": "Registration successful! You can now login.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Login Controller:

```javascript
const login = (pool) => async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required.'
      });
    }

    // Allow login by username OR email
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✓ User logged in:', username);

    return res.json({
      message: 'Login successful',
      userId: user.id
    });
  } catch (err) {
    console.error('Error logging in:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```

**Key Points:**

**Lines 11-14: Find User by Username OR Email**
```javascript
const [rows] = await pool.query(
  'SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?',
  [username, username]
);
```

- Uses same value for both conditions
- User can log in with either username or email
- Only fetches necessary columns (not all data)

**Lines 16-18: User Not Found**
```javascript
if (rows.length === 0) {
  return res.status(401).json({ message: 'Invalid credentials' });
}
```

- HTTP 401 Unauthorized
- Generic message (don't reveal if user exists or not)

**Lines 20-21: Password Verification**
```javascript
const user = rows[0];
const valid = await bcrypt.compare(password, user.password_hash);
```

- `bcrypt.compare()` handles salt extraction automatically
- Returns `true` if password matches hash, `false` otherwise

**Security Note:**
- Same error message for "user not found" and "wrong password"
- Prevents username enumeration attacks

---

## controllers/userController.js - User CRUD Logic

### Helper Functions:

```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Helper function to sanitize string values (null/empty string handling)
const sanitizeValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  
  return String(value).trim();
};

// Helper function to parse JSON fields
const parseJsonField = (field) => {
  if (!field) return [];
  return typeof field === 'string' ? JSON.parse(field) : field;
};

// Helper function to extract credit card last 4 digits
const extractCreditCardLast4 = (creditCard) => {
  if (!creditCard) return null;
  const digitsOnly = creditCard.replace(/\D/g, '');
  return digitsOnly.length >= 4 ? digitsOnly.slice(-4) : null;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
};
```

**sanitizeValue:**
- Converts value to string and trims whitespace
- Returns `null` for empty/undefined values
- Normalizes input for consistent storage

**parseJsonField:**
- Parses JSON string into JavaScript object
- Returns empty array for null/undefined
- Handles both string and already-parsed values

**extractCreditCardLast4:**
- Removes all non-digits: `replace(/\D/g, '')`
- Extracts last 4 digits: `slice(-4)`
- Never stores full credit card number!

**formatTimestamp:**
- Converts Date objects to ISO string
- Consistent format across responses

---

### getAllUsers - List All Users:

```javascript
const getAllUsers = (pool) => async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.created_at,
        u.updated_at,
        ui.mobile,
        ui.credit_card_last4,
        ui.state,
        ui.city,
        ui.gender,
        ui.hobbies,
        ui.tech_interests,
        ui.address,
        ui.dob
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      ORDER BY u.created_at DESC
    `);

    const users = rows.map((r) => {
      const creditCardLast4 = sanitizeValue(r.credit_card_last4);
      
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        username: r.username,
        created_at: formatTimestamp(r.created_at),
        updated_at: formatTimestamp(r.updated_at),
        mobile: sanitizeValue(r.mobile),
        creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
        state: sanitizeValue(r.state),
        city: sanitizeValue(r.city),
        gender: r.gender || 'Male',
        hobbies: Array.isArray(parseJsonField(r.hobbies)) ? parseJsonField(r.hobbies) : [],
        techInterests: Array.isArray(parseJsonField(r.tech_interests)) ? parseJsonField(r.tech_interests) : [],
        address: sanitizeValue(r.address),
        dob: sanitizeValue(r.dob)
      };
    });

    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```

**SQL Query Breakdown:**

```sql
SELECT 
  u.id,                    -- User's UUID
  u.name,                  -- User's full name
  u.email,                 -- Email address
  u.username,              -- Login username
  u.created_at,            -- When account was created
  u.updated_at,            -- Last update timestamp
  ui.mobile,               -- Phone number
  ui.credit_card_last4,    -- Last 4 digits only
  ui.state,                -- Geographic state
  ui.city,                 -- City
  ui.gender,               -- Male/Female/Other
  ui.hobbies,              -- JSON array
  ui.tech_interests,       -- JSON array
  ui.address,              -- Full address
  ui.dob                   -- Date of birth
FROM users u
LEFT JOIN user_interests ui ON u.id = ui.user_id
ORDER BY u.created_at DESC
```

**LEFT JOIN Explained:**
```
users table:
| id  | name  | email           |
|-----|-------|-----------------|
| 1   | John  | john@mail.com   |
| 2   | Jane  | jane@mail.com   |

user_interests table:
| user_id | mobile     | state      |
|---------|------------|------------|
| 1       | 1234567890 | California |
(Jane has no interests row)

LEFT JOIN result:
| id  | name  | email           | mobile     | state      |
|-----|-------|-----------------|------------|------------|
| 1   | John  | john@mail.com   | 1234567890 | California |
| 2   | Jane  | jane@mail.com   | NULL       | NULL       |
```

**Why LEFT JOIN?**
- Returns all users, even those without user_interests
- Users who registered via /register have no interests yet
- INNER JOIN would exclude them

**ORDER BY u.created_at DESC:**
- Newest users first
- Consistent ordering for UI

**Credit Card Masking:**
```javascript
creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
// "1234" becomes "************1234"
```

---

### createUser - Full Registration with Profile:

```javascript
const createUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      name, email, mobile, creditCard, state, city,
      gender, hobbies, techInterests, address, username, password, dob
    } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !state || !city || !username || !password) {
      await connection.release();
      return res.status(400).json({
        message: 'Required fields: name, email, mobile, state, city, username, password'
      });
    }

    if (!Array.isArray(hobbies) || hobbies.length === 0) {
      await connection.release();
      return res.status(400).json({ message: 'Please select at least one hobby' });
    }

    if (!Array.isArray(techInterests) || techInterests.length === 0) {
      await connection.release();
      return res.status(400).json({ message: 'Please select at least one tech interest' });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      await connection.release();
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert into users table
    await connection.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, username, passwordHash]
    );

    // Insert into user_interests table
    await connection.query(`
      INSERT INTO user_interests 
      (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    await connection.commit();

    return res.status(201).json({
      message: 'User created successfully',
      id: userId
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};
```

**Transaction Management:**

```javascript
const connection = await pool.getConnection();  // Get dedicated connection
await connection.beginTransaction();             // Start transaction
// ... multiple queries ...
await connection.commit();                       // Success: save all changes
// or
await connection.rollback();                     // Failure: undo all changes
connection.release();                            // Return connection to pool
```

**Why transactions here?**
- Two INSERT queries must both succeed or both fail
- Without transaction:
  - INSERT into users succeeds
  - INSERT into user_interests fails
  - Result: orphaned user record!
- With transaction:
  - Both succeed → COMMIT
  - One fails → ROLLBACK (no partial data)

**JSON.stringify for arrays:**
```javascript
JSON.stringify(hobbies)     // ["Reading", "Music"] → '["Reading","Music"]'
JSON.stringify(techInterests)  // ["Angular", "React"] → '["Angular","React"]'
```

---

### updateUser - Update Existing User:

```javascript
const updateUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const {
      name, email, mobile, creditCard, state, city,
      gender, hobbies, techInterests, address, dob
    } = req.body;

    await connection.beginTransaction();

    // Update users table
    await connection.query(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, id]
    );

    // Check if user_interests row exists
    const [interestRows] = await connection.query(
      'SELECT user_id FROM user_interests WHERE user_id = ?',
      [id]
    );

    const creditCardLast4 = extractCreditCardLast4(creditCard);

    if (interestRows.length === 0) {
      // No interests row yet → INSERT
      await connection.query(`
        INSERT INTO user_interests
        (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, sanitizeValue(mobile), creditCardLast4,
        sanitizeValue(state), sanitizeValue(city),
        gender || 'Male',
        JSON.stringify(hobbies || []),
        JSON.stringify(techInterests || []),
        sanitizeValue(address), sanitizeValue(dob)
      ]);
    } else {
      // Update existing interests row
      await connection.query(`
        UPDATE user_interests 
        SET mobile = ?, credit_card_last4 = ?, state = ?, city = ?, gender = ?, 
            hobbies = ?, tech_interests = ?, address = ?, dob = ?
        WHERE user_id = ?
      `, [
        sanitizeValue(mobile), creditCardLast4,
        sanitizeValue(state), sanitizeValue(city),
        gender || 'Male',
        JSON.stringify(hobbies || []),
        JSON.stringify(techInterests || []),
        sanitizeValue(address), sanitizeValue(dob),
        id
      ]);
    }

    await connection.commit();
    return res.json({ message: 'User updated successfully' });
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

**UPDATE Query Explained:**
```sql
UPDATE users 
SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?
```

- Only updates specified columns
- `CURRENT_TIMESTAMP` automatically sets current datetime
- `WHERE id = ?` ensures only one row is updated

**INSERT or UPDATE Logic:**
```javascript
if (interestRows.length === 0) {
  // User exists but has no interests (registered via /register)
  // → INSERT new row
} else {
  // User has existing interests
  // → UPDATE existing row
}
```

This handles users who:
1. Registered via /register (only users table entry)
2. Are now adding profile via home page inline edit

---

### deleteUser - Remove User:

```javascript
const deleteUser = (pool) => async (req, res) => {
  try {
    const { id } = req.params;

    // Foreign key constraint will automatically delete user_interests
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};
```

**Cascade Delete in Action:**

```sql
DELETE FROM users WHERE id = 'abc-123'
```

Because of the foreign key:
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

MySQL automatically:
1. Deletes the row from `users`
2. Deletes matching row from `user_interests`

No orphaned data!

---

## Database Schema Deep Dive

### Entity Relationship Diagram:

```
┌──────────────────────────────────────┐
│              users                    │
├──────────────────────────────────────┤
│ id          VARCHAR(36)    PK        │
│ name        VARCHAR(100)   NOT NULL  │
│ email       VARCHAR(100)   UNIQUE    │
│ username    VARCHAR(50)    UNIQUE    │
│ password_hash VARCHAR(255) NOT NULL  │
│ created_at  TIMESTAMP      DEFAULT   │
│ updated_at  TIMESTAMP      ON UPDATE │
└──────────────────────────────────────┘
            │
            │ 1:1 (one-to-one)
            │ ON DELETE CASCADE
            ▼
┌──────────────────────────────────────┐
│          user_interests              │
├──────────────────────────────────────┤
│ user_id     VARCHAR(36)    PK, FK    │
│ mobile      VARCHAR(15)    NOT NULL  │
│ credit_card_last4 VARCHAR(4)         │
│ state       VARCHAR(100)   NOT NULL  │
│ city        VARCHAR(100)   NOT NULL  │
│ gender      ENUM           DEFAULT   │
│ hobbies     JSON                     │
│ tech_interests JSON                  │
│ address     TEXT                     │
│ dob         DATE                     │
└──────────────────────────────────────┘
```

### Indexes and Performance:

```sql
INDEX idx_username (username)  -- Fast login lookups
INDEX idx_email (email)        -- Fast email searches
INDEX idx_user_id (user_id)    -- Fast JOIN operations
```

---

## Complete API Request-Response Flows

### Registration Flow:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Angular   │────▶│   Express   │────▶│ Controller  │────▶│    MySQL    │
│   Frontend  │     │   Server    │     │   Logic     │     │   Database  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │  POST /api/register                   │                   │
      │  {name, username,│email, password}    │                   │
      │──────────────────▶                    │                   │
      │                   │                   │                   │
      │                   │  cors(), json()   │                   │
      │                   │──────────────────▶│                   │
      │                   │                   │                   │
      │                   │                   │ Validate input    │
      │                   │                   │───────────────────│
      │                   │                   │                   │
      │                   │                   │ SELECT id FROM    │
      │                   │                   │ users WHERE...    │
      │                   │                   │───────────────────▶
      │                   │                   │                   │
      │                   │                   │   [] (no match)   │
      │                   │                   │◀───────────────────
      │                   │                   │                   │
      │                   │                   │ bcrypt.hash()     │
      │                   │                   │───────────────────│
      │                   │                   │                   │
      │                   │                   │ INSERT INTO users │
      │                   │                   │───────────────────▶
      │                   │                   │                   │
      │                   │                   │   OK (1 row)      │
      │                   │                   │◀───────────────────
      │                   │                   │                   │
      │                   │  201 Created      │                   │
      │◀──────────────────│◀──────────────────│                   │
      │                   │                   │                   │
      │  {message, userId}│                   │                   │
      │──────────────────▶│                   │                   │
```

### Login Flow:

```
1. User enters username/password
2. Angular sends POST /api/login
3. Express routes to login controller
4. Controller queries: SELECT password_hash FROM users WHERE username = ?
5. bcrypt.compare(password, hash)
6. If valid: Return 200 + userId
7. If invalid: Return 401 Unauthorized
8. Angular redirects to /home
```

### CRUD Operations Flow:

```
GET /api/users
├── Query: SELECT ... FROM users LEFT JOIN user_interests
├── Transform: JSON parse, mask credit card
└── Response: Array of user objects

POST /api/users
├── Validate: All required fields present
├── Transaction BEGIN
├── INSERT INTO users (auth data)
├── INSERT INTO user_interests (profile data)
├── Transaction COMMIT
└── Response: 201 Created

PUT /api/users/:id
├── Transaction BEGIN
├── UPDATE users SET ...
├── Check if user_interests exists
├── INSERT or UPDATE user_interests
├── Transaction COMMIT
└── Response: 200 OK

DELETE /api/users/:id
├── DELETE FROM users WHERE id = ?
├── (CASCADE deletes user_interests)
└── Response: 200 OK
```

---

## Security Implementation

### SQL Injection Prevention:

**Vulnerable (DON'T DO THIS):**
```javascript
// ❌ BAD - String concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`;
// If username = "'; DROP TABLE users; --"
// Query becomes: SELECT * FROM users WHERE username = ''; DROP TABLE users; --'
```

**Secure (ALWAYS DO THIS):**
```javascript
// ✓ GOOD - Parameterized query
await pool.query('SELECT * FROM users WHERE username = ?', [username]);
// mysql2 escapes special characters
// "'; DROP TABLE users; --" becomes a literal string, not SQL
```

### Password Security:

```javascript
// Never store plain passwords!
const passwordHash = await bcrypt.hash(password, 10);

// Hash format: $2a$10$SALT_22_CHARS$HASH_31_CHARS
// $2a = bcrypt version
// $10 = cost factor (2^10 iterations)
// Salt is embedded in hash, unique per password
```

### CORS Configuration:

```javascript
app.use(cors({ origin: 'http://localhost:4200' }));
// Only accepts requests from Angular dev server
// Blocks requests from unknown origins
```

### Credit Card Handling:

```javascript
// Only store last 4 digits
const last4 = creditCard.slice(-4);

// Display with masking
const display = '************' + last4;  // ************1234
```

---

## Export Statement

```javascript
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
```

Makes these functions available for import in routes.

