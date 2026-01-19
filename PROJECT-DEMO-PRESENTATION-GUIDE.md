## Demo Presentation Guide – Cafeteria Members Project

Use this as a **script** while sharing your screen. It is organized **page by page**, and for each important action it tells you:
- **What to show on UI**
- **What to say (frontend behaviour)**
- **What is happening in backend / database**
- Extra focus on **Filters** and **Excel Bulk Add/Edit**.

You can adapt wording, but try to keep the structure and sequence.

---

## 1. High-Level Introduction (1–2 minutes)

- **What to show**
  - Show the browser with the app starting on the **Login** page.

- **What to say**
  - “This is a full‑stack Angular + Node + MySQL application to manage **Cafeteria Members**.”
  - “We have authentication (Register + Login), a **Home** page with inline editing, client‑side **filters**, and a complete **Excel Bulk Add/Edit** feature for users.”
  - “Frontend is built in **Angular** with **PrimeNG** UI components. Backend is **Node + Express**, database is **MySQL**.”

- **Technical note (short)**
  - Frontend routes: `login`, `register`, `home`.
  - Backend main controllers:
    - `authController.js` → register/login
    - `userController.js` → CRUD + Excel bulk

---

## 2. Login Page – Authentication & Validations (2–3 minutes)

- **What to show**
  - Stay on **Login** screen.
  - Show username & password fields, try submitting empty/invalid values.

- **What to say (features & validations)**
  - “Login uses **Angular Reactive Forms** with strong validation.”
  - “Username is required and must match pattern: 4–20 characters, letters/numbers/`._-` only.”
  - “Password is required, at least 8 characters, and must contain **uppercase, lowercase, number, and special character**.”
  - “If form is invalid and I click Login, the form marks all fields as touched and shows clear error messages.”

- **Explain frontend → backend flow**
  - “On submit, if the form is valid, the component calls:
    - `this.http.post('/api/login', { username, password })`.”
  - “Backend `authController.login`:
    - Looks up user by **username or email**.
    - Compares password using **bcrypt.compare**.
    - On success returns a user object (id, username, email, name).”
  - “In frontend we store this user in `localStorage` as `current_user`. This is used later for Excel cover sheet ‘Downloaded by’.”

- **What happens after login**
  - “If login succeeds, we navigate to `/home`. If it fails, we show an error message like ‘Invalid username or password’.”

---

## 3. Register Page – Strong Validation & User Creation (2–3 minutes)

- **What to show**
  - Navigate to `/register`.
  - Show name, username, email, password, confirm password.

- **What to say (validations)**
  - “Name is required, minimum 2 characters, and allows **letters + spaces only** (no numbers).”
  - “Username: required, 4–20 chars, pattern `[a-zA-Z0-9_@]`.”
  - “Email: custom validator checks both **email format** and **valid TLD** (.com, .org, .net, …).”
  - “Password: same strong rule as login; Confirm Password must match.”
  - “If any rule fails, we show specific messages (invalid email, invalid TLD, passwords don’t match, etc.).”

- **Explain frontend → backend flow**
  - “On submit, if form is valid, we call:
    - `POST /api/register` with `{ name, username, email, password }`.”
  - “Backend `authController.register`:
    - Validates all fields (same patterns).
    - Checks if **username or email already exist** in `users` table.
    - Generates a UUID for `id`.
    - Hashes password with `bcrypt` and stores as `password_hash` in `users` table.
    - Returns newly created user data.”
  - “Frontend again stores this user in `localStorage` and redirects to `/home`.”

---

## 4. Home Page – Overview (Table, Inline Editing, Filters) (1–2 minutes)

- **What to show**
  - On `/home`, highlight:
    - Page header (Cafeteria Members).
    - Top‑right toolbar: **Excel**, **Filters**, **Clear**, **Save Changes**.
    - Main **PrimeNG table** listing users.

- **What to say**
  - “This is the main management page where we can **view, filter, edit, and delete members**.”
  - “Data comes from backend via `UserService.getUsers()` → `GET /api/users`.”
  - “Backend `userController.getAllUsers` joins `users` and `user_interests` tables and returns a combined user object.”
  - “We show fields like name, email, username, mobile, state, city, gender, hobbies, tech interests, DOB, and masked credit card.”

---

## 5. Filters – Frontend‑Only Filtering (3–4 minutes, focus area)

- **What to show**
  - Click **Filters** button → show filters row.
  - Show changing filters and how the table updates without any network calls.

- **What to say (concept)**
  - “All filtering is **frontend‑only**, optimized to avoid extra API calls.”
  - “We keep:
    - `users`: raw list from backend.
    - `filteredUsers`: list after applying filters. The table binds to `filteredUsers`.”
  - “When we change any filter, only the UI array is recalculated; backend is not called again.”

- **Explain each filter**
  - **Name filter**
    - “Simple text input that filters by `user.name` (case‑insensitive).”
  - **State filter**
    - “Dropdown populated from **locations.json** (same source as Add Member form and Excel).”
    - “If state is selected, we keep only users with `u.state === state`.”
  - **City filter (dependent)**
    - “City dropdown options depend on selected state using `citiesByState` map.”
    - “If user changes state and current city is not valid for that state, we automatically clear city filter.”
  - **Gender filter**
    - “Dropdown: Male/Female/Other. Filters `u.gender` equality.”
  - **Tech Interests filter**
    - “Multi‑select based on same set used in form & Excel (Angular, React, Node.js, Java).”
    - “We keep users where at least one selected tech is present in `u.techInterests`.”

- **Explain core filter function (`applyLocalFilters`)**
  - “On every filter change we call `applyLocalFilters()`:
    - Normalizes name query to lowercase.
    - Validates state+city combination (if invalid, clears city).
    - Runs a `.filter()` over `this.users` to produce `this.filteredUsers`.”
  - “This approach is very fast for typical datasets and avoids backend dependency for search.”

- **Explain Clear button**
  - “Clear resets `filterModel` to default and calls `applyLocalFilters()` again, so we see full dataset.”

---

## 6. Inline Cell Editing + Save Changes (3–4 minutes)

- **What to show**
  - Click into a couple of cells (e.g., mobile, state/city, hobbies) and edit them.
  - Then click **Save Changes**.

- **What to say (high‑level)**
  - “The table supports **true cell‑based inline editing**.”
  - “We track changed rows in an internal object `editedRows`, and when I click **Save Changes** we do a **batch update** to the backend.”

- **Explain change‑tracking briefly**
  - “When a cell edit is completed, `celledited(event)` is called:
    - It normalizes the value (trim, digits only for mobile, etc.).
    - If this is the first change for that row, we copy the **original** value from `baselineUsers` (snapshot from server).
    - We log the previous and current value with timestamp in `events`.”
  - “We also re‑validate the row using `validateUser()`. If there are validation issues (email, mobile length, DOB, etc.), we store per‑field errors and show them around the cell.”

- **Explain Save Changes button**
  - “Save button is global for the table—it sends all modified rows in one go.”
  - “`savechanges()`:
    - Gathers IDs from `editedRows`.
    - Re‑validates each row; if any row invalid, we show a warning toast and **don’t call backend**.
    - Builds an array of HTTP calls `userService.updateUser(id, prepareUpdate(user))`.
    - Uses `forkJoin` so that all update calls happen in parallel.”
  - “On success:
    - We remove successful IDs from `editedRows` and `fieldErrors`.
    - Refresh the table by calling `loadUsers()` again (so UI is in sync with DB).”

- **Backend side**
  - “Each update call goes to `PUT /api/users/:id` handled by `userController.updateUser`:
    - Updates `users` table (name/username/email).
    - Inserts/updates `user_interests` table for that user (mobile, last4 credit card, state, city, gender, hobbies, tech interests, address, dob).”

---

## 7. Add Member Dialog (UserFormComponent) (2–3 minutes)

- **What to show**
  - Click **Add Member** → show the dialog.
  - Scroll a bit to show grid layout (two fields per row).

- **What to say**
  - “Form is built with **Reactive Forms** and uses **PrimeFlex 2‑column grid** so the form is visually compact.”
  - “We validate:
    - Name (no numbers).
    - Email (must end with `.com`).
    - Mobile (exactly 10 digits).
    - Credit card (16 digits on create).
    - State & City (required, valid mapping).
    - Gender (required).
    - Hobbies & Tech Interests (multi‑select, at least one each).
    - Address pattern (only letters, numbers, space, comma, dot, underscore, hyphen).
    - DOB (required, **future dates disabled**).”

- **Backend flow**
  - “On submit, component calls:
    - For ADD: `POST /api/users` with full payload.
    - For EDIT mode (from inline actions) it calls `PUT /api/users/:id` with subset of fields.”
  - “Backend:
    - Validates required fields.
    - Ensures unique username/email.
    - Stores user in `users` and details in `user_interests`.”

---

## 8. Excel Bulk Add/Edit – Concept Overview (1–2 minutes introduction)

- **What to show**
  - Point to **Excel** split button and say this is the bulk feature.

- **What to say (high‑level)**
  - “Now I’ll focus on the **Excel Bulk Add/Edit** feature, which is one of the main strengths of this project.”
  - “Idea:
    - Download a validated Excel **template** (blank or with data).
    - Fill or modify rows in Excel.
    - Upload back.
    - Server validates every row, then performs **bulk INSERT and UPDATE** inside a single transaction, and returns a detailed error report if needed.”

---

## 9. Excel Download – Step‑by‑Step Demo Script (4–5 minutes, deep focus)

### 9.1 UI Flow (what to show and say)

- **Step 1 – Show Excel menu**
  - “Click on **Excel** split button. We have:
    - Download → Blank Template
    - Download → Template with Data
    - Upload”

- **Step 2 – Download blank template**
  - Click “Blank Template”.
  - “Frontend calls `downloadTemplate()` with mode `'blank'`.
    - `HomeComponent` calls `UserService.downloadUsersTemplate('blank', downloadedBy)`.
    - That sends **GET** `/api/users/excel-template?mode=blank&downloadedBy=<current_user>`.”
  - “Backend `downloadExcelTemplate`:
    - Reads `locations.json` for state/city.
    - Builds a workbook with 3 sheets:
      - `Cover`: metadata, instructions.
      - `Application Portfolio`: main data entry sheet.
      - `Data Format`: rules and dropdown values (Genders, States, Cities, Hobbies, Tech Interests).”
  - Open the downloaded blank file and show each sheet:
    - **Cover**: “Here you can see who downloaded the file, when, and what mode.”
    - **Application Portfolio**: “This is where we will enter data. All columns match the UI form and DB columns.”
    - **Data Format**: “Contains rules for each column plus dropdown source ranges.”

- **Step 3 – Download template with data**
  - “If I choose **Template with Data**, the same endpoint runs with `mode=data`.”
  - “Backend additionally runs a query `SELECT ... FROM users LEFT JOIN user_interests` and pre‑fills each row in Application Portfolio.”
  - Show some rows prefilled: “This is a convenient export for bulk editing existing users.”

### 9.2 Excel internals (explain to interviewer)

- “All dropdowns are implemented using **Excel data validation**:
  - Gender, State, City, Hobbies, Tech Interests fetch their lists from `Data Format` sheet.
  - For City, we use a **dependent dropdown**; formula uses `OFFSET + MATCH + COUNTIF` over a State→City mapping table.”
- “DOB column has Excel‑side date validation so users **cannot select a future date** when typing or using Excel’s calendar.”
- “We also generate an error Excel file later (for upload errors); structure is similar, with an extra ‘Error Reason’ column.”

---

## 10. Excel Upload – Step‑by‑Step Demo Script (5–7 minutes, deep focus)

### 10.1 Upload Dialog UI & Steps

- **What to show**
  - Click **Excel → Upload** to open dialog.
  - Show the **stepper** (Select → Validate → Upload).
  - Show the file input and the three action buttons: Download Error Excel, Validate, Upload.

- **What to say (UI behaviour)**
  - “Step 1: **Select** – We choose an Excel file. We enforce that filename starts with `Users_Template_` and allow browser suffixes like `(2)`.”
  - “Step 2: **Validate** – When I click Validate:
    - Frontend calls `validateBulk()` → `UserService.validateBulkExcel(file)` → `POST /api/users/bulk?dryRun=true`.
    - Backend parses the Excel file, validates every row, but **does not modify the DB**.”
  - “If there are errors, we show them in a small table inside the dialog and enable ‘Download Error Excel’.”
  - “Step 3: **Upload** – When I click Upload:
    - Frontend calls `uploadBulk()` → `POST /api/users/bulk?dryRun=false`.
    - Now backend actually does bulk INSERT/UPDATE inside a transaction.”

### 10.2 Backend Validation Logic (high‑level explanation)

- “Backend uses **xlsx** library to read the file:
  - Converts the Application Portfolio sheet to a matrix of rows.
  - Verifies header names match expected template (so user can’t break the format).”
- “For each row:
  - It builds an object with all columns.
  - Decides the mode:
    - If `UserId` empty → **ADD**.
    - If `UserId` present → **EDIT**.”
- “Then it calls `validateRow(row, lookups, mode)`:
  - Checks required fields (all mandatory columns for ADD).
  - Validates email, username pattern, mobile length, credit card length.
  - Validates dropdown values: gender, state, city, hobbies, techInterests.
  - Validates state‑city mapping.
  - Validates DOB format and non‑future (with help of normalizeDateCell).”
- “It also:
  - Detects **duplicate emails and usernames inside the file**.
  - Queries DB once to detect:
    - Existing emails/usernames (for uniqueness).
    - Existing ids for EDIT mode.”

### 10.3 What happens on Validate vs Upload

- **Validate (dryRun=true)**
  - “If we are just validating:
    - Backend builds `errorDetails` (rowNumber + reason).
    - Also builds an **Error Excel** (only failed rows + ‘Error Reason’) and encodes it as base64.
    - Returns: `createdCount=0`, `updatedCount=0`, `errorCount`, `errorDetails`, `errorFileBase64`.”
  - “Frontend:
    - Shows errors in the dialog table.
    - Enables **Download Error Excel** button which calls `downloadValidationErrors()`, decodes base64, and downloads that Excel.”

- **Upload (dryRun=false)**
  - “For real upload:
    - Backend uses a DB connection and starts a **transaction**.”
  - “For ADD rows:
    - Loops through `addList`.
    - For each row:
      - Generates a UUID.
      - Hashes the password with `bcrypt`.
      - Prepares one row for `users` table and one for `user_interests` table.
    - Executes **two bulk queries**:
      - `INSERT INTO users (...) VALUES ?`
      - `INSERT INTO user_interests (...) VALUES ?`.”
  - “For EDIT rows:
    - Prepares:
      - A single `UPDATE users` using `CASE WHEN id THEN value END` patterns for name/username/email.
      - A single `INSERT ... ON DUPLICATE KEY UPDATE` for `user_interests` (upsert).”
  - “If everything passes:
    - It commits the transaction and returns `createdCount` and `updatedCount`.”
  - “If there are DB errors:
    - It rolls back the transaction and returns 500 with proper error message.”

### 10.4 What frontend does after upload

- “On success:
  - We show a toast summary: **Created X, Updated Y, Errors Z**.
  - If backend returned `errorFileBase64`, we automatically offer a download of ‘Users_Bulk_Errors.xlsx’ so the user can see failed rows.”
- “Then we call `loadUsers()` again:
  - This refreshes the table so that inline editing and filters work on the latest data.”

---

## 11. Delete Member – Confirmation & Cascade Delete (1–2 minutes)

- **What to show**
  - Click delete icon/button on a user.
  - Show PrimeNG `p-dialog` confirmation instead of browser `confirm`.

- **What to say**
  - “Delete uses a **PrimeNG dialog** for a consistent UX.”
  - “On confirm, frontend calls `DELETE /api/users/:id`.”
  - “Backend simply deletes from `users`. Because we have a foreign key with `ON DELETE CASCADE`, the related row in `user_interests` is removed automatically.”
  - “We then reload the users and show a success toast.”

---

## 12. Closing Summary (30–60 seconds)

- **What to say**
  - “To summarize:
    - We built a full authentication flow with strong validations.
    - The Home page supports **inline editing**, **frontend‑only filters**, and **a rich Add Member dialog**.”
  - “The most important part is the **Excel Bulk Add/Edit**:
    - Server‑side template generation with validated dropdowns and dependent State→City.
    - Robust validation pipeline for uploads.
    - Transactional bulk insert/update with clear error feedback and error Excel files.”
  - “The entire stack is designed to be **safe, consistent, and user‑friendly**, and to handle both small manual edits and large Excel‑based bulk operations efficiently.”


